<script setup lang="ts">
import apiClient, { domainGroupService, projectService, userConsoleDomainService } from '~/services/api'

definePageMeta({ layout: 'default' })

const loading = ref(false)
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Data
const groups = ref<any[]>([])
const projects = ref<any[]>([])
const groupMeta = ref<Record<string, { type: string; remark: string; groupId: string }>>({})
const groupZones = ref<any[]>([])

// Monitor rules (saved sync configs)
const rules = ref<any[]>([])
const dialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', groupId: '', projectId: '', env: 'prod', type: 'web', enabled: true })

const envOptions = ['prod', 'uat', 'test', 'dev']
const typeOptions = ['web', 'admin', 'callback', 'api']

// Stats
const totalRules = computed(() => rules.value.length)
const activeRules = computed(() => rules.value.filter(r => r.enabled))

async function fetchData() {
  loading.value = true
  try {
    const [g, meta, projRes] = await Promise.all([
      domainGroupService.listGroups(),
      domainGroupService.listMeta(),
      projectService.list(),
    ])
    groups.value = g || []
    const m: Record<string, { type: string; remark: string; groupId: string }> = {}
    for (const item of (meta || [])) {
      if (item.zoneId) m[item.zoneId] = { type: item.type || '', remark: item.remark || '', groupId: item.groupId || '' }
    }
    groupMeta.value = m
    projects.value = Array.isArray(projRes) ? projRes : projRes?.data || []
    // Fetch zones per account
    try {
      const { data: accData } = await apiClient.get('/cloudflare/accounts')
      const accounts = accData?.data || []
      const results = await Promise.all(
        accounts.map((a: any) =>
          apiClient.get('/cloudflare/zones', { params: { account_id: a.id } })
            .then((r: any) => (r.data?.data || []).map((z: any) => ({ ...z, accountName: a.name })))
            .catch(() => [])
        )
      )
      const all: any[] = []
      results.forEach((r: any) => all.push(...r))
      groupZones.value = all
    } catch { groupZones.value = [] }
  } catch (e: any) {
    console.error('Failed to fetch', e)
  } finally {
    loading.value = false
  }
}

// Local storage for rules (no backend endpoint yet)
function loadRules() {
  try {
    const saved = localStorage.getItem('monitor_rules')
    rules.value = saved ? JSON.parse(saved) : []
  } catch { rules.value = [] }
}

function saveRules() {
  localStorage.setItem('monitor_rules', JSON.stringify(rules.value))
}

onMounted(() => {
  fetchData()
  loadRules()
})

function getGroupDomains(groupId: string) {
  return groupZones.value.filter(z => groupMeta.value[z.zone_id]?.groupId === groupId).map(z => ({
    domain: z.name,
    env: 'prod',
    type: groupMeta.value[z.zone_id]?.type || 'web',
    remark: '',
    cdn: '',
  }))
}

function getGroupName(groupId: string) {
  return groups.value.find(g => g.id === groupId)?.name || groupId
}

function getProjectName(projectId: string) {
  return projects.value.find(p => String(p.id) === projectId)?.name || projectId
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', groupId: '', projectId: '', env: 'prod', type: 'web', enabled: true }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = { ...rule }
  dialog.value = true
}

function saveRule() {
  if (!form.value.name.trim() || !form.value.groupId || !form.value.projectId) return
  if (editingId.value) {
    const idx = rules.value.findIndex(r => r.id === editingId.value)
    if (idx >= 0) rules.value[idx] = { ...form.value, id: editingId.value }
  } else {
    rules.value.push({ ...form.value, id: Date.now(), lastRun: null, lastStatus: null })
  }
  saveRules()
  dialog.value = false
}

function deleteRule(rule: any) {
  if (!confirm(`Delete "${rule.name}"?`)) return
  rules.value = rules.value.filter(r => r.id !== rule.id)
  saveRules()
}

function toggleRule(rule: any) {
  rule.enabled = !rule.enabled
  saveRules()
}

