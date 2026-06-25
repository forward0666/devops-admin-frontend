<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient, { domainGroupService } from '~/services/api'
// @ts-ignore
import VueApexCharts from 'vue3-apexcharts'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'

// State
const loading = ref(false)
const syncing = ref(false)
const records = ref<any[]>([])
const snackbar = ref({ show: false, text: '', color: 'success' })

// Groups
const groups = ref<any[]>([])
const groupMeta = ref<Record<string, { groupId: string }>>({})
const selectedGroup = ref<string | null>(process.client ? localStorage.getItem('statistic-group') : null)
const groupOptions = computed(() => [
  { title: 'All', value: null },
  ...groups.value.map((g: any) => ({ title: g.name, value: g.id })),
])

// Filters
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const searchDomain = ref('')
const sortKey = ref<string>('total')
const sortDir = ref<'asc' | 'desc'>('desc')

// Computed
const groupZoneIds = computed(() => {
  if (!selectedGroup.value) return null
  return new Set(
    Object.entries(groupMeta.value)
      .filter(([_, m]) => m.groupId === selectedGroup.value)
      .map(([zoneId]) => zoneId)
  )
})

const filteredRecords = computed(() => {
  let list = records.value
  if (selectedGroup.value && groupZoneIds.value) {
    list = list.filter(r => groupZoneIds.value!.has(r.zoneId))
  }
  if (searchDomain.value) {
    const s = searchDomain.value.toLowerCase()
    list = list.filter(r => (r.domain || '').toLowerCase().includes(s))
  }
  return [...list].sort((a, b) => {
    const av = Number(a[sortKey.value] ?? 0)
    const bv = Number(b[sortKey.value] ?? 0)
    return sortDir.value === 'asc' ? av - bv : bv - av
  })
})

const totalStats = computed(() => {
  const sum = (key: string) => filteredRecords.value.reduce((s, r) => s + (Number(r[key]) || 0), 0)
  return {
    domains: filteredRecords.value.length,
    total: sum('total'),
    cached: sum('cached'),
    uncached: sum('uncached'),
    bandwidth: sum('bandwidth'),
    threats: sum('threats'),
    pageViews: sum('pageViews'),
    uniqueVisitor: sum('uniqueVisitor'),
  }
})

// Charts
const asnChart = computed(() => {
  const asnMap: Record<number, number> = {}
  for (const r of filteredRecords.value) {
    for (const a of (r.topAsns || [])) {
      asnMap[a.asn] = (asnMap[a.asn] || 0) + a.requests
    }
  }
  const sorted = Object.entries(asnMap).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return {
    series: [{ name: 'Requests', data: sorted.map(([, v]) => v) }],
    options: {
      chart: { type: 'bar', background: 'transparent' },
      theme: { mode: 'dark' },
      xaxis: { categories: sorted.map(([k]) => `AS${k}`), labels: { style: { fontSize: '11px' } } },
      colors: ['#00E396'],
      plotOptions: { bar: { borderRadius: 4, horizontal: true } },
      dataLabels: { enabled: false },
    },
  }
})

const topDomainsChart = computed(() => {
  const sorted = [...filteredRecords.value].sort((a, b) => b.total - a.total).slice(0, 10)
  return {
    series: [{ name: 'Requests', data: sorted.map(r => r.total) }],
    options: {
      chart: { type: 'bar', background: 'transparent' },
      theme: { mode: 'dark' },
      xaxis: { categories: sorted.map(r => r.domain), labels: { style: { fontSize: '11px' } } },
      colors: ['#4FC3F7'],
      plotOptions: { bar: { borderRadius: 4, horizontal: true } },
      dataLabels: { enabled: false },
    },
  }
})

const bandwidthChart = computed(() => {
  const sorted = [...filteredRecords.value].sort((a, b) => b.bandwidth - a.bandwidth).slice(0, 10)
  return {
    series: [{ name: 'Bandwidth', data: sorted.map(r => r.bandwidth) }],
    options: {
      chart: { type: 'bar', background: 'transparent' },
      theme: { mode: 'dark' },
      xaxis: { categories: sorted.map(r => r.domain), labels: { style: { fontSize: '11px' } } },
      colors: ['#AB47BC'],
      plotOptions: { bar: { borderRadius: 4, horizontal: true } },
      dataLabels: { enabled: false },
      yaxis: { labels: { formatter: (val: number) => formatBytes(val) } },
      tooltip: { y: { formatter: (val: number) => formatBytes(val) } },
    },
  }
})

