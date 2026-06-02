<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const MONITOR_GATEWAY = '/monitor'

const route = useRoute()
const router = useRouter()
const selectedAccountId = ref<number | null>(route.query.account ? Number(route.query.account) : -1)
const domainFilter = ref(route.query.search as string || '')
const dnsRecords = ref<any[]>([])
const monitorStatus = ref<Record<string, any>>({})
const accounts = ref<any[]>([])
const loadingAccounts = ref(false)
const loadingRecords = ref(false)
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Pagination
const page = ref(1)
const pageSize = ref(20)

const accountOptions = computed(() => [
  { title: 'All', value: -1 },
  ...accounts.value.map((a: any) => ({ title: a.name, value: a.id })),
])

const typeCounts = computed(() => {
  const map: Record<string, number> = {}
  dnsRecords.value.forEach(r => {
    const t = r.type || 'unknown'
    map[t] = (map[t] || 0) + 1
  })
  return map
})

const typeColors: Record<string, string> = {
  A: 'success', CNAME: 'primary',
}

const filteredRecords = computed(() => {
  if (!domainFilter.value) return dnsRecords.value
  const s = domainFilter.value.toLowerCase()
  return dnsRecords.value.filter(r => r.name?.toLowerCase().includes(s) || r.content?.toLowerCase().includes(s))
})

async function fetchAccounts() {
  loadingAccounts.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/accounts`)
    accounts.value = data.data || []
  } catch (e: any) {
    console.error('Failed to fetch accounts', e)
  } finally {
    loadingAccounts.value = false
  }
}

async function fetchDnsRecords() {
  loadingRecords.value = true
  try {
    const params: Record<string, any> = {}
    if (selectedAccountId.value && selectedAccountId.value !== -1) params.account_id = selectedAccountId.value
    const { data } = await apiClient.get(`${CF_GATEWAY}/dnsDomain`, { params })
    dnsRecords.value = data.data || []
    await fetchMonitorStatus()
  } catch (e: any) {
    console.error('Failed to fetch DNS domains', e)
    dnsRecords.value = []
  } finally {
    loadingRecords.value = false
  }
}

async function fetchMonitorStatus() {
  try {
    const { data } = await apiClient.get(`${MONITOR_GATEWAY}/rules`)
    const rules = data.data || []
    const statusMap: Record<string, any> = {}
    for (const rule of rules) {
      if (!rule.enabled) continue
      try {
        const res = await apiClient.get(`${MONITOR_GATEWAY}/rules/${rule.id}/results`, { params: { limit: 10000 } })
        const results = res.data.data || []
        for (const r of results) {
          if (r.domain && !statusMap[r.domain]) {
            statusMap[r.domain] = { status: r.status, status_code: r.status_code, response_time_ms: r.response_time_ms, resolved_ip: r.resolved_ip, probe_ip: r.probe_ip }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch results for rule ${rule.id}`, e)
      }
    }
    monitorStatus.value = statusMap
  } catch (e) {
    console.warn('Failed to fetch monitor rules', e)
  }
}

async function syncDns() {
  syncing.value = true
  try {
    const { data } = await apiClient.post(`${CF_GATEWAY}/dnsDomain/sync`)
    const synced = data.data?.synced || 0
    const accCount = data.data?.accounts || 0
    snackbar.value = { show: true, text: `Sync complete: ${synced} records from ${accCount} accounts`, color: 'success' }
    await fetchDnsRecords()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || e?.message || 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}

watch(selectedAccountId, (val) => {
  router.replace({ query: val !== null ? { account: String(val), search: domainFilter.value || undefined } : { search: domainFilter.value || undefined } })
  fetchDnsRecords()
})

watch(domainFilter, () => { page.value = 1 })

// Sort
const sortKey = ref<string>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const domainSortOrder = ref<'asc' | 'desc'>('asc')

function toggleSort(key: string) {
  if (key === 'domain') {
    domainSortOrder.value = domainSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortOrder.value = 'asc'
    }
  }
}

