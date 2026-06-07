<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'
import { useCfAccount } from '~/composables/useCfAccount'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const { accounts, loading: loadingAccounts, fetchAccounts } = useCfAccount()

const route = useRoute()
const zones = ref<any[]>([])
const platform = ref<'cloudflare' | 'tencent'>('cloudflare')
const savedAccount = process.client ? localStorage.getItem('cf-account-id') : null
const selectedAccountId = ref<number | null>(savedAccount ? Number(savedAccount) : (route.query.account ? Number(route.query.account) : null))
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const platformOptions = [
  { title: 'Cloudflare', value: 'cloudflare' },
  { title: 'Tencent', value: 'tencent' },
]

const accountOptions = computed(() => {
  if (platform.value === 'cloudflare') {
    return [
      { title: 'All', value: -1 },
      ...accounts.value.map((a: any) => ({ title: a.name, value: a.id })),
    ]
  }
  return []
})

const domainOptions = computed(() =>
  zones.value.map((z: any) => ({ title: z.name, value: z.zone_id }))
)

const ruleTypes = [
  { title: 'Security Rules', value: 'security' },
  { title: 'Rate Limit Rules', value: 'ratelimit' },
  { title: 'Cache Rules', value: 'cache' },
  { title: 'DDoS Rules', value: 'ddos' },
  { title: 'Managed Rules', value: 'managed' },
  { title: 'DNS Records', value: 'dns' },
  { title: 'SSL Settings', value: 'ssl' },
]

const syncRules = ref<any[]>([])
const loadingRules = ref(false)

watch(selectedAccountId, (val) => {
  if (process.client) {
    if (val !== null) localStorage.setItem('cf-account-id', String(val))
    else localStorage.removeItem('cf-account-id')
  }
  navigateTo({ query: val ? { account: String(val) } : {} }, { replace: true })
})

watch(platform, () => {
  selectedAccountId.value = null
  zones.value = []
  syncRules.value = []
})

async function fetchZones() {
  if (!selectedAccountId.value) { zones.value = []; return }
  loading.value = true
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
  } catch (e) {
    console.error('Failed to fetch zones', e)
  } finally {
    loading.value = false
  }
}

