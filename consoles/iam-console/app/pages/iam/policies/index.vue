<script setup lang="ts">
const search = ref('')
const typeFilter = ref('All')
const page = ref(1)
const pageSize = 20
const types = ['All', 'Managed', 'Custom']
const { data, refresh } = await useFetch('/api/iam/policies-full', {
  query: computed(() => ({ search: search.value, type: typeFilter.value, page: page.value, pageSize }))
})

// Create policy (fullscreen page overlay)
const showCreate = ref(false)
const createMode = ref<'visual' | 'json'>('visual')
const createForm = ref({
  name: '', description: '',
  policyDocument: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": [],\n      "Resource": "*"\n    }\n  ]\n}'
})
const creating = ref(false)

// Visual editor state
const visualStatements = ref([{
  effect: 'Allow', service: '', actions: [] as string[], resource: '*', conditions: ''
}])

const services = [
  'S3', 'EC2', 'IAM', 'Lambda', 'DynamoDB', 'RDS', 'CloudWatch', 'CloudTrail',
  'ECS', 'CloudFormation', 'SNS', 'SQS', 'KMS', 'Secrets Manager', 'SSM', 'VPC'
]

const serviceActions: Record<string, string[]> = {
  S3: ['GetObject', 'PutObject', 'DeleteObject', 'ListBucket', 'GetBucketPolicy', 'PutBucketPolicy', 'CreateBucket', 'DeleteBucket'],
  EC2: ['DescribeInstances', 'RunInstances', 'TerminateInstances', 'StartInstances', 'StopInstances', 'DescribeVolumes', 'CreateSnapshot'],
  IAM: ['GetUser', 'ListUsers', 'CreateUser', 'DeleteUser', 'AttachUserPolicy', 'DetachUserPolicy', 'CreateRole', 'ListRoles'],
  Lambda: ['InvokeFunction', 'CreateFunction', 'UpdateFunctionCode', 'DeleteFunction', 'GetFunction', 'ListFunctions'],
  DynamoDB: ['GetItem', 'PutItem', 'DeleteItem', 'Scan', 'Query', 'CreateTable', 'DeleteTable', 'DescribeTable'],
  RDS: ['DescribeDBInstances', 'CreateDBInstance', 'DeleteDBInstance', 'ModifyDBInstance', 'CreateDBSnapshot'],
  CloudWatch: ['GetMetricData', 'PutMetricData', 'GetMetricStatistics', 'ListMetrics', 'PutMetricAlarm'],
  CloudTrail: ['LookupEvents', 'DescribeTrails', 'CreateTrail', 'StartLogging', 'StopLogging'],
  ECS: ['RunTask', 'StopTask', 'DescribeTasks', 'CreateService', 'UpdateService', 'DeleteService', 'ListTasks'],
  CloudFormation: ['CreateStack', 'UpdateStack', 'DeleteStack', 'DescribeStacks', 'DescribeStackEvents'],
  SNS: ['Publish', 'Subscribe', 'Unsubscribe', 'CreateTopic', 'DeleteTopic', 'ListTopics'],
  SQS: ['SendMessage', 'ReceiveMessage', 'DeleteMessage', 'CreateQueue', 'DeleteQueue', 'ListQueues'],
  KMS: ['Encrypt', 'Decrypt', 'GenerateDataKey', 'CreateKey', 'DescribeKey', 'ListKeys'],
  'Secrets Manager': ['GetSecretValue', 'CreateSecret', 'DeleteSecret', 'UpdateSecret', 'ListSecrets'],
  SSM: ['SendCommand', 'GetCommandInvocation', 'GetParameter', 'PutParameter', 'DescribeInstanceInformation'],
  VPC: ['CreateVpc', 'DeleteVpc', 'CreateSubnet', 'DeleteSubnet', 'CreateRouteTable', 'DescribeVpcs'],
}

// Edit dialog
const showEdit = ref(false)
const editTarget = ref<any>(null)
const editForm = ref({ name: '', description: '' })
const saving = ref(false)

