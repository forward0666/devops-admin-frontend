<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient, { domainGroupService } from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/domain'

const route = useRoute()
const router = useRouter()
const domainFilter = ref(route.query.search as string || '')
const statusFilter = ref(route.query.status as string || '')
const groupFilter = ref('')
const sourceFilter = ref('')
const groups = ref<any[]>([])
const zoneMeta = ref<Record<string, any>>({})
const dnsRecords = ref<any[]>([])
const loadingRecords = ref(false)
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Pagination
const page = ref(1)
const pageSize = ref(20)

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

const groupFilteredRecords = computed(() => {
  let records = dnsRecords.value
  if (domainFilter.value) {
    const s = domainFilter.value.toLowerCase()
    records = records.filter(r => r.name?.toLowerCase().includes(s) || r.content?.toLowerCase().includes(s))
  }
  if (groupFilter.value) {
    records = records.filter(r => getZoneGroupId(r) === groupFilter.value)
  }
  if (sourceFilter.value) {
    records = records.filter(r => getSource(r.account_name) === sourceFilter.value)
  }
  return records
})

const statusCodeStats = computed(() => {
  const stats: Record<string, { count: number, label: string, icon: string, color: string, filter: string }> = {
    total: { count: 0, label: 'Total', icon: 'bx-globe', color: 'primary', filter: '' },
    up: { count: 0, label: 'Up (200)', icon: 'bx-check-circle', color: 'success', filter: 'up' },
    s3xx: { count: 0, label: '3xx', icon: 'bx-link-external', color: 'info', filter: '3xx' },
    s403: { count: 0, label: '403', icon: 'bx-shield-x', color: 'error', filter: '403' },
    s4xx: { count: 0, label: '4xx', icon: 'bx-error', color: 'warning', filter: '4xx' },
    s5xx: { count: 0, label: '5xx', icon: 'bx-server', color: 'error', filter: '5xx' },
    down: { count: 0, label: 'Timeout', icon: 'bx-time-five', color: 'error', filter: 'down' },
    noData: { count: 0, label: 'No Data', icon: 'bx-minus-circle', color: 'grey', filter: 'noData' },
    pub: { count: 0, label: 'Public', icon: 'bx-globe', color: 'info', filter: 'public' },
    priv: { count: 0, label: 'Private', icon: 'bx-lock', color: 'warning', filter: 'private' },
    ignored: { count: 0, label: 'Ignored', icon: 'bx-hide', color: 'grey', filter: 'ignored' },
  }
  for (const r of groupFilteredRecords.value) {
    stats.total.count++
    if (r.last_status_code === 200) {
      stats.up.count++
    } else if (r.last_status_code >= 300 && r.last_status_code < 400) {
      stats.s3xx.count++
    } else if (r.last_status_code === 403) {
      stats.s403.count++
    } else if (r.last_status_code >= 400 && r.last_status_code < 500) {
      stats.s4xx.count++
    } else if (r.last_status_code >= 500) {
      stats.s5xx.count++
    } else if (r.last_status === 'timeout' || r.last_status === 'error') {
      stats.down.count++
    } else {
      stats.noData.count++
    }
    if (r.is_public === false) {
      stats.priv.count++
    } else {
      stats.pub.count++
    }
    if (r.is_ignored) {
      stats.ignored.count++
    }
  }
  return [stats.total, stats.pub, stats.priv, stats.up, stats.s3xx, stats.s403, stats.s4xx, stats.s5xx, stats.down, stats.noData]
})

const sourceOptions = computed(() => {
  const platforms = [...new Set(groupFilteredRecords.value.map(r => getSource(r.account_name)).filter(Boolean))]
  return platforms.map(p => ({ title: p, value: p }))
})


function getSource(accountName: string): string {
  if (!accountName) return 'Other'
  const lower = accountName.toLowerCase()
  if (lower.includes('u8')) return 'Cloudflare-U8'
  if (lower.includes('ph')) return 'Cloudflare-PH'
  return `Cloudflare-${accountName}`
}

function getZoneGroupId(record: any): string {
  return zoneMeta.value[record.zone_id]?.groupId || ''
}

