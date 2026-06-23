<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient, { domainGroupService, projectService } from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const MONITOR_GATEWAY = '/cloudflare/sync_domain'

// Groups & Projects
const groups = ref<any[]>([])
const projects = ref<any[]>([])
const groupMeta = ref<Record<string, { type: string; remark: string; groupId: string }>>({})
const groupZones = ref<any[]>([])
const dnsRecords = ref<any[]>([])
const dnsLoading = ref(false)
const expandedDomains = ref<Record<string, boolean>>({})

const envOptions = ['prod', 'uat', 'test', 'dev']

// State
const rules = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editingId = ref<string | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })
const saving = ref(false)

// Form
const form = ref({
  name: '',
  groupId: '',
  projectId: '',
  env: 'prod',
  description: '',
  enabled: true,
})

// Computed
const groupZoneList = computed(() => {
  if (!form.value.groupId) return []
  return groupZones.value.filter(z => groupMeta.value[z.zone_id]?.groupId === form.value.groupId)
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

function dnsByZone(zoneName: string) {
  return dnsRecords.value.filter((r: any) => {
    const name = (r.name || '').toLowerCase()
    return name === zoneName.toLowerCase() || name.endsWith('.' + zoneName.toLowerCase())
  })
}

async function fetchDnsRecords(groupId: string) {
  const zones = groupZones.value.filter(z => groupMeta.value[z.zone_id]?.groupId === groupId)
  if (!zones.length) { dnsRecords.value = []; return }
  dnsLoading.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/dns`)
    const allRecords = data?.data || []
    const zoneNames = new Set(zones.map((z: any) => z.name))
    dnsRecords.value = allRecords.filter((r: any) => {
      const name = (r.name || '').toLowerCase()
      const rtype = (r.type || '').toUpperCase()
      if (rtype !== 'A' && rtype !== 'CNAME') return false
      for (const zn of zoneNames) {
        if (name === zn.toLowerCase() || name.endsWith('.' + zn.toLowerCase())) return true
      }
      return false
    })
  } catch { dnsRecords.value = [] }
  finally { dnsLoading.value = false }
}

watch(() => form.value.groupId, (gid) => {
  if (gid) fetchDnsRecords(gid)
  else dnsRecords.value = []
  expandedDomains.value = {}
})

// Fetch group/project data
async function fetchGroupData() {
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
    try {
      const { data: accData } = await apiClient.get(`${CF_GATEWAY}/accounts`)
      const accs = accData?.data || []
      const results = await Promise.all(
        accs.map((a: any) =>
          apiClient.get(`${CF_GATEWAY}/zones`, { params: { account_id: a.id } })
            .then((r: any) => (r.data?.data || []).map((z: any) => ({ ...z, accountName: a.name })))
            .catch(() => [])
        )
      )
      const all: any[] = []
      results.forEach((r: any) => all.push(...r))
      groupZones.value = all
    } catch { groupZones.value = [] }
  } catch (e: any) {
    console.error('Failed to fetch group data', e)
  }
}

// CRUD
async function fetchRules() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${MONITOR_GATEWAY}/rules`)
    rules.value = (data.data || []).map((r: any) => ({
      ...r,
      groupId: r.group_id ?? r.groupId ?? '',
      projectId: String(r.project_id ?? r.projectId ?? ''),
      env: r.env || 'prod',
      type: r.type || 'web',
      lastCheck: r.last_check ?? r.lastCheck,
    }))
  } catch (e: any) {
    console.error('Failed to fetch rules', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', groupId: '', projectId: '', env: 'prod', description: '', enabled: true }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = {
    name: rule.name,
    groupId: rule.groupId || '',
    projectId: rule.projectId || '',
    env: rule.env || 'prod',
    description: rule.description || '',
    enabled: !!rule.enabled,
  }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim()) {
    snackbar.value = { show: true, text: 'Name is required', color: 'error' }
    return
  }
  if (!form.value.groupId || !form.value.projectId) {
    snackbar.value = { show: true, text: 'Select group and project', color: 'error' }
    return
  }
  saving.value = true
  try {
    const body = {
      name: form.value.name,
      group_id: form.value.groupId,
      project_id: form.value.projectId,
      env: form.value.env,
      description: form.value.description,
      enabled: form.value.enabled,
    }
    if (editingId.value) {
      await apiClient.put(`${MONITOR_GATEWAY}/rules/${editingId.value}`, body)
      snackbar.value = { show: true, text: 'Rule updated', color: 'success' }
    } else {
      await apiClient.post(`${MONITOR_GATEWAY}/rules`, body)
      snackbar.value = { show: true, text: 'Rule created', color: 'success' }
    }
    dialog.value = false
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed to save', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete this rule?')) return
  try {
    await apiClient.delete(`${MONITOR_GATEWAY}/rules/${id}`)
    snackbar.value = { show: true, text: 'Rule deleted', color: 'success' }
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed to delete', color: 'error' }
  }
}

