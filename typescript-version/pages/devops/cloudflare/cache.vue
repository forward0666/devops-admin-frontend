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
const search = ref('')
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const accountOptions = computed(() => accounts.value.map((a: any) => ({ title: a.name, value: a.id })))

const zones = ref<any[]>([])
const loadingZones = ref(false)
const logsMap = ref<Record<string, any[]>>({})
const expandedZones = ref<Record<string, boolean>>({})

const purgeDialog = ref(false)
const purgeZoneId = ref<string | null>(null)
const purgeZoneName = ref('')
const purgeMode = ref<'all' | 'url' | 'tag' | 'host'>('all')
const purgeInput = ref('')
const purging = ref(false)

const typeColors: Record<string, string> = { 'Purge All': 'error', 'Purge URL': 'warning', 'Purge Tag': 'info', 'Purge Host': 'primary' }

watch(selectedAccountId, (val) => {
  router.replace({ query: val ? { account: String(val) } : {} })
  logsMap.value = {}
  expandedZones.value = {}
  if (val) fetchZones()
})

async function fetchZones() {
  if (!selectedAccountId.value) return
  loadingZones.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones`, { params: { account_id: selectedAccountId.value } })
    zones.value = data.data || []
    await fetchAllLogs()
  } catch (e: any) {
    console.error('Failed to fetch zones', e)
  } finally {
    loadingZones.value = false
  }
}

async function fetchAllLogs() {
  if (!selectedAccountId.value) return
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/cache`, { params: { account_id: selectedAccountId.value } })
    const map: Record<string, any[]> = {}
    ;(data.data || []).forEach((r: any) => {
      const zid = r.zone_id
      if (!map[zid]) map[zid] = []
      map[zid].push(r)
    })
    logsMap.value = map
  } catch (e: any) {
    console.error('Failed to fetch cache logs', e)
  }
}