const countryChart = computed(() => {
  const countryMap: Record<string, number> = {}
  for (const r of filteredRecords.value) {
    for (const c of (r.topCountries || [])) {
      countryMap[c.country] = (countryMap[c.country] || 0) + c.requests
    }
  }
  const sorted = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return {
    series: [{ name: 'Requests', data: sorted.map(([, v]) => v) }],
    options: {
      chart: { type: 'bar', background: 'transparent' },
      theme: { mode: 'dark' },
      xaxis: { categories: sorted.map(([k]) => k), labels: { style: { fontSize: '11px' } } },
      colors: ['#FEB019'],
      plotOptions: { bar: { borderRadius: 4, horizontal: true } },
      dataLabels: { enabled: false },
    },
  }
})

const threatChart = computed(() => {
  const withThreats = filteredRecords.value.filter(r => r.threats > 0).sort((a, b) => b.threats - a.threats).slice(0, 10)
  return {
    series: [{ name: 'Threats', data: withThreats.map(r => r.threats) }],
    options: {
      chart: { type: 'bar', background: 'transparent' },
      theme: { mode: 'dark' },
      xaxis: { categories: withThreats.map(r => r.domain), labels: { style: { fontSize: '11px' } } },
      colors: ['#FF4560'],
      plotOptions: { bar: { borderRadius: 4, horizontal: true } },
      dataLabels: { enabled: false },
    },
  }
})

function toggleSort(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'desc' }
}

