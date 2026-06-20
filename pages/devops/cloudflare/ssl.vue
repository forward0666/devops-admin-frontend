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
const syncing = ref(false)
const syncingZone = ref<string | null>(null)
const saving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const accountOptions = computed(() => [
  { title: 'All', value: -1 },
  ...accounts.value.map((a: any) => ({ title: a.name, value: a.id })),
])

const zones = ref<any[]>([])
const loadingZones = ref(false)
const sslMap = ref<Record<string, any>>({})
const expandedZones = ref<Record<string, boolean>>({})
const search = ref('')

const sslModeColors: Record<string, string> = { off: 'error', flexible: 'warning', full: 'info', full_strict: 'success' }
const sslModeLabels: Record<string, string> = { off: 'Off', flexible: 'Flexible', full: 'Full', full_strict: 'Full (Strict)' }

watch(selectedAccountId, (val) => {
  if (process.client) {
    if (val !== null) localStorage.setItem("cf-account-id", String(val))
    else localStorage.removeItem("cf-account-id")
  }
  router.replace({ query: val ? { account: String(val) } : {} })
  sslMap.value = {}
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
    await fetchAllSsl()
  } catch (e: any) {
    console.error('Failed to fetch zones', e)
  } finally {
    loadingZones.value = false
  }
}

async function fetchAllSsl() {
  if (!selectedAccountId.value || selectedAccountId.value === -1) return
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/ssl`, { params: { account_id: selectedAccountId.value } })
    const map: Record<string, any> = {}
    ;(data.data || []).forEach((r: any) => { map[r.zone_id] = r })
    sslMap.value = map
  } catch (e: any) {
    console.error('Failed to fetch SSL settings', e)
  }
}

async function syncZone(zoneId: string) {
  if (!selectedAccountId.value) return
  syncingZone.value = zoneId
  try {
    const token = await getToken(selectedAccountId.value)
    await apiClient.post(`${CF_GATEWAY}/zones/${zoneId}/ssl/sync`, null, {
      params: { account_id: selectedAccountId.value, zone_id: zoneId },
      headers: { 'X-Cf-Token': token },
    })
    snackbar.value = { show: true, text: 'SSL synced', color: 'success' }
    // Re-fetch single zone
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones/${zoneId}/ssl`, {
      params: { account_id: selectedAccountId.value, zone_id: zoneId },
    })
    sslMap.value = { ...sslMap.value, [zoneId]: (data.data || [])[0] }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Sync failed', color: 'error' }
  } finally {
    syncingZone.value = null
  }
}

async function syncAll() {
  if (!selectedAccountId.value) return
  syncing.value = true
  try {
    const accountZones: Record<number, any[]> = {}
    for (const z of zones.value) {
      const aid = z.account_id
      if (!accountZones[aid]) accountZones[aid] = []
      accountZones[aid].push(z)
    }
    for (const [aid, zs] of Object.entries(accountZones)) {
      const token = await getToken(String(aid))
      for (const z of zs) {
      try {
        await apiClient.post(`${CF_GATEWAY}/zones/${z.zone_id}/ssl/sync`, null, {
          params: { account_id: aid, zone_id: z.zone_id },
          headers: { 'X-Cf-Token': token },
        })
      } catch (e) { /* skip failed zone */ }
    }
    snackbar.value = { show: true, text: `Synced ${zones.value.length} zones`, color: 'success' }
    await fetchAllSsl()
  } catch (e: any) {
    snackbar.value = { show: true, text: 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}

async function updateSsl(zoneId: string, mode: string) {
  if (!selectedAccountId.value) return
  saving.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    await apiClient.patch(`${CF_GATEWAY}/zones/${zoneId}/ssl`, { value: mode }, {
      params: { account_id: selectedAccountId.value, zone_id: zoneId },
      headers: { 'X-Cf-Token': token },
    })
    sslMap.value = { ...sslMap.value, [zoneId]: { ...sslMap.value[zoneId], ssl_mode: mode } }
    snackbar.value = { show: true, text: 'SSL mode updated', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed to update', color: 'error' }
  } finally {
    saving.value = false
  }
}

function toggleZone(zoneId: string) {
  expandedZones.value = { ...expandedZones.value, [zoneId]: !expandedZones.value[zoneId] }
}

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

const filteredZones = computed(() => {
  let list = zones.value
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(z => z.name?.toLowerCase().includes(s))
  }
  const order = sortOrder.value === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    let va: any, vb: any
    if (sortKey.value === 'name') {
      va = a.name; vb = b.name
    } else if (sortKey.value === 'ssl_mode') {
      va = sslMap.value[a.zone_id]?.ssl_mode || ''; vb = sslMap.value[b.zone_id]?.ssl_mode || ''
    } else {
      va = a.name; vb = b.name
    }
    if (va == null) return 1; if (vb == null) return -1
    return String(va).localeCompare(String(vb)) * order
  })
})

