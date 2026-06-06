<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'
import { useCfAccount } from '~/composables/useCfAccount'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const { accounts, loading, fetchAccounts, getToken } = useCfAccount()

const route = useRoute()
const router = useRouter()
const savedAccount = process.client ? localStorage.getItem("cf-account-id") : null
const selectedAccountId = ref<number | null>(savedAccount ? Number(savedAccount) : (route.query.account ? Number(route.query.account) : null))
const search = ref('')
const syncingAll = ref(false)
const syncingZone = ref<string | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

const accountOptions = computed(() => [
  { title: 'All', value: -1 },
  ...accounts.value.map((a: any) => ({ title: a.name, value: a.id })),
])

const zones = ref<any[]>([])
const loadingZones = ref(false)
const rulesMap = ref<Record<string, any[]>>({})
const expandedZones = ref<Record<string, boolean>>({})

const actionColors: Record<string, string> = {
  cache: 'primary',
  bypass_cache: 'warning',
  eligible: 'success',
  set_cache_settings: 'info',
  bypass_cache_by_device_type: 'secondary',
}

watch(selectedAccountId, (val) => {
  if (process.client) {
    if (val !== null) localStorage.setItem("cf-account-id", String(val))
    else localStorage.removeItem("cf-account-id")
  }
  router.replace({ query: val ? { account: String(val) } : {} })
  rulesMap.value = {}
  expandedZones.value = {}
  if (val) fetchZones()
})

async function fetchZones() {
  if (!selectedAccountId.value) return
  loadingZones.value = true
  try {
    if (selectedAccountId.value === -1) {
      const results = await Promise.all(
        accounts.value.map((a: any) =>
          apiClient.get(`${CF_GATEWAY}/zones`, { params: { account_id: a.id } }).then(r => r.data?.data || []).catch(() => [])
        )
      )
      const allZones: any[] = []
      results.forEach(z => allZones.push(...(z || [])))
      zones.value = allZones
    } else {
      const { data } = await apiClient.get(`${CF_GATEWAY}/zones`, { params: { account_id: selectedAccountId.value } })
      zones.value = data.data || []
    }
    await fetchAllRules()
  } catch (e: any) {
    console.error('Failed to fetch zones', e)
  } finally {
    loadingZones.value = false
  }
}

async function fetchAllRules() {
  if (!selectedAccountId.value || selectedAccountId.value === -1) return
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/cache`, { params: { account_id: selectedAccountId.value } })
    const map: Record<string, any[]> = {}
    ;(data.data || []).forEach((r: any) => {
      const zid = r.zone_id
      if (!map[zid]) map[zid] = []
      map[zid].push(r)
    })
    rulesMap.value = map
  } catch (e: any) {
    console.error('Failed to fetch cache rules', e)
  }
}

async function fetchRules(zoneId: string) {
  if (!selectedAccountId.value) return
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones/${zoneId}/cache/rules`, {
      params: { account_id: selectedAccountId.value, zone_id: zoneId },
    })
    rulesMap.value = { ...rulesMap.value, [zoneId]: data.data || [] }
  } catch (e: any) {
    console.error('Failed to fetch rules', e)
  }
}

async function syncZone(zoneId: string) {
  if (!selectedAccountId.value) return
  syncingZone.value = zoneId
  try {
    const token = await getToken(selectedAccountId.value)
    const { data } = await apiClient.post(
      `${CF_GATEWAY}/zones/${zoneId}/cache/sync`,
      {},
      { params: { account_id: selectedAccountId.value, zone_id: zoneId }, headers: { 'X-Cf-Token': token } },
    )
    snackbar.value = { show: true, text: `Synced ${data.data?.synced || 0} cache rules`, color: 'success' }
    await fetchRules(zoneId)
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Sync failed', color: 'error' }
  } finally {
    syncingZone.value = null
  }
}

