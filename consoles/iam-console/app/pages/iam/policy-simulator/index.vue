<script setup lang="ts">
// Entity type selection
const entityType = ref<'Users' | 'Roles' | 'Policies'>('Users')
const selectedEntity = ref('')
const selectedService = ref('')
const selectedResources = ref('*')

// Service actions
const services = ['S3', 'EC2', 'IAM', 'Lambda', 'RDS', 'DynamoDB', 'CloudWatch', 'SNS', 'SQS', 'KMS', 'ECS', 'CloudFormation']
const serviceActions: Record<string, string[]> = {
  S3: ['GetObject', 'PutObject', 'DeleteObject', 'ListBucket', 'GetBucketPolicy', 'PutBucketPolicy', 'CreateBucket', 'DeleteBucket'],
  EC2: ['DescribeInstances', 'RunInstances', 'TerminateInstances', 'StartInstances', 'StopInstances', 'DescribeVolumes', 'CreateSnapshot', 'DescribeImages'],
  IAM: ['GetUser', 'ListUsers', 'CreateUser', 'DeleteUser', 'AttachUserPolicy', 'DetachUserPolicy', 'CreateRole', 'ListRoles', 'PutRolePolicy'],
  Lambda: ['InvokeFunction', 'CreateFunction', 'UpdateFunctionCode', 'DeleteFunction', 'GetFunction', 'ListFunctions', 'AddPermission'],
  RDS: ['DescribeDBInstances', 'CreateDBInstance', 'DeleteDBInstance', 'ModifyDBInstance', 'CreateDBSnapshot', 'RestoreDBInstanceFromSnapshot'],
  DynamoDB: ['GetItem', 'PutItem', 'DeleteItem', 'Scan', 'Query', 'CreateTable', 'DeleteTable', 'DescribeTable', 'UpdateItem'],
  CloudWatch: ['GetMetricData', 'PutMetricData', 'DescribeAlarms', 'PutMetricAlarm', 'DeleteAlarms', 'GetDashboard'],
  SNS: ['Publish', 'CreateTopic', 'DeleteTopic', 'Subscribe', 'Unsubscribe', 'ListTopics'],
  SQS: ['SendMessage', 'ReceiveMessage', 'DeleteMessage', 'CreateQueue', 'DeleteQueue', 'GetQueueAttributes'],
  KMS: ['Encrypt', 'Decrypt', 'GenerateDataKey', 'CreateKey', 'ScheduleKeyDeletion', 'DescribeKey'],
  ECS: ['CreateCluster', 'DeleteCluster', 'RunTask', 'StopTask', 'DescribeTasks', 'RegisterTaskDefinition'],
  CloudFormation: ['CreateStack', 'DeleteStack', 'UpdateStack', 'DescribeStacks', 'DescribeStackEvents'],
}

const selectedActions = ref<string[]>([])
const allSelected = computed(() => {
  const actions = serviceActions[selectedService.value] || []
  return actions.length > 0 && selectedActions.value.length === actions.length
})

function toggleAllActions() {
  const actions = serviceActions[selectedService.value] || []
  if (allSelected.value) {
    selectedActions.value = []
  } else {
    selectedActions.value = [...actions]
  }
}

// Entity data
const users = ['admin', 'developer1', 'developer2', 'devops-lead', 'data-analyst', 'qa-tester', 'security-auditor', 'readonly-user', 'ci-deploy-bot']
const roles = ['EC2-Service-Role', 'Lambda-Execution-Role', 'CrossAccount-Admin', 'CI-CD-Pipeline-Role', 'ReadOnly-Audit-Role', 'SAML-Federation-Role', 'WebIdentity-Cognito', 'ECS-Task-Execution']
const policies = ['AdministratorAccess', 'ReadOnlyAccess', 'EC2FullAccess', 'S3FullAccess', 'IAMFullAccess', 'LambdaFullAccess', 'Custom-DeployPolicy', 'Custom-DenyDelete']

const entityList = computed(() => {
  if (entityType.value === 'Users') return users
  if (entityType.value === 'Roles') return roles
  return policies
})

// Simulation
const simulationRunning = ref(false)
const simulationDone = ref(false)
const simulationResults = ref<{ action: string; resource: string; allowed: boolean; matchedPolicy: string }[]>([])

const allowedCount = computed(() => simulationResults.value.filter(r => r.allowed).length)
const totalCount = computed(() => simulationResults.value.length)