async function runRule(rule: any) {
  const domains = getGroupDomains(rule.groupId)
  if (!domains.length) {
    snackbar.value = { show: true, text: 'No domains in this group', color: 'error' }
    return
  }
  // Apply env/type overrides
  const syncDomains = domains.map(d => ({
    ...d,
    env: rule.env || d.env,
    type: rule.type || d.type,
  }))
  syncing.value = true
  try {
    await userConsoleDomainService.importDomains({ projectId: rule.projectId, domains: syncDomains })
    rule.lastRun = new Date().toISOString()
    rule.lastStatus = 'success'
    saveRules()
    snackbar.value = { show: true, text: `Synced ${syncDomains.length} domains to ${getProjectName(rule.projectId)}`, color: 'success' }
  } catch (e: any) {
    rule.lastRun = new Date().toISOString()
    rule.lastStatus = 'failed'
    saveRules()
    snackbar.value = { show: true, text: e?.message || 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}

function formatTime(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Stats -->
    <div class="d-flex gap-4 mb-4 flex-wrap">
      <VCard class="pa-4" style="min-width: 140px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Total</div>
        <div class="text-h4 font-weight-bold">{{ totalRules }}</div>
      </VCard>
      <VCard class="pa-4" style="min-width: 140px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Active</div>
        <div class="text-h4 font-weight-bold text-success">{{ activeRules.length }}</div>
      </VCard>
    </div>

    <!-- Table -->
    <VCard style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
      <VCardText class="d-flex align-center gap-3 py-3">
        <VIcon icon="bx-radar" color="primary" />
        <span class="text-h6">Monitor Rule</span>
        <VSpacer />
        <VBtn color="primary" size="small" prepend-icon="bx-plus" @click="openCreate">Add Rule</VBtn>
      </VCardText>

      <div v-if="loading" class="text-center py-8"><VProgressCircular indeterminate color="primary" /></div>

      <VTable v-else class="text-no-wrap sticky-table" hover density="compact" style="flex: 1; min-height: 0; width: 100%;">
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th style="width: 50px;">#</th>
            <th>Name</th>
            <th>Source Group</th>
            <th>Target Project</th>
            <th style="width: 80px;">Env</th>
            <th style="width: 80px;">Type</th>
            <th style="width: 80px;">Enabled</th>
            <th style="width: 160px;">Last Run</th>
            <th style="width: 80px;">Status</th>
            <th style="width: 200px;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rules.length === 0">
            <td colspan="10" class="text-center text-medium-emphasis py-8">No rules. Click "Add Rule" to create one.</td>
          </tr>
          <tr v-for="(rule, idx) in rules" :key="rule.id">
            <td class="text-caption">{{ idx + 1 }}</td>
            <td><strong>{{ rule.name }}</strong></td>
            <td><VChip size="x-small" color="info" variant="tonal">{{ getGroupName(rule.groupId) }}</VChip></td>
            <td><VChip size="x-small" color="success" variant="tonal">{{ getProjectName(rule.projectId) }}</VChip></td>
            <td><VChip size="x-small" variant="tonal">{{ rule.env }}</VChip></td>
            <td><VChip size="x-small" variant="tonal">{{ rule.type }}</VChip></td>
            <td>
              <VSwitch :model-value="rule.enabled" density="compact" hide-details color="success" @update:model-value="toggleRule(rule)" />
            </td>
            <td class="text-caption">{{ formatTime(rule.lastRun) }}</td>
            <td>
              <VChip v-if="rule.lastStatus === 'success'" size="x-small" color="success" variant="tonal">OK</VChip>
              <VChip v-else-if="rule.lastStatus === 'failed'" size="x-small" color="error" variant="tonal">FAIL</VChip>
              <span v-else class="text-caption text-medium-emphasis">-</span>
            </td>
            <td>
              <VBtn size="x-small" color="primary" variant="tonal" :loading="syncing" :disabled="!rule.enabled" @click="runRule(rule)">Run</VBtn>
              <VBtn size="x-small" color="info" variant="tonal" class="ms-1" @click="openEdit(rule)">Edit</VBtn>
              <VBtn size="x-small" color="error" variant="tonal" class="ms-1" @click="deleteRule(rule)">Delete</VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialog" max-width="500">
      <VCard>
        <VCardItem><VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle></VCardItem>
        <VCardText>
          <VTextField v-model="form.name" label="Rule Name" density="compact" hide-details class="mb-3" />
          <VSelect v-model="form.groupId" :items="groups.map(g => ({ title: g.name, value: g.id }))" label="Source Group" density="compact" hide-details clearable class="mb-3" />
          <VSelect v-model="form.projectId" :items="projects.map(p => ({ title: p.name, value: String(p.id) }))" label="Target Project" density="compact" hide-details clearable class="mb-3" />
          <VSelect v-model="form.env" :items="envOptions" label="Environment" density="compact" hide-details class="mb-3" />
          <VSelect v-model="form.type" :items="typeOptions" label="Type" density="compact" hide-details />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!form.name.trim() || !form.groupId || !form.projectId" @click="saveRule">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>

<style scoped>
.sticky-table { display: flex; flex-direction: column; width: 100%; }
.sticky-table :deep(.v-table__wrapper) { flex: 1; min-height: 0; overflow-y: auto; }
.sticky-table :deep(thead) { position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface)); }
</style>
