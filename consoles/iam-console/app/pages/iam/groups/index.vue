<script setup lang="ts">
const search = ref('')
const { data, refresh } = await useFetch('/api/iam/groups-full', {
  query: computed(() => ({ search: search.value }))
})

// Create group dialog
const showCreate = ref(false)
const createForm = ref({ name: '', description: '', users: [] as string[], policies: [] as string[] })
const creating = ref(false)
const { data: usersData } = await useFetch('/api/iam/users-full', { query: { pageSize: 100 } })
const { data: policiesData } = await useFetch('/api/iam/policies-full', { query: { pageSize: 100 } })
const userSearch = ref('')
const policySearch = ref('')
const policyTypeFilter = ref('All')

const filteredUsers = computed(() => {
  const items = usersData.value?.items || []
  if (!userSearch.value) return items
  return items.filter((u: any) => u.username.toLowerCase().includes(userSearch.value.toLowerCase()))
})

const filteredPolicies = computed(() => {
  const items = policiesData.value?.items || []
  let result = items
  if (policyTypeFilter.value !== 'All') {
    result = result.filter((p: any) => p.type === policyTypeFilter.value)
  }
  if (policySearch.value) {
    result = result.filter((p: any) => p.name.toLowerCase().includes(policySearch.value.toLowerCase()))
  }
  return result
})

// Edit dialog
const showEdit = ref(false)
const editTarget = ref<any>(null)
const editForm = ref({ name: '', description: '' })
const saving = ref(false)

// Delete confirm with name typing
const showDelete = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)
const deleteConfirmName = ref('')
const deleting = ref(false)

// Actions dropdown
const openActions = ref<string | null>(null)

// Selected checkboxes
const selected = ref<string[]>([])
const allSelected = computed(() => data.value?.items?.length && selected.value.length === data.value.items.length)

function toggleAll() {
  if (allSelected.value) { selected.value = [] }
  else { selected.value = (data.value?.items || []).map((g: any) => g.id) }
}
function toggleOne(id: string) {
  const i = selected.value.indexOf(id)
  i === -1 ? selected.value.push(id) : selected.value.splice(i, 1)
}

function openCreate() {
  createForm.value = { name: '', description: '', users: [], policies: [] }
  userSearch.value = ''
  policySearch.value = ''
  policyTypeFilter.value = 'All'
  showCreate.value = true
}

async function doCreate() {
  creating.value = true
  try {
    await $fetch('/api/iam/groups-full', { method: 'POST', body: createForm.value })
    showCreate.value = false
    await refresh()
  } finally { creating.value = false }
}

function openEdit(group: any) {
  editTarget.value = group
  editForm.value = { name: group.name, description: group.description }
  showEdit.value = true
  openActions.value = null
}

async function doEdit() {
  saving.value = true
  try {
    await $fetch(`/api/iam/groups-full/${editTarget.value.id}`, { method: 'PUT', body: editForm.value })
    showEdit.value = false
    editTarget.value = null
    await refresh()
  } finally { saving.value = false }
}

