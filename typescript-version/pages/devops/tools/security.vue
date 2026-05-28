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

const projectOptions = computed(() => projects.value.map(p => ({ title: p.name, value: p.id })))
const envOptions = computed(() => {
  const envs = [...new Set(domains.value.map(d => d.env).filter(Boolean))]
  return envs.map(e => ({ title: e.toUpperCase(), value: e }))
})

async function fetchData() {
  loading.value = true
  try {
    const [projectData, domainData] = await Promise.all([
      projectService.list(),
      selectedProject.value ? domainService.list(String(selectedProject.value)) : Promise.resolve([]),
    ])
    projects.value = projectData || []
    domains.value = domainData || []
    if (selectedProject.value) await fetchRules()
    else rules.value = []
  } catch (e) {
    console.error('Failed to fetch', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
watch(selectedProject, fetchData)
watch(selectedEnv, fetchRules)

async function fetchRules() {
  if (!selectedProject.value) { rules.value = []; return }
  try {
    const params: any = { projectId: selectedProject.value }
    if (selectedEnv.value) params.env = selectedEnv.value
    const { data } = await apiClient.get(`${CF_GATEWAY}/securityRules`, { params })
    rules.value = data?.data || []
  } catch (e) {
    console.error('Failed to fetch rules', e)
  }
}

// --- CRUD Dialog ---
const dialog = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ name: '', env: '', entries: [{ zone: '', zoneId: '', ruleId: '' }] as { zone: string; zoneId: string; ruleId: string }[] })
const saving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

function openCreate() {
  if (!selectedProject.value) {
    snackbar.value = { show: true, text: 'Please select a project first', color: 'warning' }
    return
  }
  editingId.value = null
  form.value = { name: '', env: selectedEnv.value || '', entries: [{ zone: '', zoneId: '', ruleId: '' }] }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
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
  form.value = { name: rule.name || '', env: rule.env || '', entries }
  dialog.value = true
}

function addEntry() { form.value.entries.push({ zone: '', zoneId: '', ruleId: '' }) }
function removeEntry(idx: number) { if (form.value.entries.length > 1) form.value.entries.splice(idx, 1) }

async function save() {
  if (!form.value.name.trim() || !selectedProject.value) return
  const newRuleIds = form.value.entries.map(e => e.ruleId.trim()).filter(Boolean)
  if (newRuleIds.length > 0) {
    const existingIds = new Set<string>()
    for (const r of rules.value) {
      if (editingId.value && r.id === editingId.value) continue
      for (const e of getEntries(r)) { if (e.ruleId) existingIds.add(e.ruleId.trim()) }
    }
    const dupes = newRuleIds.filter(rid => existingIds.has(rid))
    if (dupes.length > 0) {
      snackbar.value = { show: true, text: `Duplicate Rule ID: ${dupes.join(', ')}`, color: 'error' }
      return
    }
  }
  saving.value = true
  try {
    const payload: any = {
      projectId: selectedProject.value,
      name: form.value.name,
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
  if (!confirm(`Delete this rule?`)) return
  try {
    await apiClient.delete(`${CF_GATEWAY}/securityRules/${rule.id}`, { params: { projectId: selectedProject.value } })
    snackbar.value = { show: true, text: 'Rule deleted', color: 'success' }
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to delete', color: 'error' }
  }
}

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

</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="selectedProject" :items="projectOptions" label="Project" density="compact" style="max-width: 200px" hide-details clearable />
        <VSelect v-model="selectedEnv" :items="envOptions" label="Environment" density="compact" style="max-width: 160px" hide-details clearable />
        <VSpacer />
      </VCardText>
    </VCard>

    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VCardTitle class="pt-2 px-6 pb-0 text-body-1 d-flex align-center">
        Security Rules
        <VSpacer />
        <VBtn size="small" color="primary" @click="openCreate" prepend-icon="bx-plus">Add Rule</VBtn>
      </VCardTitle>
      <div class="card-scroll">
        <VTable v-if="rules.length > 0" class="text-no-wrap sticky-table" hover density="compact" style="width: 100%;">
          <colgroup>
            <col style="width: 80px" />
            <col />
            <col style="width: 180px" />
          </colgroup>
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th>Env</th>
              <th>Name</th>
              <th style="padding-left: 12px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="r in rules" :key="r.id">
              <tr>
                <td><VChip size="x-small" color="primary" variant="tonal">{{ (r.env || '-').toUpperCase() }}</VChip></td>
                <td>{{ r.name || '-' }}</td>
                <td style="padding-left: 12px; white-space: nowrap;">
                  <VBtn size="x-small" variant="tonal" :color="viewedRules.has(r.id) ? 'warning' : 'success'" class="me-1" @click="toggleView(r.id)">{{ viewedRules.has(r.id) ? 'Hide' : 'View' }}</VBtn>
                  <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEdit(r)">Edit</VBtn>
                  <VBtn size="x-small" variant="tonal" color="error" @click="deleteRule(r)">Delete</VBtn>
                </td>
              </tr>
              <tr v-if="viewedRules.has(r.id)">
                <td colspan="3" style="padding: 0 !important;">
                  <div style="padding: 8px 16px 12px 50px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <thead>
                        <tr class="text-caption text-medium-emphasis">
                          <th style="text-align: left; padding: 4px 12px; width: 120px;">Zone</th>
                          <th style="text-align: left; padding: 4px 12px; width: 280px;">Zone ID</th>
                          <th style="text-align: left; padding: 4px 12px;">Rule ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(entry, eidx) in getEntries(r)" :key="eidx">
                          <td style="padding: 4px 12px;"><code class="text-caption">{{ entry.zone || '-' }}</code></td>
                          <td style="padding: 4px 12px;"><code class="text-caption">{{ entry.zoneId || '-' }}</code></td>
                          <td style="padding: 4px 12px;"><code class="text-caption">{{ entry.ruleId || '-' }}</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </VTable>
        <VCardText v-else class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-shield" size="48" class="mb-2" />
          <p>No rules yet.</p>
        </VCardText>
      </div>
    </VCard>

    <!-- Add Rule Dialog -->
    <VDialog v-model="dialog" max-width="800">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle>
        <VCardText class="pt-2">
          <VSelect v-model="form.env" :items="envOptions" label="Environment" density="compact" hide-details class="mb-3" clearable />
          <VTextField v-model="form.name" label="Name" density="compact" hide-details class="mb-4" placeholder="白名单规则" />
          <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">Rules</div>
          <div v-for="(entry, idx) in form.entries" :key="idx" class="d-flex align-center gap-2 mb-2">
            <VTextField v-model="entry.zone" label="Zone" density="compact" hide-details placeholder="example.com" style="flex: 1" />
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
.sticky-table table { table-layout: fixed !important; }
.sticky-table :deep(tbody td) { overflow: hidden !important; max-width: 0 !important; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