const filteredRecords = computed(() => {
  let records = dnsRecords.value
  if (domainFilter.value) {
    const s = domainFilter.value.toLowerCase()
    records = records.filter(r => r.name?.toLowerCase().includes(s) || r.content?.toLowerCase().includes(s))
  }
  if (groupFilter.value) {
    records = records.filter(r => getZoneGroupId(r) === groupFilter.value)
  }
  if (sourceFilter.value) {
    records = records.filter(r => getSource(r.account_name) === sourceFilter.value)
  }
  if (statusFilter.value) {
    const f = statusFilter.value
    if (f === 'up') records = records.filter(r => r.last_status_code === 200)
    else if (f === '3xx') records = records.filter(r => r.last_status_code >= 300 && r.last_status_code < 400)
    else if (f === '403') records = records.filter(r => r.last_status_code === 403)
    else if (f === '4xx') records = records.filter(r => r.last_status_code >= 400 && r.last_status_code < 500 && r.last_status_code !== 403)
    else if (f === '5xx') records = records.filter(r => r.last_status_code >= 500)
    else if (f === 'down') records = records.filter(r => (r.last_status === 'timeout' || r.last_status === 'error') && !r.last_status_code)
    else if (f === 'noData') records = records.filter(r => r.last_status_code !== 200 && r.last_status_code !== 403 && !(r.last_status_code >= 400 && r.last_status_code < 500) && !(r.last_status_code >= 500) && r.last_status !== 'timeout' && r.last_status !== 'error')
    else if (f === 'public') records = records.filter(r => r.is_public !== false)
    else if (f === 'private') records = records.filter(r => r.is_public === false)
    else if (f === 'ignored') records = records.filter(r => r.is_ignored)
  }
  return records
})

