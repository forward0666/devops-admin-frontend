<script setup lang="ts">
const search = ref('')
const page = ref(1)
const pageSize = 20
const sortField = ref('name')
const sortDir = ref<'asc' | 'desc'>('asc')
const { data, refresh } = await useFetch('/api/iam/roles-full', {
  query: computed(() => ({ search: search.value, page: page.value, pageSize }))
})

// Create role wizard
const showCreateWizard = ref(false)
const createStep = ref(1)
const createForm = ref({
  name: '', description: '', trustType: 'Cloud Service',
  trustPolicy: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Principal": {\n        "Service": "ec2.example.com"\n      },\n      "Action": "sts:AssumeRole"\n    }\n  ]\n}',
  policies: [] as string[], maxSession: 3600,
  tags: [] as { key: string; value: string }[]
})
const creating = ref(false)
const { data: policiesData } = await useFetch('/api/iam/policies-full', { query: { pageSize: 100 } })
const policySearch = ref('')
const policyTypeFilter = ref('All')

const trustEntities = [
  { key: 'Cloud Service', icon: 'cloud', desc: 'cloud services like EC2, Lambda, or ECS will use this role' },
  { key: 'Another account', icon: 'users', desc: 'Allow access from another account' },
  { key: 'Web Identity', icon: 'globe', desc: 'Federated users via Cognito, Google, Facebook, etc.' },
  { key: 'SAML 2.0 federation', icon: 'shield', desc: 'Corporate identity provider via SAML 2.0' },
  { key: 'Custom trust policy', icon: 'code', desc: 'Write your own custom trust policy JSON' },
]

const sessionOptions = [
  { label: '1 hour', value: 3600 },
  { label: '2 hours', value: 7200 },
  { label: '4 hours', value: 14400 },
  { label: '8 hours', value: 28800 },
  { label: '12 hours', value: 43200 },
]

const filteredCreatePolicies = computed(() => {
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

// Delete confirm
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
  else { selected.value = (data.value?.items || []).map((r: any) => r.id) }
}
function toggleOne(id: string) {
  const i = selected.value.indexOf(id)
  i === -1 ? selected.value.push(id) : selected.value.splice(i, 1)
}

function sortBy(field: string) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
}

function getTrustIcon(trustType: string) {
  if (trustType.includes('Service')) return 'cloud'
  if (trustType.includes('account')) return 'users'
  if (trustType.includes('Web') || trustType.includes('Identity')) return 'globe'
  if (trustType.includes('SAML')) return 'shield'
  return 'code'
}

function openCreate() {
  createForm.value = {
    name: '', description: '', trustType: 'Cloud Service',
    trustPolicy: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Principal": {\n        "Service": "ec2.example.com"\n      },\n      "Action": "sts:AssumeRole"\n    }\n  ]\n}',
    policies: [], maxSession: 3600, tags: []
  }
  createStep.value = 1
  policySearch.value = ''
  policyTypeFilter.value = 'All'
  showCreateWizard.value = true
}

function addTag() { createForm.value.tags.push({ key: '', value: '' }) }
function removeTag(i: number) { createForm.value.tags.splice(i, 1) }

async function doCreate() {
  creating.value = true
  try {
    await $fetch('/api/iam/roles-full', { method: 'POST', body: createForm.value })
    showCreateWizard.value = false
    await refresh()
  } finally { creating.value = false }
}

function openEdit(role: any) {
  editTarget.value = role
  editForm.value = { name: role.name, description: role.description }
  showEdit.value = true
  openActions.value = null
}

async function doEdit() {
  saving.value = true
  try {
    await $fetch(`/api/iam/roles-full/${editTarget.value.id}`, { method: 'PUT', body: editForm.value })
    showEdit.value = false
    editTarget.value = null
    await refresh()
  } finally { saving.value = false }
}