function sortIcon(key: string) {
  if (sortKey.value !== key) return 'bx-sort'
  return sortDir.value === 'asc' ? 'bx-sort-up' : 'bx-sort-down'
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let val = bytes
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatNumber(n: number): string {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

// Fetch groups
async function fetchGroups() {
  try {
    const [g, meta] = await Promise.all([
      domainGroupService.listGroups(),
      domainGroupService.listMeta(),
    ])
    groups.value = g || []
    const m: Record<string, { groupId: string }> = {}
    for (const item of (meta || [])) {
      if (item.zoneId) m[item.zoneId] = { groupId: item.groupId || '' }
    }
    groupMeta.value = m
  } catch { /* ignore */ }
}

// Fetch data from MongoDB via domain service
async function fetchData() {
  loading.value = true
  try {
    const { data } = await apiClient.get('/domain/statistic', { params: { date: selectedDate.value } })
    records.value = data?.data || []
  } catch (e: any) {
    console.error('Failed to fetch statistic', e)
    records.value = []
  } finally {
    loading.value = false
  }
}

// Sync from CF to MongoDB via cloudflare service
async function syncData() {
  syncing.value = true
  try {
    const { data } = await apiClient.post(`${CF_GATEWAY}/statistic/sync`, { date: selectedDate.value, groupId: selectedGroup.value || '' }, { timeout: 300000 })
    snackbar.value = { show: true, text: data?.message || `Synced ${data?.data?.synced || 0} record`, color: 'success' }
    await fetchData()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}

// Watch date change
function onDateChange() {
  fetchData()
}

watch(selectedGroup, (v) => {
  if (process.client) localStorage.setItem('statistic-group', v || '')
})

onMounted(async () => {
  await fetchGroups()
  await fetchData()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Domain Statistic</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Domain visit analytic from Cloudflare</p>
        </div>
        <VSelect v-model="selectedGroup" :items="groupOptions" density="compact" hide-details style="max-width: 180px" clearable placeholder="Group" />
        <VTextField
          v-model="selectedDate"
          type="date"
          density="compact"
          hide-details
          style="max-width: 160px"
          @update:model-value="onDateChange"
        />
        <VBtn color="primary" :loading="syncing" @click="syncData" prepend-icon="bx-sync">
          Sync
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Stats Cards -->
    <div class="d-flex gap-4 mb-4 flex-wrap">
      <VCard class="pa-3" style="min-width: 120px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Domains</div>
        <div class="text-h5 font-weight-bold">{{ totalStats.domains }}</div>
      </VCard>
      <VCard class="pa-3" style="min-width: 120px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Total Request</div>
        <div class="text-h5 font-weight-bold text-primary">{{ formatNumber(totalStats.total) }}</div>
      </VCard>
      <VCard class="pa-3" style="min-width: 120px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Cached</div>
        <div class="text-h5 font-weight-bold text-success">{{ formatNumber(totalStats.cached) }}</div>
      </VCard>
      <VCard class="pa-3" style="min-width: 120px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Uncached</div>
        <div class="text-h5 font-weight-bold text-warning">{{ formatNumber(totalStats.uncached) }}</div>
      </VCard>
      <VCard class="pa-3" style="min-width: 120px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Bandwidth</div>
        <div class="text-h5 font-weight-bold text-info">{{ formatBytes(totalStats.bandwidth) }}</div>
      </VCard>
      <VCard class="pa-3" style="min-width: 120px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Threat</div>
        <div class="text-h5 font-weight-bold text-error">{{ formatNumber(totalStats.threats) }}</div>
      </VCard>
      <VCard class="pa-3" style="min-width: 120px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Page View</div>
        <div class="text-h5 font-weight-bold">{{ formatNumber(totalStats.pageViews) }}</div>
      </VCard>
      <VCard class="pa-3" style="min-width: 120px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Unique Visitor</div>
        <div class="text-h5 font-weight-bold">{{ formatNumber(totalStats.uniqueVisitor) }}</div>
      </VCard>
    </div>

    <!-- Charts -->
    <div class="d-flex gap-4 mb-4" style="height: 220px; overflow-x: auto;">
      <VCard style="flex: 2; min-width: 0;">
        <VCardTitle class="text-body-2 pa-2">Top 10 by Request</VCardTitle>
        <VCardText class="pa-1">
          <apexchart type="bar" :options="topDomainsChart.options" :series="topDomainsChart.series" height="180" />
        </VCardText>
      </VCard>
      <VCard style="flex: 2; min-width: 0;">
        <VCardTitle class="text-body-2 pa-2">Top 10 by Bandwidth</VCardTitle>
        <VCardText class="pa-1">
          <apexchart type="bar" :options="bandwidthChart.options" :series="bandwidthChart.series" height="180" />
        </VCardText>
      </VCard>
      <VCard style="flex: 2; min-width: 0;">
        <VCardTitle class="text-body-2 pa-2">Top 10 by Country</VCardTitle>
        <VCardText class="pa-1">
          <apexchart type="bar" :options="countryChart.options" :series="countryChart.series" height="180" />
        </VCardText>
      </VCard>
    </div>

    <!-- Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable class="sticky-table" style="flex: 1; min-height: 0; max-height: calc(100vh - 500px); table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 100px" />
          <col style="width: 120px" />
          <col style="width: 120px" />
          <col style="width: 120px" />
          <col style="width: 120px" />
          <col style="width: 100px" />
          <col style="width: 100px" />
          <col style="width: 120px" />
        </colgroup>
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th>Domain</th>
            <th style="cursor: pointer; " @click="toggleSort('total')">Total <VIcon :icon="sortIcon('total')" size="14" /></th>
            <th style="cursor: pointer; " @click="toggleSort('cached')">Cached <VIcon :icon="sortIcon('cached')" size="14" /></th>
            <th style="cursor: pointer; " @click="toggleSort('uncached')">Uncached <VIcon :icon="sortIcon('uncached')" size="14" /></th>
            <th style="cursor: pointer; " @click="toggleSort('bandwidth')">Bandwidth <VIcon :icon="sortIcon('bandwidth')" size="14" /></th>
            <th style="cursor: pointer; " @click="toggleSort('threats')">Threat <VIcon :icon="sortIcon('threats')" size="14" /></th>
            <th style="cursor: pointer; " @click="toggleSort('pageViews')">View <VIcon :icon="sortIcon('pageViews')" size="14" /></th>
            <th style="cursor: pointer; " @click="toggleSort('uniqueVisitor')">Unique Visitor <VIcon :icon="sortIcon('uniqueVisitor')" size="14" /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRecords" :key="r.domain">
            <td><code class="text-body-2">{{ r.domain }}</code></td>
            <td>{{ formatNumber(r.total) }}</td>
            <td>{{ formatNumber(r.cached) }}</td>
            <td>{{ formatNumber(r.uncached) }}</td>
            <td>{{ formatBytes(r.bandwidth) }}</td>
            <td>{{ formatNumber(r.threats) }}</td>
            <td>{{ formatNumber(r.pageViews) }}</td>
            <td>{{ formatNumber(r.uniqueVisitor) }}</td>
          </tr>
          <tr v-if="filteredRecords.length === 0">
            <td :colspan="8" class="text-center py-8 text-medium-emphasis">
              <VIcon icon="bx-bar-chart" size="48" class="mb-2" />
              <p>No statistics data. Click "Sync" to fetch from Cloudflare.</p>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>

<style scoped>
.sticky-table :deep(.v-table__wrapper) { overflow-y: auto; }
.sticky-table :deep(thead) { position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface)); }
</style>
