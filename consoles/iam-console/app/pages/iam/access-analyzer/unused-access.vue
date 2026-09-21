<script setup lang="ts">
const { data: unused, refresh } = await useFetch('/api/iam/unused-access')
const search = ref('')
const filterType = ref('All')

const filtered = computed(() => {
  let items = unused.value || []
  if (filterType.value === 'Users') items = items.filter((u: any) => u.entityType === 'User')
  if (filterType.value === 'Roles') items = items.filter((u: any) => u.entityType === 'Role')
  if (search.value) {
    const q = search.value.toLowerCase()
    items = items.filter((u: any) => u.entityName.toLowerCase().includes(q) || u.recommendation.toLowerCase().includes(q))
  }
  return items
})

// Review dialog
const showReview = ref(false)
const reviewTarget = ref<any>(null)
const showApplyConfirm = ref(false)
const applyTarget = ref<any>(null)

function openReview(item: any) {
  reviewTarget.value = item
  showReview.value = true
}

function applyRecommendation(item: any) {
  applyTarget.value = item
  showApplyConfirm.value = true
}

function confirmApply() {
  // In real app, apply the recommendation
  showApplyConfirm.value = false
  applyTarget.value = null
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Unused Access</h1>
      <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        Refresh
      </button>
    </div>

    <!-- Search + Filter -->
    <div class="flex items-center gap-3 mb-4">
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Search entities..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div class="flex gap-1">
        <button v-for="t in ['All', 'Users', 'Roles']" :key="t" @click="filterType = t"
          :class="['px-3 py-1.5 text-sm rounded-md transition-colors', filterType === t ? 'bg-[#232f3e] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
          {{ t }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-[#232f3e]">
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Entity</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Type</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Unused Permissions</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Last Activity</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Recommendation</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Actions</th>
          </tr>
        </thead>
        <tbody v-if="filtered">
          <tr v-for="u in filtered" :key="u.id" class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
            <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ u.entityName }}</td>
            <td class="px-4 py-3">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', u.entityType === 'User' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700']">{{ u.entityType }}</span>
            </td>
            <td class="px-4 py-3">
              <span v-for="p in u.unusedPermissions" :key="p" class="inline-block bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded mr-1 mb-0.5 font-mono">{{ p }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ u.lastActivity }}</td>
            <td class="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" :title="u.recommendation">{{ u.recommendation }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-1">
                <button @click="openReview(u)" class="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50">Review</button>
                <button @click="applyRecommendation(u)" class="px-2 py-1 text-xs text-green-600 border border-green-300 rounded hover:bg-green-50">Apply</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!filtered?.length" class="p-8 text-center text-gray-500 text-sm">No unused access findings</div>
    </div>

    <!-- REVIEW DIALOG -->
    <div v-if="showReview && reviewTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showReview = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="px-6 py-4 border-b border-gray-200 bg-[#232f3e] rounded-t-lg">
          <h2 class="text-lg font-semibold text-white">Review Unused Access</h2>
        </div>
        <div class="px-6 py-5 space-y-4">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Entity</span>
            <span class="text-sm font-medium text-gray-900">{{ reviewTarget.entityName }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Type</span>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', reviewTarget.entityType === 'User' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700']">{{ reviewTarget.entityType }}</span>
          </div>
          <div class="py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500 block mb-2">Unused Permissions</span>
            <div class="flex flex-wrap gap-1">
              <span v-for="p in reviewTarget.unusedPermissions" :key="p" class="inline-block bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded font-mono">{{ p }}</span>
            </div>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-500">Last Activity</span>
            <span class="text-sm text-gray-700">{{ reviewTarget.lastActivity }}</span>
          </div>
          <div class="py-2">
            <span class="text-sm text-gray-500 block mb-1">Recommendation</span>
            <p class="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md border border-yellow-200">{{ reviewTarget.recommendation }}</p>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showReview = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
          <button @click="showReview = false; applyRecommendation(reviewTarget)" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Apply Recommendation</button>
        </div>
      </div>
    </div>

    <!-- APPLY CONFIRM -->
    <div v-if="showApplyConfirm && applyTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showApplyConfirm = false">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Apply Recommendation</h2>
        </div>
        <div class="px-6 py-5 space-y-3">
          <p class="text-sm text-gray-700">Apply recommendation for <strong>{{ applyTarget.entityName }}</strong>?</p>
          <p class="text-sm text-gray-500">{{ applyTarget.recommendation }}</p>
          <p class="text-sm text-gray-500">This action will modify permissions and cannot be easily undone.</p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button @click="showApplyConfirm = false" class="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button @click="confirmApply()" class="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>