const modeCounts = computed(() => {
  const map: Record<string, number> = {}
  Object.values(sslMap.value).forEach((r: any) => {
    const m = r?.ssl_mode || 'unknown'
    map[m] = (map[m] || 0) + 1
  })
  return map
})

const page = ref(Number(route.query.page) || 1)
const pageSize = ref(Number(route.query.size) || 20)

watch([page, pageSize, search], () => {
watch(search, () => { page.value = 1 })
  router.replace({ query: { ...route.query, page: String(page.value), size: String(pageSize.value), search: search.value || undefined } })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredZones.value.length / pageSize.value)))
const pagedZones = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredZones.value.slice(start, start + pageSize.value)
})

onMounted(async () => {
  await fetchAccounts()
  if (!selectedAccountId.value && accounts.value.length > 0) selectedAccountId.value = -1
  if (selectedAccountId.value) fetchZones()
})

const SSL_MODES = ['off', 'flexible', 'full', 'full_strict']
const sslModeInfo: Record<string, string> = {
  off: 'No encryption',
  flexible: 'Visitor↔CF encrypted, CF↔Origin not',
  full: 'End-to-end, self-signed OK',
  full_strict: 'End-to-end, valid cert required',
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4" style="flex-shrink: 0;">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="selectedAccountId" :items="accountOptions" label="Account" density="compact" style="max-width: 180px" hide-details :loading="loading" />
        <VTextField v-model="search" prepend-inner-icon="bx-search" placeholder="Filter by domain..." density="compact" hide-details clearable style="max-width: 240px" />
        <div class="d-flex align-center flex-wrap gap-4">
          <VChip size="small" color="primary" variant="tonal">Zones: {{ zones.length }}</VChip>
          <VChip v-for="(count, mode) in modeCounts" :key="mode" size="small" :color="sslModeColors[mode] || 'grey'" variant="tonal">{{ sslModeLabels[mode] || mode }}: {{ count }}</VChip>
        </div>
        <VSpacer />
        <VBtn color="primary" variant="tonal" :loading="syncing" :disabled="!selectedAccountId" prepend-icon="bx-refresh" @click="syncAll">Sync</VBtn>
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
          <col style="width: 360px" />
          <col style="width: 140px" />
          <col style="width: 180px" />
          <col />
        </colgroup>
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th style="width: 360px !important; max-width: 360px !important;" class="sortable" @click="toggleSort('name')">
              Zone <VIcon size="14" :icon="sortKey === 'name' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" />
            </th>
            <th style="width: 140px; max-width: 140px;" class="sortable" @click="toggleSort('ssl_mode')">
              SSL Mode <VIcon size="14" :icon="sortKey === 'ssl_mode' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" />
            </th>
            <th style="width: 180px; max-width: 180px;">Modified</th>
            <th>Synced</th>
          </tr>
        </thead>
        <tbody>
            <template v-for="z in pagedZones" :key="z.zone_id">
              <tr style="background: rgb(var(--v-theme-on-surface), 0.04);">
                <td style="width: 360px !important; max-width: 360px !important; padding: 0 !important;">
                  <div class="d-flex align-center" style="width: 360px; max-width: 360px; overflow: hidden; padding: 10px 16px;">
                    <VIcon icon="bx-lock" size="18" class="me-2 text-medium-emphasis" />
                    <span class="font-weight-bold text-body-1">{{ z.name }}</span>
                    <VBtn size="x-small" variant="tonal" color="primary" :loading="syncingZone === z.zone_id" @click.stop="syncZone(z.zone_id)" prepend-icon="bx-refresh" class="ms-2">Sync</VBtn>
                  </div>
                </td>
                <td style="width: 140px; max-width: 140px;">
                  <VChip v-if="sslMap[z.zone_id]" size="x-small" :color="sslModeColors[sslMap[z.zone_id].ssl_mode] || 'grey'" variant="tonal">{{ sslModeLabels[sslMap[z.zone_id].ssl_mode] || sslMap[z.zone_id].ssl_mode }}</VChip>
                </td>
                <td style="width: 180px; max-width: 180px;" class="text-caption text-medium-emphasis">{{ sslMap[z.zone_id]?.modified_on ? new Date(sslMap[z.zone_id].modified_on + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
                <td class="text-caption text-medium-emphasis">{{ sslMap[z.zone_id]?.synced_at ? new Date(sslMap[z.zone_id].synced_at + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
              </tr>
          </template>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loadingZones" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-lock" size="48" class="mb-2" />
        <p>{{ search ? 'No matching zones' : 'No synced zones. Click Sync on Zones page first.' }}</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-lock" size="48" class="mb-2" />
        <p>Select an account to manage SSL/TLS</p>
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