async function syncAll() {
  if (!selectedAccountId.value) return
  syncingAll.value = true
  let totalSynced = 0
  try {
    const token = await getToken(selectedAccountId.value)
    for (const z of zones.value) {
      try {
        const { data } = await apiClient.post(
          `${CF_GATEWAY}/zones/${z.zone_id}/cache/sync`,
          {},
          { params: { account_id: selectedAccountId.value, zone_id: z.zone_id }, headers: { 'X-Cf-Token': token } },
        )
        totalSynced += data.data?.synced || 0
      } catch (e: any) {
        console.error(`Failed to sync zone ${z.name}`, e)
      }
    }
    snackbar.value = { show: true, text: `Synced ${totalSynced} cache rules`, color: 'success' }
    await fetchAllRules()
  } finally {
    syncingAll.value = false
  }
}

function toggleZone(zoneId: string) {
  const next = !expandedZones.value[zoneId]
  expandedZones.value = { ...expandedZones.value, [zoneId]: next }
  if (next) fetchRules(zoneId)
}

function getZoneRuleCount(zoneId: string): number {
  return (rulesMap.value[zoneId] || []).length
}

const filteredZones = computed(() => {
  if (!search.value) return zones.value
  const s = search.value.toLowerCase()
  return zones.value.filter(z =>
    z.name?.toLowerCase().includes(s) ||
    (rulesMap.value[z.zone_id] || []).some(r => (r.description || '').toLowerCase().includes(s) || (r.expression || '').toLowerCase().includes(s))
  )
})

const totalRules = computed(() => Object.values(rulesMap.value).flat().length)

// Sorting
const sortKey = ref<string>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortedZones = computed(() => {
  const list = [...filteredZones.value]
  const order = sortOrder.value === 'asc' ? 1 : -1
  const key = sortKey.value
  list.sort((a, b) => {
    let va: any, vb: any
    if (key === 'name') { va = a.name || ''; vb = b.name || '' }
    else if (key === 'action') {
      va = (rulesMap.value[a.zone_id] || []).map((r: any) => r.action || '').join(',')
      vb = (rulesMap.value[b.zone_id] || []).map((r: any) => r.action || '').join(',')
    } else if (key === 'expression') {
      va = (rulesMap.value[a.zone_id] || []).map((r: any) => r.expression || '').join(',')
      vb = (rulesMap.value[b.zone_id] || []).map((r: any) => r.expression || '').join(',')
    } else if (key === 'status') {
      va = (rulesMap.value[a.zone_id] || []).filter((r: any) => r.status === 'active').length
      vb = (rulesMap.value[b.zone_id] || []).filter((r: any) => r.status === 'active').length
    } else if (key === 'synced') {
      va = (rulesMap.value[a.zone_id] || [])[0]?.synced_at || ''
      vb = (rulesMap.value[b.zone_id] || [])[0]?.synced_at || ''
    } else { va = ''; vb = '' }
    if (typeof va === 'number') return (va - vb) * order
    return String(va).localeCompare(String(vb)) * order
  })
  return list
})

const page = ref(Number(route.query.page) || 1)
const pageSize = ref(Number(route.query.size) || 20)

watch([page, pageSize, search], () => {
watch(search, () => { page.value = 1 })
  router.replace({ query: { ...route.query, page: String(page.value), size: String(pageSize.value), search: search.value || undefined } })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedZones.value.length / pageSize.value)))
const pagedZones = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedZones.value.slice(start, start + pageSize.value)
})

