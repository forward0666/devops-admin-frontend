<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient, { userConsoleProjectService as projectService, userConsoleDomainService as domainService } from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'

const route = useRoute()
const projects = ref<any[]>([])
const domains = ref<any[]>([])
const rules = ref<any[]>([])
const selectedProject = ref<number | null>(route.query.project ? Number(route.query.project) : null)
const selectedEnv = ref<string | null>((route.query.env as string) || null)
const loading = ref(false)

// Persist filters
watch([selectedProject, selectedEnv], ([p, e]) => {
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

const filteredDomains = computed(() => {
  let result = domains.value
  if (selectedEnv.value) result = result.filter(d => d.env === selectedEnv.value)
  return result
})

// --- Fetch ---
async function fetchData() {
  loading.value = true
  try {
    const [projectData, domainData] = await Promise.all([
      projectService.list(),
      selectedProject.value ? domainService.list(String(selectedProject.value)) : Promise.resolve([]),
    ])
    projects.value = projectData || []
    domains.value = domainData || []

    if (selectedProject.value) {
      await fetchRules()
    } else {
      rules.value = []
    }
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
    const { data } = await apiClient.get(`${CF_GATEWAY}/securityRule`, { params })
    rules.value = data?.data || []
  } catch (e) {
    console.error('Failed to fetch rules', e)
  }
}

// --- CRUD Dialog ---
const dialog = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ ruleId: '', name: '', env: '', zone: '' })
const saving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const actionOptions = [
  { title: 'Allow (白名单)', value: 'allow' },
  { title: 'Block (黑名单)', value: 'block' },
  { title: 'Challenge (验证)', value: 'challenge' },
]

function openCreate() {
  if (!selectedProject.value) {
    snackbar.value = { show: true, text: 'Please select a project first', color: 'warning' }
    return
  }
  editingId.value = null
  form.value = { ruleId: '', name: '', env: selectedEnv.value || '', zone: '' }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = {
    ruleId: rule.ruleId || '',
    name: rule.name || '',
    env: rule.env || '',
    zone: rule.zone || '',
  }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim() || !selectedProject.value) return
  saving.value = true
  try {
    const payload = { ...form.value, projectId: selectedProject.value }
    if (editingId.value) {
      await apiClient.put(`${CF_GATEWAY}/securityRule/${editingId.value}`, payload)
      snackbar.value = { show: true, text: 'Rule updated', color: 'success' }
    } else {
      await apiClient.post(`${CF_GATEWAY}/securityRule`, payload)
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
    await apiClient.delete(`${CF_GATEWAY}/securityRule/${rule.id}`, { params: { projectId: selectedProject.value } })
    snackbar.value = { show: true, text: 'Rule deleted', color: 'success' }
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to delete', color: 'error' }
  }
}

const actionColors: Record<string, string> = {
  allow: 'success',
  block: 'error',
  challenge: 'warning',
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
          <VChip size="small" color="primary" variant="tonal">Domains: {{ filteredDomains.length }}</VChip>
          <VChip size="small" color="info" variant="tonal">Rules: {{ rules.length }}</VChip>
        </div>
        <VSpacer />
        <VBtn color="primary" @click="openCreate" prepend-icon="bx-plus">Add Rule</VBtn>
      </VCardText>
    </VCard>

    <!-- Rules Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VCardTitle class="pt-4 px-6">Security Rules</VCardTitle>
      <VCardSubtitle class="px-6">Manage whitelist / blacklist rules</VCardSubtitle>
        <VTable v-if="rules.length > 0" class="text-no-wrap sticky-table" hover density="compact" style="flex: 1; min-height: 0; width: 100%;">
          <colgroup>
            <col style="width: 100px" />
            <col style="width: 200px" />
            <col style="width: 300px" />
            <col style="width: 180px" />
          </colgroup>
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th>Env</th>
              <th>Name</th>
              <th>Rule ID</th>
              <th style="text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rules" :key="r.id">
              <td><VChip size="x-small" color="primary" variant="tonal">{{ (r.env || '-').toUpperCase() }}</VChip></td>
              <td>{{ r.name || '-' }}</td>
              <td><code class="text-caption">{{ r.ruleId || '-' }}</code></td>
              <td class="text-center">
                <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEdit(r)">Edit</VBtn>
                <VBtn size="x-small" variant="tonal" color="error" @click="deleteRule(r)">Delete</VBtn>
              </td>
            </tr>
          </tbody>
      </VTable>
      <VCardText v-else class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-shield" size="48" class="mb-2" />
          <p>No security rules yet. Click "Add Rule" to create one.</p>
          <p class="text-caption mt-1">Select a project first.</p>
        </VCardText>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialog" max-width="600">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle>
        <VCardText class="pt-2">
          <VSelect v-model="form.env" :items="envOptions" label="Environment" density="compact" hide-details class="mb-3" clearable />
          <VTextField v-model="form.name" label="Name" density="compact" hide-details class="mb-3" placeholder="白名单规则" />

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
