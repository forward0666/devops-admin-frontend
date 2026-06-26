<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient, { domainGroupService } from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'

// State
const loading = ref(false)
const syncing = ref(false)
const syncingChart = ref(false)
const records = ref<any[]>([])
const chartData = ref<any[]>([])
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
const selectedDate = ref(process.client ? (localStorage.getItem('statistic-date') || new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10))
const sortKey = ref<string>('total')
const sortDir = ref<'asc' | 'desc'>('desc')
const selectedDomain = ref<string | null>(null)
const selectedCountry = ref<string | null>(null)
const selectedIP = ref<string | null>(null)

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
  if (selectedIP.value) {
    const domainsWithIP = new Set(
      chartData.value
        .filter(r => (r.topIPs || []).some((item: any) => item.ip === selectedIP.value))
        .map(r => r.domain)
    )
    list = list.filter(r => domainsWithIP.has(r.domain))
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

const cacheRate = computed(() => {
  const t = totalStats.value.total
  return t > 0 ? ((totalStats.value.cached / t) * 100).toFixed(1) : '0'
})

// ===== Charts =====

const requestsList = computed(() => {
  const sorted = [...filteredRecords.value].sort((a, b) => b.total - a.total)
  const max = sorted[0]?.total || 1
  return sorted.map((r, idx) => ({
    rank: idx + 1,
    name: r.domain,
    total: r.total,
    percent: ((r.total / max) * 100).toFixed(1),
  }))
})

const bandwidthList = computed(() => {
  const source = selectedDomain.value ? filteredRecords.value.filter(r => r.domain === selectedDomain.value) : filteredRecords.value
  const sorted = [...source].sort((a, b) => b.bandwidth - a.bandwidth)
  const max = sorted[0]?.bandwidth || 1
  return sorted.map((r, idx) => ({
    rank: idx + 1,
    name: r.domain,
    bandwidth: r.bandwidth,
    percent: ((r.bandwidth / max) * 100).toFixed(1),
  }))
})

const COUNTRY_NAMES: Record<string, string> = {
  CN: 'China', US: 'United States', JP: 'Japan', DE: 'Germany', GB: 'United Kingdom', FR: 'France', IN: 'India',
  BR: 'Brazil', RU: 'Russia', KR: 'South Korea', CA: 'Canada', AU: 'Australia', IT: 'Italy',
  ES: 'Spain', MX: 'Mexico', ID: 'Indonesia', TR: 'Turkey', SA: 'Saudi Arabia', NL: 'Netherlands',
  PL: 'Poland', TH: 'Thailand', VN: 'Vietnam', PH: 'Philippines', MY: 'Malaysia', SG: 'Singapore',
  HK: 'Hong Kong', TW: 'Taiwan', MO: 'Macao', IE: 'Ireland', SE: 'Sweden', NO: 'Norway',
  FI: 'Finland', DK: 'Denmark', AT: 'Austria', CH: 'Switzerland', BE: 'Belgium', PT: 'Portugal',
  NZ: 'New Zealand', ZA: 'South Africa', EG: 'Egypt', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
  UA: 'Ukraine', CZ: 'Czech Republic', RO: 'Romania', HU: 'Hungary', IL: 'Israel',
  AE: 'UAE', PK: 'Pakistan', BD: 'Bangladesh', NG: 'Nigeria', KE: 'Kenya',
  XX: 'Unknown',
}

const countryList = computed(() => {
  const countryMap: Record<string, number> = {}
  let source = selectedDomain.value ? chartData.value.filter(r => r.domain === selectedDomain.value) : chartData.value
  if (selectedIP.value) {
    source = source.filter(r => (r.topIPs || []).some((item: any) => item.ip === selectedIP.value))
  }
  for (const r of source) {
    for (const c of (r.topCountries || [])) {
      countryMap[c.country] = (countryMap[c.country] || 0) + c.requests
    }
  }
  const sorted = Object.entries(countryMap).sort((a, b) => b[1] - a[1])
  const total = sorted.reduce((s, [, v]) => s + v, 0) || 1
  return sorted.map(([code, req], idx) => ({
    rank: idx + 1,
    code,
    name: COUNTRY_NAMES[code] || code,
    requests: req,
    percent: ((req / total) * 100).toFixed(1),
  }))
})

const ipList = computed(() => {
  const ipMap: Record<string, { requests: number; country: string }> = {}
  let source = selectedDomain.value ? chartData.value.filter(r => r.domain === selectedDomain.value) : chartData.value
  for (const r of source) {
    for (const item of (r.topIPs || [])) {
      if (selectedCountry.value && item.country !== selectedCountry.value) continue
      const k = item.ip
      if (ipMap[k]) ipMap[k].requests += item.requests
      else ipMap[k] = { requests: item.requests, country: item.country }
    }
  }
  return Object.entries(ipMap).sort((a, b) => b[1].requests - a[1].requests).map(([ip, data], idx) => ({
    rank: idx + 1,
    ip,
    country: data.country,
    requests: data.requests,
  }))
})

const asnChart = computed(() => {
  const asnMap: Record<number, number> = {}
  for (const r of filteredRecords.value) {
    for (const a of (r.topAsns || [])) {
      asnMap[a.asn] = (asnMap[a.asn] || 0) + a.requests
    }
  }
  const sorted = Object.entries(asnMap).sort((a, b) => b[1] - a[1]).slice(0, 8)
  return {
    series: [{ name: 'Requests', data: sorted.map(([, v]) => v) }],
    options: {
      chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
      theme: { mode: 'dark' },
      xaxis: { categories: sorted.map(([k]) => `AS${k}`), labels: { style: { fontSize: '11px' } } },
      colors: ['#00E396'],
      plotOptions: { bar: { borderRadius: 4, horizontal: true } },
      dataLabels: { enabled: false },
      grid: { borderColor: 'rgba(255,255,255,0.06)' },
    },
  }
})

// ===== Metric cards config =====
const metricCards = computed(() => [
  { title: 'Total Requests', value: totalStats.value.total, icon: 'bx-transfer', color: '#4FC3F7', format: 'number' },
  { title: 'Unique Visitors', value: totalStats.value.uniqueVisitor, icon: 'bx-user', color: '#00E396', format: 'number' },
  { title: 'Page Views', value: totalStats.value.pageViews, icon: 'bx-file', color: '#775DD0', format: 'number' },
  { title: 'Bandwidth', value: totalStats.value.bandwidth, icon: 'bx-data', color: '#AB47BC', format: 'bytes' },
  { title: 'Cached Rate', value: Number(cacheRate.value), icon: 'bx-check-shield', color: '#00E396', format: 'percent' },
  { title: 'Threats', value: totalStats.value.threats, icon: 'bx-shield-x', color: '#FF4560', format: 'number' },
])

// ===== Functions =====
function toggleDomain(name: string) {
  if (selectedDomain.value === name) {
    selectedDomain.value = null
    selectedCountry.value = null
    selectedIP.value = null
  } else {
    selectedDomain.value = name
    selectedCountry.value = null
    selectedIP.value = null
  }
}

function toggleCountry(code: string) {
  if (selectedCountry.value === code) {
    selectedCountry.value = null
  } else {
    selectedCountry.value = code
    selectedIP.value = null
  }
}

function toggleIP(ip: string) {
  if (selectedIP.value === ip) {
    selectedIP.value = null
  } else {
    selectedIP.value = ip
  }
}

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

function formatMetric(val: number, fmt: string) {
  if (fmt === 'bytes') return formatBytes(val)
  if (fmt === 'percent') return `${val}%`
  return formatNumber(val)
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

// Fetch data
async function fetchData() {
  loading.value = true
  try {
    const [tableRes, chartRes] = await Promise.all([
      apiClient.get('/domain/statistic', { params: { date: selectedDate.value } }),
      apiClient.get('/domain/statistic/chart', { params: { date: selectedDate.value } }),
    ])
    records.value = tableRes.data?.data || []
    chartData.value = chartRes.data?.data || []
  } catch (e: any) {
    console.error('Failed to fetch statistic', e)
    records.value = []
    chartData.value = []
  } finally {
    loading.value = false
  }
}

// Sync
async function syncData() {
  syncing.value = true
  try {
    const { data } = await apiClient.post(`${CF_GATEWAY}/statistic/sync`, { date: selectedDate.value, groupId: selectedGroup.value || '' }, { timeout: 300000 })
    snackbar.value = { show: true, text: data?.message || 'Synced', color: 'success' }
    await fetchData()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}

async function syncChartData() {
  syncingChart.value = true
  try {
    const { data } = await apiClient.post(`${CF_GATEWAY}/statistic/sync/chart`, { date: selectedDate.value, groupId: selectedGroup.value || '' }, { timeout: 300000 })
    snackbar.value = { show: true, text: data?.message || 'Chart synced', color: 'success' }
    await fetchData()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Chart sync failed', color: 'error' }
  } finally {
    syncingChart.value = false
  }
}

function onDateChange() {
  fetchData()
}

watch(selectedGroup, (v) => {
  if (process.client) localStorage.setItem('statistic-group', v || '')
})
watch(selectedDate, (v) => {
  if (process.client) localStorage.setItem('statistic-date', v)
})

onMounted(async () => {
  await fetchGroups()
  await fetchData()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 16px;">
    <!-- Header -->
    <VCard>
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Domain Analytics</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Cloudflare traffic overview — {{ selectedDate }}</p>
        </div>
        <VSelect v-model="selectedGroup" :items="groupOptions" density="compact" hide-details style="max-width: 180px" clearable placeholder="Group" />
        <VTextField v-model="selectedDate" type="date" density="compact" hide-details style="max-width: 160px" @update:model-value="onDateChange" />
        <VBtn color="primary" :loading="syncing" @click="syncData" prepend-icon="bx-sync">Sync</VBtn>
        <VBtn color="secondary" :loading="syncingChart" @click="syncChartData" prepend-icon="bx-bar-chart">Chart</VBtn>
      </VCardText>
    </VCard>

    <!-- Metric Cards -->
    <div class="metric-grid">
      <VCard v-for="card in metricCards" :key="card.title" class="metric-card">
        <VCardText class="d-flex align-center gap-3 py-4 px-4">
          <VAvatar size="44" rounded variant="tonal" :style="{ background: card.color + '22' }">
            <VIcon :icon="card.icon" size="22" :style="{ color: card.color }" />
          </VAvatar>
          <div class="flex-grow-1">
            <div class="text-caption text-medium-emphasis mb-1">{{ card.title }}</div>
            <div class="text-h5 font-weight-bold">{{ formatMetric(card.value, card.format) }}</div>
          </div>
        </VCardText>
      </VCard>
    </div>

    <!-- Charts Row 1: Top Domains + Bandwidth + Country -->
    <div class="chart-row">
      <VCard class="chart-card" style="flex: 2;">
        <VCardTitle class="text-body-2 pa-3 pb-0">
          <VIcon icon="bx-bar-chart" size="16" class="me-1" />Top by Domain
        </VCardTitle>
        <VCardText class="pa-2">
          <div class="rank-list rank-list-scroll">
            <div v-for="r in requestsList" :key="r.name" class="rank-row rank-row-click" :class="{ 'rank-row-active': selectedDomain === r.name }" @click="toggleDomain(r.name)">
              <span class="rank-num rank-blue">{{ r.rank }}</span>
              <span class="rank-name">{{ r.name }}</span>
              <div class="rank-bar-wrap">
                <div class="rank-bar rank-bar-blue" :style="{ width: r.percent + '%' }" />
              </div>
              <span class="rank-val">{{ formatNumber(r.total) }}</span>
            </div>
          </div>
        </VCardText>
      </VCard>
      <VCard class="chart-card" style="flex: 2;">
        <VCardTitle class="text-body-2 pa-3 pb-0">
          <VIcon icon="bx-data" size="16" class="me-1" />Top by Bandwidth
        </VCardTitle>
        <VCardText class="pa-2">
          <div class="rank-list rank-list-scroll">
            <div v-for="r in bandwidthList" :key="r.name" class="rank-row">
              <span class="rank-num rank-purple">{{ r.rank }}</span>
              <span class="rank-name">{{ r.name }}</span>
              <div class="rank-bar-wrap">
                <div class="rank-bar rank-bar-purple" :style="{ width: r.percent + '%' }" />
              </div>
              <span class="rank-val">{{ formatBytes(r.bandwidth) }}</span>
            </div>
          </div>
        </VCardText>
      </VCard>
      <VCard class="chart-card" style="flex: 2;">
        <VCardTitle class="text-body-2 pa-3 pb-0">
          <VIcon icon="bx-globe" size="16" class="me-1" />Top by Country
        </VCardTitle>
        <VCardText class="pa-2">
          <div class="rank-list rank-list-scroll">
            <div v-if="countryList.length === 0" class="rank-empty text-medium-emphasis">No country data</div>
            <div v-for="c in countryList" :key="c.code" class="rank-row rank-row-click" :class="{ 'rank-row-active-gold': selectedCountry === c.code }" @click="toggleCountry(c.code)">
              <span class="rank-num rank-gold">{{ c.rank }}</span>
              <span class="rank-name">{{ c.name }}</span>
              <span class="rank-sub text-medium-emphasis">{{ c.code }}</span>
              <div class="rank-bar-wrap">
                <div class="rank-bar rank-bar-gold" :style="{ width: c.percent + '%' }" />
              </div>
              <span class="rank-val">{{ formatNumber(c.requests) }}</span>
              <span class="rank-pct rank-gold">{{ c.percent }}%</span>
            </div>
          </div>
        </VCardText>
      </VCard>
      <VCard class="chart-card" style="flex: 2;">
        <VCardTitle class="text-body-2 pa-3 pb-0">
          <VIcon icon="bx-desktop" size="16" class="me-1" />Top by Client IP
        </VCardTitle>
        <VCardText class="pa-2">
          <div class="rank-list rank-list-scroll">
            <div v-if="ipList.length === 0" class="rank-empty text-medium-emphasis">No IP data</div>
            <div v-for="item in ipList" :key="item.ip" class="rank-row rank-row-click" :class="{ 'rank-row-active-cyan': selectedIP === item.ip }" @click="toggleIP(item.ip)">
              <span class="rank-num rank-cyan">{{ item.rank }}</span>
              <span class="rank-name" style="min-width: 110px; font-family: monospace; font-size: 12px;">{{ item.ip }}</span>
              <span class="rank-sub text-medium-emphasis" style="font-size: 10px;">{{ item.country }}</span>
              <div class="rank-bar-wrap">
                <div class="rank-bar rank-bar-cyan" :style="{ width: (item.requests / (ipList[0]?.requests || 1) * 100).toFixed(1) + '%' }" />
              </div>
              <span class="rank-val">{{ formatNumber(item.requests) }}</span>
            </div>
          </div>
        </VCardText>
      </VCard>
    </div>

    <!-- Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VDivider />
      <VTable class="sticky-table" style="max-height: calc(100vh - 520px); table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 60px" />
          <col style="width: 140px" />
          <col style="width: 100px" />
          <col style="width: 100px" />
          <col style="width: 100px" />
          <col style="width: 100px" />
          <col style="width: 80px" />
          <col style="width: 80px" />
          <col style="width: 110px" />
        </colgroup>
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th>#</th>
            <th style="cursor: pointer" @click="toggleSort('domain')">Domain <VIcon :icon="sortIcon('domain')" size="14" /></th>
            <th style="cursor: pointer" @click="toggleSort('total')">Total <VIcon :icon="sortIcon('total')" size="14" /></th>
            <th style="cursor: pointer" @click="toggleSort('cached')">Cached <VIcon :icon="sortIcon('cached')" size="14" /></th>
            <th style="cursor: pointer" @click="toggleSort('uncached')">Uncached <VIcon :icon="sortIcon('uncached')" size="14" /></th>
            <th style="cursor: pointer" @click="toggleSort('bandwidth')">Bandwidth <VIcon :icon="sortIcon('bandwidth')" size="14" /></th>
            <th style="cursor: pointer" @click="toggleSort('threats')">Threat <VIcon :icon="sortIcon('threats')" size="14" /></th>
            <th style="cursor: pointer" @click="toggleSort('pageViews')">Views <VIcon :icon="sortIcon('pageViews')" size="14" /></th>
            <th style="cursor: pointer" @click="toggleSort('uniqueVisitor')">Unique <VIcon :icon="sortIcon('uniqueVisitor')" size="14" /></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, idx) in filteredRecords" :key="r.domain">
            <td class="text-caption text-medium-emphasis">{{ idx + 1 }}</td>
            <td><code class="text-body-2">{{ r.domain }}</code></td>
            <td class="font-weight-medium">{{ formatNumber(r.total) }}</td>
            <td class="text-success">{{ formatNumber(r.cached) }}</td>
            <td class="text-warning">{{ formatNumber(r.uncached) }}</td>
            <td>{{ formatBytes(r.bandwidth) }}</td>
            <td :class="r.threats > 0 ? 'text-error font-weight-medium' : ''">{{ formatNumber(r.threats) }}</td>
            <td>{{ formatNumber(r.pageViews) }}</td>
            <td>{{ formatNumber(r.uniqueVisitor) }}</td>
          </tr>

        </tbody>
      </VTable>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>

<style scoped>
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.metric-card {
  border-left: 3px solid transparent;
  transition: border-color 0.2s;
}
.metric-card:hover {
  border-left-color: rgb(var(--v-theme-primary));
}
.chart-row {
  display: flex;
  gap: 12px;
}
.chart-card {
  min-width: 0;
}
@media (max-width: 1200px) {
  .chart-row {
    flex-wrap: wrap;
  }
  .chart-card {
    flex: 1 1 300px !important;
  }
}
.sticky-table { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.sticky-table :deep(.v-table__wrapper) { flex: 1; overflow-y: auto; min-height: 0; }
.sticky-table :deep(thead) { position: sticky; top: 0; z-index: 10; }
.sticky-table :deep(thead th) { background: rgb(var(--v-theme-surface)); border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
.rank-list { display: flex; flex-direction: column; gap: 6px; }
.rank-list-scroll { max-height: 260px; overflow-y: auto; padding-right: 4px; }
.rank-list-scroll::-webkit-scrollbar { width: 4px; }
.rank-list-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
.rank-row { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 4px; }
.rank-empty { text-align: center; padding: 16px 0; font-size: 12px; }
.rank-row-click { cursor: pointer; }
.rank-row-click:hover { background: rgba(255,255,255,0.04); }
.rank-row-active { background: rgba(79,195,247,0.12) !important; }
.rank-row-active-gold { background: rgba(254,176,25,0.12) !important; }
.rank-row-active-cyan { background: rgba(38,198,218,0.12) !important; }
.rank-num { width: 20px; text-align: center; font-size: 12px; font-weight: 600; }
.rank-gold { color: #FEB019; }
.rank-blue { color: #4FC3F7; }
.rank-purple { color: #AB47BC; }
.rank-cyan { color: #26C6DA; }
.rank-name { font-size: 13px; font-weight: 500; min-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank-sub { font-size: 11px; min-width: 24px; }
.rank-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.rank-bar { height: 100%; border-radius: 3px; transition: width 0.3s; }
.rank-bar-gold { background: #FEB019; }
.rank-bar-blue { background: #4FC3F7; }
.rank-bar-purple { background: #AB47BC; }
.rank-bar-cyan { background: #26C6DA; }
.rank-val { font-size: 12px; min-width: 56px; text-align: right; }
.rank-pct { font-size: 12px; font-weight: 600; min-width: 42px; text-align: right; }
</style>
