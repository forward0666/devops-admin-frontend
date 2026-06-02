<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'
import { useCfAccount } from '~/composables/useCfAccount'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const { accounts, loading, fetchAccounts, getToken } = useCfAccount()

const route = useRoute()
const router = useRouter()
const selectedAccountId = ref<number | null>(route.query.account ? Number(route.query.account) : -1)
const domainFilter = ref(route.query.search as string || '')
const dnsRecords = ref<any[]>([])
const loadingRecords = ref(false)
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

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
  A: 'success', AAAA: 'info', CNAME: 'primary', MX: 'warning',
  TXT: 'secondary', NS: 'grey', SRV: 'error', CAA: 'orange', PTR: 'purple',
}

const filteredRecords = computed(() => {
  if (!domainFilter.value) return dnsRecords.value
  const s = domainFilter.value.toLowerCase()
  return dnsRecords.value.filter(r => r.name?.toLowerCase().includes(s))
})

watch(selectedAccountId, (val) => {
  if (process.client) {
    if (val !== null) localStorage.setItem("cf-account-id", String(val))
    else localStorage.removeItem("cf-account-id")
  }
  router.replace({ query: val ? { account: String(val) } : {} })
  if (val) fetchDnsRecords()
})

async function fetchDnsRecords() {
  loadingRecords.value = true
  try {
    const params: Record<string, any> = {}
    if (selectedAccountId.value && selectedAccountId.value !== -1) params.account_id = selectedAccountId.value
    const { data } = await apiClient.get(`${CF_GATEWAY}/dns`, { params })
    dnsRecords.value = data.data || []
  } catch (e: any) {
    console.error('Failed to fetch DNS records', e)
  } finally {
    loadingRecords.value = false
  }
}

async function syncFromCF() {
  if (!selectedAccountId.value) return
  syncing.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const { data } = await apiClient.post(
      `${CF_GATEWAY}/dns/sync`,
      null,
      {
        params: { account_id: selectedAccountId.value },
        headers: { 'X-Cf-Token': token },
        timeout: 60000,
      },
    )
    snackbar.value = { show: true, text: `Synced ${data.data?.synced || 0} DNS records`, color: 'success' }
    await fetchDnsRecords()
  } catch (e: any) {
    let detail: string = e?.response?.data?.detail || 'Sync failed'
    if (detail.includes('Sync zones first')) {
      detail += ' - please sync Zones first'
    }
    snackbar.value = { show: true, text: detail, color: 'error' }
  } finally {
    syncing.value = false
  }
}

onMounted(async () => {
  await fetchAccounts()
  if (!selectedAccountId.value && accounts.value.length > 0) {
    selectedAccountId.value = accounts.value[0].id
  }
  if (selectedAccountId.value) fetchDnsRecords()
})

const sortKey = ref<string>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

const domainSortKey = ref<'domain' | string>('domain')
const domainSortOrder = ref<'asc' | 'desc'>('asc')

const groupedRecords = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const r of filteredRecords.value) {
    const domain = r.zone_name || 'unknown'
    if (!groups[domain]) groups[domain] = []
    groups[domain].push(r)
  }
  // Sort within each group by sortKey (except domain)
  const key = sortKey.value
  const order = sortOrder.value === 'asc' ? 1 : -1
  const result: Record<string, any[]> = {}
  for (const domain of Object.keys(groups)) {
    result[domain] = [...groups[domain]].sort((a, b) => {
      const va = a[key]; const vb = b[key]
      if (va == null) return 1; if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * order
      return String(va).localeCompare(String(vb)) * order
    })
  }
  return result
})

const sortedRecords = computed(() => {
  const all: any[] = []
  for (const domain of Object.keys(groupedRecords.value)) {
    all.push(...groupedRecords.value[domain])
  }
  return all
})

