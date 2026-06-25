<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'

// State
const loading = ref(false)
const syncing = ref(false)
const records = ref<any[]>([])
const snackbar = ref({ show: false, text: '', color: 'success' })

// Filters
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const searchDomain = ref('')
const sortKey = ref<string>('total')
const sortDir = ref<'asc' | 'desc'>('desc')

// Computed
const filteredRecords = computed(() => {
  let list = records.value
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

// Fetch data from MongoDB
async function fetchData() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/statistics`, { params: { date: selectedDate.value } })
    records.value = data?.data || []
  } catch (e: any) {
    console.error('Failed to fetch statistics', e)
    records.value = []
  } finally {
    loading.value = false
  }
}

// Sync from CF to MongoDB
async function syncData() {
  syncing.value = true
  try {
    const { data } = await apiClient.post(`${CF_GATEWAY}/statistics/sync`, { date: selectedDate.value }, { timeout: 300000 })
    snackbar.value = { show: true, text: data?.message || `Synced ${data?.data?.synced || 0} records`, color: 'success' }
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

onMounted(fetchData)
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Domain Statistics</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Domain visit analytics from Cloudflare</p>
        </div>
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
        <div class="text-caption text-medium-emphasis">Total Requests</div>
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
        <div class="text-caption text-medium-emphasis">Threats</div>
        <div class="text-h5 font-weight-bold text-error">{{ formatNumber(totalStats.threats) }}</div>
      </VCard>
      <VCard class="pa-3" style="min-width: 120px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Page Views</div>
        <div class="text-h5 font-weight-bold">{{ formatNumber(totalStats.pageViews) }}</div>
      </VCard>
    </div>

    <!-- Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable class="sticky-table" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 250px" />
          <col style="width: 120px" />
          <col style="width: 120px" />
          <col style="width: 120px" />
          <col style="width: 120px" />
          <col style="width: 100px" />
          <col style="width: 100px" />
        </colgroup>
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th>
              <div class="d-flex align-center gap-1">
                <span>Domain</span>
              </div>
              <VTextField v-model="searchDomain" density="compact" hide-details placeholder="Search domain..." clearable style="font-size: 12px; margin-top: 4px;" />
            </th>
            <th style="cursor: pointer; text-align: right;" @click="toggleSort('total')">Total <VIcon :icon="sortIcon('total')" size="14" /></th>
            <th style="cursor: pointer; text-align: right;" @click="toggleSort('cached')">Cached <VIcon :icon="sortIcon('cached')" size="14" /></th>
            <th style="cursor: pointer; text-align: right;" @click="toggleSort('uncached')">Uncached <VIcon :icon="sortIcon('uncached')" size="14" /></th>
            <th style="cursor: pointer; text-align: right;" @click="toggleSort('bandwidth')">Bandwidth <VIcon :icon="sortIcon('bandwidth')" size="14" /></th>
            <th style="cursor: pointer; text-align: right;" @click="toggleSort('threats')">Threats <VIcon :icon="sortIcon('threats')" size="14" /></th>
            <th style="cursor: pointer; text-align: right;" @click="toggleSort('pageViews')">Views <VIcon :icon="sortIcon('pageViews')" size="14" /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRecords" :key="r.domain">
            <td><code class="text-body-2">{{ r.domain }}</code></td>
            <td style="text-align: right;">{{ formatNumber(r.total) }}</td>
            <td style="text-align: right;">{{ formatNumber(r.cached) }}</td>
            <td style="text-align: right;">{{ formatNumber(r.uncached) }}</td>
            <td style="text-align: right;">{{ formatBytes(r.bandwidth) }}</td>
            <td style="text-align: right;">{{ formatNumber(r.threats) }}</td>
            <td style="text-align: right;">{{ formatNumber(r.pageViews) }}</td>
          </tr>
          <tr v-if="filteredRecords.length === 0">
            <td :colspan="7" class="text-center py-8 text-medium-emphasis">
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
