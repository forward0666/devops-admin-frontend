<script setup lang="ts">
const accounts = ref([
  { id: '123456789012', name: 'Production', email: 'prod@company.com', status: 'Active', joined: '2023-01-15' },
  { id: '234567890123', name: 'Staging', email: 'staging@company.com', status: 'Active', joined: '2023-03-01' },
  { id: '345678901234', name: 'Development', email: 'dev@company.com', status: 'Active', joined: '2023-03-01' },
  { id: '456789012345', name: 'Security Audit', email: 'security@company.com', status: 'Active', joined: '2023-06-15' },
  { id: '567890123456', name: 'Sandbox', email: 'sandbox@company.com', status: 'Inactive', joined: '2024-01-10' },
])

const search = ref('')

const filtered = computed(() => {
  if (!search.value) return accounts.value
  const q = search.value.toLowerCase()
  return accounts.value.filter(a => a.name.toLowerCase().includes(q) || a.id.includes(q) || a.email.toLowerCase().includes(q))
})

// Add account dialog
const showAdd = ref(false)
const addForm = ref({ id: '', name: '', email: '' })
const adding = ref(false)

// Actions
const openActions = ref<string | null>(null)

async function doAdd() {
  adding.value = true
  try {
    accounts.value.push({ ...addForm.value, status: 'Active', joined: new Date().toISOString().split('T')[0] })
    showAdd.value = false
  } finally { adding.value = false }
}

function toggleStatus(id: string) {
  const acct = accounts.value.find(a => a.id === id)
  if (acct) acct.status = acct.status === 'Active' ? 'Inactive' : 'Active'
}

function removeAccount(id: string) {
  accounts.value = accounts.value.filter(a => a.id !== id)
  openActions.value = null
}

function toggleActions(id: string) {
  openActions.value = openActions.value === id ? null : id
}

function closeAll() { openActions.value = null }
</script>

<template>
  <div @click="closeAll">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Multi-Account Access</h1>
      <div class="flex gap-2">
        <button @click="showAdd = true" class="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Add account
        </button>
      </div>
    </div>

    <!-- Organization Info -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-5">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-900">My Organization</h2>
          <p class="text-sm text-gray-500">o-abc123456 · {{ accounts.length }} accounts · Management account: 123456789012</p>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Search accounts..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
    </div>

    <!-- Accounts Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-[#232f3e]">
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Account ID</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Account Name</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Email</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Joined</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="acct in filtered" :key="acct.id" class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
            <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ acct.id }}</td>
            <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ acct.name }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ acct.email }}</td>
            <td class="px-4 py-3">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', acct.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700']">
                {{ acct.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ acct.joined }}</td>
            <td class="px-4 py-3">
              <div class="relative">
                <button @click.stop="toggleActions(acct.id)" class="p-1 rounded hover:bg-gray-200 text-gray-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
                <div v-if="openActions === acct.id" class="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border py-1 z-30">
                  <button @click="toggleStatus(acct.id); openActions = null" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    {{ acct.status === 'Active' ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button @click="removeAccount(acct.id)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Remove</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!filtered?.length" class="p-8 text-center text-gray-500 text-sm">No accounts found</div>
    </div>

    <!-- ADD ACCOUNT DIALOG -->
    <div v-if="showAdd" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showAdd = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
          <h2 class="text-lg font-semibold text-white">Add account</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Account ID <span class="text-red-500">*</span></label>
            <input v-model="addForm.id" type="text" placeholder="123456789012" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Account name <span class="text-red-500">*</span></label>
            <input v-model="addForm.name" type="text" placeholder="Enter account name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-red-500">*</span></label>
            <input v-model="addForm.email" type="email" placeholder="account@example.com" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showAdd = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doAdd()" :disabled="!addForm.id || !addForm.name || adding" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {{ adding ? 'Adding...' : 'Add account' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
