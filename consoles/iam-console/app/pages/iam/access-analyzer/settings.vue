<script setup lang="ts">
const analyzers = ref([
  { id: 'a1', name: 'Account Analyzer', arn: 'arn:access-analyzer:us-east-1:123456789:analyzer/account-analyzer', type: 'Account', status: 'Active', region: 'us-east-1', createdAt: '2024-01-15' },
  { id: 'a2', name: 'Org Analyzer', arn: 'arn:access-analyzer:us-east-1:123456789:analyzer/org-analyzer', type: 'Organization', status: 'Active', region: 'us-east-1', createdAt: '2024-02-01' },
])

const autoCreate = ref(true)

// Create analyzer
const showCreate = ref(false)
const createForm = ref({ name: '', zoneOfTrust: 'Account' })
const creating = ref(false)

// Edit analyzer
const showEdit = ref(false)
const editTarget = ref<any>(null)
const editForm = ref({ name: '', zoneOfTrust: 'Account' })
const saving = ref(false)

// Delete
const showDelete = ref(false)
const deleteTarget = ref<any>(null)
const deleteConfirmName = ref('')
const deleting = ref(false)

const openActions = ref<string | null>(null)

function openCreate() {
  createForm.value = { name: '', zoneOfTrust: 'Account' }
  showCreate.value = true
}

async function doCreate() {
  creating.value = true
  try {
    analyzers.value.push({
      id: 'a' + Date.now(),
      name: createForm.value.name,
      arn: `arn:access-analyzer:us-east-1:123456789:analyzer/${createForm.value.name}`,
      type: createForm.value.zoneOfTrust,
      status: 'Active',
      region: 'us-east-1',
      createdAt: new Date().toISOString().split('T')[0]
    })
    showCreate.value = false
  } finally { creating.value = false }
}

function openEdit(a: any) {
  editTarget.value = a
  editForm.value = { name: a.name, zoneOfTrust: a.type }
  showEdit.value = true
  openActions.value = null
}

async function doEdit() {
  saving.value = true
  try {
    const idx = analyzers.value.findIndex(a => a.id === editTarget.value.id)
    if (idx !== -1) {
      analyzers.value[idx].name = editForm.value.name
      analyzers.value[idx].type = editForm.value.zoneOfTrust
    }
    showEdit.value = false
  } finally { saving.value = false }
}

function confirmDelete(a: any) {
  deleteTarget.value = a
  deleteConfirmName.value = ''
  showDelete.value = true
  openActions.value = null
}

async function doDelete() {
  if (!deleteTarget.value || deleteConfirmName.value !== deleteTarget.value.name) return
  deleting.value = true
  try {
    analyzers.value = analyzers.value.filter(a => a.id !== deleteTarget.value.id)
    showDelete.value = false
    deleteTarget.value = null
  } finally { deleting.value = false }
}

function toggleActions(id: string) {
  openActions.value = openActions.value === id ? null : id
}

function closeAll() { openActions.value = null }
</script>

<template>
  <div @click="closeAll">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Analyzer Settings</h1>
      <div class="flex gap-2">
        <button @click="openCreate()" class="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Create analyzer
        </button>
      </div>
    </div>

    <!-- Auto-create toggle -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900">Auto-create analyzers</h3>
          <p class="text-xs text-gray-500 mt-1">Automatically create an analyzer for new accounts added to your organization</p>
        </div>
        <button @click="autoCreate = !autoCreate" :class="['relative w-11 h-6 rounded-full transition-colors', autoCreate ? 'bg-blue-600' : 'bg-gray-300']">
          <span :class="['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', autoCreate && 'translate-x-5']"></span>
        </button>
      </div>
    </div>

    <!-- Analyzers table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-[#232f3e]">
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Analyzer Name</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Zone of Trust</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Region</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">ARN</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Created</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in analyzers" :key="a.id" class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
            <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ a.name }}</td>
            <td class="px-4 py-3">
              <span class="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">{{ a.type }}</span>
            </td>
            <td class="px-4 py-3">
              <span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">{{ a.status }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ a.region }}</td>
            <td class="px-4 py-3 text-xs font-mono text-gray-500 max-w-xs truncate" :title="a.arn">{{ a.arn }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ a.createdAt }}</td>
            <td class="px-4 py-3">
              <div class="relative">
                <button @click.stop="toggleActions(a.id)" class="p-1 rounded hover:bg-gray-200 text-gray-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
                <div v-if="openActions === a.id" class="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border py-1 z-30">
                  <button @click="openEdit(a)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                  <button @click="confirmDelete(a)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!analyzers.length" class="p-8 text-center text-gray-500 text-sm">No analyzers configured</div>
    </div>

    <!-- CREATE DIALOG -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showCreate = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
          <h2 class="text-lg font-semibold text-white">Create analyzer</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Analyzer name <span class="text-red-500">*</span></label>
            <input v-model="createForm.name" type="text" placeholder="Enter analyzer name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Zone of trust</label>
            <select v-model="createForm.zoneOfTrust" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Account">Account</option>
              <option value="Organization">Organization</option>
            </select>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showCreate = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doCreate()" :disabled="!createForm.name || creating" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {{ creating ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT DIALOG -->
    <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showEdit = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Edit analyzer</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Analyzer name</label>
            <input v-model="editForm.name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Zone of trust</label>
            <select v-model="editForm.zoneOfTrust" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Account">Account</option>
              <option value="Organization">Organization</option>
            </select>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showEdit = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doEdit()" :disabled="saving" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRM -->
    <div v-if="showDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDelete = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Delete analyzer</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <p class="text-sm text-gray-700">Are you sure you want to delete analyzer <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-sm text-gray-500">This will stop analyzing resources for unintended access.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type <strong>{{ deleteTarget?.name }}</strong> to confirm:</label>
            <input v-model="deleteConfirmName" type="text" :placeholder="deleteTarget?.name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showDelete = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doDelete()" :disabled="deleteConfirmName !== deleteTarget?.name || deleting" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>