async function fetchDnsRecords() {
  loadingRecords.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/domain`)
    dnsRecords.value = data.data || []
  } catch (e: any) {
    console.error('Failed to fetch DNS domains', e)
    dnsRecords.value = []
  } finally {
    loadingRecords.value = false
  }
}



async function syncDns() {
  syncing.value = true
  try {
    const { data } = await apiClient.post(`${CF_GATEWAY}/domain/sync`, null, { timeout: 30000 })
    const synced = data.data?.synced || 0
    snackbar.value = { show: true, text: `Sync complete: ${synced} records`, color: 'success' }
    await fetchDnsRecords()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || e?.message || 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}

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

async function togglePublic(record: any, value: boolean) {
  try {
    await apiClient.put(`/domain/domain/${record.id || record._id}`, { is_public: value })
    record.is_public = value
    snackbar.value = { show: true, text: value ? 'Marked as public' : 'Marked as private', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed to update', color: 'error' }
  }
}

async function toggleIgnore(record: any, value: boolean) {
  try {
    await apiClient.put(`/domain/domain/${record.id || record._id}`, { is_ignored: value })
    record.is_ignored = value
    snackbar.value = { show: true, text: value ? 'Ignored' : 'Unignored', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed to update', color: 'error' }
  }
}

async function updateRemark(record: any) {
  try {
    await apiClient.put(`/domain/domain/${record.id || record._id}`, { remark: record.remark || '' })
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed to update remark', color: 'error' }
  }
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
  await Promise.all([fetchDnsRecords(), fetchGroups(), fetchMeta()])
})

async function fetchGroups() {
  try {
    const res = await domainGroupService.listGroups()
    groups.value = res || []
  } catch { groups.value = [] }
}

async function fetchMeta() {
  try {
    const res = await domainGroupService.listMeta()
    const list = res || []
    const m: Record<string, any> = {}
    for (const item of list) {
      m[item.zoneId] = { type: item.type || '', remark: item.remark || '', groupId: item.groupId || '', env: item.env || '' }
    }
    zoneMeta.value = m
  } catch { zoneMeta.value = {} }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Filter bar -->
    <VCard class="mb-4" style="flex-shrink: 0;">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VTextField
          v-model="domainFilter"
          prepend-inner-icon="bx-search"
          placeholder="Filter by domain..."
          density="compact"
          hide-details
          clearable
          style="max-width: 240px"
        />
        <VSelect v-model="groupFilter" :items="[{ title: 'All Groups', value: '' }, ...groups.map((g: any) => ({ title: g.name, value: g.id }))]" density="compact" style="max-width: 160px" hide-details clearable placeholder="Group" />
        <VSelect v-model="sourceFilter" :items="[{ title: 'All Sources', value: '' }, ...sourceOptions]" density="compact" style="max-width: 160px" hide-details clearable placeholder="Source" />
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
        <VBtn prepend-icon="bx-upload" variant="tonal" color="secondary" size="small" :disabled="!sortedRecords.length" @click="exportCSV">Export</VBtn>
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[20, 50, 100, 500]" density="compact" style="max-width: 80px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <!-- Status Code Stats -->
    <div class="d-flex flex-wrap gap-2 mb-4" style="overflow: hidden;">
      <VCard v-for="stat in statusCodeStats" :key="stat.label" :style="{ minWidth: '90px', flex: '1 1 0', cursor: 'pointer', border: statusFilter === stat.filter ? '2px solid rgb(var(--v-theme-primary))' : 'none' }" @click="statusFilter = statusFilter === stat.filter ? '' : stat.filter; router.replace({ query: { ...route.query, status: statusFilter === stat.filter ? stat.filter : undefined } })">
        <VCardText class="d-flex align-center py-2 px-3" style="gap: 20px;">
          <VIcon :icon="stat.icon" :color="stat.color" size="18" />
          <div>
            <div class="text-body-1 font-weight-bold">{{ stat.count }}</div>
            <div class="text-caption text-medium-emphasis" style="font-size: 10px;">{{ stat.label }}</div>
          </div>
        </VCardText>
      </VCard>
    </div>

    <!-- Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loadingRecords" indeterminate color="primary" />
      <VTable v-if="sortedRecords.length" class="sticky-table" hover density="compact" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th>
              Zone
            </th>
            <th style="text-align: center;">Type</th>
            <th>Name</th>
            <th>Content</th>
            <th style="text-align: center;">Proxied</th>
            <th>Status</th>
            <th>Resolved IP</th>
            <th>Probe IP</th>
            <th>Probe Time</th>
            <th style="text-align: center; width: 70px;">Private</th>
            <th style="text-align: center; width: 70px;">Ignore</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="domain in pagedDomainKeys" :key="domain">
            <tr class="cursor-pointer" @click="toggleDomain(domain)" style="background: rgb(var(--v-theme-on-surface), 0.04);">
              <td colspan="12" style="padding: 0 !important;">
                <div class="d-flex align-center" style="padding: 12px 5px;">
                  <VIcon :icon="expandedDomains[domain] ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
                  <VIcon icon="bx-globe" size="18" class="me-2 text-medium-emphasis" />
                  <span class="font-weight-bold text-body-1">{{ domain }}</span>
                  <VChip size="x-small" variant="tonal" color="primary" class="ms-2">{{ groupedRecords[domain]?.length || 0 }}</VChip>
                </div>
              </td>
            </tr>
            <template v-if="expandedDomains[domain]">
              <tr v-for="r in (groupedRecords[domain] || [])" :key="r.record_id">
                <td></td>
                <td style="text-align: center;">
                  <VChip size="x-small" :color="typeColors[r.type] || 'grey'" variant="tonal">{{ r.type }}</VChip>
                </td>
                <td style="word-break: break-all;">
                  <code style="word-break: break-all;" class="text-caption">{{ r.name }}</code>
                </td>
                <td style="word-break: break-all;">
                  <code class="text-caption">{{ r.content }}</code>
                </td>
                <td style="text-align: center;">
                  <VChip size="x-small" :color="r.proxied ? 'success' : 'grey'" variant="tonal">{{ r.proxied ? 'Yes' : 'No' }}</VChip>
                </td>
                <td>
                  <template v-if="r.last_status_code">
                    <VChip size="x-small" :color="r.last_status_code >= 300 && r.last_status_code < 400 ? 'info' : r.last_status_code === 200 ? 'success' : (r.last_status_code >= 500 || r.last_status_code === 403) ? 'error' : 'warning'" variant="tonal">{{ r.last_status_code }}</VChip>
                    <span v-if="r.last_response_time_ms" class="text-caption text-medium-emphasis ms-1">{{ r.last_response_time_ms }}ms</span>
                  </template>
                  <template v-else-if="r.last_status">
                    <VChip size="x-small" :color="r.last_status === 'up' ? 'success' : 'error'" variant="tonal">{{ r.last_status }}</VChip>
                  </template>
                  <template v-else-if="r.status_code">
                    <VChip size="x-small" :color="r.status_code === 200 ? 'success' : (r.status_code >= 500 || r.status_code === 403) ? 'error' : 'warning'" variant="tonal">{{ r.status_code }}</VChip>
                  </template>
                  <span v-else class="text-caption text-disabled">-</span>
                </td>
                <td>
                  <span v-if="r.last_resolved_ip" class="text-caption">{{ r.last_resolved_ip }}</span>
                  <span v-else class="text-caption text-disabled">-</span>
                </td>
                <td>
                  <span v-if="r.last_probe_ip && r.last_probe_ip !== 'fail'" class="text-caption">{{ r.last_probe_ip }}</span>
                  <span v-else class="text-caption text-disabled">-</span>
                </td>
                <td>
                  <span v-if="r.last_checked_at" class="text-caption">{{ new Date(r.last_checked_at + 'Z').toLocaleTimeString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) }}</span>
                  <span v-else class="text-caption text-disabled">-</span>
                </td>
                <td style="text-align: center;">
                  <VSwitch
                    :model-value="!r.is_public"
                    @update:model-value="togglePublic(r, !$event)"
                    color="success"
                    density="compact"
                    hide-details
                    style="display: inline-flex;"
                  />
                </td>
                <td style="text-align: center;">
                  <VSwitch
                    :model-value="r.is_ignored"
                    @update:model-value="toggleIgnore(r, $event)"
                    :color="r.is_ignored ? 'warning' : 'grey'"
                    density="compact"
                    hide-details
                    style="display: inline-flex;"
                  />
                </td>
                <td>
                  <VTextField
                    v-model="r.remark"
                    density="compact"
                    variant="plain"
                    hide-details
                    placeholder="-"
                    @blur="updateRemark(r)"
                    style="font-size: 12px;"
                  />
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
.sticky-table :deep(table) {
  table-layout: fixed;
  width: 100%;
}
.sticky-table :deep(th),
.sticky-table :deep(td) {
  padding: 2px 8px !important;
}
.sticky-table :deep(th:nth-child(1)),
.sticky-table :deep(td:nth-child(1)) { width: 60px; }
.sticky-table :deep(th:nth-child(2)),
.sticky-table :deep(td:nth-child(2)) { width: 80px; }
.sticky-table :deep(th:nth-child(3)),
.sticky-table :deep(td:nth-child(3)) { width: 200px; }
.sticky-table :deep(th:nth-child(4)),
.sticky-table :deep(td:nth-child(4)) { width: 130px; }
.sticky-table :deep(th:nth-child(5)),
.sticky-table :deep(td:nth-child(5)) { width: 80px; }
.sticky-table :deep(th:nth-child(6)),
.sticky-table :deep(td:nth-child(6)) { width: 100px; }
.sticky-table :deep(th:nth-child(7)),
.sticky-table :deep(td:nth-child(7)) { width: 110px; }
.sticky-table :deep(th:nth-child(8)),
.sticky-table :deep(td:nth-child(8)) { width: 110px; }
.sticky-table :deep(th:nth-child(9)),
.sticky-table :deep(td:nth-child(9)) { width: 100px; }
.sticky-table :deep(th:nth-child(10)),
.sticky-table :deep(td:nth-child(10)) { width: 80px; }
.sticky-table :deep(th:nth-child(11)),
.sticky-table :deep(td:nth-child(11)) { width: 80px; }
.sticky-table :deep(th:nth-child(12)),
.sticky-table :deep(td:nth-child(12)) { width: 150px; }
.sticky-table :deep(.v-table__wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