async function fetchZoneLogs(zoneId: string) {
  if (!selectedAccountId.value) return
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones/${zoneId}/cache`, {
      params: { account_id: selectedAccountId.value, zone_id: zoneId },
    })
    logsMap.value = { ...logsMap.value, [zoneId]: data.data || [] }
  } catch (e: any) {
    console.error('Failed to fetch logs', e)
  }
}

function toggleZone(zoneId: string) {
  const next = !expandedZones.value[zoneId]
  expandedZones.value = { ...expandedZones.value, [zoneId]: next }
  if (next) fetchZoneLogs(zoneId)
}

function getZoneLogCount(zoneId: string): number {
  return (logsMap.value[zoneId] || []).length
}

function openPurge(zoneId: string, zoneName: string, mode: typeof purgeMode.value) {
  purgeZoneId.value = zoneId
  purgeZoneName.value = zoneName
  purgeMode.value = mode
  purgeInput.value = ''
  purgeDialog.value = true
}

async function executePurge() {
  if (!selectedAccountId.value || !purgeZoneId.value) return
  if (purgeMode.value !== 'all' && !purgeInput.value.trim()) {
    snackbar.value = { show: true, text: 'Please enter a value', color: 'error' }
    return
  }
  purging.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const zid = purgeZoneId.value
    const body: Record<string, any> = {}
    if (purgeMode.value === 'url') body.files = [purgeInput.value.trim()]
    else if (purgeMode.value === 'tag') body.tags = [purgeInput.value.trim()]
    else if (purgeMode.value === 'host') body.hosts = [purgeInput.value.trim()]

    const endpoints: Record<string, string> = {
      all: `${CF_GATEWAY}/zones/${zid}/cache/purge`,
      url: `${CF_GATEWAY}/zones/${zid}/cache/purge/urls`,
      tag: `${CF_GATEWAY}/zones/${zid}/cache/purge/tags`,
      host: `${CF_GATEWAY}/zones/${zid}/cache/purge/hosts`,
    }
    await apiClient.post(endpoints[purgeMode.value], body, {
      params: { account_id: selectedAccountId.value, zone_id: zid },
      headers: { 'X-Cf-Token': token },
    })
    snackbar.value = { show: true, text: 'Cache purged', color: 'success' }
    purgeDialog.value = false
    await fetchZoneLogs(zid)
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Purge failed', color: 'error' }
  } finally {
    purging.value = false
  }
}

const filteredZones = computed(() => {
  if (!search.value) return zones.value
  const s = search.value.toLowerCase()
  return zones.value.filter(z =>
    z.name?.toLowerCase().includes(s) ||
    (logsMap.value[z.zone_id] || []).some(l => (l.target || '').toLowerCase().includes(s))
  )
})

const totalLogs = computed(() => Object.values(logsMap.value).flat().length)

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

onMounted(async () => {
  await fetchAccounts()
  if (!selectedAccountId.value && accounts.value.length > 0) selectedAccountId.value = accounts.value[0].id
  if (selectedAccountId.value) fetchZones()
})

const purgeModes = [
  { value: 'all' as const, label: 'Purge All', icon: 'bx-trash', color: 'error' },
  { value: 'url' as const, label: 'Purge URL', icon: 'bx-link', color: 'warning' },
  { value: 'tag' as const, label: 'Purge Tag', icon: 'bx-purchase-tag', color: 'info' },
  { value: 'host' as const, label: 'Purge Host', icon: 'bx-server', color: 'primary' },
]
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="selectedAccountId" :items="accountOptions" label="Account" density="compact" style="max-width: 180px" hide-details :loading="loading" />
        <VTextField v-model="search" prepend-inner-icon="bx-search" placeholder="Filter by domain or target..." density="compact" hide-details clearable style="max-width: 260px" />
        <div class="d-flex align-center flex-wrap gap-4">
          <VChip size="small" color="primary" variant="tonal">Zones: {{ zones.length }}</VChip>
          <VChip size="small" color="info" variant="tonal">Logs: {{ totalLogs }}</VChip>
        </div>
        <VSpacer />
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[10, 20, 50, 100]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <VCard v-if="selectedAccountId">
      <VProgressLinear v-if="loadingZones" indeterminate color="primary" />
      <div v-if="zones.length > 0" style="max-height: calc(100vh - 220px); overflow-y: auto;">
        <VTable class="text-no-wrap" hover density="compact" style="table-layout: fixed; width: 100%;">
          <colgroup>
            <col style="width: 500px" />
            <col style="width: 120px" />
            <col />
            <col style="width: 180px" />
          </colgroup>
          <thead style="position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface));">
            <tr class="text-caption text-medium-emphasis">
              <th style="width: 500px !important; max-width: 500px !important;">Zone</th>
              <th style="width: 120px; max-width: 120px;">Type</th>
              <th>Target</th>
              <th style="width: 180px; max-width: 180px;">Time</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="z in pagedZones" :key="z.zone_id">
              <tr class="cursor-pointer" @click="toggleZone(z.zone_id)" style="background: rgb(var(--v-theme-on-surface), 0.04);">
                <td style="width: 500px !important; max-width: 500px !important; padding: 0 !important;">
                  <div class="d-flex align-center" style="width: 500px; max-width: 500px; overflow: hidden; padding: 10px 16px;">
                    <VIcon :icon="expandedZones[z.zone_id] ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
                    <VIcon icon="bx-bolt" size="18" class="me-2 text-medium-emphasis" />
                    <span class="font-weight-bold text-body-1">{{ z.name }}</span>
                    <VChip v-if="getZoneLogCount(z.zone_id) > 0" size="x-small" variant="tonal" color="primary" class="ms-2">{{ getZoneLogCount(z.zone_id) }}</VChip>
                    <VDivider vertical class="mx-2" />
                    <VBtn v-for="pm in purgeModes" :key="pm.value" size="x-small" variant="text" :color="pm.color" :icon="pm.icon" class="me-1" @click.stop="openPurge(z.zone_id, z.name, pm.value)" :title="pm.label" />
                  </div>
                </td>
                <td style="width: 120px; max-width: 120px;"></td>
                <td></td>
                <td style="width: 180px; max-width: 180px;"></td>
              </tr>
              <template v-if="expandedZones[z.zone_id]">
                <tr v-if="(logsMap[z.zone_id] || []).length === 0">
                  <td colspan="4" class="text-center py-4 text-medium-emphasis"><p class="mb-0">No purge history for this zone</p></td>
                </tr>
                <tr v-for="log in (logsMap[z.zone_id] || []).slice(0, 20)" :key="log._id">
                  <td style="width: 500px !important; max-width: 500px !important;"></td>
                  <td style="width: 120px; max-width: 120px;"><VChip size="x-small" :color="typeColors[log.type] || 'grey'" variant="tonal">{{ log.type }}</VChip></td>
                  <td style="white-space: normal; word-break: break-all;"><code class="text-caption">{{ log.target }}</code></td>
                  <td style="width: 180px; max-width: 180px;" class="text-caption text-medium-emphasis">{{ log.timestamp ? new Date(log.timestamp).toLocaleString() : '-' }}</td>
                </tr>
              </template>
            </template>
          </tbody>
        </VTable>
      </div>
      <VCardText v-else-if="!loadingZones" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-bolt" size="48" class="mb-2" />
        <p>{{ search ? 'No matching zones' : 'No synced zones. Click Sync on Zones page first.' }}</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-bolt" size="48" class="mb-2" />
        <p>Select an account to manage cache</p>
      </VCardText>
    </VCard>

    <!-- Purge Dialog -->
    <VDialog v-model="purgeDialog" max-width="450">
      <VCard>
        <VCardTitle>{{ purgeModes.find(m => m.value === purgeMode)?.label }} - {{ purgeZoneName }}</VCardTitle>
        <VCardText>
          <VAlert v-if="purgeMode === 'all'" type="error" variant="tonal" density="compact" class="mb-3">
            This will purge ALL cached files for this zone.
          </VAlert>
          <VTextField v-if="purgeMode === 'url'" v-model="purgeInput" label="URL" density="compact" placeholder="https://example.com/page.html" />
          <VTextField v-if="purgeMode === 'tag'" v-model="purgeInput" label="Cache Tag" density="compact" placeholder="e.g. product-123" />
          <VTextField v-if="purgeMode === 'host'" v-model="purgeInput" label="Hostname" density="compact" placeholder="e.g. cdn.example.com" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="purgeDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="purging" @click="executePurge">Purge</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