function confirmDelete(role: any) {
  deleteTarget.value = { id: role.id, name: role.name }
  deleteConfirmName.value = ''
  showDelete.value = true
  openActions.value = null
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/iam/roles-full/${deleteTarget.value.id}`, { method: 'DELETE' })
    showDelete.value = false
    deleteTarget.value = null
    await refresh()
  } finally { deleting.value = false }
}

function toggleActions(id: string) {
  openActions.value = openActions.value === id ? null : id
}
</script>

<template>
  <div>
    <!-- Page header: AWS IAM style -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-normal text-gray-900">Roles</h1>
      <div class="flex gap-2">
        <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
        <button @click="openCreate()" class="px-4 py-1.5 bg-[#ec7211] text-white rounded text-sm font-medium hover:bg-[#d6670e] flex items-center gap-1">
          Create role
        </button>
      </div>
    </div>

    <!-- Search bar: AWS style with icon -->
    <div class="mb-3">
      <div class="relative max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Filter roles" class="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#006ce0] focus:border-[#006ce0]" />
      </div>
    </div>

    <!-- Count indicator -->
    <p class="text-sm text-gray-600 mb-3">{{ data?.total || data?.items?.length || 0 }} roles found</p>

    <!-- Roles table: AWS IAM style -->
    <div class="bg-white border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-[#f2f3f3] border-b border-gray-300">
            <th class="w-10 px-3 py-2">
              <input type="checkbox" :checked="allSelected" @change="toggleAll()" class="rounded text-[#006ce0]" />
            </th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 select-none" @click="sortBy('name')">
              <div class="flex items-center gap-1">
                Role name
                <svg v-if="sortField === 'name' && sortDir === 'asc'" class="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                <svg v-else-if="sortField === 'name' && sortDir === 'desc'" class="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" /></svg>
              </div>
            </th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Trusted entities</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600">Creation time</th>
            <th class="text-left px-3 py-2 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 select-none" @click="sortBy('lastActivity')">
              <div class="flex items-center gap-1">
                Last activity
                <svg v-if="sortField === 'lastActivity' && sortDir === 'asc'" class="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                <svg v-else-if="sortField === 'lastActivity' && sortDir === 'desc'" class="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" /></svg>
              </div>
            </th>
            <th class="w-16 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody v-if="data">
          <tr v-for="role in (data?.items || [])" :key="role.id"
            :class="[
              'border-b border-gray-100 hover:bg-[#f1faff] transition-colors',
              selected.includes(role.id) ? 'bg-[#e8f4fd]' : ''
            ]"
            style="height: 48px;"
          >
            <td class="px-3">
              <input type="checkbox" :checked="selected.includes(role.id)" @change="toggleOne(role.id)" class="rounded text-[#006ce0]" />
            </td>
            <td class="px-3">
              <NuxtLink :to="`/iam/roles/${role.id}`" class="text-[#006ce0] hover:text-[#004ba0] hover:underline text-sm">{{ role.name }}</NuxtLink>
            </td>
            <td class="px-3">
              <div class="flex items-center gap-2">
                <svg v-if="getTrustIcon(role.trustType) === 'cloud'" class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                <svg v-else-if="getTrustIcon(role.trustType) === 'users'" class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <svg v-else-if="getTrustIcon(role.trustType) === 'globe'" class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                <svg v-else-if="getTrustIcon(role.trustType) === 'shield'" class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <svg v-else class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                <span class="text-sm text-gray-700">{{ role.trustType }}</span>
              </div>
            </td>
            <td class="px-3 text-sm text-gray-600">{{ role.createdAt }}</td>
            <td class="px-3 text-sm text-gray-600">{{ role.lastActivity }}</td>
            <td class="px-3">
              <div class="relative">
                <button @click.stop="toggleActions(role.id)" class="p-1 rounded hover:bg-gray-200 text-gray-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
                <div v-if="openActions === role.id" class="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border py-1 z-30">
                  <NuxtLink :to="`/iam/roles/${role.id}`" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">View</NuxtLink>
                  <button @click="openEdit(role)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                  <button @click="confirmDelete(role)" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!data?.items?.length" class="p-8 text-center text-sm text-gray-500">No roles found</div>
    </div>

    <!-- Pagination -->
    <div v-if="data && (data?.total || 0) > pageSize" class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
      <div class="flex items-center gap-1">
        <button :disabled="page <= 1" @click="page--"
          class="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          ‹
        </button>
        <template v-for="p in Math.ceil(((data?.total || 0) || 0) / pageSize)" :key="p">
          <button v-if="p <= 3 || p === Math.ceil(((data?.total || 0) || 0) / pageSize) || Math.abs(p - page) <= 1"
            @click="page = p"
            :class="[
              'px-2.5 py-1 text-sm border rounded',
              p === page ? 'bg-[#006ce0] text-white border-[#006ce0]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            ]">
            {{ p }}
          </button>
          <span v-else-if="p === 4 || p === Math.ceil(((data?.total || 0) || 0) / pageSize) - 1" class="px-1 text-gray-400">…</span>
        </template>
        <button :disabled="page * pageSize >= ((data?.total || 0) || 0)" @click="page++"
          class="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          ›
        </button>
      </div>
      <span class="text-sm text-gray-600">{{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, (data?.total || 0)) }} of {{ (data?.total || 0) }}</span>
    </div>

    <!-- CREATE ROLE WIZARD (fullscreen overlay) -->
    <div v-if="showCreateWizard" class="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
      <div class="max-w-4xl mx-auto px-6 py-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Create IAM role</h1>
            <p class="text-sm text-gray-500 mt-1">Step {{ createStep }} of 3</p>
          </div>
          <button @click="showCreateWizard = false" class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Progress bar -->
        <div class="flex gap-2 mb-8">
          <div v-for="s in 3" :key="s" class="flex-1">
            <div :class="['h-1 rounded-full transition-colors', s <= createStep ? 'bg-[#ec7211]' : 'bg-gray-200']" />
            <p :class="['text-xs mt-1', s <= createStep ? 'text-gray-900 font-medium' : 'text-gray-400']">
              {{ s === 1 ? 'Trusted entity' : s === 2 ? 'Permissions' : 'Review & create' }}
            </p>
          </div>
        </div>

        <!-- Step 1: Select trusted entity -->
        <div v-if="createStep === 1" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Select trusted entity</h2>
          <p class="text-sm text-gray-500 mb-6">Choose the type of trusted entity that will use this role.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button v-for="entity in trustEntities" :key="entity.key"
              @click="createForm.trustType = entity.key"
              :class="['p-5 border-2 rounded-lg text-left transition-all', createForm.trustType === entity.key ? 'border-[#006ce0] bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50']">
              <div class="flex items-center gap-3 mb-2">
                <svg v-if="entity.icon === 'cloud'" class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                <svg v-else-if="entity.icon === 'users'" class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <svg v-else-if="entity.icon === 'globe'" class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                <svg v-else-if="entity.icon === 'shield'" class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <svg v-else class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                <span class="text-sm font-semibold text-gray-900">{{ entity.key }}</span>
              </div>
              <p class="text-xs text-gray-500">{{ entity.desc }}</p>
            </button>
          </div>
        </div>

        <!-- Step 2: Add permissions -->
        <div v-else-if="createStep === 2" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Add permissions</h2>
          <p class="text-sm text-gray-500 mb-4">Select policies to attach to this role.</p>
          <div class="flex gap-3 mb-4">
            <input v-model="policySearch" type="text" placeholder="Search policies..." class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select v-model="policyTypeFilter" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All</option>
              <option>Managed</option>
              <option>Custom</option>
            </select>
          </div>
          <div class="max-h-80 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
            <label v-for="p in filteredCreatePolicies" :key="p.id" class="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" :value="p.name" v-model="createForm.policies" class="text-[#006ce0] rounded" />
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-gray-900">{{ p.name }}</span>
                <span class="text-xs text-gray-400 ml-2">{{ p.description }}</span>
              </div>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium shrink-0', p.type === 'Managed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600']">{{ p.type }}</span>
            </label>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ createForm.policies.length }} policy(ies) selected</p>
        </div>

        <!-- Step 3: Name, review, and create -->
        <div v-else-if="createStep === 3" class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Name, review, and create</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Role name <span class="text-red-500">*</span></label>
                <input v-model="createForm.name" type="text" placeholder="Enter role name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea v-model="createForm.description" rows="2" placeholder="Optional description" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Maximum session duration</label>
                <select v-model="createForm.maxSession" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option v-for="opt in sessionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Trust policy preview -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-gray-200 bg-[#f2f3f3] flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-700">Trust policy</h3>
              <span class="text-xs text-gray-500">{{ createForm.trustType }}</span>
            </div>
            <pre class="p-5 text-sm text-gray-800 font-mono bg-gray-50 overflow-x-auto">{{ createForm.trustPolicy }}</pre>
          </div>

          <!-- Tags -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-700">Tags</h3>
              <button @click="addTag()" class="text-sm text-[#006ce0] hover:text-[#004ba0] flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                Add tag
              </button>
            </div>
            <div v-if="createForm.tags.length" class="space-y-2">
              <div v-for="(tag, i) in createForm.tags" :key="i" class="flex gap-2 items-center">
                <input v-model="tag.key" type="text" placeholder="Key" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input v-model="tag.value" type="text" placeholder="Value" class="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button @click="removeTag(i)" class="text-red-500 hover:text-red-700 p-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">No tags added</p>
          </div>

          <!-- Summary -->
          <div class="bg-gray-50 rounded-lg border border-gray-200 p-5 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Trusted entity</span><span class="font-medium text-gray-900">{{ createForm.trustType }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Policies</span><span class="font-medium text-gray-900">{{ createForm.policies.length }} selected</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Max session</span><span class="font-medium text-gray-900">{{ Math.floor(createForm.maxSession / 3600) }}h</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Tags</span><span class="font-medium text-gray-900">{{ createForm.tags.length }}</span></div>
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button v-if="createStep > 1" @click="createStep--" class="px-5 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium">Back</button>
          <div v-else />
          <div class="flex gap-3">
            <button @click="showCreateWizard = false" class="px-5 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button v-if="createStep < 3" @click="createStep++" class="px-5 py-2.5 text-sm text-white bg-[#ec7211] rounded-md hover:bg-[#d6670e] font-medium">Next</button>
            <button v-else @click="doCreate()" :disabled="!createForm.name || creating" class="px-5 py-2.5 text-sm text-white bg-[#ec7211] rounded-md hover:bg-[#d6670e] font-medium disabled:opacity-50">
              {{ creating ? 'Creating...' : 'Create role' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT DIALOG -->
    <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showEdit = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Edit role</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role name</label>
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
          <h2 class="text-lg font-semibold text-gray-900">Delete role</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <p class="text-sm text-gray-700">Are you sure you want to delete role <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="text-sm text-gray-500">This action cannot be undone.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type <strong>{{ deleteTarget?.name }}</strong> to confirm:</label>
            <input v-model="deleteConfirmName" type="text" :placeholder="deleteTarget?.name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showDelete = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doDelete()" :disabled="deleteConfirmName !== deleteTarget?.name || deleting" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete role' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
