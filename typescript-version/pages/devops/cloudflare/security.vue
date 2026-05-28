<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'
import { useCfAccount } from '~/composables/useCfAccount'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const { accounts, loading, fetchAccounts, getToken } = useCfAccount()

const route = useRoute()
const router = useRouter()
const selectedAccountId = ref<number | null>(Number(route.query.account) || null)
const search = ref(route.query.search as string || '')
const syncing = ref(false)
const syncingZone = ref<string | null>(null)
const syncingAll = ref(false)
const loadingRules = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const accountOptions = computed(() => accounts.value.map((a: any) => ({ title: a.name, value: a.id })))

// All zones from MongoDB (synced via zone page)
const zones = ref<any[]>([])
const loadingZones = ref(false)

// Rules grouped by zone_id
const rulesMap = ref<Record<string, any[]>>({})

const actionColors: Record<string, string> = { block: 'error', allow: 'success', challenge: 'warning', skip: 'info' }

watch(selectedAccountId, (val) => {
  router.replace({ query: val ? { account: String(val) } : {} })
  rulesMap.value = {}
  page.value = 1
  if (val) fetchZones()
})

async function fetchZones() {
  if (!selectedAccountId.value) return
  loadingZones.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones`, { params: { account_id: selectedAccountId.value } })
    zones.value = data.data || []
    // Load all rules at once
    await fetchAllRules()
  } catch (e: any) {
    console.error('Failed to fetch zones', e)
  } finally {
    loadingZones.value = false
  }
}

async function fetchAllRules() {
  if (!selectedAccountId.value) return
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/security`, {
      params: { account_id: selectedAccountId.value },
    })
    const allRules = data.data || []
    const map: Record<string, any[]> = {}
    allRules.forEach((r: any) => {
      const zid = r.zone_id
      if (!map[zid]) map[zid] = []
      map[zid].push(r)
    })
    rulesMap.value = map
  } catch (e: any) {
    console.error('Failed to fetch all rules', e)
  }
}

async function syncZone(zoneId: string) {
  if (!selectedAccountId.value) return
  syncingZone.value = zoneId
  try {
    const token = await getToken(selectedAccountId.value)
    const { data } = await apiClient.post(
      `${CF_GATEWAY}/zones/${zoneId}/security/sync`,
      null,
      {
        params: { account_id: selectedAccountId.value, zone_id: zoneId },
        headers: { 'X-Cf-Token': token },
        timeout: 60000,
      },
    )
    snackbar.value = { show: true, text: `Synced ${data.data?.synced || 0} rules`, color: 'success' }
    await fetchRules(zoneId)
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Sync failed', color: 'error' }
  } finally {
    syncingZone.value = null
  }
}

async function syncAll() {
  if (!selectedAccountId.value || zones.value.length === 0) return
  syncingAll.value = true
  let totalSynced = 0
  try {
    const token = await getToken(selectedAccountId.value)
    for (const z of zones.value) {
      try {
        const { data } = await apiClient.post(
          `${CF_GATEWAY}/zones/${z.zone_id}/security/sync`,
          null,
          {
            params: { account_id: selectedAccountId.value, zone_id: z.zone_id },
            headers: { 'X-Cf-Token': token },
            timeout: 60000,
          },
        )
        totalSynced += data.data?.synced || 0
        await fetchRules(z.zone_id)
      } catch (e: any) {
        console.error(`Failed to sync zone ${z.name}`, e)
      }
    }
    snackbar.value = { show: true, text: `Synced ${totalSynced} rules across ${zones.value.length} zones`, color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: 'Sync failed', color: 'error' }
  } finally {
    syncingAll.value = false
  }
}

