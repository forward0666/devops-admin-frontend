<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface ServiceItem {
  serviceId: string
  displayName: string
  description: string
  icon: string
  category: string
  url: string
  status: string
  version: string
  owner: string
  tags: string | string[]
  permissions: string | string[]
  sortOrder: number
  created_at?: string
  updated_at?: string
}

const authHeaders = () => {
  if (!import.meta.client) return {}
  const token = localStorage.getItem('app_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// State
const items = ref<ServiceItem[]>([])
const total = ref(0)
const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedStatus = ref('all')
const page = ref(1)
const pageSize = ref(20)

// Dialog state
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editingItem = ref<ServiceItem | null>(null)
const deletingItem = ref<ServiceItem | null>(null)
const saving = ref(false)

// Form state
const form = ref<ServiceForm>({
  serviceId: '',
  displayName: '',
  description: '',
  icon: '📦',
  category: 'General',
  url: '',
  status: 'published',
  version: '1.0.0',
  owner: '',
  tags: '',
  permissions: '',
  sortOrder: 0,
})

interface ServiceForm {
  serviceId: string
  displayName: string
  description: string
  icon: string
  category: string
  url: string
  status: string
  version: string
  owner: string
  tags: string
  permissions: string
  sortOrder: number
}

const categories = ['General', 'Compute', 'Storage', 'Database', 'Security', 'Networking', 'Monitoring', 'DevOps', 'Analytics', 'AI/ML']
const statuses = ['published', 'in-development', 'experimental', 'disabled']

const statusColors: Record<string, string> = {
  'published': 'bg-green-100 text-green-800',
  'in-development': 'bg-blue-100 text-blue-800',
  'experimental': 'bg-orange-100 text-orange-800',
  'disabled': 'bg-gray-100 text-gray-600',
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// Debounce
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchItems()
  }, 300)
})

watch([selectedCategory, selectedStatus], () => {
  page.value = 1
  fetchItems()
})

async function fetchItems() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(page.value))
    params.set('pageSize', String(pageSize.value))
    if (searchQuery.value) params.set('search', searchQuery.value)
    if (selectedCategory.value !== 'all') params.set('category', selectedCategory.value)
    if (selectedStatus.value !== 'all') params.set('status', selectedStatus.value)

    const data = await $fetch<{ items: ServiceItem[]; total: number }>(`/api/services/catalog?${params}`, {
      headers: authHeaders(),
    })
    items.value = data.items || []
    total.value = data.total || 0
  } catch (e: any) {
    console.error('Fetch services error:', e)
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  fetchItems()
}

function openCreate() {
  form.value = {
    serviceId: '',
    displayName: '',
    description: '',
    icon: '📦',
    category: 'General',
    url: '',
    status: 'published',
    version: '1.0.0',
    owner: '',
    tags: '',
    permissions: '',
    sortOrder: 0,
  }
  showCreateDialog.value = true
}

function openEdit(item: ServiceItem) {
  editingItem.value = item
  const tags = typeof item.tags === 'string' ? item.tags : (item.tags || []).join(', ')
  const perms = typeof item.permissions === 'string' ? item.permissions : (item.permissions || []).join(', ')
  form.value = {
    serviceId: item.serviceId,
    displayName: item.displayName,
    description: item.description || '',
    icon: item.icon || '📦',
    category: item.category || 'General',
    url: item.url || '',
    status: item.status || 'published',
    version: item.version || '1.0.0',
    owner: item.owner || '',
    tags,
    permissions: perms,
    sortOrder: item.sortOrder || 0,
  }
  showEditDialog.value = true
}

function confirmDelete(item: ServiceItem) {
  deletingItem.value = item
  showDeleteDialog.value = true
}

async function handleCreate() {
  if (!form.value.serviceId || !form.value.displayName) return
  saving.value = true
  try {
    await $fetch('/api/services/catalog', {
      method: 'POST',
      body: {
        ...form.value,
        tags: form.value.tags ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        permissions: form.value.permissions ? form.value.permissions.split(',').map(p => p.trim()).filter(Boolean) : [],
      },
      headers: authHeaders(),
    })
    showCreateDialog.value = false
    await fetchItems()
  } catch (e: any) {
    console.error('Create error:', e)
    alert(e.data?.message || e.message || 'Failed to create service')
  } finally {
    saving.value = false
  }
}

