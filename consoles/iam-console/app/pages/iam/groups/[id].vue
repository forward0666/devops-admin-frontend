<script setup lang="ts">
const route = useRoute()
const { data: group, error, refresh } = await useFetch(`/api/iam/groups-full/${route.params.id}`)
const { data: usersData } = await useFetch('/api/iam/users-full', { query: { pageSize: 100 } })
const { data: policiesData } = await useFetch('/api/iam/policies-full', { query: { pageSize: 100 } })

const activeTab = ref('users')
const tabs = [
  { key: 'users', label: 'Users' },
  { key: 'permissions', label: 'Permissions' },
]

// Delete group
const showDelete = ref(false)
const deleteConfirmName = ref('')
const deleting = ref(false)

// Add users dialog
const showAddUsers = ref(false)
const addUsersSearch = ref('')
const selectedUsers = ref<string[]>([])
const addingUsers = ref(false)

// Add policies dialog
const showAddPolicies = ref(false)
const addPolicySearch = ref('')
const addPolicyTypeFilter = ref('All')
const selectedPolicies = ref<string[]>([])
const addingPolicies = ref(false)

// Remove user confirm
const showRemoveUser = ref(false)
const removeUserTarget = ref('')

// Remove policy confirm
const showRemovePolicy = ref(false)
const removePolicyTarget = ref('')

const memberUsers = computed(() => {
  if (!group.value || !usersData.value) return []
  const members = group.value.members || []
  return usersData.value.items.filter((u: any) => members.includes(u.username) || members.includes(u.id))
})

const groupPolicies = computed(() => {
  if (!group.value || !policiesData.value) return []
  const policyNames = group.value.policies || []
  return policiesData.value.items.filter((p: any) => policyNames.includes(p.name) || policyNames.includes(p.id))
})

const filteredAddUsers = computed(() => {
  const items = usersData.value?.items || []
  const currentMembers = group.value?.members || []
  const available = items.filter((u: any) => !currentMembers.includes(u.username) && !currentMembers.includes(u.id))
  if (!addUsersSearch.value) return available
  return available.filter((u: any) => u.username.toLowerCase().includes(addUsersSearch.value.toLowerCase()))
})

const filteredAddPolicies = computed(() => {
  const items = policiesData.value?.items || []
  const currentPolicies = group.value?.policies || []
  let available = items.filter((p: any) => !currentPolicies.includes(p.name) && !currentPolicies.includes(p.id))
  if (addPolicyTypeFilter.value !== 'All') {
    available = available.filter((p: any) => p.type === addPolicyTypeFilter.value)
  }
  if (addPolicySearch.value) {
    available = available.filter((p: any) => p.name.toLowerCase().includes(addPolicySearch.value.toLowerCase()))
  }
  return available
})

async function doDelete() {
  deleting.value = true
  try {
    await $fetch(`/api/iam/groups-full/${route.params.id}`, { method: 'DELETE' })
    navigateTo('/iam/groups')
  } finally { deleting.value = false }
}

async function doAddUsers() {
  addingUsers.value = true
  try {
    await $fetch(`/api/iam/groups-full/${route.params.id}`, { method: 'PUT', body: { addUsers: selectedUsers.value } })
    showAddUsers.value = false
    selectedUsers.value = []
    await refresh()
  } finally { addingUsers.value = false }
}

async function doAddPolicies() {
  addingPolicies.value = true
  try {
    await $fetch(`/api/iam/groups-full/${route.params.id}`, { method: 'PUT', body: { addPolicies: selectedPolicies.value } })
    showAddPolicies.value = false
    selectedPolicies.value = []
    await refresh()
  } finally { addingPolicies.value = false }
}

async function doRemoveUser() {
  await $fetch(`/api/iam/groups-full/${route.params.id}`, { method: 'PUT', body: { removeUser: removeUserTarget.value } })
  showRemoveUser.value = false
  await refresh()
}

async function doRemovePolicy() {
  await $fetch(`/api/iam/groups-full/${route.params.id}`, { method: 'PUT', body: { removePolicy: removePolicyTarget.value } })
  showRemovePolicy.value = false
  await refresh()
}
</script>