async function triggerCheck(id: string) {
  try {
    await apiClient.post(`${MONITOR_GATEWAY}/rules/${id}/check`)
    snackbar.value = { show: true, text: 'Check triggered', color: 'success' }
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed to trigger', color: 'error' }
  }
}

function formatTime(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
}

onMounted(async () => {
  await fetchGroupData()
  await fetchRules()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Sync Domain</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Sync domains from groups to projects</p>
        </div>
        <VBtn color="primary" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Rule
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Rules Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="rules.length > 0" class="sticky-table" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 200px" />
          <col style="width: 150px" />
          <col style="width: 150px" />
          <col style="width: 100px" />
          <col style="width: 180px" />
          <col style="width: 130px" />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Source Group</th>
            <th>Target Project</th>
            <th>Env</th>
            <th>Last Check</th>
            <th style="text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in rules" :key="rule.id">
            <td class="font-weight-medium">{{ rule.name }}</td>
            <td><VChip size="x-small" color="info" variant="tonal">{{ getGroupName(rule.groupId) }}</VChip></td>
            <td><VChip size="x-small" color="success" variant="tonal">{{ getProjectName(rule.projectId) }}</VChip></td>
            <td><VChip size="x-small" variant="tonal">{{ rule.env }}</VChip></td>
            <td>
              <div v-if="rule.lastCheck" class="text-caption">
                <div>{{ formatTime(rule.lastCheck) }}</div>
                <VChip size="x-small" :color="rule.status === 'ok' ? 'success' : rule.status === 'error' ? 'error' : 'grey'" variant="tonal" class="mt-1">{{ rule.status || '-' }}</VChip>
              </div>
              <span v-else class="text-caption text-medium-emphasis">Never</span>
            </td>
            <td style="text-align: center;">
              <VBtn icon size="x-small" variant="text" color="success" @click="triggerCheck(rule.id)" :loading="false">
                <VIcon icon="bx-play" size="16" />
              </VBtn>
              <VBtn icon size="x-small" variant="text" color="primary" @click="openEdit(rule)">
                <VIcon icon="bx-edit" size="16" />
              </VBtn>
              <VBtn icon size="x-small" variant="text" color="error" @click="handleDelete(rule.id)">
                <VIcon icon="bx-trash" size="16" />
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>

      <!-- Empty state -->
      <div v-if="!loading && rules.length === 0" class="text-center py-12">
        <VIcon icon="bx-folder-open" size="48" color="grey" class="mb-2" />
        <p class="text-body-1 text-medium-emphasis">No rules yet. Click "Add Rule" to create one.</p>
      </div>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialog" max-width="600">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle>
        <VCardText>
          <VTextField v-model="form.name" label="Rule Name" density="compact" class="mb-3" hint="e.g. Production Sync" persistent-hint />

          <VSelect v-model="form.groupId" :items="groups.map(g => ({ title: g.name, value: g.id }))" label="Source Group" density="compact" class="mb-3" clearable />

          <!-- Domain preview when group selected -->
          <div v-if="form.groupId && groupZoneList.length > 0" class="mb-3 pa-3 border rounded" style="max-height: 200px; overflow-y: auto;">
            <p class="text-caption text-medium-emphasis mb-2">{{ groupZoneList.length }} domains:</p>
            <div v-for="zone in groupZoneList" :key="zone.zone_id" class="mb-1">
              <div class="d-flex align-center gap-2 cursor-pointer" @click="expandedDomains[zone.name] = !expandedDomains[zone.name]">
                <VIcon :icon="expandedDomains[zone.name] ? 'bx-chevron-down' : 'bx-chevron-right'" size="12" />
                <code class="text-body-2">{{ zone.name }}</code>
                <VChip size="x-small" color="info" variant="tonal">{{ dnsByZone(zone.name).length }} DNS</VChip>
              </div>
              <div v-if="expandedDomains[zone.name]" class="ms-5 mt-1">
                <div v-if="dnsLoading" class="text-caption text-medium-emphasis">Loading...</div>
                <div v-else v-for="r in dnsByZone(zone.name)" :key="r.id || r.name" class="d-flex align-center gap-2" style="font-size: 11px;">
                  <VChip size="x-small" variant="tonal" color="secondary" style="min-width: 45px; justify-content: center;">{{ r.type }}</VChip>
                  <code>{{ r.name }}</code>
                </div>
              </div>
            </div>
          </div>

          <VSelect v-model="form.projectId" :items="projects.map(p => ({ title: p.name, value: String(p.id) }))" label="Target Project" density="compact" class="mb-3" clearable />

          <VSelect v-model="form.env" :items="envOptions" label="Environment" density="compact" class="mb-3" />

          <VTextarea v-model="form.description" label="Description" density="compact" rows="2" hide-details />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="save">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.sticky-table :deep(.v-table__wrapper) { overflow-y: auto; }
.sticky-table :deep(thead) { position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface)); }
</style>