onMounted(async () => {
  await fetchAccounts()
  if (!selectedAccountId.value && accounts.value.length > 0) selectedAccountId.value = -1
  if (selectedAccountId.value) fetchZones()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="selectedAccountId" :items="accountOptions" label="Account" density="compact" style="max-width: 180px" hide-details :loading="loading" />
        <VTextField v-model="search" prepend-inner-icon="bx-search" placeholder="Filter by domain or rule..." density="compact" hide-details clearable style="max-width: 260px" />
        <div class="d-flex align-center flex-wrap gap-4">
          <VChip size="small" color="primary" variant="tonal">Zones: {{ zones.length }}</VChip>
          <VChip size="small" color="info" variant="tonal">Rules: {{ totalRules }}</VChip>
        </div>
        <VSpacer />
        <VBtn color="primary" variant="tonal" :loading="syncingAll" :disabled="!selectedAccountId || selectedAccountId === -1" prepend-icon="bx-refresh" @click="syncAll">Sync</VBtn>
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[10, 20, 50, 100]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <VCard v-if="selectedAccountId" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loadingZones" indeterminate color="primary" />
      <VTable v-if="zones.length > 0" class="text-no-wrap sticky-table" hover density="compact" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
          <colgroup>
            <col style="width: 290px" />
            <col style="width: 120px" />
            <col />
            <col style="width: 90px" />
            <col style="width: 180px" />
          </colgroup>
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th style="width: 290px !important; max-width: 290px !important;" class="sortable" @click="toggleSort('name')">Zone <VIcon size="14" :icon="sortKey === 'name' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></th>
              <th style="width: 120px; max-width: 120px;" class="sortable" @click="toggleSort('action')">Action <VIcon size="14" :icon="sortKey === 'action' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></th>
              <th class="sortable" @click="toggleSort('expression')">Expression <VIcon size="14" :icon="sortKey === 'expression' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></th>
              <th style="width: 90px; max-width: 90px;" class="sortable" @click="toggleSort('status')">Status <VIcon size="14" :icon="sortKey === 'status' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></th>
              <th style="width: 180px; max-width: 180px;">Synced</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="z in pagedZones" :key="z.zone_id">
              <tr class="cursor-pointer" @click="toggleZone(z.zone_id)" style="background: rgb(var(--v-theme-on-surface), 0.04);">
                <td colspan="5" style="padding: 0 !important;">
                  <div class="d-flex align-center" style="padding: 10px 16px;">
                    <VIcon :icon="expandedZones[z.zone_id] ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
                    <VIcon icon="bx-bolt" size="18" class="me-2 text-medium-emphasis" />
                    <span class="font-weight-bold text-body-1">{{ z.name }}</span>
                    <VChip v-if="getZoneRuleCount(z.zone_id) > 0" size="x-small" variant="tonal" color="primary" class="ms-2">{{ getZoneRuleCount(z.zone_id) }}</VChip>
                    <VBtn size="x-small" variant="tonal" color="primary" :loading="syncingZone === z.zone_id" @click.stop="syncZone(z.zone_id)" prepend-icon="bx-refresh" class="ms-2">Sync</VBtn>
                  </div>
                </td>
              </tr>
              <template v-if="expandedZones[z.zone_id]">
                <template v-if="(rulesMap[z.zone_id] || []).length > 0">
                  <tr v-for="r in rulesMap[z.zone_id]" :key="r.rule_id">
                    <td style="width: 290px; max-width: 290px;">
                      <div style="max-width: 290px; white-space: normal; word-break: break-all; padding-left: 36px;" class="font-weight-medium">{{ r.description || r.rule_id }}</div>
                    </td>
                    <td style="width: 120px; max-width: 120px;"><VChip size="x-small" :color="actionColors[r.action] || 'grey'" variant="tonal">{{ r.action }}</VChip></td>
                    <td style="white-space: normal; word-break: break-all;"><code class="text-caption">{{ r.expression }}</code></td>
                    <td style="width: 90px; max-width: 90px;"><VChip size="x-small" :color="r.status === 'active' ? 'success' : 'grey'" variant="tonal">{{ r.status }}</VChip></td>
                    <td style="width: 180px; max-width: 180px;" class="text-caption text-medium-emphasis">{{ r.synced_at ? new Date(r.synced_at + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
                  </tr>
                </template>
                <tr v-if="(rulesMap[z.zone_id] || []).length === 0">
                  <td colspan="5" class="text-center py-4 text-medium-emphasis"><p class="mb-0">No cache rules. Click Sync to fetch from Cloudflare.</p></td>
                </tr>
              </template>
            </template>
          </tbody>
      </VTable>
      <VCardText v-else-if="!loadingZones" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-bolt" size="48" class="mb-2" />
        <p>{{ search ? 'No matching zones' : 'No synced zones. Click Sync on Zones page first.' }}</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-bolt" size="48" class="mb-2" />
        <p>Select an account to manage cache rules</p>
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
