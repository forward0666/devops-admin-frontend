<script setup lang="ts">
const activities = ref([
  { id: 1, event: 'Account invited', account: 'Sandbox', actor: 'admin', time: '2024-01-10 14:30', details: 'Account 567890123456 invited to organization' },
  { id: 2, event: 'SCP attached', account: 'Production', actor: 'admin', time: '2024-01-05 10:00', details: 'RestrictRegions SCP attached to Production OU' },
  { id: 3, event: 'Account joined', account: 'Security Audit', actor: 'security-auditor', time: '2023-06-15 09:00', details: 'Account 4567890123456 joined organization' },
  { id: 4, event: 'OU created', account: '-', actor: 'admin', time: '2023-03-01 11:00', details: 'Production OU created under Root' },
  { id: 5, event: 'Account joined', account: 'Development', actor: 'admin', time: '2023-03-01 10:30', details: 'Account 345678901234 joined organization' },
  { id: 6, event: 'Account joined', account: 'Staging', actor: 'admin', time: '2023-03-01 10:00', details: 'Account 234567890123 joined organization' },
  { id: 7, event: 'Account joined', account: 'Production', actor: 'admin', time: '2023-01-15 09:00', details: 'Account 123456789012 joined organization' },
  { id: 8, event: 'Organization created', account: '-', actor: 'root', time: '2023-01-15 08:00', details: 'Organization o-abc123456 created' },
])

const search = ref('')
const timeFilter = ref('All')

const filtered = computed(() => {
  let items = activities.value
  if (timeFilter.value === 'Last 24h') {
    const cutoff = Date.now() - 86400000
    items = items.filter(a => new Date(a.time).getTime() > cutoff)
  } else if (timeFilter.value === 'Last 7 days') {
    const cutoff = Date.now() - 7 * 86400000
    items = items.filter(a => new Date(a.time).getTime() > cutoff)
  }
  if (search.value) {
    const q = search.value.toLowerCase()
    items = items.filter(a => a.event.toLowerCase().includes(q) || a.account.toLowerCase().includes(q) || a.actor.toLowerCase().includes(q) || a.details.toLowerCase().includes(q))
  }
  return items
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Organization Activity</h1>
    </div>

    <!-- Search + Time filter -->
    <div class="flex items-center gap-3 mb-4">
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Search activities..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div class="flex gap-1">
        <button v-for="t in ['All', 'Last 24h', 'Last 7 days']" :key="t" @click="timeFilter = t"
          :class="['px-3 py-1.5 text-sm rounded-md transition-colors', timeFilter === t ? 'bg-[#232f3e] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
          {{ t }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-[#232f3e]">
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Time</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Account</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Action</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Actor</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in filtered" :key="a.id" class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
            <td class="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{{ a.time }}</td>
            <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ a.account }}</td>
            <td class="px-4 py-3">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium',
                a.event.includes('joined') ? 'bg-green-100 text-green-700' :
                a.event.includes('invited') ? 'bg-blue-100 text-blue-700' :
                a.event.includes('SCP') ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700']">
                {{ a.event }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ a.actor }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ a.details }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!filtered?.length" class="p-8 text-center text-gray-500 text-sm">No activities found</div>
    </div>
  </div>
</template>
