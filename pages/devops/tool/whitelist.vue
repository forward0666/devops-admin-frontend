<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient, { userConsoleProjectService as projectService, userConsoleDomainService as domainService } from '~/services/api'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const authStore = useAuthStore()

const route = useRoute()
const projects = ref<any[]>([])
const domains = ref<any[]>([])
const whitelists = ref<any[]>([])
const rules = ref<any[]>([])
const savedProject = process.client ? localStorage.getItem('cf-project-id') : null
const savedEnv = process.client ? localStorage.getItem('cf-env') : null
const selectedProject = ref<number | null>(savedProject ? Number(savedProject) : (route.query.project ? Number(route.query.project) : null))
const selectedEnv = ref<string | null>(savedEnv || (route.query.env as string) || null)
const search = ref('')
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

const projectOptions = computed(() => [
  { title: 'All', value: -1 },
  ...projects.value.map(p => ({ title: p.name, value: p.id })),
])
const envOptions = computed(() => {
  const envs = [...new Set(domains.value.map(d => d.env).filter(Boolean))]
  return envs.map(e => ({ title: e.toUpperCase(), value: e }))
})

const filteredWhitelists = computed(() => {
  if (!search.value) return whitelists.value
  const s = search.value.toLowerCase()
  return whitelists.value.filter(w =>
    (w.ruleName || '').toLowerCase().includes(s) ||
    (w.username || '').toLowerCase().includes(s) ||
    (w.ip || '').toLowerCase().includes(s) ||
    (w.operator || '').toLowerCase().includes(s)
  )
})

async function fetchData() {
  loading.value = true
  try {
    const projectData = await projectService.list()
    projects.value = projectData || []

    if (selectedProject.value === -1) {
      const [domainResults, whitelistResults, ruleResults] = await Promise.all([
        Promise.all(projects.value.map((p: any) => domainService.list(String(p.id)).catch(() => []))),
        Promise.all(projects.value.map((p: any) => {
          const params: any = { projectId: p.id }
          if (selectedEnv.value) params.env = selectedEnv.value
          return apiClient.get(`${CF_GATEWAY}/whitelist`, { params }).then(r => r.data?.data || []).catch(() => [])
        })),
        Promise.all(projects.value.map((p: any) => {
          const params: any = { projectId: p.id }
          if (selectedEnv.value) params.env = selectedEnv.value
          return apiClient.get(`${CF_GATEWAY}/securityRules`, { params }).then(r => r.data?.data || []).catch(() => [])
        })),
      ])
      const allDomains: any[] = []
      domainResults.forEach(d => allDomains.push(...(d || [])))
      domains.value = allDomains
      const allWhitelists: any[] = []
      whitelistResults.forEach(w => allWhitelists.push(...(w || [])))
      whitelists.value = allWhitelists
      const allRules: any[] = []
      ruleResults.forEach(r => allRules.push(...(r || [])))
      rules.value = allRules
    } else if (selectedProject.value) {
      const domainData = await domainService.list(String(selectedProject.value))
      domains.value = domainData || []
      await fetchWhitelists()
      await fetchRules()
    } else {
      domains.value = []
      whitelists.value = []
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
watch(selectedEnv, () => { fetchWhitelists(); fetchRules() })

async function fetchWhitelists() {
  if (!selectedProject.value) { whitelists.value = []; return }
  try {
    if (selectedProject.value === -1) {
      const results = await Promise.all(
        projects.value.map((p: any) => {
          const params: any = { projectId: p.id }
          if (selectedEnv.value) params.env = selectedEnv.value
          return apiClient.get(`${CF_GATEWAY}/whitelist`, { params }).then(r => r.data?.data || []).catch(() => [])
        })
      )
      const allWhitelists: any[] = []
      results.forEach(w => allWhitelists.push(...(w || [])))
      whitelists.value = allWhitelists
    } else {
      const params: any = { projectId: selectedProject.value }
      if (selectedEnv.value) params.env = selectedEnv.value
      const { data } = await apiClient.get(`${CF_GATEWAY}/whitelist`, { params })
      whitelists.value = data?.data || []
    }
  } catch (e) {
    whitelists.value = []
  }
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
      const params: any = { projectId: selectedProject.value }
      if (selectedEnv.value) params.env = selectedEnv.value
      const { data } = await apiClient.get(`${CF_GATEWAY}/securityRules`, { params })
      rules.value = data?.data || []
    }
  } catch (e) {
    rules.value = []
  }
}

async function deleteWhitelist(w: any) {
  if (!confirm(`Remove IP ${w.ip} from ${w.ruleName || 'rule'}?`)) return
  try {
    const params: any = { projectId: selectedProject.value, ip: w.ip }
    if (w.ruleId) params.ruleId = w.ruleId
    if (w.username) params.username = w.username
    await apiClient.delete(`${CF_GATEWAY}/whitelist/remove`, { params })
    await fetchWhitelists()
  } catch (e: any) {
    console.error('Failed to remove IP', e)
  }
}

// --- Edit Whitelist ---
const editDialog = ref(false)
const editForm = ref({ id: '', ruleId: '', oldIp: '', newIp: '', username: '' })
const editSaving = ref(false)

function openEdit(w: any) {
  editForm.value = {
    id: w.id,
    ruleId: w.ruleId || '',
    oldIp: w.ip || '',
    newIp: w.ip || '',
    username: w.username || '',
  }
  editDialog.value = true
}

async function saveEdit() {
  if (!editForm.value.newIp.trim() || !selectedProject.value) return
  editSaving.value = true
  try {
    const payload: any = {
      id: editForm.value.id,
      projectId: selectedProject.value,
      ruleId: editForm.value.ruleId,
      oldIp: editForm.value.oldIp,
      newIp: editForm.value.newIp,
    }
    const { data } = await apiClient.put(`${CF_GATEWAY}/whitelist`, payload)
    snackbar.value = { show: true, text: data?.message || 'IP updated', color: 'success' }
    editDialog.value = false
    await fetchWhitelists()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || e?.message || 'Failed', color: 'error' }
  } finally {
    editSaving.value = false
  }
}

