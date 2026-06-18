<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient, { userConsoleProjectService as projectService, userConsoleDomainService as domainService } from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'

const route = useRoute()
const projects = ref<any[]>([])
const domains = ref<any[]>([])
const rules = ref<any[]>([])
const savedProject = process.client ? localStorage.getItem('cf-project-id') : null
const savedEnv = process.client ? localStorage.getItem('cf-env') : null
const selectedProject = ref<number | null>(savedProject ? Number(savedProject) : (route.query.project ? Number(route.query.project) : null))
const selectedEnv = ref<string | null>(savedEnv || (route.query.env as string) || null)
const loading = ref(false)

// Persist filters
watch([selectedProject, selectedEnv], ([p, e]) => {
  if (process.client) {
    if (p !== null) localStorage.setItem('cf-project-id', String(p))
    else localStorage.removeItem('cf-project-id')
    if (e) localStorage.setItem('cf-env', e)
    else localStorage.removeItem('cf-env')
  }
  const query: Record<string, string> = {}
  if (p !== null) query.project = String(p)
  if (e !== null) query.env = e
  navigateTo({ query }, { replace: true })
})

const projectOptions = computed(() => [
  { title: 'All', value: -1 },
  ...projects.value.map(p => ({ title: p.name, value: p.id })),
])
const envOptions = computed(() => {
  const envs = [...new Set(domains.value.map(d => d.env).filter(Boolean))]
  return envs.map(e => ({ title: e.toUpperCase(), value: e }))
})

function getEntries(rule: any): { zone: string; zoneId: string; ruleId: string }[] {
  if (Array.isArray(rule.entries) && rule.entries.length > 0) return rule.entries
  const zones = Array.isArray(rule.zones) ? rule.zones : (rule.zone ? [rule.zone] : [])
  const ruleIds = Array.isArray(rule.ruleIds) ? rule.ruleIds : (rule.ruleId ? [rule.ruleId] : [])
  const zoneIds = Array.isArray(rule.zoneIds) ? rule.zoneIds : (rule.zoneId ? [rule.zoneId] : [])
  const maxLen = Math.max(zones.length, ruleIds.length, zoneIds.length, 1)
  const result: { zone: string; zoneId: string; ruleId: string }[] = []
  for (let i = 0; i < maxLen; i++) {
    result.push({ zone: zones[i] || '', zoneId: zoneIds[i] || '', ruleId: ruleIds[i] || '' })
  }
  return result
}

const viewedRules = ref<Set<string>>(new Set())
function toggleView(ruleId: string) {
  const s = new Set(viewedRules.value)
  if (s.has(ruleId)) s.delete(ruleId)
  else s.add(ruleId)
  viewedRules.value = s
}