async function fetchSyncRules() {
  if (!selectedAccountId.value) { syncRules.value = []; return }
  loadingRules.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/syncRules`, {
      params: { account_id: selectedAccountId.value },
    })
    syncRules.value = data?.data || []
  } catch (e) {
    console.error('Failed to fetch sync rules', e)
  } finally {
    loadingRules.value = false
  }
}

onMounted(async () => {
  await fetchAccounts()
  if (!selectedAccountId.value && accounts.value.length > 0) {
    selectedAccountId.value = -1
  }
  if (selectedAccountId.value) {
    await fetchZones()
    await fetchSyncRules()
  }
})

watch(selectedAccountId, async () => {
  await fetchZones()
  await fetchSyncRules()
})

// Create/Edit dialog
const dialog = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = ref({
  name: '',
  description: '',
  sourceZoneId: null as string | null,
  targetZoneIds: [] as string[],
  ruleTypes: ['security'] as string[],
})

function openCreate() {
  editingId.value = null
  form.value = { name: '', description: '', sourceZoneId: null, targetZoneIds: [], ruleTypes: ['security'] }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  const targetIds = typeof rule.target_zone_ids === 'string' ? JSON.parse(rule.target_zone_ids) : (rule.target_zone_ids || [])
  const types = typeof rule.rule_types === 'string' ? JSON.parse(rule.rule_types) : (rule.rule_types || [])
  form.value = {
    name: rule.name || '',
    description: rule.description || '',
    sourceZoneId: rule.source_zone_id || null,
    targetZoneIds: targetIds,
    ruleTypes: types,
  }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim() || !form.value.sourceZoneId || form.value.targetZoneIds.length === 0 || form.value.ruleTypes.length === 0) {
    snackbar.value = { show: true, text: 'Please fill all required fields', color: 'warning' }
    return
  }
  saving.value = true
  try {
    const payload: any = {
      account_id: selectedAccountId.value,
      name: form.value.name,
      description: form.value.description,
      sourceZoneId: form.value.sourceZoneId,
      targetZoneIds: form.value.targetZoneIds,
      ruleTypes: form.value.ruleTypes,
    }
    if (editingId.value) {
      await apiClient.put(`${CF_GATEWAY}/syncRules/${editingId.value}`, payload)
      snackbar.value = { show: true, text: 'Sync rule updated', color: 'success' }
    } else {
      await apiClient.post(`${CF_GATEWAY}/syncRules`, payload)
      snackbar.value = { show: true, text: 'Sync rule created', color: 'success' }
    }
    dialog.value = false
    await fetchSyncRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  } finally {
    saving.value = false
  }
}

const syncingId = ref<string | null>(null)
let syncPollTimer: ReturnType<typeof setInterval> | null = null

async function doSync(rule: any) {
  syncingId.value = rule.id
  // Start polling to refresh data every 5s while syncing
  if (syncPollTimer) clearInterval(syncPollTimer)
  syncPollTimer = setInterval(() => fetchSyncRules(), 5000)
  try {
    const { data } = await apiClient.post(`${CF_GATEWAY}/syncRules/${rule.id}/push`, null, { timeout: 200000 })
    snackbar.value = { show: true, text: data?.message || 'Sync completed', color: 'success' }
    await fetchSyncRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Sync failed', color: 'error' }
  } finally {
    syncingId.value = null
    if (syncPollTimer) { clearInterval(syncPollTimer); syncPollTimer = null }
  }
}

onUnmounted(() => {
  if (syncPollTimer) { clearInterval(syncPollTimer); syncPollTimer = null }
})

async function handleDelete(rule: any) {
  if (!confirm(`Delete "${rule.name}"?`)) return
  try {
    await apiClient.delete(`${CF_GATEWAY}/syncRules/${rule.id}`)
    snackbar.value = { show: true, text: 'Sync rule deleted', color: 'success' }
    await fetchSyncRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  }
}

function getZoneName(zoneId: string): string {
  return zones.value.find((z: any) => z.zone_id === zoneId)?.name || zoneId
}

const ruleTypeColors: Record<string, string> = { security: 'primary', ratelimit: 'warning', cache: 'success', ddos: 'error', managed: 'info', dns: 'secondary', ssl: 'grey' }

function getTargetIds(rule: any): string[] {
  return typeof rule.target_zone_ids === 'string' ? JSON.parse(rule.target_zone_ids) : (rule.target_zone_ids || [])
}

function getRuleTypes(rule: any): string[] {
  return typeof rule.rule_types === 'string' ? JSON.parse(rule.rule_types) : (rule.rule_types || [])
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="platform" :items="platformOptions" label="Platform" density="compact" style="max-width: 140px" hide-details />
        <VSelect v-model="selectedAccountId" :items="accountOptions" label="Account" density="compact" style="max-width: 200px" hide-details clearable :loading="loadingAccounts" />
        <VBtn color="primary" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Create
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Rules Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loadingRules" indeterminate color="primary" />
      <VTable v-if="syncRules.length > 0" class="sticky-table" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 220px" />
          <col style="width: 150px" />
          <col style="width: 200px" />
          <col style="width: 180px" />
          <col style="width: 160px" />
          <col style="width: 130px" />
        </colgroup>
        <thead>
          <tr>
            <th style="width: 220px">Name</th>
            <th style="width: 150px">Source</th>
            <th style="width: 200px">Targets</th>
            <th style="width: 180px">Rule Types</th>
            <th style="width: 160px">Last Synced</th>
            <th style="width: 130px; text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in syncRules" :key="r.id">
            <td class="font-weight-medium">{{ r.description || r.name }}</td>
            <td>
              <VChip size="x-small" variant="tonal" color="primary">{{ getZoneName(r.source_zone_id) }}</VChip>
            </td>
            <td>
              <VChip v-for="tid in getTargetIds(r)" :key="tid" size="x-small" variant="tonal" color="primary" class="me-1 mb-1">{{ getZoneName(tid) }}</VChip>
            </td>
            <td>
              <VChip v-for="rt in getRuleTypes(r)" :key="rt" size="x-small" :color="ruleTypeColors[rt] || 'grey'" variant="tonal" class="me-1 mb-1">{{ rt }}</VChip>
            </td>
            <td class="text-caption text-medium-emphasis">{{ r.last_synced_at ? new Date(r.last_synced_at + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : 'Never' }}</td>
            <td style="text-align: center;">
              <VBtn icon size="x-small" variant="text" color="warning" :loading="syncingId === r.id" @click="doSync(r)">
                <VIcon icon="bx-refresh" size="16" />
              </VBtn>
              <VBtn icon size="x-small" variant="text" color="primary" @click="openEdit(r)">
                <VIcon icon="bx-edit" size="16" />
              </VBtn>
              <VBtn icon size="x-small" variant="text" color="error" @click="handleDelete(r)">
                <VIcon icon="bx-trash" size="16" />
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loadingRules" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-transfer" size="48" class="mb-2" />
        <p>No sync rules yet. Click "Create" to add one.</p>
      </VCardText>
    </VCard>

    <!-- Create/Edit Dialog -->
    <VDialog v-model="dialog" max-width="600">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Sync Rule' : 'Create Sync Rule' }}</VCardTitle>
        <VCardText>
          <VTextField v-model="form.name" label="Rule Name" density="compact" class="mb-3" hint="e.g. Prod to Staging sync" persistent-hint />
          <VTextField v-model="form.description" label="Description" density="compact" class="mb-3" hide-details />
          <VAutocomplete
            v-model="form.sourceZoneId"
            :items="domainOptions"
            label="Source Domain"
            density="compact"
            class="mb-3"
            clearable
            placeholder="Search source domain"
          />
          <VAutocomplete
            v-model="form.targetZoneIds"
            :items="domainOptions.filter(o => o.value !== form.sourceZoneId)"
            label="Target Domains"
            density="compact"
            class="mb-3"
            multiple
            chips
            clearable
            placeholder="Search target domains"
          />
          <VSelect
            v-model="form.ruleTypes"
            :items="ruleTypes"
            label="Rule Types"
            density="compact"
            multiple
            chips
            hide-details
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!form.name.trim() || !form.sourceZoneId || form.targetZoneIds.length === 0 || form.ruleTypes.length === 0" @click="save">{{ editingId ? 'Save' : 'Create' }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

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
.sticky-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
}
</style>