const sortedDomainKeys = computed(() => {
  const keys = Object.keys(groupedRecords.value)
  const order = domainSortOrder.value === 'asc' ? 1 : -1
  keys.sort((a, b) => a.localeCompare(b) * order)
  return keys
})

// Pagination
const page = ref(Number(route.query.page) || 1)
const pageSize = ref(Number(route.query.size) || 20)

watch([page, pageSize, domainFilter], () => {
watch(domainFilter, () => { page.value = 1 })
  router.replace({ query: { ...route.query, page: String(page.value), size: String(pageSize.value), search: domainFilter.value || undefined } })
})
const domainKeys = computed(() => sortedDomainKeys.value)
const totalPages = computed(() => Math.max(1, Math.ceil(domainKeys.value.length / pageSize.value)))
const pagedDomainKeys = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return domainKeys.value.slice(start, start + pageSize.value)
})

// Expanded state persistence
const expandedDomains = ref<Record<string, boolean>>({})
try {
  expandedDomains.value = JSON.parse(localStorage.getItem('cf_dns_expanded') || '{}')
} catch { /* ignore */ }

function toggleDomain(domain: string) {
  const next = { ...expandedDomains.value, [domain]: !expandedDomains.value[domain] }
  expandedDomains.value = next
  localStorage.setItem('cf_dns_expanded', JSON.stringify(next))
}

function toggleSort(key: string) {
  if (key === 'domain') {
    if (domainSortKey.value === 'domain') {
      domainSortOrder.value = domainSortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      domainSortKey.value = 'domain'
      domainSortOrder.value = 'asc'
    }
  } else {
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortOrder.value = 'asc'
    }
  }
}