function confirmDelete(group: any) {
  deleteTarget.value = { id: group.id, name: group.name }
  deleteConfirmName.value = ''
  showDelete.value = true
  openActions.value = null
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/iam/groups-full/${deleteTarget.value.id}`, { method: 'DELETE' })
    showDelete.value = false
    deleteTarget.value = null
    deleteConfirmName.value = ''
    await refresh()
  } finally { deleting.value = false }
}

function toggleActions(id: string) {
  openActions.value = openActions.value === id ? null : id
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-normal text-gray-900">IAM user groups</h1>
      <div class="flex gap-2">
        <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
        <button @click="openCreate()" class="px-4 py-1.5 bg-[#ec7211] text-white rounded text-sm font-medium hover:bg-[#d6670e] flex items-center gap-1">
          Create group
        </button>
      </div>
    </div>

    <div class="mb-3">
      <div class="relative max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Filter groups" class="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#006ce0] focus:border-[#006ce0]" />
      </div>
    </div>

    <p class="text-sm text-gray-600 mb-3">{{ data?.total || data?.items?.length || 0 }} groups found</p>

    <div class="bg-white border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-[#f2f3f3] border-b border-gray-300">
            <th class="w-10 px-3 py-2">
              <input type="checkbox" :checked="allSelected" @change="toggleAll()" class="rounded text-[#006ce0]" />
            </th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Group name</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Users</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Policies</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Creation time</th>
            <th class="w-16 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody v-if="data">
          <tr v-for="group in (data?.items || [])" :key="group.id" :class="['border-b border-gray-100 hover:bg-[#f1faff] transition-colors', selected.includes(group.id) ? 'bg-[#e8f4fd]' : '']" style="height:48px;">
            <td class="px-3">
              <input type="checkbox" :checked="selected.includes(group.id)" @change="toggleOne(group.id)" class="rounded text-[#006ce0]" />
            </td>
            <td class="px-3">
              <NuxtLink :to="`/iam/groups/${group.id}`" class="text-[#006ce0] hover:text-[#004ba0] hover:underline text-sm">{{ group.name }}</NuxtLink>
            </td>
            <td class="px-4 py-3"><span class="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{{ group.members.length }}</span></td>
            <td class="px-4 py-3"><span class="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">{{ group.policies.length }}</span></td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ group.createdAt }}</td>
            <td class="px-4 py-3">
              <div class="relative">
                <button @click.stop="toggleActions(group.id)" class="p-1 rounded hover:bg-gray-200 text-gray-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
                <div v-if="openActions === group.id" class="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border py-1 z-30">
                  <NuxtLink :to="`/iam/groups/${group.id}`" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">View</NuxtLink>
                  <button @click="openEdit(group)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                  <button @click="confirmDelete(group)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!data?.items?.length" class="p-8 text-center text-sm text-gray-500">No groups found</div>
    </div>

    <!-- CREATE GROUP DIALOG -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showCreate = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#f2f3f3] rounded-t-lg">
          <h2 class="text-lg font-semibold text-gray-800">Create group</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Group name <span class="text-red-500">*</span></label>
            <input v-model="createForm.name" type="text" placeholder="Enter group name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea v-model="createForm.description" rows="2" placeholder="Optional description" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Add users</p>
            <input v-model="userSearch" type="text" placeholder="Search users..." class="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div class="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
              <label v-for="u in filteredUsers" :key="u.id" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" :value="u.username" v-model="createForm.users" class="text-blue-600 rounded" />
                <span class="text-sm text-gray-700">{{ u.username }}</span>
              </label>
              <div v-if="!filteredUsers.length" class="text-xs text-gray-400 py-1 px-2">No users found</div>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700 mb-2">Attach policies</p>
            <div class="flex gap-2 mb-2">
              <input v-model="policySearch" type="text" placeholder="Search policies..." class="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select v-model="policyTypeFilter" class="px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All</option>
                <option>Managed</option>
                <option>Custom</option>
              </select>
            </div>
            <div class="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
              <label v-for="p in filteredPolicies" :key="p.id" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" :value="p.name" v-model="createForm.policies" class="text-blue-600 rounded" />
                <span class="text-sm text-gray-700">{{ p.name }}</span>
                <span :class="['ml-auto text-xs px-1.5 py-0.5 rounded', p.type === 'Managed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600']">{{ p.type }}</span>
              </label>
              <div v-if="!filteredPolicies.length" class="text-xs text-gray-400 py-1 px-2">No policies found</div>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showCreate = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doCreate()" :disabled="!createForm.name || creating" class="px-4 py-2 text-sm text-white bg-[#ec7211] rounded-md hover:bg-[#d6670e] disabled:opacity-50">
            {{ creating ? 'Creating...' : 'Create group' }}
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT DIALOG -->
    <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showEdit = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Edit group</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Group name</label>
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

    <!-- DELETE CONFIRM (type name) -->
    <div v-if="showDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDelete = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Delete group</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <p class="text-sm text-gray-700">Are you sure you want to delete group <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-sm text-gray-500">This action cannot be undone. Users in this group will lose associated permissions.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type <strong>{{ deleteTarget?.name }}</strong> to confirm:</label>
            <input v-model="deleteConfirmName" type="text" :placeholder="deleteTarget?.name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showDelete = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doDelete()" :disabled="deleteConfirmName !== deleteTarget?.name || deleting" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete group' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>