// --- Fetch ---
async function fetchData() {
  loading.value = true
  try {
    const projectData = await projectService.list()
    projects.value = projectData || []

    if (selectedProject.value === -1) {
      // All projects: fetch domains and rules from each
      const [domainResults, ruleResults] = await Promise.all([
        Promise.all(projects.value.map((p: any) => domainService.list(String(p.id)).catch(() => []))),
        Promise.all(projects.value.map((p: any) => {
          const params: any = { projectId: p.id }
          if (selectedEnv.value) params.env = selectedEnv.value
          return apiClient.get(`${CF_GATEWAY}/securityRules`, { params }).then(r => r.data?.data || []).catch(() => [])
        })),
      ])
      const allDomains: any[] = []
      domainResults.forEach(d => allDomains.push(...(d || [])))
      domains.value = allDomains
      const allRules: any[] = []
      ruleResults.forEach(r => allRules.push(...(r || [])))
      rules.value = allRules
    } else if (selectedProject.value) {
      const domainData = await domainService.list(String(selectedProject.value))
      domains.value = domainData || []
      const secParams: any = { projectId: selectedProject.value }
      if (selectedEnv.value) secParams.env = selectedEnv.value
      const { data: secData } = await apiClient.get(`${CF_GATEWAY}/securityRules`, { params: secParams })
      rules.value = secData?.data || []
    } else {
      domains.value = []
      rules.value = []
    }
  } catch (e) {
    console.error('Failed to fetch', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
watch(selectedProject, () => { fetchData(); fetchRules() })
watch(selectedEnv, fetchRules)

// --- CRUD Dialog ---
const dialog = ref(false)
const editingId = ref<string | null>(null)
const editingProjectId = ref<number | null>(null)
const form = ref({ name: '', description: '', env: '', entries: [{ zone: '', zoneId: '', ruleId: '' }] as { zone: string; zoneId: string; ruleId: string }[] })
const saving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })
const dialogDomains = ref<any[]>([])
const dialogDomainOptions = computed(() =>
  dialogDomains.value
    .filter(d => d.type === 'web')
    .map(d => ({ title: d.domain, value: d.domain, zoneId: d.zoneId || '' }))
)
watch(() => form.value.env, () => { if (dialog.value) fetchDialogDomains() })

function addEntry() { form.value.entries.push({ zone: '', zoneId: '', ruleId: '' }) }
function removeEntry(idx: number) { if (form.value.entries.length > 1) form.value.entries.splice(idx, 1) }

async function fetchDialogDomains() {
  const pid = editingId.value ? editingProjectId.value : selectedProject.value
  if (!pid) { dialogDomains.value = []; return }
  try {
    const data = await domainService.list(String(pid))
    dialogDomains.value = (data || []).filter((d: any) => !form.value.env || d.env === form.value.env)
  } catch { dialogDomains.value = [] }
}

function openCreate() {
  if (!selectedProject.value || selectedProject.value === -1) {
    snackbar.value = { show: true, text: 'Please select a specific project first', color: 'warning' }
    return
  }
  editingId.value = null
  form.value = { name: '', description: '', env: selectedEnv.value || '', entries: [{ zone: '', zoneId: '', ruleId: '' }] }
  dialog.value = true
  fetchDialogDomains()
}

function openEdit(rule: any) {
  editingId.value = rule.id
  editingProjectId.value = rule.projectId
  let entries: { zone: string; zoneId: string; ruleId: string }[] = []
  if (Array.isArray(rule.entries) && rule.entries.length > 0) {
    entries = rule.entries.map((e: any) => ({ zone: e.zone || '', zoneId: e.zoneId || '', ruleId: e.ruleId || '' }))
  } else {
    const zones = Array.isArray(rule.zones) ? rule.zones : (rule.zone ? [rule.zone] : [])
    const ruleIds = Array.isArray(rule.ruleIds) ? rule.ruleIds : (rule.ruleId ? [rule.ruleId] : [])
    const zoneIds = Array.isArray(rule.zoneIds) ? rule.zoneIds : (rule.zoneId ? [rule.zoneId] : [])
    const maxLen = Math.max(zones.length, ruleIds.length, zoneIds.length, 1)
    for (let i = 0; i < maxLen; i++) {
      entries.push({ zone: zones[i] || '', zoneId: zoneIds[i] || '', ruleId: ruleIds[i] || '' })
    }
  }
  form.value = { name: rule.name || '', description: rule.description || '', env: rule.env || '', entries }
  dialog.value = true
  fetchDialogDomains()
}

async function fetchRules() {
  if (!selectedProject.value) { rules.value = []; return }
  try {
    if (selectedProject.value === -1) {
      const results = await Promise.all(
        projects.value.map((p: any) => {
          const params: any = { projectId: p.id }
          if (selectedEnv.value) params.env = selectedEnv.value
          return apiClient.get(`${CF_GATEWAY}/securityRules`, { params }).then(r => r.data?.data || []).catch(() => [])
        })
      )
      const allRules: any[] = []
      results.forEach(r => allRules.push(...(r || [])))
      rules.value = allRules
    } else {
      const fetchParams: any = { projectId: selectedProject.value }
      if (selectedEnv.value) fetchParams.env = selectedEnv.value
      const { data: fetchData } = await apiClient.get(`${CF_GATEWAY}/securityRules`, { params: fetchParams })
      rules.value = fetchData?.data || []
    }
  } catch (e) {
    console.error('Failed to fetch rules', e)
  }
}

async function save() {
  if (!form.value.name.trim() || !selectedProject.value) return
  saving.value = true
  try {
    const payload: any = {
      projectId: editingId.value ? editingProjectId.value : selectedProject.value,
      name: form.value.name,
      description: form.value.description,
      env: form.value.env,
      entries: form.value.entries.filter(e => e.zone || e.zoneId || e.ruleId),
    }
    if (editingId.value) {
      await apiClient.put(`${CF_GATEWAY}/securityRules/${editingId.value}`, payload)
      snackbar.value = { show: true, text: 'Rule updated', color: 'success' }
    } else {
      await apiClient.post(`${CF_GATEWAY}/securityRules`, payload)
      snackbar.value = { show: true, text: 'Rule created', color: 'success' }
    }
    dialog.value = false
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function deleteRule(rule: any) {
  if (!confirm(`Delete "${rule.name}"?`)) return
  try {
    await apiClient.delete(`${CF_GATEWAY}/securityRules/${rule.id}`, { params: { projectId: selectedProject.value } })
    snackbar.value = { show: true, text: 'Rule deleted', color: 'success' }
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to delete', color: 'error' }
  }
}



</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Filters -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="selectedProject" :items="projectOptions" label="Project" density="compact" style="max-width: 200px" hide-details clearable />
        <VSelect v-model="selectedEnv" :items="envOptions" label="Environment" density="compact" style="max-width: 160px" hide-details clearable />
        <div class="d-flex align-center flex-wrap gap-4">
          <VChip size="small" color="info" variant="tonal">Rules: {{ rules.length }}</VChip>
        </div>
        <VSpacer />
        <VBtn color="primary" @click="openCreate" prepend-icon="bx-plus">Add Rule</VBtn>
      </VCardText>
    </VCard>

    <!-- Rules Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <div class="card-scroll">
        <VTable v-if="rules.length > 0" class="text-no-wrap sticky-table" hover density="compact" style="width: 100%;">
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th style="width: 50px;">Project</th>
              <th style="width: 50px;">Env</th>
              <th style="width: 100px;">Name</th>
              <th style="width: 300px;">Description</th>
              <th style="width: 140px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rules" :key="r.id">
              <td class="text-body-2">{{ projects.find(p => p.id === r.projectId)?.name || '-' }}</td>
              <td><VChip size="x-small" color="primary" variant="tonal">{{ (r.env || '-').toUpperCase() }}</VChip></td>
              <td>{{ r.name }}</td>
              <td><code class="text-caption">{{ r.description || '-' }}</code></td>

              <td>
                <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEdit(r)">Edit</VBtn>
                <VBtn size="x-small" variant="tonal" color="error" @click="deleteRule(r)">Delete</VBtn>
              </td>
            </tr>
          </tbody>
      </VTable>
      <VCardText v-else class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-shield" size="48" class="mb-2" />
          <p>No rules yet.</p>
        </VCardText>
      </div>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialog" max-width="800">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle>
        <VCardText class="pt-2">
          <VSelect v-model="form.env" :items="envOptions" label="Environment" density="compact" hide-details class="mb-3" clearable />
          <VTextField v-model="form.name" label="Name" density="compact" hide-details class="mb-3" placeholder="白名单规则" />
          <VTextField v-model="form.description" label="Description" density="compact" hide-details class="mb-4" placeholder="规则描述" />
          <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">Rules</div>
          <div v-for="(entry, idx) in form.entries" :key="idx" class="d-flex align-center gap-2 mb-2">
            <VSelect
              v-model="entry.zone"
              :items="dialogDomainOptions"
              label="Zone"
              density="compact"
              hide-details
              clearable
              style="flex: 1"
              @update:model-value="val => { const opt = dialogDomainOptions.find(o => o.value === val); entry.zoneId = opt?.zoneId || '' }"
            />
            <VTextField v-model="entry.zoneId" label="Zone ID" density="compact" hide-details placeholder="abc123" style="flex: 2" />
            <VTextField v-model="entry.ruleId" label="Rule ID" density="compact" hide-details placeholder="def456" style="flex: 2" />
            <VBtn icon="bx-trash" size="small" variant="text" color="error" :disabled="form.entries.length <= 1" @click="removeEntry(idx)" />
          </div>
          <VBtn size="small" variant="tonal" color="primary" prepend-icon="bx-plus" @click="addEntry" class="mt-1">Add Row</VBtn>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!form.name.trim()" @click="save">Save</VBtn>
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
  width: 100%;
}
.sticky-table :deep(.v-table__wrapper) table {
  table-layout: fixed !important;
  width: 100% !important;
}
.sticky-table :deep(th),
.sticky-table :deep(td) {
  padding: 2px 8px !important;
  font-size: 13px;
}
.sticky-table :deep(th:nth-child(1)),
.sticky-table :deep(td:nth-child(1)),
.sticky-table :deep(th:nth-child(2)),
.sticky-table :deep(td:nth-child(2)) {
  text-align: center;
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
.sticky-table :deep(.v-table__wrapper) table th:nth-child(1),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(1) { width: 50px !important; min-width: 50px !important; max-width: 50px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(2),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(2) { width: 50px !important; min-width: 50px !important; max-width: 50px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(3),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(3) { width: 100px !important; min-width: 100px !important; max-width: 100px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(4),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(4) { width: 300px !important; min-width: 300px !important; max-width: 300px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(5),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(5) { width: 140px !important; min-width: 140px !important; max-width: 140px !important; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