// Delete confirm
const showDelete = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)
const deleteConfirmName = ref('')
const deleting = ref(false)

const openActions = ref<string | null>(null)

function toggleActions(id: string) {
  openActions.value = openActions.value === id ? null : id
}

function openCreate() {
  createForm.value = { name: '', description: '', policyDocument: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": [],\n      "Resource": "*"\n    }\n  ]\n}' }
  visualStatements.value = [{ effect: 'Allow', service: '', actions: [], resource: '*', conditions: '' }]
  createMode.value = 'visual'
  showCreate.value = true
}

function addStatement() {
  visualStatements.value.push({ effect: 'Allow', service: '', actions: [], resource: '*', conditions: '' })
}

function removeStatement(i: number) {
  visualStatements.value.splice(i, 1)
}

function toggleAction(stmt: any, action: string) {
  const idx = stmt.actions.indexOf(action)
  idx === -1 ? stmt.actions.push(action) : stmt.actions.splice(idx, 1)
}

function selectAllActions(stmt: any) {
  if (!stmt.service) return
  stmt.actions = [...(serviceActions[stmt.service] || [])]
}

function clearAllActions(stmt: any) {
  stmt.actions = []
}

function getServiceActions(service: string) {
  return serviceActions[service] || []
}

function syncVisualToJson() {
  const doc = {
    Version: '2012-10-17',
    Statement: visualStatements.value.map(s => ({
      Effect: s.effect,
      Action: s.actions.length ? s.actions : (s.service ? [`${s.service.toLowerCase()}:*`] : ['*']),
      Resource: s.resource
    }))
  }
  createForm.value.policyDocument = JSON.stringify(doc, null, 2)
}

function validateJson() {
  try {
    JSON.parse(createForm.value.policyDocument)
    return { valid: true, error: '' }
  } catch (e: any) {
    return { valid: false, error: e.message }
  }
}

const jsonValidation = computed(() => {
  if (createMode.value !== 'json') return { valid: true, error: '' }
  return validateJson()
})

async function doCreate() {
  creating.value = true
  if (createMode.value === 'visual') syncVisualToJson()
  try {
    await $fetch('/api/iam/policies-full', { method: 'POST', body: createForm.value })
    showCreate.value = false
    await refresh()
  } finally { creating.value = false }
}

function openEdit(policy: any) {
  editTarget.value = policy
  editForm.value = { name: policy.name, description: policy.description }
  showEdit.value = true
  openActions.value = null
}

async function doEdit() {
  saving.value = true
  try {
    await $fetch(`/api/iam/policies-full/${editTarget.value.id}`, { method: 'PUT', body: editForm.value })
    showEdit.value = false
    editTarget.value = null
    await refresh()
  } finally { saving.value = false }
}

function confirmDelete(policy: any) {
  deleteTarget.value = { id: policy.id, name: policy.name }
  deleteConfirmName.value = ''
  showDelete.value = true
  openActions.value = null
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/iam/policies-full/${deleteTarget.value.id}`, { method: 'DELETE' })
    showDelete.value = false
    deleteTarget.value = null
    await refresh()
  } finally { deleting.value = false }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-normal text-gray-900">Policies</h1>
      <div class="flex gap-2">
        <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
        <button @click="openCreate()" class="px-4 py-1.5 bg-[#ec7211] text-white rounded text-sm font-medium hover:bg-[#d6670e] flex items-center gap-1">
          Create policy
        </button>
      </div>
    </div>

    <div class="flex items-center gap-4 mb-3">
      <div class="relative flex-1 max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Filter policies" class="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#006ce0] focus:border-[#006ce0]" />
      </div>
      <div class="flex gap-1 bg-gray-100 rounded-md p-0.5">
        <button v-for="t in types" :key="t" @click="typeFilter = t; page = 1"
          :class="['px-3 py-1.5 text-sm rounded-md transition-colors', typeFilter === t ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700']">
          {{ t }}
        </button>
      </div>
    </div>

    <p class="text-sm text-gray-600 mb-3">{{ data?.total || data?.items?.length || 0 }} policies found</p>

    <div class="bg-white border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-[#f2f3f3] border-b border-gray-300">
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Policy name</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Type</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Used as</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Attachments</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Creation time</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Last activity</th>
            <th class="w-16 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody v-if="data">
          <tr v-for="policy in data.items" :key="policy.id" class="border-b border-gray-100 hover:bg-[#f1faff] transition-colors" style="height:48px;">
            <td class="px-3">
              <NuxtLink :to="`/iam/policies/${policy.id}`" class="text-[#006ce0] hover:text-[#004ba0] hover:underline text-sm">{{ policy.name }}</NuxtLink>
              <div class="text-xs text-gray-400 mt-0.5">{{ policy.description }}</div>
            </td>
            <td class="px-4 py-3">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', policy.type === 'Managed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700']">{{ policy.type }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ policy.usedAs }}</td>
            <td class="px-4 py-3"><span class="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">{{ policy.attachmentCount }}</span></td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ policy.createdAt }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ policy.lastActivity }}</td>
            <td class="px-4 py-3">
              <div class="relative">
                <button @click.stop="toggleActions(policy.id)" class="p-1 rounded hover:bg-gray-200 text-gray-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
                <div v-if="openActions === policy.id" class="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border py-1 z-30">
                  <NuxtLink :to="`/iam/policies/${policy.id}`" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">View</NuxtLink>
                  <button v-if="policy.type === 'Custom'" @click="openEdit(policy)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                  <button v-if="policy.type === 'Custom'" @click="confirmDelete(policy)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                  <span v-if="policy.type === 'Managed'" class="block px-4 py-2 text-sm text-gray-400">Managed</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!data?.items?.length" class="p-8 text-center text-sm text-gray-500">No policies found</div>
    </div>

    <div v-if="data && (data?.total || 0) > pageSize" class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
      <div class="flex items-center gap-1">
        <button :disabled="page <= 1" @click="page--" class="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40">‹</button>
        <template v-for="p in Math.ceil(((data?.total || 0) || 0) / pageSize)" :key="p">
          <button v-if="p <= 3 || p === Math.ceil(((data?.total || 0) || 0) / pageSize) || Math.abs(p - page) <= 1"
            @click="page = p"
            :class="['px-2.5 py-1 text-sm border rounded', p === page ? 'bg-[#006ce0] text-white border-[#006ce0]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50']">
            {{ p }}
          </button>
          <span v-else-if="p === 4 || p === Math.ceil(((data?.total || 0) || 0) / pageSize) - 1" class="px-1 text-gray-400">…</span>
        </template>
        <button :disabled="page * pageSize >= (data?.total || 0)" @click="page++" class="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40">›</button>
      </div>
      <span class="text-sm text-gray-600">{{ (page - 1) * pageSize + 1 }}-{{ Math.min(page * pageSize, (data?.total || 0)) }} of {{ (data?.total || 0) }}</span>
    </div>

    <!-- CREATE POLICY (fullscreen overlay) -->
    <div v-if="showCreate" class="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
      <div class="max-w-5xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Create policy</h1>
          <button @click="showCreate = false" class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Editor mode toggle -->
        <div class="flex gap-1 bg-gray-100 rounded-md p-0.5 w-fit mb-6">
          <button @click="createMode = 'visual'" :class="['px-4 py-2 text-sm rounded-md transition-colors font-medium', createMode === 'visual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700']">Visual editor</button>
          <button @click="createMode = 'json'; syncVisualToJson()" :class="['px-4 py-2 text-sm rounded-md transition-colors font-medium', createMode === 'json' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700']">JSON</button>
        </div>

        <!-- Basic info -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Policy name <span class="text-red-500">*</span></label>
              <input v-model="createForm.name" type="text" placeholder="Enter policy name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input v-model="createForm.description" type="text" placeholder="Optional description" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <!-- Visual editor -->
        <div v-if="createMode === 'visual'" class="space-y-4">
          <div v-for="(stmt, i) in visualStatements" :key="i" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-700">Statement {{ i + 1 }}</span>
              <button v-if="visualStatements.length > 1" @click="removeStatement(i)" class="text-red-500 hover:text-red-700 text-sm font-medium">Remove statement</button>
            </div>
            <div class="p-5 space-y-4">
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Effect</label>
                  <select v-model="stmt.effect" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>Allow</option>
                    <option>Deny</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Service</label>
                  <select v-model="stmt.service" @change="stmt.actions = []" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">Select service...</option>
                    <option v-for="s in services" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">Resources</label>
                  <div class="flex gap-2">
                    <select v-model="stmt.resource" class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                      <option value="*">All resources</option>
                      <option value="specific">Specific resources</option>
                    </select>
                  </div>
                </div>
              </div>
              <!-- Actions -->
              <div v-if="stmt.service">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-medium text-gray-500">Actions</label>
                  <div class="flex gap-2">
                    <button @click="selectAllActions(stmt)" class="text-xs text-blue-600 hover:text-blue-800">Select all</button>
                    <span class="text-gray-300">|</span>
                    <button @click="clearAllActions(stmt)" class="text-xs text-gray-500 hover:text-gray-700">Clear</button>
                  </div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                  <label v-for="action in getServiceActions(stmt.service)" :key="action" class="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" :checked="stmt.actions.includes(action)" @change="toggleAction(stmt, action)" class="text-blue-600 rounded" />
                    <span class="text-xs text-gray-700">{{ action }}</span>
                  </label>
                </div>
              </div>
              <div v-if="stmt.resource === 'specific'">
                <label class="block text-xs font-medium text-gray-500 mb-1">Resource ARN</label>
                <input type="text" placeholder="arn:s3:::my-bucket/*" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Conditions (optional)</label>
                <input v-model="stmt.conditions" type="text" placeholder="e.g. region:RequestedRegion equals us-east-1" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <button @click="addStatement()" class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add new statement
          </button>
        </div>

        <!-- JSON editor -->
        <div v-if="createMode === 'json'">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-gray-200 bg-[#f2f3f3] flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-700">Policy Document</h3>
              <div class="flex gap-2">
                <button @click="() => { try { createForm.policyDocument = JSON.stringify(JSON.parse(createForm.policyDocument), null, 2) } catch {} }" class="px-3 py-1 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-500">Format</button>
                <button class="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">Import policy</button>
              </div>
            </div>
            <div class="p-1">
              <textarea v-model="createForm.policyDocument" rows="20" class="w-full px-4 py-3 border-0 text-sm font-mono bg-gray-50 focus:outline-none focus:ring-0 resize-none" />
            </div>
            <div v-if="!jsonValidation.valid" class="px-5 py-2 bg-red-50 border-t border-red-200">
              <p class="text-xs text-red-600">Invalid JSON: {{ jsonValidation.error }}</p>
            </div>
          </div>
        </div>

        <!-- Bottom buttons -->
        <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button @click="showCreate = false" class="px-5 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doCreate()" :disabled="!createForm.name || creating || (createMode === 'json' && !jsonValidation.valid)" class="px-5 py-2.5 text-sm text-white bg-[#ec7211] rounded-md hover:bg-[#d6670e] font-medium disabled:opacity-50">
            {{ creating ? 'Creating...' : 'Create policy' }}
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT DIALOG -->
    <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showEdit = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Edit policy</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Policy name</label>
            <input v-model="editForm.name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea v-model="editForm.description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showEdit = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doEdit()" :disabled="saving" class="px-4 py-2 text-sm text-white bg-[#ec7211] rounded-md hover:bg-[#d6670e] disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRM -->
    <div v-if="showDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDelete = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Delete policy</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <p class="text-sm text-gray-700">Are you sure you want to delete policy <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-sm text-gray-500">This action cannot be undone. This policy will be removed from all attached entities.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type <strong>{{ deleteTarget?.name }}</strong> to confirm:</label>
            <input v-model="deleteConfirmName" type="text" :placeholder="deleteTarget?.name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showDelete = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doDelete()" :disabled="deleteConfirmName !== deleteTarget?.name || deleting" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete policy' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>