async function fetchRules(zoneId: string) {
  if (!selectedAccountId.value) return
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones/${zoneId}/security`, {
      params: { account_id: selectedAccountId.value, zone_id: zoneId },
    })
    rulesMap.value = { ...rulesMap.value, [zoneId]: data.data || [] }
  } catch (e: any) {
    console.error('Failed to fetch rules for zone', zoneId, e)
  }
}

onMounted(async () => {
  await fetchAccounts()
  if (!selectedAccountId.value && accounts.value.length > 0) {
    selectedAccountId.value = accounts.value[0].id
  }
  if (selectedAccountId.value) fetchZones()
})

// Expanded state
const expandedZones = ref<Record<string, boolean>>({})

function toggleZone(zoneId: string) {
  const next = !expandedZones.value[zoneId]
  expandedZones.value = { ...expandedZones.value, [zoneId]: next }
  if (next && !rulesMap.value[zoneId]) {
    fetchRules(zoneId)
  }
}

// Stats
const actionCounts = computed(() => {
  const map: Record<string, number> = {}
  Object.values(rulesMap.value).flat().forEach(r => {
    const a = r.action || 'unknown'
    map[a] = (map[a] || 0) + 1
  })
  return map
})

const totalRules = computed(() => Object.values(rulesMap.value).flat().length)

// Filtered zones by search
const filteredZones = computed(() => {
  if (!search.value) return zones.value
  const s = search.value.toLowerCase()
  return zones.value.filter(z =>
    z.name?.toLowerCase().includes(s) ||
    (rulesMap.value[z.zone_id] || []).some(r =>
      (r.description || '').toLowerCase().includes(s) ||
      (r.expression || '').toLowerCase().includes(s)
    )
  )
})

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
      va = (rulesMap.value[a.zone_id] || []).filter((r: any) => !r.paused).length
      vb = (rulesMap.value[b.zone_id] || []).filter((r: any) => !r.paused).length
    } else if (key === 'synced') {
      va = (rulesMap.value[a.zone_id] || [])[0]?.synced_at || ''
      vb = (rulesMap.value[b.zone_id] || [])[0]?.synced_at || ''
    } else { va = ''; vb = '' }
    if (typeof va === 'number') return (va - vb) * order
    return String(va).localeCompare(String(vb)) * order
  })
  return list
})

// Pagination
const page = ref(Number(route.query.page) || 1)
const pageSize = ref(Number(route.query.size) || 20)

watch([page, pageSize, search], () => {
  router.replace({ query: { ...route.query, page: String(page.value), size: String(page.value), search: search.value || undefined } })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedZones.value.length / pageSize.value)))
const pagedZones = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedZones.value.slice(start, start + pageSize.value)
})

function getZoneRuleCount(zoneId: string): number {
  return (rulesMap.value[zoneId] || []).length
}

function exportCSV() {
  const allRules = Object.entries(rulesMap.value).flatMap(([zoneId, rules]) =>
    rules.map(r => ({ zone: zoneId, ...r }))
  )
  if (!allRules.length) return
  const headers = Object.keys(allRules[0]).filter(k => k !== '_id')
  const rows = allRules.map(r => headers.map(h => {
    let v = r[h]
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) v = '"' + v.replace(/"/g, '""') + '"'
    return v
  }).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'security_rules_' + new Date().toISOString().slice(0, 10) + '.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
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
          v-model="search"
          prepend-inner-icon="bx-search"
          placeholder="Filter by domain or rule..."
          density="compact"
          hide-details
          clearable
          style="max-width: 260px"
        />
        <div class="d-flex align-center flex-wrap gap-4">
          <VChip size="small" color="primary" variant="tonal">Zones: {{ zones.length }}</VChip>
          <VChip size="small" color="info" variant="tonal">Rules: {{ totalRules }}</VChip>
          <VChip v-for="(count, action) in actionCounts" :key="action" size="small" :color="actionColors[action] || 'grey'" variant="tonal">{{ action }}: {{ count }}</VChip>
        </div>
        <VSpacer />
        <VBtn
          color="primary"
          variant="tonal"
          :loading="syncingAll"
          :disabled="!selectedAccountId"
          prepend-icon="bx-refresh"
          @click="syncAll"
        >
          Sync
        </VBtn>
        <VBtn icon="bx-download" size="small" variant="text" :disabled="!selectedAccountId" title="Export CSV" @click="exportCSV" class="ms-1" />
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[10, 20, 50, 100]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <VCard v-if="selectedAccountId" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loadingZones" indeterminate color="primary" />
      <VTable v-if="zones.length > 0" class="text-no-wrap sticky-table" hover density="compact" style="flex: 1; min-height: 0; width: 100%; table-layout: fixed;">
          <colgroup>
            <col style="width: 257px" />
            <col style="width: 120px" />
            <col style="width: 350px" />
            <col style="width: 300px" />
            <col style="width: 90px" />
            <col />
          </colgroup>
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th style="width: 257px !important; max-width: 257px !important; overflow: hidden;" class="sortable" @click="toggleSort('name')">Zone <VIcon size="14" :icon="sortKey === 'name' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></th>
              <th style="width: 120px !important; max-width: 120px !important; overflow: hidden;" class="sortable" @click="toggleSort('action')">Action <VIcon size="14" :icon="sortKey === 'action' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></th>
              <th style="width: 350px !important; max-width: 350px !important; overflow: hidden;" class="sortable" @click="toggleSort('expression')">Expression <VIcon size="14" :icon="sortKey === 'expression' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></th>
              <th style="width: 300px !important; max-width: 300px !important; text-align: left;">Rule ID</th>
              <th style="width: 90px !important; max-width: 90px !important;" class="sortable" @click="toggleSort('status')">Status <VIcon size="14" :icon="sortKey === 'status' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></th>
              <th>Synced</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="z in pagedZones" :key="z.zone_id">
              <!-- Zone group header -->
              <tr class="cursor-pointer" @click="toggleZone(z.zone_id)" style="background: rgb(var(--v-theme-on-surface), 0.04);">
                <td style="width: 257px !important; max-width: 257px !important; padding: 0 !important;">
                  <div class="d-flex align-center" style="width: 257px; max-width: 257px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 12px 16px;">
                    <VIcon :icon="expandedZones[z.zone_id] ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
                    <VIcon icon="bx-shield-quarter" size="18" class="me-2 text-medium-emphasis" />
                    <span class="font-weight-bold text-body-1">{{ z.name }}</span>
                    <VChip v-if="getZoneRuleCount(z.zone_id) > 0" size="x-small" variant="tonal" color="primary" class="ms-2">{{ getZoneRuleCount(z.zone_id) }}</VChip>
                    <VBtn
                      size="x-small"
                      variant="tonal"
                      color="primary"
                      :loading="syncingZone === z.zone_id"
                      @click.stop="syncZone(z.zone_id)"
                      prepend-icon="bx-refresh"
                      class="ms-2"
                    >
                      Sync
                    </VBtn>
                  </div>
                </td>
                <td style="width: 120px !important; max-width: 120px !important;"></td>
                <td style="width: 350px !important; max-width: 350px !important;"></td>
                <td style="width: 300px !important; max-width: 300px !important;"></td>
                <td style="width: 90px !important; max-width: 90px !important;"></td>
                <td></td>
              </tr>
              <!-- Rules rows -->
              <template v-if="expandedZones[z.zone_id]">
                <template v-if="(rulesMap[z.zone_id] || []).length > 0">
                <tr v-for="r in rulesMap[z.zone_id]" :key="r.rule_id">
                  <td style="width: 257px !important; max-width: 257px !important;">
                    <div style="max-width: 257px; white-space: normal; word-break: break-all; padding-left: 36px;" class="font-weight-medium">{{ r.description || r.rule_id }}</div>
                  </td>
                  <td style="width: 120px !important; max-width: 120px !important;"><div style="width: 90px; overflow: hidden;"><VChip size="x-small" :color="actionColors[r.action] || 'grey'" variant="tonal">{{ r.action }}</VChip></div></td>
                  <td style="width: 350px !important; max-width: 350px !important; text-align: left; padding: 8px 16px !important;"><code style="white-space: pre-wrap; word-break: break-all; line-height: 1.4;" class="text-caption">{{ r.expression }}</code></td>
                  <td style="width: 300px !important; max-width: 300px !important; text-align: left; padding: 8px 16px !important;"><code style="white-space: pre-wrap; word-break: break-all; line-height: 1.4;" class="text-caption">{{ r.rule_id }}</code></td>

                  <td style="width: 90px !important; max-width: 90px !important;"><VChip size="x-small" :color="r.paused ? 'grey' : 'success'" variant="tonal">{{ r.paused ? 'paused' : 'active' }}</VChip></td>
                  <td class="text-caption text-medium-emphasis">{{ r.synced_at ? new Date(r.synced_at).toLocaleString() : '-' }}</td>
                </tr>
              </template>
              </template>
              <template v-if="expandedZones[z.zone_id] && (rulesMap[z.zone_id] || []).length === 0">
                <tr>
                  <td colspan="7" class="text-center py-4 text-medium-emphasis">
                    <p class="mb-0">No synced rules. Click Sync to fetch from Cloudflare.</p>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
      </VTable>
      <VCardText v-else-if="!loadingZones" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-shield-quarter" size="48" class="mb-2" />
        <p>{{ search ? 'No matching zones' : 'No synced zones. Click Sync on Zones page first.' }}</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-shield-quarter" size="48" class="mb-2" />
        <p>Select an account to manage security rules</p>
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
  width: 100%;
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
