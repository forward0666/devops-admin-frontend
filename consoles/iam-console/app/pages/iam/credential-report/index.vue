<script setup lang="ts">
const { data: report, refresh } = await useFetch('/api/iam/credential-report')
const search = ref('')
const page = ref(1)
const pageSize = 10
const reportStatus = ref<'none' | 'generating' | 'ready'>('none')

const filtered = computed(() => {
  const items = report.value || []
  if (!search.value) return items
  const q = search.value.toLowerCase()
  return items.filter((r: any) => r.user.toLowerCase().includes(q))
})

const paginated = computed(() => {
  const items = filtered.value
  const start = (page.value - 1) * pageSize
  return items.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize))

async function generateReport() {
  reportStatus.value = 'generating'
  await new Promise(r => setTimeout(r, 2000))
  reportStatus.value = 'ready'
  await refresh()
}

function downloadReport() {
  if (!report.value) return
  const csv = [
    'User,ARN,Password Enabled,MFA Active,Access Key 1 Active,Access Key 1 Last Used,Access Key 2 Active,Access Key 2 Last Used,Last Activity,Last Console Login',
    ...report.value.map((r: any) => [r.user, r.arn, r.passwordEnabled, r.mfaActive, r.accessKey1Active, r.accessKey1LastUsed, r.accessKey2Active, r.accessKey2LastUsed, r.lastActivity, r.lastConsoleLogin].join(','))
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'credential-report.csv'; a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Credential Report</h1>
      <div class="flex gap-2">
        <button @click="refresh()" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Refresh
        </button>
        <button @click="generateReport()" :disabled="reportStatus === 'generating'"
          :class="['px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-colors', reportStatus === 'generating' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-blue-600 text-white hover:bg-blue-700']">
          <svg v-if="reportStatus === 'generating'" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <svg v-else-if="reportStatus === 'ready'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {{ reportStatus === 'generating' ? 'Generating...' : reportStatus === 'ready' ? 'Ready' : 'Generate report' }}
        </button>
        <button @click="downloadReport()" :disabled="reportStatus !== 'ready' && !report?.length"
          class="px-4 py-1.5 bg-[#232f3e] text-white rounded-md text-sm font-medium hover:bg-gray-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download CSV
        </button>
      </div>
    </div>

    <!-- Status bar -->
    <div v-if="reportStatus === 'generating'" class="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800 flex items-center gap-2">
      <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      Generating credential report... This may take a moment.
    </div>
    <div v-if="reportStatus === 'ready'" class="mb-4 bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800 flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
      Report generated successfully. You can now download the CSV.
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" type="text" placeholder="Search users..." class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-[#232f3e]">
            <th class="text-left px-3 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap">User</th>
            <th class="text-left px-3 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap">Password Enabled</th>
            <th class="text-left px-3 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap">MFA Active</th>
            <th class="text-left px-3 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap">Access Key 1</th>
            <th class="text-left px-3 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap">AK1 Last Used</th>
            <th class="text-left px-3 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap">Access Key 2</th>
            <th class="text-left px-3 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap">AK2 Last Used</th>
            <th class="text-left px-3 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap">Last Activity</th>
            <th class="text-left px-3 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap">Console Login</th>
          </tr>
        </thead>
        <tbody v-if="paginated">
          <tr v-for="r in paginated" :key="r.user" class="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
            <td class="px-3 py-2 text-sm font-medium text-gray-900">{{ r.user }}</td>
            <td class="px-3 py-2">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', r.passwordEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
                {{ r.passwordEnabled ? '✅ Enabled' : '❌ Disabled' }}
              </span>
            </td>
            <td class="px-3 py-2">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', r.mfaActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                {{ r.mfaActive ? '✅ Yes' : '❌ No' }}
              </span>
            </td>
            <td class="px-3 py-2">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', r.accessKey1Active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
                {{ r.accessKey1Active ? '✅ Active' : '❌ Inactive' }}
              </span>
            </td>
            <td class="px-3 py-2 text-xs text-gray-600">{{ r.accessKey1LastUsed }}</td>
            <td class="px-3 py-2">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', r.accessKey2Active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
                {{ r.accessKey2Active ? '✅ Active' : '❌ Inactive' }}
              </span>
            </td>
            <td class="px-3 py-2 text-xs text-gray-600">{{ r.accessKey2LastUsed }}</td>
            <td class="px-3 py-2 text-xs text-gray-600">{{ r.lastActivity }}</td>
            <td class="px-3 py-2 text-xs text-gray-600">{{ r.lastConsoleLogin }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!paginated?.length" class="p-8 text-center text-gray-500 text-sm">No data available. Generate a report first.</div>
    </div>

    <!-- Pagination -->
    <div v-if="filtered.length > pageSize" class="flex items-center justify-between mt-4">
      <span class="text-sm text-gray-500">Showing {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, filtered.length) }} of {{ filtered.length }}</span>
      <div class="flex gap-2">
        <button :disabled="page <= 1" @click="page--" class="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
        <button v-for="p in totalPages" :key="p" @click="page = p" :class="['px-3 py-1 border rounded text-sm', p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50']">{{ p }}</button>
        <button :disabled="page >= totalPages" @click="page++" class="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
      </div>
    </div>
  </div>
</template>
