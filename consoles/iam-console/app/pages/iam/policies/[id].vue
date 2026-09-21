<script setup lang="ts">
const route = useRoute()
const { data: policy, error, refresh } = await useFetch(`/api/iam/policies-full/${route.params.id}`)

const activeTab = ref('permissions')
const tabs = [
  { key: 'permissions', label: 'Permissions' },
  { key: 'policy usage', label: 'Policy usage' },
  { key: 'access advisor', label: 'Access advisor' },
  { key: 'tags', label: 'Tags' },
]

// Edit policy JSON
const showEditPolicy = ref(false)
const editPolicyJson = ref('')
const savingPolicy = ref(false)

// Delete policy
const showDelete = ref(false)
const deleteConfirmName = ref('')
const deleting = ref(false)

// Edit tags
const showEditTags = ref(false)
const editTags = ref<{ key: string; value: string }[]>([])
const showRemoveTag = ref(false)
const removeTagTarget = ref('')

// Access advisor search
const advisorSearch = ref('')

const policyUsageData = computed(() => {
  if (!policy.value) return []
  // Simulated usage data based on attachment count
  const usages = [
    { entity: 'Admins', type: 'Group', attachedVia: 'Direct' },
    { entity: 'EC2-Service-Role', type: 'Role', attachedVia: 'Direct' },
    { entity: 'CrossAccount-Admin', type: 'Role', attachedVia: 'Direct' },
    { entity: 'Developers', type: 'Group', attachedVia: 'Direct' },
    { entity: 'devops-lead', type: 'User', attachedVia: 'Group: Admins' },
    { entity: 'admin', type: 'User', attachedVia: 'Group: Admins' },
    { entity: 'developer1', type: 'User', attachedVia: 'Group: Developers' },
    { entity: 'Lambda-Execution-Role', type: 'Role', attachedVia: 'Direct' },
    { entity: 'CI-CD-Pipeline-Role', type: 'Role', attachedVia: 'Direct' },
    { entity: 'DataTeam', type: 'Group', attachedVia: 'Direct' },
  ]
  return usages.slice(0, policy.value.attachmentCount || 0)
})

const accessAdvisorData = computed(() => {
  if (!policy.value) return []
  const services = [
    { service: 'S3', lastAccessed: '2026-09-07', actionsUsed: 'GetObject, PutObject, ListBucket' },
    { service: 'EC2', lastAccessed: '2026-09-06', actionsUsed: 'DescribeInstances, RunInstances' },
    { service: 'IAM', lastAccessed: '2026-09-07', actionsUsed: 'GetUser, ListUsers' },
    { service: 'DynamoDB', lastAccessed: '2026-09-05', actionsUsed: 'Scan, GetItem, PutItem' },
    { service: 'Lambda', lastAccessed: '2026-09-07', actionsUsed: 'InvokeFunction, GetFunction' },
    { service: 'RDS', lastAccessed: '2026-09-04', actionsUsed: 'DescribeDBInstances' },
    { service: 'CloudTrail', lastAccessed: '2026-09-03', actionsUsed: 'LookupEvents' },
    { service: 'CloudWatch', lastAccessed: '2026-09-07', actionsUsed: 'GetMetricData, PutMetricData' },
  ]
  if (!advisorSearch.value) return services
  return services.filter(s => s.service.toLowerCase().includes(advisorSearch.value.toLowerCase()))
})

function openEditPolicy() {
  editPolicyJson.value = JSON.stringify(policy.value!.policyDocument, null, 2)
  showEditPolicy.value = true
}

async function savePolicyDocument() {
  savingPolicy.value = true
  try {
    const parsed = JSON.parse(editPolicyJson.value)
    await $fetch(`/api/iam/policies-full/${route.params.id}`, { method: 'PUT', body: { policyDocument: parsed } })
    showEditPolicy.value = false
    await refresh()
  } finally { savingPolicy.value = false }
}

