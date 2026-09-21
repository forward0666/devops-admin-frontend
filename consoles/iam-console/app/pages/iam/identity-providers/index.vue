<script setup lang="ts">
const { data: providers, refresh } = await useFetch('/api/iam/identity-providers')

// Search
const search = ref('')

const filtered = computed(() => {
  const items = providers.value?.items || []
  if (!search.value) return items
  const q = search.value.toLowerCase()
  return items.filter((p: any) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || p.arn.toLowerCase().includes(q))
})

// Add provider dialog
const showCreate = ref(false)
const createForm = ref({ name: '', type: 'SAML' as 'SAML' | 'OIDC', metadataUrl: '', metadataFile: '', clientId: '', thumbprints: '' })
const creating = ref(false)

// Delete confirm (type name)
const showDelete = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)
const deleteConfirmName = ref('')
const deleting = ref(false)

// View detail
const showView = ref(false)
const viewTarget = ref<any>(null)

const openActions = ref<string | null>(null)

function openCreate() {
  createForm.value = { name: '', type: 'SAML', metadataUrl: '', metadataFile: '', clientId: '', thumbprints: '' }
  showCreate.value = true
}

async function doCreate() {
  creating.value = true
  try {
    await $fetch('/api/iam/identity-providers', { method: 'POST', body: createForm.value })
    showCreate.value = false
    await refresh()
  } finally { creating.value = false }
}

function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    createForm.value.metadataFile = file.name
    // In real app, read file content
  }
}

function confirmDelete(idp: any) {
  deleteTarget.value = { id: idp.id, name: idp.name }
  deleteConfirmName.value = ''
  showDelete.value = true
  openActions.value = null
}

async function doDelete() {
  if (!deleteTarget.value || deleteConfirmName.value !== deleteTarget.value.name) return
  deleting.value = true
  try {
    await $fetch(`/api/iam/identity-providers/${deleteTarget.value.id}`, { method: 'DELETE' })
    showDelete.value = false
    deleteTarget.value = null
    deleteConfirmName.value = ''
    await refresh()
  } finally { deleting.value = false }
}

function viewProvider(idp: any) {
  viewTarget.value = idp
  showView.value = true
  openActions.value = null
}

function toggleActions(id: string) {
  openActions.value = openActions.value === id ? null : id
}

function closeAll() {
  openActions.value = null
}
</script>

<template>
  <div @click="closeAll">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Identity Providers</h1>
      <div class="flex gap-2">
        <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
        <button @click="openCreate()" class="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Add identity provider
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Search identity providers..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-[#232f3e]">
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider">Provider Name</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider">Type</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider">ARN</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider">Creation Time</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody v-if="filtered">
          <tr v-for="idp in filtered" :key="idp.id" class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
            <td class="px-4 py-3">
              <button @click="viewProvider(idp)" class="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm">{{ idp.name }}</button>
            </td>
            <td class="px-4 py-3">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', idp.type === 'SAML' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700']">{{ idp.type }}</span>
            </td>
            <td class="px-4 py-3 text-xs font-mono text-gray-500 max-w-xs truncate" :title="idp.arn">{{ idp.arn }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ idp.createdAt }}</td>
            <td class="px-4 py-3">
              <div class="relative">
                <button @click.stop="toggleActions(idp.id)" class="p-1 rounded hover:bg-gray-200 text-gray-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
                <div v-if="openActions === idp.id" class="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border py-1 z-30">
                  <button @click="viewProvider(idp)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">View</button>
                  <button @click="confirmDelete(idp)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!filtered?.length" class="p-8 text-center text-gray-500 text-sm">No identity providers found</div>
    </div>

    <!-- ADD PROVIDER DIALOG -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showCreate = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
          <h2 class="text-lg font-semibold text-white">Add identity provider</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <!-- Provider type tabs -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Provider type</label>
            <div class="flex border-b border-gray-200">
              <button
                v-for="t in ['SAML', 'OIDC']" :key="t"
                @click="createForm.type = t as any"
                :class="['px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px', createForm.type === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
              >
                {{ t === 'SAML' ? 'SAML' : 'OpenID Connect' }}
              </button>
            </div>
          </div>

          <!-- Provider name (both types) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Provider name <span class="text-red-500">*</span></label>
            <input v-model="createForm.name" type="text" placeholder="Enter provider name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <!-- SAML fields -->
          <template v-if="createForm.type === 'SAML'">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Metadata document</label>
              <div class="space-y-3">
                <div>
                  <label class="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span class="text-sm text-gray-600">{{ createForm.metadataFile || 'Upload metadata file' }}</span>
                    <input type="file" accept=".xml,.txt" class="hidden" @change="handleFileUpload" />
                  </label>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400">
                  <div class="flex-1 h-px bg-gray-200"></div>
                  <span>OR</span>
                  <div class="flex-1 h-px bg-gray-200"></div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Enter metadata URL</label>
                  <input v-model="createForm.metadataUrl" type="text" placeholder="https://example.com/metadata.xml" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </template>

          <!-- OIDC fields -->
          <template v-if="createForm.type === 'OIDC'">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Provider URL <span class="text-red-500">*</span></label>
              <input v-model="createForm.metadataUrl" type="text" placeholder="https://accounts.google.com" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p class="text-xs text-gray-500 mt-1">The URL of the OIDC identity provider (e.g. https://accounts.google.com)</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Client ID list <span class="text-red-500">*</span></label>
              <input v-model="createForm.clientId" type="text" placeholder="Enter client IDs (comma separated)" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Thumbprints <span class="text-gray-400 text-xs">(optional)</span></label>
              <textarea v-model="createForm.thumbprints" rows="3" placeholder="Enter thumbprints (comma separated)" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p class="text-xs text-gray-500 mt-1">Comma-separated list of server certificate thumbprints</p>
            </div>
          </template>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showCreate = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doCreate()" :disabled="!createForm.name || creating" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {{ creating ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- VIEW DETAIL DIALOG -->
    <div v-if="showView && viewTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showView = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
          <h2 class="text-lg font-semibold text-white">Identity Provider Details</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Provider Name</span>
            <span class="text-sm font-medium text-gray-900">{{ viewTarget.name }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Type</span>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', viewTarget.type === 'SAML' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700']">{{ viewTarget.type }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">ARN</span>
            <span class="text-xs font-mono text-gray-700 break-all text-right max-w-[60%]">{{ viewTarget.arn }}</span>
          </div>
          <div v-if="viewTarget.metadataUrl" class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Metadata URL</span>
            <span class="text-xs font-mono text-gray-700 break-all text-right max-w-[60%]">{{ viewTarget.metadataUrl }}</span>
          </div>
          <div v-if="viewTarget.clientId" class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Client ID</span>
            <span class="text-sm text-gray-700">{{ viewTarget.clientId }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Created</span>
            <span class="text-sm text-gray-700">{{ viewTarget.createdAt }}</span>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button @click="showView = false" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRM (type name) -->
    <div v-if="showDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDelete = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Delete identity provider</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <p class="text-sm text-gray-700">Are you sure you want to delete identity provider <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-sm text-gray-500">This action cannot be undone. Any roles or applications relying on this provider will no longer be able to authenticate.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type <strong>{{ deleteTarget?.name }}</strong> to confirm:</label>
            <input v-model="deleteConfirmName" type="text" :placeholder="deleteTarget?.name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showDelete = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doDelete()" :disabled="deleteConfirmName !== deleteTarget?.name || deleting" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete provider' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
