<script setup lang="ts">
const { data: allPolicies, refresh } = await useFetch('/api/iam/sc-policies')
const rcpPolicies = computed(() => {
  if (!allPolicies.value) return []
  return allPolicies.value.filter((p: any) => p.type === 'Resource control')
})

const search = ref('')
const expandedPolicy = ref<string | null>(null)
const openActions = ref<string | null>(null)

const filtered = computed(() => {
  if (!search.value) return rcpPolicies.value
  const q = search.value.toLowerCase()
  return rcpPolicies.value.filter((p: any) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
})

// Create RCP dialog
const showCreate = ref(false)
const createForm = ref({
  name: '', description: '',
  policyDocument: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Action": [],\n      "Resource": "*"\n    }\n  ]\n}',
  targets: [] as string[],
})
const creating = ref(false)
const targetOptions = ['Root OU', 'Production OU', 'Development OU', 'Staging OU', 'Security OU']

// Edit dialog
const showEdit = ref(false)
const editTarget = ref<any>(null)
const editForm = ref({ name: '', description: '', policyDocument: '' })
const saving = ref(false)

// Detach confirm
const showDetach = ref(false)
const detachTarget = ref<any>(null)

// Delete confirm
const showDelete = ref(false)
const deleteTarget = ref<any>(null)
const deleteConfirmName = ref('')
const deleting = ref(false)

function toggleExpand(id: string) {
  expandedPolicy.value = expandedPolicy.value === id ? null : id
}

function toggleActions(id: string) {
  openActions.value = openActions.value === id ? null : id
}

function closeAll() { openActions.value = null }

function openCreate() {
  createForm.value = {
    name: '', description: '',
    policyDocument: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Deny",\n      "Action": [],\n      "Resource": "*"\n    }\n  ]\n}',
    targets: []
  }
  showCreate.value = true
}

async function doCreate() {
  creating.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    showCreate.value = false
    await refresh()
  } finally { creating.value = false }
}

function openEdit(p: any) {
  editTarget.value = p
  editForm.value = { name: p.name, description: p.description, policyDocument: JSON.stringify(p.policyDocument, null, 2) }
  showEdit.value = true
  openActions.value = null
}

async function doEdit() {
  saving.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    showEdit.value = false
    await refresh()
  } finally { saving.value = false }
}

function confirmDetach(p: any) {
  detachTarget.value = p
  showDetach.value = true
  openActions.value = null
}

function doDetach() {
  if (detachTarget.value) {
    detachTarget.value.status = 'Detached'
    detachTarget.value.targets = []
  }
  showDetach.value = false
  detachTarget.value = null
}

function confirmDelete(p: any) {
  deleteTarget.value = p
  deleteConfirmName.value = ''
  showDelete.value = true
  openActions.value = null
}

async function doDelete() {
  if (!deleteTarget.value || deleteConfirmName.value !== deleteTarget.value.name) return
  deleting.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    showDelete.value = false
    deleteTarget.value = null
    await refresh()
  } finally { deleting.value = false }
}
</script>

<template>
  <div @click="closeAll">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Resource Control Policies</h1>
      <div class="flex gap-2">
        <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
        <button @click="openCreate()" class="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Create RCP
        </button>
      </div>
    </div>

    <!-- Info note -->
    <div class="mb-4 bg-orange-50 border border-orange-200 rounded-md p-4 text-sm text-orange-800">
      <strong>Note:</strong> Resource Control Policies (RCPs) restrict actions across all accounts in your organization, regardless of IAM permissions granted.
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Search RCPs..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
    </div>

    <!-- Policies list -->
    <div v-if="filtered?.length" class="space-y-4">
      <div v-for="p in filtered" :key="p.id" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" @click="toggleExpand(p.id)">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded flex items-center justify-center text-xs font-bold bg-orange-100 text-orange-600">RC</div>
            <div>
              <div class="text-sm font-medium text-gray-900">{{ p.name }}</div>
              <div class="text-xs text-gray-500">{{ p.description }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', p.status === 'Attached' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">{{ p.status }}</span>
            <span v-for="t in p.targets" :key="t" class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{{ t }}</span>
            <!-- Actions menu -->
            <div class="relative" @click.stop>
              <button @click.stop="toggleActions(p.id)" class="p-1 rounded hover:bg-gray-200 text-gray-500">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
              </button>
              <div v-if="openActions === p.id" class="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border py-1 z-30">
                <button @click="openEdit(p)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                <button @click="confirmDetach(p)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Detach</button>
                <button @click="confirmDelete(p)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </div>
            <svg :class="['w-4 h-4 text-gray-400 transition-transform', expandedPolicy === p.id && 'rotate-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        <div v-if="expandedPolicy === p.id" class="border-t border-gray-200 bg-gray-50">
          <pre class="p-5 text-sm text-gray-800 font-mono overflow-x-auto">{{ JSON.stringify(p.policyDocument, null, 2) }}</pre>
        </div>
      </div>
    </div>
    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center text-gray-400 text-sm">
      No Resource Control Policies configured
    </div>

    <!-- CREATE RCP DIALOG -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showCreate = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
          <h2 class="text-lg font-semibold text-white">Create RCP</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Policy name <span class="text-red-500">*</span></label>
            <input v-model="createForm.name" type="text" placeholder="Enter policy name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea v-model="createForm.description" rows="2" placeholder="Describe what this policy does" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Policy document (JSON)</label>
            <textarea v-model="createForm.policyDocument" rows="10" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Target selection</label>
            <div class="space-y-1">
              <label v-for="t in targetOptions" :key="t" class="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" :value="t" v-model="createForm.targets" class="text-blue-600 rounded" />
                <span class="text-sm text-gray-700">{{ t }}</span>
              </label>
            </div>
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
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Edit RCP</h2>
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
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Policy document (JSON)</label>
            <textarea v-model="editForm.policyDocument" rows="10" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

    <!-- DETACH CONFIRM -->
    <div v-if="showDetach && detachTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDetach = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Detach policy</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <p class="text-sm text-gray-700">Are you sure you want to detach <strong>{{ detachTarget.name }}</strong> from its targets?</p>
          <p class="text-sm text-gray-500">The policy will remain but won't be enforced on any accounts.</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showDetach = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doDetach()" class="px-4 py-2 text-sm text-white bg-yellow-600 rounded-md hover:bg-yellow-700">Detach</button>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRM -->
    <div v-if="showDelete && deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDelete = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Delete policy</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <p class="text-sm text-gray-700">Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>?</p>
          <p class="text-sm text-gray-500">This action cannot be undone.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type <strong>{{ deleteTarget.name }}</strong> to confirm:</label>
            <input v-model="deleteConfirmName" type="text" :placeholder="deleteTarget.name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showDelete = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doDelete()" :disabled="deleteConfirmName !== deleteTarget.name || deleting" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
