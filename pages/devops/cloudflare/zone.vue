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
const zones = ref<any[]>([])
const loadingZones = ref(false)
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const accountOptions = computed(() => accounts.value.map((a: any) => ({ title: a.name, value: a.id })))

watch(selectedAccountId, (val) => {
  if (process.client) {
    if (val !== null) localStorage.setItem("cf-account-id", String(val))
    else localStorage.removeItem("cf-account-id")
  }
  router.replace({ query: val ? { account: String(val) } : {} })
  if (val) fetchZones()
})

async function fetchZones() {
  if (!selectedAccountId.value) return
  loadingZones.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones`, { params: { account_id: selectedAccountId.value } })
    zones.value = data.data || []
  } catch (e: any) {
    console.error('Failed to fetch zones', e)
  } finally {
    loadingZones.value = false
  }
}

async function syncFromCF() {
  if (!selectedAccountId.value) return
  syncing.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const { data } = await apiClient.post(
      `${CF_GATEWAY}/zones/sync`,
      null,
      {
        params: { account_id: selectedAccountId.value },
        headers: { 'X-Cf-Token': token },
      },
    )
    snackbar.value = { show: true, text: `Synced ${data.data?.synced || 0} zones`, color: 'success' }
    await fetchZones()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}

onMounted(async () => {
  await fetchAccounts()
  if (!selectedAccountId.value && accounts.value.length > 0) {
    selectedAccountId.value = accounts.value[0].id
  }
  if (selectedAccountId.value) fetchZones()
})

const statusColors: Record<string, string> = { active: 'success', pending: 'warning', moved: 'info', deactivated: 'error' }

const planCounts = computed(() => {
  const map: Record<string, number> = {}
  zones.value.forEach(z => {
    const p = z.plan || 'unknown'
    map[p] = (map[p] || 0) + 1
  })
  return map
})

const planColors: Record<string, string> = { free: 'info', pro: 'primary', business: 'secondary', enterprise: 'warning' }

const sortKey = ref<string>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

const sortedZones = computed(() => {
  const sorted = [...zones.value]
  const key = sortKey.value
  const order = sortOrder.value === 'asc' ? 1 : -1
  sorted.sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * order
    return String(va).localeCompare(String(vb)) * order
  })
  return sorted
})

const page = ref(Number(route.query.page) || 1)
const pageSize = ref(Number(route.query.size) || 50)

watch([page, pageSize], () => {
  router.replace({ query: { ...route.query, page: String(page.value), size: String(pageSize.value) } })
})

const totalPages = computed(() => Math.ceil(sortedZones.value.length / pageSize.value))
const pagedZones = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedZones.value.slice(start, start + pageSize.value)
})

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}


function exportCSV() {
  if (!sortedZones.value.length) return
  const headers = Object.keys(sortedZones.value[0]).filter(k => k !== '_id')
  const rows = sortedZones.value.map(r => headers.map(h => {
    let v = r[h]
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) v = '"' + v.replace(/"/g, '""') + '"'
    return v
  }).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'zones_' + new Date().toISOString().slice(0, 10) + '.csv'
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
        <div class="d-flex align-center flex-wrap gap-4">
          <VChip size="small" color="primary" variant="tonal">Total: {{ zones.length }}</VChip>
          <VChip size="small" color="success" variant="tonal">Active: {{ zones.filter(z => z.status === 'active').length }}</VChip>
          <VChip v-for="(count, plan) in planCounts" :key="plan" size="small" :color="planColors[plan] || 'grey'" variant="tonal">{{ plan }}: {{ count }}</VChip>
        </div>
        <VSpacer />
        <VBtn
          color="primary"
          variant="tonal"
          :loading="syncing"
          :disabled="!selectedAccountId"
          prepend-icon="bx-refresh"
          @click="syncFromCF"
        >
          Sync
        </VBtn>
        <VBtn prepend-icon="bx-upload" variant="tonal" color="secondary" size="small" :disabled="!selectedAccountId" @click="exportCSV" class="ms-1">Export</VBtn>
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span  class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn  icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect  v-model="pageSize" :items="[20, 50, 100, 200, 500]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <VCard v-if="selectedAccountId" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loadingZones" indeterminate color="primary" />
      <VTable v-if="zones.length > 0" class="sticky-table" style="flex: 1; min-height: 0;">
        <thead>
          <tr>
            <th class="sortable" @click="toggleSort('name')">
              Domain <VIcon size="14" :icon="sortKey === 'name' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" />
            </th>
            <th style="width: 140px">Zone ID</th>
            <th class="sortable" style="width: 100px" @click="toggleSort('status')">
              Status <VIcon size="14" :icon="sortKey === 'status' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" />
            </th>
            <th class="sortable" style="width: 190px" @click="toggleSort('plan')">
              Plan <VIcon size="14" :icon="sortKey === 'plan' ? (sortOrder === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" />
            </th>
            <th style="width: 140px">Name Server</th>
            <th style="width: 250px">Synced</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="z in pagedZones" :key="z.zone_id">
            <td class="font-weight-medium">{{ z.name }}</td>
            <td><code class="text-caption text-medium-emphasis">{{ z.zone_id }}</code></td>
            <td>
              <VChip size="x-small" :color="statusColors[z.status] || 'grey'" variant="tonal">{{ z.status }}</VChip>
              <VChip v-if="z.paused" size="x-small" color="grey" variant="tonal" class="ms-1">Paused</VChip>
            </td>
            <td class="text-caption text-capitalize">{{ z.plan }}</td>
            <td>
              <div v-for="ns in (z.name_servers || []).slice(0, 2)" :key="ns" class="text-caption text-medium-emphasis">
                {{ ns }}
              </div>
            </td>
            <td class="text-caption text-medium-emphasis">{{ z.synced_at ? new Date(z.synced_at + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loadingZones" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-cloud-download" size="48" class="mb-2" />
        <p>No synced zones. Click Sync to fetch from Cloudflare.</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-globe" size="48" class="mb-2" />
        <p>Select an account to manage zones</p>
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