async function doDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/iam/policies-full/${route.params.id}`, { method: 'DELETE' })
    navigateTo('/iam/policies')
  } finally { deleting.value = false }
}

function openEditTags() {
  editTags.value = policy.value?.tags ? [...policy.value.tags.map((t: any) => ({ ...t }))] : []
  if (!editTags.value.length) editTags.value.push({ key: '', value: '' })
  showEditTags.value = true
}

function addEditTag() { editTags.value.push({ key: '', value: '' }) }
function removeEditTag(i: number) { editTags.value.splice(i, 1) }

async function saveTags() {
  await $fetch(`/api/iam/policies-full/${route.params.id}`, { method: 'PUT', body: { tags: editTags.value } })
  showEditTags.value = false
  await refresh()
}

function confirmRemoveTag(key: string) {
  removeTagTarget.value = key
  showRemoveTag.value = true
}

async function doRemoveTag() {
  const newTags = (policy.value?.tags || []).filter((t: any) => t.key !== removeTagTarget.value)
  await $fetch(`/api/iam/policies-full/${route.params.id}`, { method: 'PUT', body: { tags: newTags } })
  showRemoveTag.value = false
  await refresh()
}

function relativeTime(dateStr: string) {
  if (!dateStr || dateStr === 'Never') return 'Never'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}
</script>

<template>
  <div v-if="error" class="text-center py-20 text-gray-500">Policy not found</div>
  <div v-else-if="policy">
    <!-- Page header -->
    <div class="flex items-start justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ policy.name }}</h1>
          <p class="text-sm text-gray-500">{{ policy.description }}</p>
        </div>
        <span :class="['ml-2 text-xs px-3 py-1 rounded-full font-medium', policy.type === 'Managed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700']">
          {{ policy.type }}
        </span>
      </div>
      <button v-if="policy.type === 'Custom'" @click="showDelete = true" class="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        Delete policy
      </button>
    </div>

    <div class="text-xs text-gray-400 mb-4 font-mono">{{ policy.arn }}</div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex gap-0 -mb-px overflow-x-auto">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          :class="['px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap', activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- TAB: PERMISSIONS -->
    <div v-if="activeTab === 'permissions'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-5 py-3 border-b border-gray-200 bg-[#f2f3f3] flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700">Policy Document</h3>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-500">JSON</span>
          <button v-if="policy.type === 'Custom'" @click="openEditPolicy()" class="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">Edit policy</button>
        </div>
      </div>
      <PolicyDocumentViewer :policyDocument="policy.policyDocument" />
    </div>

    <!-- TAB: POLICY USAGE -->
    <div v-else-if="activeTab === 'policy usage'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-700">Policy usage ({{ policy.attachmentCount }})</span>
      </div>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Entity</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Attached via</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="usage in policyUsageData" :key="`${usage.entity}-${usage.type}`" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5 text-sm font-medium text-gray-900">{{ usage.entity }}</td>
            <td class="px-4 py-2.5">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', usage.type === 'Group' ? 'bg-blue-100 text-blue-700' : usage.type === 'Role' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700']">{{ usage.type }}</span>
            </td>
            <td class="px-4 py-2.5 text-sm text-gray-600">{{ usage.attachedVia }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!policyUsageData.length" class="p-6 text-center text-sm text-gray-400">Not attached to any entities</div>
    </div>

    <!-- TAB: ACCESS ADVISOR -->
    <div v-else-if="activeTab === 'access advisor'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200">
        <div class="relative max-w-sm">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input v-model="advisorSearch" type="text" placeholder="Search services..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Service</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Last accessed</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions used</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in accessAdvisorData" :key="item.service" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5 text-sm font-medium text-gray-900">{{ item.service }}</td>
            <td class="px-4 py-2.5 text-sm text-gray-600">{{ relativeTime(item.lastAccessed) }}</td>
            <td class="px-4 py-2.5 text-sm text-gray-600">{{ item.actionsUsed }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TAB: TAGS -->
    <div v-else-if="activeTab === 'tags'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700">Tags ({{ policy.tags?.length || 0 }})</h3>
        <button @click="openEditTags()" class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </button>
      </div>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Key</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Value</th>
            <th class="w-16 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tag in policy.tags" :key="tag.key" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5 text-sm font-medium text-gray-700">{{ tag.key }}</td>
            <td class="px-4 py-2.5 text-sm text-gray-600">{{ tag.value }}</td>
            <td class="px-4 py-2.5">
              <button @click="confirmRemoveTag(tag.key)" class="text-red-500 hover:text-red-700 p-1" title="Remove">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!policy.tags?.length" class="p-6 text-center text-sm text-gray-400">No tags</div>
    </div>

    <!-- EDIT POLICY JSON DIALOG -->
    <div v-if="showEditPolicy" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showEditPolicy = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#f2f3f3] rounded-t-lg">
          <h2 class="text-lg font-semibold text-gray-800">Edit policy document</h2>
        </div>
        <div class="px-6 py-5">
          <textarea v-model="editPolicyJson" rows="20" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="text-xs text-gray-400 mt-2">Edit the JSON policy document. Invalid JSON will be rejected.</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showEditPolicy = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="savePolicyDocument()" :disabled="savingPolicy" class="px-4 py-2 text-sm text-white bg-[#ec7211] rounded-md hover:bg-[#d6670e] disabled:opacity-50">
            {{ savingPolicy ? 'Saving...' : 'Save' }}
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
          <p class="text-sm text-gray-700">Are you sure you want to delete policy <strong>{{ policy.name }}</strong>?</p>
          <p class="text-sm text-gray-500">This action cannot be undone. This policy will be removed from all attached entities.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type <strong>{{ policy.name }}</strong> to confirm:</label>
            <input v-model="deleteConfirmName" type="text" :placeholder="policy.name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showDelete = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doDelete()" :disabled="deleteConfirmName !== policy.name || deleting" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete policy' }}
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT TAGS DIALOG -->
    <div v-if="showEditTags" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showEditTags = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#f2f3f3] rounded-t-lg">
          <h2 class="text-lg font-semibold text-gray-800">Edit tags</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <div v-for="(tag, i) in editTags" :key="i" class="flex gap-2 items-center">
            <input v-model="tag.key" type="text" placeholder="Key" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input v-model="tag.value" type="text" placeholder="Value" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button @click="removeEditTag(i)" class="text-red-500 hover:text-red-700 p-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <button @click="addEditTag()" class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add tag
          </button>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showEditTags = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="saveTags()" class="px-4 py-2 text-sm text-white bg-[#ec7211] rounded-md hover:bg-[#d6670e]">Save tags</button>
        </div>
      </div>
    </div>

    <!-- REMOVE TAG CONFIRM -->
    <div v-if="showRemoveTag" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showRemoveTag = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Remove tag</h2>
        </div>
        <div class="px-6 py-5">
          <p class="text-sm text-gray-700">Remove tag <strong>{{ removeTagTarget }}</strong>?</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showRemoveTag = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doRemoveTag()" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>