// --- Add Whitelist ---
const whitelistDialog = ref(false)
const whitelistForm = ref({ ruleId: '', username: '', ip: '' })
const whitelistSaving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

function openWhitelistCreate() {
  if (!selectedProject.value || selectedProject.value === -1) {
    snackbar.value = { show: true, text: 'Please select a specific project first', color: 'warning' }
    return
  }
  whitelistForm.value = { ruleId: '', username: '', ip: '' }
  whitelistDialog.value = true
}

async function saveWhitelist() {
  if (!whitelistForm.value.ruleId || !whitelistForm.value.ip.trim() || !selectedProject.value) return
  whitelistSaving.value = true
  try {
    const payload: any = {
      projectId: selectedProject.value,
      ruleId: whitelistForm.value.ruleId,
      ip: whitelistForm.value.ip,
      username: whitelistForm.value.username,
      operator: authStore.userName || 'unknown',
      env: selectedEnv.value || '',
    }
    const { data } = await apiClient.post(`${CF_GATEWAY}/whitelist`, payload)
    snackbar.value = { show: true, text: data?.message || 'Whitelist created', color: 'success' }
    whitelistDialog.value = false
    await fetchWhitelists()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || e?.message || 'Failed', color: 'error' }
  } finally {
    whitelistSaving.value = false
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="selectedProject" :items="projectOptions" label="Project" density="compact" style="max-width: 200px" hide-details clearable />
        <VSelect v-model="selectedEnv" :items="envOptions" label="Environment" density="compact" style="max-width: 160px" hide-details clearable />
        <VTextField v-model="search" prepend-inner-icon="bx-search" placeholder="Filter by rule, user, IP..." density="compact" hide-details clearable style="max-width: 260px" />
        <VSpacer />
        <VBtn color="primary" @click="openWhitelistCreate" prepend-icon="bx-plus">Add Whitelist</VBtn>
      </VCardText>
    </VCard>

    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <div class="card-scroll">
        <VTable v-if="filteredWhitelists.length > 0" class="text-no-wrap sticky-table" hover density="compact" style="width: 100%;">
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th>Project</th>
              <th>ENV</th>
              <th>Rule Name</th>
              <th>Username</th>
              <th>IP</th>
              <th>Operator</th>
              <th>Created</th>
              <th style="width: 140px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in filteredWhitelists" :key="w.id">
              <td class="text-body-2">{{ projects.find(p => p.id === w.projectId)?.name || '-' }}</td>
              <td><VChip size="x-small" color="primary" variant="tonal">{{ (w.env || '-').toUpperCase() }}</VChip></td>
              <td>{{ w.ruleName || '-' }}</td>
              <td>{{ w.username || '-' }}</td>
              <td><code class="text-caption">{{ w.ip || '-' }}</code></td>
              <td>{{ w.operator || '-' }}</td>
              <td class="text-caption text-medium-emphasis">{{ w.createdAt ? new Date(w.createdAt).toLocaleString() : '-' }}</td>
              <td>
                <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEdit(w)">Edit</VBtn>
                <VBtn size="x-small" variant="tonal" color="error" @click="deleteWhitelist(w)">Remove</VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
        <VCardText v-else class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-list-ul" size="48" class="mb-2" />
          <p>No records yet.</p>
        </VCardText>
      </div>
    </VCard>

    <!-- Add Whitelist Dialog -->
    <VDialog v-model="whitelistDialog" max-width="500">
      <VCard>
        <VCardTitle>Add Whitelist</VCardTitle>
        <VCardText class="pt-2">
          <VSelect v-model="whitelistForm.ruleId" :items="rules.map(r => ({ title: r.name, value: r.id }))" label="Rule Name" density="compact" hide-details class="mb-3" clearable />
          <VTextField v-model="whitelistForm.username" label="Username" density="compact" hide-details class="mb-3" placeholder="张三" />
          <VTextField v-model="whitelistForm.ip" label="IP" density="compact" hide-details class="mb-3" placeholder="1.2.3.4" />
          <div class="text-caption text-medium-emphasis">Operator: <strong>{{ authStore.userName || '-' }}</strong></div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="whitelistDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="whitelistSaving" :disabled="!whitelistForm.ruleId || !whitelistForm.ip.trim()" @click="saveWhitelist">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Whitelist Dialog -->
    <VDialog v-model="editDialog" max-width="400">
      <VCard>
        <VCardTitle>Edit IP</VCardTitle>
        <VCardText class="pt-2">
          <div class="text-caption text-medium-emphasis mb-2">Rule: <strong>{{ editForm.username || '-' }}</strong></div>
          <VTextField v-model="editForm.newIp" label="IP" density="compact" hide-details class="mb-3" placeholder="1.2.3.4" />
          <div class="text-caption text-medium-emphasis">Old IP: <code>{{ editForm.oldIp }}</code></div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="editDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="editSaving" :disabled="!editForm.newIp.trim() || editForm.newIp === editForm.oldIp" @click="saveEdit">Save</VBtn>
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
.sticky-table :deep(table) {
  table-layout: fixed;
  width: 100%;
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
.sticky-table :deep(tbody td) { overflow: hidden !important; max-width: 0 !important; }
.sticky-table :deep(th:nth-child(1)),
.sticky-table :deep(td:nth-child(1)) { width: 50px; }
.sticky-table :deep(th:nth-child(2)),
.sticky-table :deep(td:nth-child(2)) { width: 70px; }
.sticky-table :deep(th:nth-child(3)),
.sticky-table :deep(td:nth-child(3)) { width: 150px; }
.sticky-table :deep(th:nth-child(4)),
.sticky-table :deep(td:nth-child(4)) { width: 120px; }
.sticky-table :deep(th:nth-child(5)),
.sticky-table :deep(td:nth-child(5)) { width: 140px; }
.sticky-table :deep(th:nth-child(6)),
.sticky-table :deep(td:nth-child(6)) { width: 120px; }
.sticky-table :deep(th:nth-child(7)),
.sticky-table :deep(td:nth-child(7)) { width: 160px; }
.sticky-table :deep(th:nth-child(8)),
.sticky-table :deep(td:nth-child(8)) { width: 140px; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
