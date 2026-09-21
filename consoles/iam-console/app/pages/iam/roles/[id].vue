<script setup lang="ts">
const route = useRoute()
const { data: role, error, refresh } = await useFetch(`/api/iam/roles-full/${route.params.id}`)
const { data: policiesData } = await useFetch('/api/iam/policies-full', { query: { pageSize: 100 } })

const activeTab = ref('trust relationships')
const tabs = [
  { key: 'trust relationships', label: 'Trust relationships' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'access advisor', label: 'Access advisor' },
  { key: 'tags', label: 'Tags' },
]

// Edit trust policy
const showEditTrust = ref(false)
const editTrustJson = ref('')
const savingTrust = ref(false)

// Add permissions dialog
const showAddPermissions = ref(false)
const addPermSearch = ref('')
const addPermTypeFilter = ref('All')
const selectedPolicies = ref<string[]>([])
const addingPolicies = ref(false)

// Remove permission confirm
const showRemovePerm = ref(false)
const removePermTarget = ref('')

// Edit tags
const showEditTags = ref(false)
const editTags = ref<{ key: string; value: string }[]>([])
const showRemoveTag = ref(false)
const removeTagTarget = ref('')

// Access advisor search
const advisorSearch = ref('')

const rolePolicies = computed(() => {
  if (!role.value || !policiesData.value) return []
  const policyNames = role.value.policies || []
  return policiesData.value.items.filter((p: any) => policyNames.includes(p.name) || policyNames.includes(p.id))
})

const filteredAddPolicies = computed(() => {
  const items = policiesData.value?.items || []
  const currentPolicies = role.value?.policies || []
  let available = items.filter((p: any) => !currentPolicies.includes(p.name) && !currentPolicies.includes(p.id))
  if (addPermTypeFilter.value !== 'All') {
    available = available.filter((p: any) => p.type === addPermTypeFilter.value)
  }
  if (addPermSearch.value) {
    available = available.filter((p: any) => p.name.toLowerCase().includes(addPermSearch.value.toLowerCase()))
  }
  return available
})

const accessAdvisorData = computed(() => {
  if (!role.value) return []
  const services = [
    { service: 'S3', lastAccessed: '2026-09-07', actionsUsed: 'GetObject, PutObject, ListBucket' },
    { service: 'EC2', lastAccessed: '2026-09-06', actionsUsed: 'DescribeInstances, RunInstances' },
    { service: 'IAM', lastAccessed: '2026-09-07', actionsUsed: 'GetUser, ListUsers, ListRoles' },
    { service: 'DynamoDB', lastAccessed: '2026-09-05', actionsUsed: 'Scan, GetItem, PutItem' },
    { service: 'Lambda', lastAccessed: '2026-09-07', actionsUsed: 'InvokeFunction, GetFunction' },
    { service: 'RDS', lastAccessed: '2026-09-04', actionsUsed: 'DescribeDBInstances' },
    { service: 'CloudTrail', lastAccessed: '2026-09-03', actionsUsed: 'LookupEvents' },
    { service: 'ECS', lastAccessed: '2026-09-07', actionsUsed: 'RunTask, DescribeTasks' },
  ]
  if (!advisorSearch.value) return services
  return services.filter(s => s.service.toLowerCase().includes(advisorSearch.value.toLowerCase()))
})

function openEditTrust() {
  editTrustJson.value = JSON.stringify(role.value!.trustPolicy, null, 2)
  showEditTrust.value = true
}

async function saveTrustPolicy() {
  savingTrust.value = true
  try {
    const parsed = JSON.parse(editTrustJson.value)
    await $fetch(`/api/iam/roles-full/${route.params.id}`, { method: 'PUT', body: { trustPolicy: parsed } })
    showEditTrust.value = false
    await refresh()
  } finally { saving.value = false }
}

async function doAddPermissions() {
  addingPolicies.value = true
  try {
    await $fetch(`/api/iam/roles-full/${route.params.id}`, { method: 'PUT', body: { addPolicies: selectedPolicies.value } })
    showAddPermissions.value = false
    selectedPolicies.value = []
    await refresh()
  } finally { addingPolicies.value = false }
}

async function doRemovePermission() {
  await $fetch(`/api/iam/roles-full/${route.params.id}`, { method: 'PUT', body: { removePolicy: removePermTarget.value } })
  showRemovePerm.value = false
  await refresh()
}

function openEditTags() {
  editTags.value = role.value?.tags ? [...role.value.tags.map((t: any) => ({ ...t }))] : []
  if (!editTags.value.length) editTags.value.push({ key: '', value: '' })
  showEditTags.value = true
}

function addEditTag() { editTags.value.push({ key: '', value: '' }) }
function removeEditTag(i: number) { editTags.value.splice(i, 1) }

async function saveTags() {
  await $fetch(`/api/iam/roles-full/${route.params.id}`, { method: 'PUT', body: { tags: editTags.value } })
  showEditTags.value = false
  await refresh()
}

function confirmRemoveTag(key: string) {
  removeTagTarget.value = key
  showRemoveTag.value = true
}