// Grouped by zone
const groupedRecords = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const r of filteredRecords.value) {
    const domain = r.zone_name || 'unknown'
    if (!groups[domain]) groups[domain] = []
    groups[domain].push(r)
  }
  const key = sortKey.value
  const order = sortOrder.value === 'asc' ? 1 : -1
  const result: Record<string, any[]> = {}
  for (const [domain, records] of Object.entries(groups)) {
    result[domain] = [...records].sort((a, b) => {
      const va = a[key]; const vb = b[key]
      if (va == null) return 1; if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * order
      return String(va).localeCompare(String(vb)) * order
    })
  }
  return result
})

const sortedDomainKeys = computed(() => {
  const keys = Object.keys(groupedRecords.value)
  const order = domainSortOrder.value === 'asc' ? 1 : -1
  keys.sort((a, b) => a.localeCompare(b) * order)
  return keys
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedDomainKeys.value.length / pageSize.value)))
const pagedDomainKeys = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedDomainKeys.value.slice(start, start + pageSize.value)
})

const sortedRecords = computed(() => {
  const all: any[] = []
  for (const records of Object.values(groupedRecords.value)) {
    all.push(...records)
  }
  return all
})

// Expanded state
const expandedDomains = ref<Record<string, boolean>>({})
try {
  expandedDomains.value = JSON.parse(localStorage.getItem('dns_domain_expanded') || '{}')
} catch { /* ignore */ }

function toggleDomain(domain: string) {
  const next = { ...expandedDomains.value, [domain]: !expandedDomains.value[domain] }
  expandedDomains.value = next
  localStorage.setItem('dns_domain_expanded', JSON.stringify(next))
}

function expandAll() {
  const next: Record<string, boolean> = {}
  sortedDomainKeys.value.forEach(k => { next[k] = true })
  expandedDomains.value = next
  localStorage.setItem('dns_domain_expanded', JSON.stringify(next))
}

function collapseAll() {
  expandedDomains.value = {}
  localStorage.setItem('dns_domain_expanded', JSON.stringify({}))
}