function exportCSV() {
  if (!sortedRecords.value.length) return
  const headers = Object.keys(sortedRecords.value[0]).filter(k => k !== '_id')
  const rows = sortedRecords.value.map(r => headers.map(h => {
    let v = r[h]
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) v = '"' + v.replace(/"/g, '""') + '"'
    return v
  }).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dns_records_' + new Date().toISOString().slice(0, 10) + '.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4" style="flex-shrink: 0;">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect
          v-model="selectedAccountId"
          :items="accountOptions"
          label="Account"
          density="compact"
          style="max-width: 180px"
          hide-details
          :loading="loading"
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
        <div class="d-flex align-center flex-wrap gap-4">
          <VChip size="small" color="primary" variant="tonal">Total: {{ dnsRecords.length }}</VChip>
          <VChip v-for="(count, type) in typeCounts" :key="type" size="small" :color="typeColors[type] || 'grey'" variant="tonal">{{ type }}: {{ count }}</VChip>
        </div>
        <VSpacer />
        <VBtn
          color="primary"
          variant="tonal"
          :loading="syncing"
          :disabled="!selectedAccountId || selectedAccountId === -1"
          prepend-icon="bx-refresh"
          @click="syncFromCF"
        >
          Sync
        </VBtn>
        <VBtn icon="bx-download" size="small" variant="text" :disabled="!selectedAccountId" title="Export CSV" @click="exportCSV" class="ms-1" />
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[10, 20, 50, 100, 500]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <VCard v-if="selectedAccountId" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loadingRecords" indeterminate color="primary" />
      <VTable v-if="sortedRecords.length" class="text-no-wrap sticky-table" hover density="compact" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
          <colgroup>
            <col style="width: 200px" />
            <col style="width: 100px" />
            <col style="width: 250px" />
            <col style="width: 350px" />
            <col style="width: 80px" />
            <col style="width: 80px" />
            <col style="width: 190px" />
          </colgroup>
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th style="width: 200px !important; max-width: 200px !important; overflow: hidden;">
                <span class="cursor-pointer d-inline-flex align-center gap-1" @click="toggleSort('domain')">
                  Domain <VIcon size="14" :icon="domainSortKey === 'domain' ? (domainSortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" />
                </span>
              </th>
              <th style="width: 100px; max-width: 100px; overflow: hidden;">
                <span class="cursor-pointer d-inline-flex align-center gap-1" @click="toggleSort('type')">
                  Type <VIcon size="14" :icon="sortKey === 'type' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" />
                </span>
              </th>
              <th style="width: 250px !important; max-width: 250px !important; overflow: hidden;">
                <span class="cursor-pointer d-inline-flex align-center gap-1" @click="toggleSort('name')">
                  Name <VIcon size="14" :icon="sortKey === 'name' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" />
                </span>
              </th>
              <th style="width: 350px !important; max-width: 350px !important; overflow: hidden;">
                <span class="cursor-pointer d-inline-flex align-center gap-1" @click="toggleSort('content')">
                  Content <VIcon size="14" :icon="sortKey === 'content' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" />
                </span>
              </th>
              <th style="width: 80px; text-align: center;">Proxied</th>
              <th style="width: 80px; text-align: center;">TTL</th>
              <th style="width: 190px;">Synced</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="domain in pagedDomainKeys" :key="domain">
              <tr class="cursor-pointer" @click="toggleDomain(domain)" style="background: rgb(var(--v-theme-on-surface), 0.04);">
                <td style="width: 200px !important; max-width: 200px !important; padding: 0 !important;">
                  <div class="d-flex align-center" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 12px 16px;">
                    <VIcon :icon="expandedDomains[domain] ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
                    <VIcon icon="bx-globe" size="18" class="me-2 text-medium-emphasis" />
                    <span class="font-weight-bold text-body-1">{{ domain }}</span>
                    <VChip size="x-small" variant="tonal" color="primary" class="ms-2">{{ groupedRecords[domain]?.length || 0 }}</VChip>
                  </div>
                </td>
                <td style="width: 100px; max-width: 100px;"></td>
                <td style="width: 250px !important; max-width: 250px !important;"></td>
                <td style="width: 350px !important; max-width: 350px !important;"></td>
                <td style="width: 80px;"></td>
                <td style="width: 80px; text-align: center;"></td>
                <td style="width: 190px;"></td>
              </tr>
              <template v-if="expandedDomains[domain]">
                <tr v-for="r in (groupedRecords[domain] || [])" :key="r.record_id">
                  <td style="width: 200px !important; max-width: 200px !important;"></td>
                  <td style="width: 100px !important; max-width: 100px !important;"><div style="width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><VChip size="x-small" :color="typeColors[r.type] || 'grey'" variant="tonal">{{ r.type }}</VChip></div></td>
                  <td style="width: 250px !important; max-width: 250px !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><code style="display: block; width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" class="text-caption">{{ r.name }}</code></td>
                  <td style="width: 350px !important; max-width: 350px !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><code class="text-caption">{{ r.content }}</code></td>
                  <td style="width: 80px; text-align: center;"><VChip size="x-small" :color="r.proxied ? 'success' : 'grey'" variant="tonal">{{ r.proxied ? 'Yes' : 'No' }}</VChip></td>
                  <td style="width: 80px; text-align: center;"><span class="text-caption">{{ r.ttl === 1 ? 'Auto' : r.ttl }}</span></td>
                  <td style="width: 190px;"><span class="text-caption">{{ r.synced_at ? new Date(r.synced_at).toLocaleString() : '-' }}</span></td>
                </tr>
              </template>
            </template>
          </tbody>
      </VTable>
      <VCardText v-else-if="!loadingRecords" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-dns" size="48" class="mb-2" />
        <p>{{ domainFilter ? 'No matching records' : 'No synced DNS records. Click Sync to fetch from Cloudflare.' }}</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-globe" size="48" class="mb-2" />
        <p>Select an account to manage DNS records</p>
      </VCardText>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
<style scoped>
.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.sortable:hover {
  color: rgb(var(--v-theme-primary));
}
.sticky-table {
  display: flex;
  flex-direction: column;
}
.sticky-table :deep(.v-table__wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.sticky-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
}
</style>
