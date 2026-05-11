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

// Pagination
const page = ref(Number(route.query.page) || 1)
const pageSize = ref(Number(route.query.size) || 20)

watch([page, pageSize, search], () => {
  router.replace({ query: { ...route.query, page: String(page.value), size: String(pageSize.value), search: search.value || undefined } })
})

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
  a.download = 'security_rules_' + new Date().toISOString().slice(0, 10) + '.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
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

    <VCard v-if="selectedAccountId" style="display: flex; flex-direction: column; max-height: calc(100vh - 140px);">
      <VProgressLinear v-if="loadingZones" indeterminate color="primary" />
      <div v-if="zones.length > 0" style="flex: 1; overflow-y: auto">
        <VTable class="text-no-wrap" hover density="compact" style="table-layout: fixed; width: 100%;">
          <colgroup>
            <col style="width: 310px" />
            <col style="width: 90px" />
            <col style="width: 450px" />
            <col style="width: 100px" />
            <col style="width: 80px" />
            <col />
          </colgroup>
          <thead style="position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface));">
            <tr class="text-caption text-medium-emphasis">
              <th style="width: 310px !important; max-width: 310px !important; overflow: hidden;">Zone</th>
              <th style="width: 90px; max-width: 90px; overflow: hidden;">Action</th>
              <th style="width: 450px !important; max-width: 450px !important; overflow: hidden;">Expression</th>
              <th style="width: 100px; max-width: 100px; overflow: hidden;">Priority</th>
              <th style="width: 80px; max-width: 80px; overflow: hidden;">Status</th>
              <th>Synced</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="z in pagedZones" :key="z.zone_id">
              <!-- Zone group header -->
              <tr style="background: rgb(var(--v-theme-on-surface), 0.04);">
                <td style="width: 310px !important; max-width: 310px !important; padding: 0 !important;">
                  <div class="d-flex align-center" style="width: 310px; max-width: 310px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 12px 16px;">
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
                <td style="width: 90px; max-width: 90px;"></td>
                <td style="width: 450px !important; max-width: 450px !important;"></td>
                <td style="width: 100px; max-width: 100px;"></td>
                <td style="width: 80px; max-width: 80px;"></td>
                <td></td>
              </tr>
              <!-- Rules rows -->
              <template v-if="(rulesMap[z.zone_id] || []).length > 0">
                <tr v-for="r in rulesMap[z.zone_id]" :key="r.rule_id">
                  <td style="width: 310px; max-width: 310px;">
                    <div style="max-width: 310px; white-space: normal; word-break: break-all; padding-left: 36px;" class="font-weight-medium">{{ r.description || r.rule_id }}</div>
                  </td>
                  <td style="width: 90px !important; max-width: 90px !important;"><div style="width: 90px; overflow: hidden;"><VChip size="x-small" :color="actionColors[r.action] || 'grey'" variant="tonal">{{ r.action }}</VChip></div></td>
                  <td style="width: 450px; max-width: 450px; text-align: left;"><code style="display: block; max-width: 450px; white-space: pre-wrap; word-break: break-all; line-height: 1.4;" class="text-caption">{{ r.expression }}</code></td>
                  <td style="width: 100px; max-width: 100px;" class="text-caption">{{ r.priority }}</td>
                  <td style="width: 80px; max-width: 80px;"><VChip size="x-small" :color="r.paused ? 'grey' : 'success'" variant="tonal">{{ r.paused ? 'paused' : 'active' }}</VChip></td>
                  <td class="text-caption text-medium-emphasis">{{ r.synced_at ? new Date(r.synced_at).toLocaleString() : '-' }}</td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="6" class="text-center py-4 text-medium-emphasis">
                  <p class="mb-0">No synced rules. Click Sync to fetch from Cloudflare.</p>
                </td>
              </tr>
            </template>
          </tbody>
        </VTable>
      </div>
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
</style>