async function runSimulation() {
  if (!selectedEntity.value || !selectedActions.value.length) return
  simulationRunning.value = true
  simulationDone.value = false
  simulationResults.value = []

  await new Promise(r => setTimeout(r, 800))

  const denyEntities = ['readonly-user', 'data-analyst', 'ReadOnly-Audit-Role', 'ReadOnlyAccess']
  const adminEntities = ['admin', 'devops-lead', 'EC2-Service-Role', 'AdministratorAccess']
  const denyActions = ['DeleteObject', 'DeleteBucket', 'TerminateInstances', 'DeleteUser', 'DeleteFunction', 'DeleteDBInstance', 'DeleteTable', 'DeleteStack']

  for (const action of selectedActions.value) {
    const resource = selectedResources.value || '*'
    let allowed = true
    let matchedPolicy = ''

    if (denyEntities.includes(selectedEntity.value)) {
      if (action.startsWith('Get') || action.startsWith('List') || action.startsWith('Describe')) {
        allowed = true
        matchedPolicy = 'ReadOnlyAccess'
      } else {
        allowed = false
        matchedPolicy = 'No matching policy'
      }
    } else if (adminEntities.includes(selectedEntity.value)) {
      if (denyActions.includes(action)) {
        allowed = false
        matchedPolicy = 'Custom-DenyDelete'
      } else {
        allowed = true
        matchedPolicy = 'AdministratorAccess'
      }
    } else {
      if (denyActions.includes(action)) {
        allowed = false
        matchedPolicy = 'Custom-DenyDelete'
      } else {
        allowed = true
        matchedPolicy = 'Group-attached policies'
      }
    }

    simulationResults.value.push({ action: `${selectedService.value}:${action}`, resource, allowed, matchedPolicy })
  }

  simulationRunning.value = false
  simulationDone.value = true
}

// Reset on entity/service change
watch(entityType, () => { selectedEntity.value = ''; simulationDone.value = false })
watch(selectedService, () => { selectedActions.value = []; simulationDone.value = false })
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Policy Simulator</h1>

    <div class="flex gap-6">
      <!-- Left Panel (40%) -->
      <div class="w-2/5 space-y-5">
        <!-- Entity type -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Select entity type</h2>
          <div class="flex gap-2">
            <button v-for="t in ['Users', 'Roles', 'Policies']" :key="t" @click="entityType = t as any"
              :class="['flex-1 px-3 py-2 text-sm rounded-md border transition-colors text-center', entityType === t ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50']">
              {{ t }}
            </button>
          </div>
        </div>

        <!-- Entity selection -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Select {{ entityType.toLowerCase().slice(0, -1) }}</h2>
          <select v-model="selectedEntity" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select {{ entityType.toLowerCase().slice(0, -1) }}...</option>
            <option v-for="e in entityList" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>

        <!-- Service selection -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Select service</h2>
          <select v-model="selectedService" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select service...</option>
            <option v-for="s in services" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <!-- Actions list -->
        <div v-if="selectedService" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-700">Select actions</h2>
            <button @click="toggleAllActions()" class="text-xs text-blue-600 hover:text-blue-800">{{ allSelected ? 'Deselect all' : 'Select all' }}</button>
          </div>
          <div class="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
            <label v-for="a in serviceActions[selectedService]" :key="a" class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" :value="a" v-model="selectedActions" class="text-blue-600 rounded" />
              <span class="text-sm text-gray-700">{{ a }}</span>
            </label>
          </div>
        </div>

        <!-- Resources -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Select resources</h2>
          <input v-model="selectedResources" type="text" placeholder="ARN or *" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="text-xs text-gray-500 mt-1">Enter a specific ARN or * for all resources</p>
        </div>

        <!-- Run button -->
        <button @click="runSimulation()" :disabled="!selectedEntity || !selectedActions.length || simulationRunning"
          class="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <svg v-if="simulationRunning" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {{ simulationRunning ? 'Running...' : 'Run simulation' }}
        </button>
      </div>

      <!-- Right Panel (60%) - Results -->
      <div class="w-3/5">
        <!-- Empty state -->
        <div v-if="!simulationDone && !simulationRunning" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <h3 class="text-lg font-medium text-gray-500 mb-2">No simulation results</h3>
          <p class="text-sm text-gray-400">Select an entity and actions, then run simulation</p>
        </div>

        <!-- Loading state -->
        <div v-if="simulationRunning" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg class="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <p class="text-sm text-gray-500">Running simulation...</p>
        </div>

        <!-- Results -->
        <div v-if="simulationDone" class="space-y-4">
          <!-- Summary -->
          <div :class="['rounded-lg p-4 border', allowedCount === totalCount ? 'bg-green-50 border-green-200' : allowedCount === 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200']">
            <div class="flex items-center gap-2">
              <svg v-if="allowedCount === totalCount" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <svg v-else-if="allowedCount === 0" class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <svg v-else class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span :class="['text-sm font-semibold', allowedCount === totalCount ? 'text-green-800' : allowedCount === 0 ? 'text-red-800' : 'text-yellow-800']">
                {{ allowedCount }} of {{ totalCount }} actions allowed
              </span>
            </div>
          </div>

          <!-- Results table -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-[#232f3e]">
                  <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Action</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Resource</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Result</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Matched Policy</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in simulationResults" :key="i" class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td class="px-4 py-3 text-sm font-mono text-gray-700">{{ r.action }}</td>
                  <td class="px-4 py-3 text-xs font-mono text-gray-500 truncate max-w-xs" :title="r.resource">{{ r.resource }}</td>
                  <td class="px-4 py-3">
                    <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', r.allowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                      {{ r.allowed ? 'Allow' : 'Deny' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    <span v-if="r.matchedPolicy" class="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-mono">{{ r.matchedPolicy }}</span>
                    <span v-else class="text-gray-400 text-xs">None</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