async function doRemoveTag() {
  const newTags = (role.value?.tags || []).filter((t: any) => t.key !== removeTagTarget.value)
  await $fetch(`/api/iam/roles-full/${route.params.id}`, { method: 'PUT', body: { tags: newTags } })
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
  <div v-if="error" class="text-center py-20 text-gray-500">Role not found</div>
  <div v-else-if="role">
    <!-- Page header -->
    <div class="flex items-start justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded bg-purple-100 text-purple-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ role.name }}</h1>
          <p class="text-sm text-gray-500">{{ role.description }}</p>
        </div>
        <span class="ml-2 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">{{ role.trustType }}</span>
      </div>
    </div>

    <div class="text-xs text-gray-400 mb-4 font-mono">{{ role.arn }}</div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex gap-0 -mb-px overflow-x-auto">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
 :class="['px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap', activeTab === tab.key ? 'border-[#ec7211] text-[#ec7211]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">
          {{ tab.label }}
          <span v-if="tab.key === 'permissions'" class="ml-1 text-xs text-gray-400">({{ rolePolicies.length }})</span>
        </button>
      </nav>
    </div>

    <!-- TAB: TRUST RELATIONSHIPS -->
    <div v-if="activeTab === 'trust relationships'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-5 py-3 border-b border-gray-200 bg-[#f2f3f3] flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700">Trust Policy</h3>
        <button @click="openEditTrust()" class="px-3 py-1 bg-[#006ce0] text-white rounded text-xs font-medium hover:bg-[#004ba0]">Edit trust policy</button>
      </div>
      <pre class="p-5 text-sm text-gray-800 font-mono bg-gray-50 overflow-x-auto leading-relaxed">{{ JSON.stringify(role.trustPolicy, null, 2) }}</pre>
    </div>

    <!-- TAB: PERMISSIONS -->
    <div v-else-if="activeTab === 'permissions'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-700">Permissions ({{ rolePolicies.length }})</span>
        <div class="flex gap-2">
          <button @click="showRemovePerm = true; removePermTarget = ''" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Remove</button>
          <button @click="selectedPolicies = []; addPermSearch = ''; addPermTypeFilter = 'All'; showAddPermissions = true" class="px-4 py-1.5 bg-[#ec7211] text-white rounded-md text-sm font-medium hover:bg-[#d6670e] flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add permissions
          </button>
        </div>
      </div>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Policy name</th>
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
            <th class="w-16 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in rolePolicies" :key="p.id" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5">
              <NuxtLink :to="`/iam/policies/${p.id}`" class="text-sm font-medium text-[#006ce0] hover:text-[#004ba0] hover:underline">{{ p.name }}</NuxtLink>
            </td>
            <td class="px-4 py-2.5">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', p.type === 'Managed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600']">{{ p.type }}</span>
            </td>
            <td class="px-4 py-2.5">
              <button @click="removePermTarget = p.name; showRemovePerm = true" class="text-red-500 hover:text-red-700 p-1" title="Remove">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!rolePolicies.length" class="p-6 text-center text-sm text-gray-400">No policies attached</div>
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
        <h3 class="text-sm font-semibold text-gray-700">Tags ({{ role.tags?.length || 0 }})</h3>
        <button @click="openEditTags()" class="px-4 py-2 bg-[#ec7211] text-white rounded-md text-sm font-medium hover:bg-[#d6670e] flex items-center gap-1">
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
          <tr v-for="tag in role.tags" :key="tag.key" class="border-t border-gray-100 hover:bg-blue-50/50">
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
      <div v-if="!role.tags?.length" class="p-6 text-center text-sm text-gray-400">No tags</div>
    </div>

    <!-- EDIT TRUST POLICY DIALOG -->
    <div v-if="showEditTrust" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showEditTrust = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#f2f3f3] rounded-t-lg">
          <h2 class="text-lg font-semibold text-gray-800">Edit trust policy</h2>
        </div>
        <div class="px-6 py-5">
          <textarea v-model="editTrustJson" rows="16" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p class="text-xs text-gray-400 mt-2">Edit the JSON trust policy document. Invalid JSON will be rejected.</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showEditTrust = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="saveTrustPolicy()" :disabled="savingTrust" class="px-4 py-2 text-sm text-white bg-[#ec7211] rounded-md hover:bg-[#d6670e] disabled:opacity-50">
            {{ savingTrust ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ADD PERMISSIONS DIALOG -->
    <div v-if="showAddPermissions" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showAddPermissions = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#f2f3f3] rounded-t-lg">
          <h2 class="text-lg font-semibold text-gray-800">Add permissions</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <div class="flex gap-2">
            <input v-model="addPermSearch" type="text" placeholder="Search policies..." class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select v-model="addPermTypeFilter" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All</option>
              <option>Managed</option>
              <option>Custom</option>
            </select>
          </div>
          <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
            <label v-for="p in filteredAddPolicies" :key="p.id" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" :value="p.name" v-model="selectedPolicies" class="text-blue-600 rounded" />
              <span class="text-sm text-gray-700">{{ p.name }}</span>
              <span :class="['ml-auto text-xs px-1.5 py-0.5 rounded', p.type === 'Managed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600']">{{ p.type }}</span>
            </label>
            <div v-if="!filteredAddPolicies.length" class="text-xs text-gray-400 py-2 px-2 text-center">No available policies</div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showAddPermissions = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doAddPermissions()" :disabled="!selectedPolicies.length || addingPolicies" class="px-4 py-2 text-sm text-white bg-[#ec7211] rounded-md hover:bg-[#d6670e] disabled:opacity-50">
            {{ addingPolicies ? 'Adding...' : 'Add permissions' }}
          </button>
        </div>
      </div>
    </div>

    <!-- REMOVE PERMISSION CONFIRM -->
    <div v-if="showRemovePerm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showRemovePerm = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Remove policy</h2>
        </div>
        <div class="px-6 py-5">
          <p class="text-sm text-gray-700">Remove <strong>{{ removePermTarget }}</strong> from role <strong>{{ role.name }}</strong>?</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showRemovePerm = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doRemovePermission()" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Remove</button>
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