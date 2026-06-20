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
const search = ref(route.query.search as string || '')
const syncing = ref(false)
const syncingZone = ref<string | null>(null)
const syncingAll = ref(false)
const loadingRules = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const accountOptions = computed(() => [
  { title: 'All', value: -1 },
  ...accounts.value.map((a: any) => ({ title: a.name, value: a.id })),
])

const zones = ref<any[]>([])
const loadingZones = ref(false)
const rulesMap = ref<Record<string, any[]>>({})

const actionColors: Record<string, string> = { block: 'error', challenge: 'warning', js_challenge: 'warning', managed_challenge: 'info', skip: 'success' }

watch(selectedAccountId, (val) => {
  if (process.client) {
    if (val !== null) localStorage.setItem("cf-account-id", String(val))
    else localStorage.removeItem("cf-account-id")
  }
  router.replace({ query: val ? { account: String(val) } : {} })
  rulesMap.value = {}
  page.value = 1
  if (val) fetchZones()
})

async function fetchZones() {
  if (!selectedAccountId.value) return
  loadingZones.value = true
  try {
    await fetchAllRules()
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
  } catch (e: any) {
    console.error('Failed to fetch zones', e)
  } finally {
    loadingZones.value = false
  }
}

async function fetchAllRules() {
  if (!selectedAccountId.value) return
  try {
    const accountIds = selectedAccountId.value === -1 ? accounts.value.map((a: any) => a.id) : [selectedAccountId.value]
    const allRulesData: any[] = []
    for (const aid of accountIds) {
      try {
        const { data } = await apiClient.get(`${CF_GATEWAY}/ratelimit`, { params: { account_id: aid } })
        allRulesData.push(...(data.data || []))
      } catch { /* skip */ }
    }
    const map: Record<string, any[]> = {}
    allRulesData.forEach((r: any) => {
      const zid = r.zone_id
      if (!map[zid]) map[zid] = []
      map[zid].push(r)
    })
    Object.keys(map).forEach(zid => {
      map[zid].sort((a: any, b: any) => (a.priority ?? 99999) - (b.priority ?? 99999))
    })
    rulesMap.value = map
  } catch (e: any) {
    console.error('Failed to fetch rate limit rules', e)
  }
}