<template>
  <div v-if="error" class="text-center py-20 text-gray-500">Group not found</div>
  <div v-else-if="group">
    <!-- Page header -->
    <div class="flex items-start justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ group.name }}</h1>
          <p class="text-sm text-gray-500">{{ group.description }}</p>
        </div>
      </div>
      <button @click="showDelete = true" class="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        Delete group
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex gap-0 -mb-px">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          :class="['px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap', activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">
          {{ tab.label }}
          <span v-if="tab.key === 'users'" class="ml-1 text-xs text-gray-400">({{ memberUsers.length }})</span>
          <span v-if="tab.key === 'permissions'" class="ml-1 text-xs text-gray-400">({{ groupPolicies.length }})</span>
        </button>
      </nav>
    </div>

    <!-- TAB: USERS -->
    <div v-if="activeTab === 'users'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-700">Users ({{ memberUsers.length }})</span>
        <button @click="selectedUsers = []; addUsersSearch = ''; showAddUsers = true" class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Add users
        </button>
      </div>
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">User name</th>
            <th class="w-16 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in memberUsers" :key="u.id" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5">
              <NuxtLink :to="`/iam/users/${u.id}`" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">{{ u.username }}</NuxtLink>
            </td>
            <td class="px-4 py-2.5">
              <button @click="removeUserTarget = u.username; showRemoveUser = true" class="text-red-500 hover:text-red-700 p-1" title="Remove user">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!memberUsers.length" class="p-6 text-center text-sm text-gray-400">No users in this group</div>
    </div>

    <!-- TAB: PERMISSIONS -->
    <div v-else-if="activeTab === 'permissions'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 border-b border-gray-200 flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-700">Permissions ({{ groupPolicies.length }})</span>
        <button @click="selectedPolicies = []; addPolicySearch = ''; addPolicyTypeFilter = 'All'; showAddPolicies = true" class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Attach policies
        </button>
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
          <tr v-for="p in groupPolicies" :key="p.id" class="border-t border-gray-100 hover:bg-blue-50/50">
            <td class="px-4 py-2.5">
              <NuxtLink :to="`/iam/policies/${p.id}`" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">{{ p.name }}</NuxtLink>
            </td>
            <td class="px-4 py-2.5">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', p.type === 'Managed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600']">{{ p.type }}</span>
            </td>
            <td class="px-4 py-2.5">
              <button @click="removePolicyTarget = p.name; showRemovePolicy = true" class="text-red-500 hover:text-red-700 p-1" title="Remove policy">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!groupPolicies.length" class="p-6 text-center text-sm text-gray-400">No policies attached</div>
    </div>

    <!-- DELETE CONFIRM -->
    <div v-if="showDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDelete = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Delete group</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <p class="text-sm text-gray-700">Are you sure you want to delete group <strong>{{ group.name }}</strong>?</p>
          <p class="text-sm text-gray-500">This action cannot be undone.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type <strong>{{ group.name }}</strong> to confirm:</label>
            <input v-model="deleteConfirmName" type="text" :placeholder="group.name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showDelete = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doDelete()" :disabled="deleteConfirmName !== group.name || deleting" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete group' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ADD USERS DIALOG -->
    <div v-if="showAddUsers" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showAddUsers = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#f2f3f3] rounded-t-lg">
          <h2 class="text-lg font-semibold text-gray-800">Add users to {{ group.name }}</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <input v-model="addUsersSearch" type="text" placeholder="Search users..." class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
            <label v-for="u in filteredAddUsers" :key="u.id" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" :value="u.username" v-model="selectedUsers" class="text-blue-600 rounded" />
              <span class="text-sm text-gray-700">{{ u.username }}</span>
            </label>
            <div v-if="!filteredAddUsers.length" class="text-xs text-gray-400 py-2 px-2 text-center">No available users</div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showAddUsers = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doAddUsers()" :disabled="!selectedUsers.length || addingUsers" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {{ addingUsers ? 'Adding...' : 'Add users' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ADD POLICIES DIALOG -->
    <div v-if="showAddPolicies" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showAddPolicies = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#f2f3f3] rounded-t-lg">
          <h2 class="text-lg font-semibold text-gray-800">Attach policies to {{ group.name }}</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <div class="flex gap-2">
            <input v-model="addPolicySearch" type="text" placeholder="Search policies..." class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select v-model="addPolicyTypeFilter" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
          <button @click="showAddPolicies = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doAddPolicies()" :disabled="!selectedPolicies.length || addingPolicies" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {{ addingPolicies ? 'Attaching...' : 'Attach policies' }}
          </button>
        </div>
      </div>
    </div>

    <!-- REMOVE USER CONFIRM -->
    <div v-if="showRemoveUser" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showRemoveUser = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Remove user</h2>
        </div>
        <div class="px-6 py-5">
          <p class="text-sm text-gray-700">Remove <strong>{{ removeUserTarget }}</strong> from group <strong>{{ group.name }}</strong>?</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showRemoveUser = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doRemoveUser()" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Remove</button>
        </div>
      </div>
    </div>

    <!-- REMOVE POLICY CONFIRM -->
    <div v-if="showRemovePolicy" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showRemovePolicy = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Remove policy</h2>
        </div>
        <div class="px-6 py-5">
          <p class="text-sm text-gray-700">Detach <strong>{{ removePolicyTarget }}</strong> from group <strong>{{ group.name }}</strong>?</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showRemovePolicy = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doRemovePolicy()" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>