function exportCSV() {
  if (!sortedRecords.value.length) return
  const headers = ['zone_name', 'type', 'name', 'content', 'proxied', 'account_name']
  const rows = sortedRecords.value.map(r => headers.map(h => {
    let v = r[h]
    if (typeof v === 'boolean') v = v ? 'Yes' : 'No'
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) v = '"' + v.replace(/"/g, '""') + '"'
    return v ?? ''
  }).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dns_domains_' + new Date().toISOString().slice(0, 10) + '.csv'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await fetchAccounts()
  if (!selectedAccountId.value && accounts.value.length > 0) {
    selectedAccountId.value = null
  }
  await fetchDnsRecords()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Filter bar -->
    <VCard class="mb-4" style="flex-shrink: 0;">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect
          v-model="selectedAccountId"
          :items="accountOptions"
          label="Account"
          density="compact"
          style="max-width: 180px"
          hide-details
          clearable
          :loading="loadingAccounts"
        />
        <VTextField
          v-model="domainFilter"
          prepend-inner-icon="bx-search"
          placeholder="Filter by domain..."
          density="compact"
          hide-details
          clearable
          style="max-width: 240px"
        />
        <div class="d-flex align-center flex-wrap gap-2">
          <VChip size="small" color="primary" variant="tonal">Total: {{ dnsRecords.length }}</VChip>
          <VChip v-for="(count, type) in typeCounts" :key="type" size="small" :color="typeColors[type] || 'grey'" variant="tonal">
            {{ type }}: {{ count }}
          </VChip>
        </div>
        <VSpacer />
        <VBtn
          color="primary"
          variant="tonal"
          :loading="syncing"
          prepend-icon="bx-refresh"
          @click="syncDns"
        >
          Sync
        </VBtn>
        <VBtn icon="bx-download" size="small" variant="text" title="Export CSV" :disabled="!sortedRecords.length" @click="exportCSV" />
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[20, 50, 100, 500]" density="compact" style="max-width: 80px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loadingRecords" indeterminate color="primary" />
      <VTable v-if="sortedRecords.length" class="sticky-table" hover density="compact" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 200px" />
          <col style="width: 80px" />
          <col style="width: 170px" />
          <col style="width: 150px" />
          <col style="width: 100px" />
          <col style="width: 200px" />
          <col style="width: 140px" />
          <col style="width: 140px" />
        </colgroup>
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th style="width: 200px !important; max-width: 200px !important; overflow: hidden;">
              <span class="cursor-pointer d-inline-flex align-center gap-1" @click="toggleSort('domain')">
                Zone <VIcon size="14" :icon="domainSortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down'" class="text-disabled" />
              </span>
            </th>
            <th style="width: 100px; max-width: 100px; overflow: hidden; text-align: center;">Type</th>
            <th style="width: 170px !important; max-width: 170px !important; overflow: hidden;">Name</th>
            <th style="width: 150px !important; max-width: 150px !important; overflow: hidden;">Content</th>
            <th style="width: 20px; text-align: center;">Proxied</th>
            <th style="width: 200px;">Last Status</th>
            <th style="width: 140px;">Resolved IP</th>
            <th style="width: 140px;">Probe IP</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="domain in pagedDomainKeys" :key="domain">
            <tr class="cursor-pointer" @click="toggleDomain(domain)" style="background: rgb(var(--v-theme-on-surface), 0.04);">
              <td colspan="8" style="padding: 0 !important;">
                <div class="d-flex align-center" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 12px 16px;">
                  <VIcon :icon="expandedDomains[domain] ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
                  <VIcon icon="bx-globe" size="18" class="me-2 text-medium-emphasis" />
                  <span class="font-weight-bold text-body-1">{{ domain }}</span>
                  <VChip size="x-small" variant="tonal" color="primary" class="ms-2">{{ groupedRecords[domain]?.length || 0 }}</VChip>
                </div>
              </td>
            </tr>
            <template v-if="expandedDomains[domain]">
              <tr v-for="r in (groupedRecords[domain] || [])" :key="r.record_id">
                <td style="width: 200px !important; max-width: 200px !important;"></td>
                <td style="width: 90px !important; max-width: 90px !important;">
                  <div style="display: flex; justify-content: center; align-items: center;">
                    <VChip size="x-small" :color="typeColors[r.type] || 'grey'" variant="tonal">{{ r.type }}</VChip>
                  </div>
                </td>
                <td style="width: 170px !important; max-width: 170px !important; text-align: left; word-break: break-all; ">
                  <code style="display: block; width: 170px; word-break: break-all; " class="text-caption">{{ r.name }}</code>
                </td>
                <td style="width: 150px !important; max-width: 150px !important; word-break: break-all;">
                  <code class="text-caption">{{ r.content }}</code>
                </td>
                <td style="width: 20px; text-align: center;">
                  <VChip size="x-small" :color="r.proxied ? 'success' : 'grey'" variant="tonal">{{ r.proxied ? 'Yes' : 'No' }}</VChip>
                </td>
                <td style="width: 200px;">
                  <template v-if="monitorStatus[r.name]">
                    <VChip size="x-small" :color="monitorStatus[r.name].status === 'up' ? 'success' : monitorStatus[r.name].status === 'down' ? 'error' : 'warning'" variant="tonal">
                      {{ monitorStatus[r.name].status_code || monitorStatus[r.name].status }}
                    </VChip>
                    <span v-if="monitorStatus[r.name].response_time_ms" class="text-caption text-medium-emphasis ms-1">{{ monitorStatus[r.name].response_time_ms }}ms</span>
                  </template>
                  <template v-else-if="r.status_code">
                    <VChip size="x-small" :color="r.status_code === 200 ? 'success' : r.status_code >= 500 ? 'error' : 'warning'" variant="tonal">{{ r.status_code }}</VChip>
                  </template>
                  <span v-else class="text-caption text-disabled">-</span>
                </td>
                <td style="width: 140px;">
                  <span v-if="monitorStatus[r.name]?.resolved_ip" class="text-caption">{{ monitorStatus[r.name].resolved_ip }}</span>
                  <span v-else class="text-caption text-disabled">-</span>
                </td>
                <td style="width: 140px;">
                  <span v-if="monitorStatus[r.name]?.probe_ip" class="text-caption">{{ monitorStatus[r.name].probe_ip }}</span>
                  <span v-else class="text-caption text-disabled">-</span>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loadingRecords" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-globe" size="48" class="mb-2" />
        <p>{{ domainFilter ? 'No matching records' : 'No synced DNS domains. Click Sync to fetch from Cloudflare.' }}</p>
      </VCardText>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>

<style scoped>
.sticky-table {
  display: flex;
  flex-direction: column;
}
.sticky-table :deep(.v-table__wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