async function syncZone(zoneId: string) {
  const zone = zones.value.find((z: any) => z.zone_id === zoneId)
  if (!zone) return
  const aid = zone.account_id
  syncingZone.value = zoneId
  try {
    const token = await getToken(String(aid))
    const { data } = await apiClient.post(
      `${CF_GATEWAY}/zones/${zoneId}/ratelimit/sync`,
      null,
      {
        params: { account_id: aid, zone_id: zoneId },
        headers: { 'X-Cf-Token': token },
        timeout: 200000,
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
  if (!selectedAccountId.value) return
  syncingAll.value = true
  let totalSynced = 0
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
          const { data } = await apiClient.post(
            `${CF_GATEWAY}/zones/${z.zone_id}/ratelimit/sync`,
            null,
            {
              params: { account_id: aid, zone_id: z.zone_id },
              headers: { 'X-Cf-Token': token },
              timeout: 200000,
            },
          )
          totalSynced += data.data?.synced || 0
          await fetchRules(z.zone_id)
        } catch (e: any) {
          console.error(`Failed to sync zone ${z.name}`, e)
        }
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
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones/${zoneId}/ratelimit`, {
      params: { account_id: aid, zone_id: zoneId },
    })
    rulesMap.value = { ...rulesMap.value, [zoneId]: data.data || [] }
  } catch (e: any) {
    console.error('Failed to fetch rules for zone', zoneId, e)
  }
}

onMounted(async () => {
  await fetchAccounts()
  if (!selectedAccountId.value && accounts.value.length > 0) {
    selectedAccountId.value = -1
  }
  if (selectedAccountId.value) fetchZones()
})

const expandedZones = ref<Record<string, boolean>>({})

function toggleZone(zoneId: string) {
  const next = !expandedZones.value[zoneId]
  expandedZones.value = { ...expandedZones.value, [zoneId]: next }
  if (next && !rulesMap.value[zoneId]) {
    fetchRules(zoneId)
  }
}

const actionCounts = computed(() => {
  const map: Record<string, number> = {}
  Object.values(rulesMap.value).flat().forEach(r => {
    const a = r.action || 'unknown'
    map[a] = (map[a] || 0) + 1
  })
  return map
})

const totalRules = computed(() => Object.values(rulesMap.value).flat().length)

const filteredZones = computed(() => {
  let list = zones.value
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(z => z.name?.toLowerCase().includes(s))
  }
  return [...list].sort((a, b) => {
    const aRules = rulesMap.value[a.zone_id] || []
    const bRules = rulesMap.value[b.zone_id] || []
    const ap = aRules.length > 0 ? Math.min(...aRules.map((r: any) => r.priority ?? 99999)) : 99999
    const bp = bRules.length > 0 ? Math.min(...bRules.map((r: any) => r.priority ?? 99999)) : 99999
    return ap - bp
  })
})

const page = ref(Number(route.query.page) || 1)
const pageSize = ref(Number(route.query.size) || 20)

watch([page, pageSize, search], () => {
  router.replace({ query: { ...route.query, page: String(page.value), size: String(pageSize.value), search: search.value || undefined } })
})

watch(search, () => { page.value = 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(filteredZones.value.length / pageSize.value)))
const pagedZones = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredZones.value.slice(start, start + pageSize.value)
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
  a.download = 'ratelimit_rules_' + new Date().toISOString().slice(0, 10) + '.csv'
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
        <VBtn prepend-icon="bx-upload" variant="tonal" color="secondary" size="small" :disabled="!selectedAccountId" @click="exportCSV" class="ms-1">Export</VBtn>
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[10, 20, 50, 100]" density="compact" style="max-width: 95px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <VCard v-if="selectedAccountId" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loadingZones" indeterminate color="primary" />
      <VTable v-if="zones.length > 0" class="text-no-wrap sticky-table" hover density="compact" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
          <colgroup>
            <col style="width: 350px" />
            <col style="width: 120px" />
            <col style="width: 400px" />
            <col style="width: 200px" />
            <col style="width: 80px" />
            <col style="width: 95px" />
            <col />
          </colgroup>
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th style="width: 350px !important; max-width: 350px !important; overflow: hidden;">Zone</th>
              <th style="width: 120px !important; max-width: 120px !important; overflow: hidden;">Action</th>
              <th style="width: 400px !important; max-width: 400px !important; overflow: hidden;">Expression</th>
              <th style="width: 200px !important; max-width: 200px !important; text-align: left;">Rule ID</th>
              <th style="width: 80px !important; max-width: 80px !important;">Priority</th>
              <th style="width: 95px !important; max-width: 95px !important;">Status</th>
              <th>Synced</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="z in pagedZones" :key="z.zone_id">
              <tr class="cursor-pointer" @click="toggleZone(z.zone_id)" style="background: rgb(var(--v-theme-on-surface), 0.04);">
                <td colspan="7" style="padding: 0 !important;">
                  <div class="d-flex align-center" style="padding: 12px 16px;">
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
              </tr>
              <template v-if="expandedZones[z.zone_id]">
                <template v-if="(rulesMap[z.zone_id] || []).length > 0">
                <tr v-for="r in rulesMap[z.zone_id]" :key="r.rule_id">
                  <td style="width: 350px !important; max-width: 350px !important;">
                    <div style="max-width: 350px; white-space: normal; word-break: break-all; padding-left: 36px;" class="font-weight-medium">{{ r.description || r.rule_id }}</div>
                  </td>
                  <td style="width: 120px !important; max-width: 120px !important;"><div style="width: 95px; overflow: hidden;"><VChip size="x-small" :color="actionColors[r.action] || 'grey'" variant="tonal">{{ r.action }}</VChip></div></td>
                  <td style="width: 400px !important; max-width: 400px !important; text-align: left; padding: 8px 16px !important; overflow: hidden;"><code style="white-space: pre-wrap !important; word-break: break-all !important; line-height: 1.4; display: block; max-width: 450px; overflow: hidden;" class="text-caption">{{ r.expression }}</code></td>
                  <td style="width: 200px !important; max-width: 200px !important; text-align: left; padding: 8px 16px !important;"><code style="white-space: pre-wrap; word-break: break-all; line-height: 1.4;" class="text-caption">{{ r.rule_id }}</code></td>
                  <td style="width: 80px !important; max-width: 80px !important;" class="text-caption text-center">{{ r.priority ?? '-' }}</td>
                  <td style="width: 95px !important; max-width: 95px !important;"><VChip size="x-small" :color="r.paused ? 'grey' : 'success'" variant="tonal">{{ r.paused ? 'paused' : 'active' }}</VChip></td>
                  <td style="word-break: break-all; white-space: normal;" class="text-caption text-medium-emphasis">{{ r.synced_at ? new Date(r.synced_at + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
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
        <p>Select an account to manage rate limit rules</p>
      </VCardText>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
<style scoped>

.sticky-table {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.sticky-table table {
  table-layout: fixed !important;
}
.sticky-table :deep(.v-table__wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}
.sticky-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
}
.sticky-table :deep(tbody td) {
  overflow: hidden !important;
  max-width: 0 !important;
}
</style>
