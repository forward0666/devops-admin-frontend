<script setup lang="ts">
const { data: findings, refresh } = await useFetch('/api/iam/access-analyzer')
const search = ref('')
const filterStatus = ref('All')
const filterType = ref('All')

const filtered = computed(() => {
  let items = findings.value || []
  if (filterStatus.value !== 'All') items = items.filter((f: any) => f.status === filterStatus.value)
  if (filterType.value === 'Public') items = items.filter((f: any) => f.isPublic)
  if (filterType.value === 'Cross-account') items = items.filter((f: any) => !f.isPublic && f.principal !== '*')
  if (search.value) {
    const q = search.value.toLowerCase()
    items = items.filter((f: any) => f.resource.toLowerCase().includes(q) || f.principal.toLowerCase().includes(q) || f.action.toLowerCase().includes(q))
  }
  return items
})

// Create analyzer dialog
const showCreateAnalyzer = ref(false)
const analyzerForm = ref({ name: '', zoneOfTrust: 'Account' })
const creatingAnalyzer = ref(false)
const zones = ['Account', 'Organization']

async function doCreateAnalyzer() {
  creatingAnalyzer.value = true
  try {
    // In real app, POST to API
    await new Promise(r => setTimeout(r, 500))
    showCreateAnalyzer.value = false
  } finally { creatingAnalyzer.value = false }
}

// Actions
const openActions = ref<string | null>(null)
const showDetail = ref(false)
const detailTarget = ref<any>(null)

function archiveFinding(f: any) {
  openActions.value = null
  // In real app, PATCH status to Resolved
}

function viewDetail(f: any) {
  detailTarget.value = f
  showDetail.value = true
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
      <h1 class="text-2xl font-bold text-gray-900">Access Analyzer</h1>
      <div class="flex gap-2">
        <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
        <button @click="showCreateAnalyzer = true" class="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Create analyzer
        </button>
      </div>
    </div>

    <!-- Search + Filters -->
    <div class="flex items-center gap-3 mb-4">
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Search findings..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div class="flex gap-1">
        <button v-for="t in ['All', 'Public', 'Cross-account']" :key="t" @click="filterType = t"
          :class="['px-3 py-1.5 text-sm rounded-md transition-colors', filterType === t ? 'bg-[#232f3e] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
          {{ t }}
        </button>
      </div>
    </div>

    <!-- Status filter tabs -->
    <div class="flex items-center gap-2 mb-4">
      <button v-for="s in ['All', 'Active', 'Resolved']" :key="s" @click="filterStatus = s"
        :class="['px-3 py-1.5 text-sm rounded-md transition-colors', filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
        {{ s }}
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-[#232f3e]">
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Resource</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Resource Type</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Principal</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Action</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Public?</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Created</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in filtered" :key="f.id" class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
            <td class="px-4 py-3 text-xs font-mono text-gray-700 max-w-xs truncate" :title="f.resource">{{ f.resource }}</td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ f.resourceType }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ f.principal }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ f.action }}</td>
            <td class="px-4 py-3">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', f.isPublic ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700']">
                {{ f.isPublic ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', f.status === 'Active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700']">
                {{ f.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ f.createdAt }}</td>
            <td class="px-4 py-3">
              <div class="relative">
                <button @click.stop="toggleActions(f.id)" class="p-1 rounded hover:bg-gray-200 text-gray-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
                <div v-if="openActions === f.id" class="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border py-1 z-30">
                  <button @click="viewDetail(f)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">View details</button>
                  <button @click="archiveFinding(f)" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Archive finding</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!filtered?.length" class="p-8 text-center text-gray-500 text-sm">No findings found</div>
    </div>

    <!-- CREATE ANALYZER DIALOG -->
    <div v-if="showCreateAnalyzer" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showCreateAnalyzer = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
          <h2 class="text-lg font-semibold text-white">Create analyzer</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Analyzer name <span class="text-red-500">*</span></label>
            <input v-model="analyzerForm.name" type="text" placeholder="Enter analyzer name" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Zone of trust</label>
            <select v-model="analyzerForm.zoneOfTrust" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Account: analyzes resources within this account. Organization: analyzes across all organization accounts.</p>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showCreateAnalyzer = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="doCreateAnalyzer()" :disabled="!analyzerForm.name || creatingAnalyzer" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {{ creatingAnalyzer ? 'Creating...' : 'Create analyzer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- VIEW DETAIL DIALOG -->
    <div v-if="showDetail && detailTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showDetail = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
          <h2 class="text-lg font-semibold text-white">Finding Details</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Resource</span>
            <span class="text-xs font-mono text-gray-700 break-all text-right max-w-[60%]">{{ detailTarget.resource }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Resource Type</span>
            <span class="text-sm text-gray-700">{{ detailTarget.resourceType }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Principal</span>
            <span class="text-sm text-gray-700">{{ detailTarget.principal }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Action</span>
            <span class="text-sm text-gray-700">{{ detailTarget.action }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Public</span>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', detailTarget.isPublic ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700']">
              {{ detailTarget.isPublic ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Status</span>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', detailTarget.status === 'Active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700']">
              {{ detailTarget.status }}
            </span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-sm text-gray-500">Created</span>
            <span class="text-sm text-gray-700">{{ detailTarget.createdAt }}</span>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button @click="showDetail = false" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>