async function handleUpdate() {
  if (!editingItem.value) return
  saving.value = true
  try {
    await $fetch(`/api/services/catalog/${editingItem.value.serviceId}`, {
      method: 'PUT',
      body: {
        ...form.value,
        tags: form.value.tags ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        permissions: form.value.permissions ? form.value.permissions.split(',').map(p => p.trim()).filter(Boolean) : [],
      },
      headers: authHeaders(),
    })
    showEditDialog.value = false
    editingItem.value = null
    await fetchItems()
  } catch (e: any) {
    console.error('Update error:', e)
    alert(e.data?.message || e.message || 'Failed to update service')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!deletingItem.value) return
  saving.value = true
  try {
    await $fetch(`/api/services/catalog/${deletingItem.value.serviceId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    showDeleteDialog.value = false
    deletingItem.value = null
    await fetchItems()
  } catch (e: any) {
    console.error('Delete error:', e)
    alert(e.data?.message || e.message || 'Failed to delete service')
  } finally {
    saving.value = false
  }
}

function launchService(item: ServiceItem) {
  const url = item.url || `/app/${item.serviceId}`
  if (url.startsWith('http')) {
    window.open(url, '_blank')
  } else {
    navigateTo(url)
  }
}

function parseTags(tags: string | string[]): string[] {
  if (Array.isArray(tags)) return tags
  try { return JSON.parse(tags) } catch { return [] }
}

onMounted(() => {
  fetchItems()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Service Management</h1>
            <p class="text-sm text-gray-500 mt-1">Manage services registered in the platform catalog</p>
          </div>
          <button
            @click="openCreate"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#ec7211] text-white rounded-lg hover:bg-[#d6650e] transition-colors font-medium text-sm shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Service
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1 min-w-[240px]">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search services..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211]"
            />
          </div>

          <!-- Category Filter -->
          <select
            v-model="selectedCategory"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] bg-white"
          >
            <option value="all">All Categories</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>

          <!-- Status Filter -->
          <select
            v-model="selectedStatus"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] bg-white"
          >
            <option value="all">All Statuses</option>
            <option v-for="st in statuses" :key="st" :value="st">{{ st }}</option>
          </select>

          <!-- Result count -->
          <span class="text-sm text-gray-500 ml-auto">{{ total }} service{{ total !== 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="max-w-7xl mx-auto px-6 pb-8">
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <!-- Loading -->
        <div v-if="loading" class="py-16 text-center">
          <div class="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p class="text-sm text-gray-500">Loading services...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="items.length === 0" class="py-16 text-center">
          <div class="text-gray-400 text-5xl mb-4">📦</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">No services found</h3>
          <p class="text-gray-500 mb-4">Try adjusting your filters or create a new service.</p>
          <button @click="openCreate" class="px-4 py-2 bg-[#ec7211] text-white rounded-lg hover:bg-[#d6650e] text-sm font-medium">
            Create Service
          </button>
        </div>

        <!-- Table Content -->
        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Service ID</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Display Name</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Category</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">URL</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Version</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Owner</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in items" :key="item.serviceId" class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="font-mono text-xs text-gray-800">{{ item.serviceId }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{{ item.icon || '📦' }}</span>
                      <span class="font-medium text-gray-900">{{ item.displayName }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-gray-600">{{ item.category || '—' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', statusColors[item.status] || 'bg-gray-100 text-gray-600']">
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 max-w-[200px]">
                    <span class="text-gray-500 truncate block" :title="item.url">{{ item.url || '—' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-gray-600">v{{ item.version || '—' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-gray-600">{{ item.owner || '—' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        @click="launchService(item)"
                        class="p-1.5 text-gray-400 hover:text-[#ec7211] rounded transition-colors"
                        title="Launch"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                      <button
                        @click="openEdit(item)"
                        class="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        title="Edit"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        @click="confirmDelete(item)"
                        class="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                        title="Delete"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <p class="text-sm text-gray-500">
              Showing {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, total) }} of {{ total }}
            </p>
            <div class="flex items-center gap-1">
              <button
                :disabled="page <= 1"
                @click="goToPage(page - 1)"
                class="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <template v-for="p in totalPages" :key="p">
                <button
                  v-if="p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)"
                  @click="goToPage(p)"
                  :class="[
                    'px-3 py-1.5 text-sm border rounded-md transition-colors',
                    p === page
                      ? 'bg-[#ec7211] text-white border-[#ec7211]'
                      : 'border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  {{ p }}
                </button>
                <span
                  v-else-if="p === page - 2 || p === page + 2"
                  class="px-1 text-gray-400"
                >…</span>
              </template>
              <button
                :disabled="page >= totalPages"
                @click="goToPage(page + 1)"
                class="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Create Dialog -->
    <Teleport to="body">
      <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showCreateDialog = false" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <h2 class="text-lg font-semibold text-gray-900">Create Service</h2>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Service ID <span class="text-red-500">*</span></label>
                <input v-model="form.serviceId" type="text" placeholder="e.g. my-service" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Display Name <span class="text-red-500">*</span></label>
                <input v-model="form.displayName" type="text" placeholder="e.g. My Service" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea v-model="form.description" rows="2" placeholder="Brief description..." class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none resize-none" />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input v-model="form.icon" type="text" placeholder="📦" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select v-model="form.category" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none bg-white">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="form.status" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none bg-white">
                  <option v-for="st in statuses" :key="st" :value="st">{{ st }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input v-model="form.url" type="text" placeholder="https://... or /app/my-service" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input v-model="form.version" type="text" placeholder="1.0.0" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <input v-model="form.owner" type="text" placeholder="Team or person" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input v-model.number="form.sortOrder" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tags <span class="text-gray-400 font-normal">(comma separated)</span></label>
              <input v-model="form.tags" type="text" placeholder="monitoring, kubernetes, devops" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Permissions <span class="text-gray-400 font-normal">(comma separated action IDs)</span></label>
              <input v-model="form.permissions" type="text" placeholder="iam:admin, services:manage" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
            </div>
          </div>
          <div class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3">
            <button @click="showCreateDialog = false" class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              @click="handleCreate"
              :disabled="saving || !form.serviceId || !form.displayName"
              class="px-4 py-2 text-sm bg-[#ec7211] text-white rounded-md hover:bg-[#d6650e] disabled:opacity-50 transition-colors font-medium"
            >
              {{ saving ? 'Creating...' : 'Create Service' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Dialog -->
    <Teleport to="body">
      <div v-if="showEditDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showEditDialog = false" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <h2 class="text-lg font-semibold text-gray-900">Edit Service</h2>
            <p class="text-sm text-gray-500 mt-0.5">{{ editingItem?.serviceId }}</p>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Service ID</label>
              <input :value="form.serviceId" disabled type="text" class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Display Name <span class="text-red-500">*</span></label>
              <input v-model="form.displayName" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none resize-none" />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input v-model="form.icon" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select v-model="form.category" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none bg-white">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="form.status" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none bg-white">
                  <option v-for="st in statuses" :key="st" :value="st">{{ st }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input v-model="form.url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input v-model="form.version" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                <input v-model="form.owner" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input v-model.number="form.sortOrder" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tags <span class="text-gray-400 font-normal">(comma separated)</span></label>
              <input v-model="form.tags" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Permissions <span class="text-gray-400 font-normal">(comma separated action IDs)</span></label>
              <input v-model="form.permissions" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#ec7211] focus:border-[#ec7211] outline-none" />
            </div>
          </div>
          <div class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3">
            <button @click="showEditDialog = false" class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              @click="handleUpdate"
              :disabled="saving || !form.displayName"
              class="px-4 py-2 text-sm bg-[#ec7211] text-white rounded-md hover:bg-[#d6650e] disabled:opacity-50 transition-colors font-medium"
            >
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div v-if="showDeleteDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showDeleteDialog = false" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          <div class="px-6 py-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Delete Service</h3>
                <p class="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p class="text-sm text-gray-600">
              Are you sure you want to delete <strong class="text-gray-900">{{ deletingItem?.displayName }}</strong> ({{ deletingItem?.serviceId }})?
            </p>
          </div>
          <div class="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <button @click="showDeleteDialog = false" class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              @click="handleDelete"
              :disabled="saving"
              class="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
            >
              {{ saving ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
