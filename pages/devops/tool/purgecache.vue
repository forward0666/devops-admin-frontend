<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient, { userConsoleProjectService as projectService, userConsoleDomainService as domainService, cacheRuleService } from '~/services/api'

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

const filteredDomains = computed(() => {
  let result = domains.value
  if (selectedEnv.value) result = result.filter(d => d.env === selectedEnv.value)
  return result
})

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
        Promise.all(projects.value.map((p: any) => cacheRuleService.list(p.id, selectedEnv.value || undefined).catch(() => []))),
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
      rules.value = await cacheRuleService.list(selectedProject.value, selectedEnv.value || undefined) || []
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
const form = ref({ name: '', url: '', env: '' })
const saving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

function openCreate() {
  if (!selectedProject.value || selectedProject.value === -1) {
    snackbar.value = { show: true, text: 'Please select a specific project first', color: 'warning' }
    return
  }
  editingId.value = null
  form.value = { name: '', url: '', env: selectedEnv.value || '' }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = { name: rule.name, url: rule.url, env: rule.env || '' }
  dialog.value = true
}

async function fetchRules() {
  if (!selectedProject.value) { rules.value = []; return }
  try {
    if (selectedProject.value === -1) {
      const results = await Promise.all(
        projects.value.map((p: any) => cacheRuleService.list(p.id, selectedEnv.value || undefined).catch(() => []))
      )
      const allRules: any[] = []
      results.forEach(r => allRules.push(...(r || [])))
      rules.value = allRules
    } else {
      rules.value = await cacheRuleService.list(selectedProject.value, selectedEnv.value || undefined) || []
    }
  } catch (e) {
    console.error('Failed to fetch rules', e)
  }
}

async function save() {
  if (!form.value.name.trim() || !form.value.url.trim() || !selectedProject.value) return
  saving.value = true
  try {
    const payload = { ...form.value, projectId: selectedProject.value }
    if (editingId.value) {
      await cacheRuleService.update(editingId.value, payload)
      snackbar.value = { show: true, text: 'Rule updated', color: 'success' }
    } else {
      await cacheRuleService.create(payload)
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
    await cacheRuleService.delete(rule.id, selectedProject.value!)
    snackbar.value = { show: true, text: 'Rule deleted', color: 'success' }
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to delete', color: 'error' }
  }
}

// --- Purge ---
const purging = ref<string | null>(null)

async function purgeCache(rule: any) {
  if (!selectedProject.value || selectedProject.value === -1) return
  const targetDomains = filteredDomains.value.filter((d: any) => d.type === 'web')
  if (!targetDomains.length) {
    snackbar.value = { show: true, text: 'No web domains found for current project/env', color: 'warning' }
    return
  }
  purging.value = `rule-${rule.id}`
  try {
    const domainNames = targetDomains.map((d: any) => d.domain)
    const { data } = await apiClient.post(
      `${CF_GATEWAY}/cacheRule/purge`,
      { ruleId: rule.id, domains: domainNames },
    )
    const result = data?.data
    const succeeded: string[] = result?.succeeded || []
    const failed: { domain: string; reason: string }[] = result?.failed || []
    const total = result?.total || 0
    if (failed.length === 0) {
      snackbar.value = { show: true, text: `Purged ${succeeded.length}/${total}: ${succeeded.join(', ')}`, color: 'success' }
    } else if (succeeded.length === 0) {
      const names = failed.map(f => f.domain).slice(0, 5).join(', ')
      snackbar.value = { show: true, text: `All failed (${failed.length}): ${names}${failed.length > 5 ? '...' : ''}`, color: 'error' }
    } else {
      const okNames = succeeded.slice(0, 3).join(', ')
      const failNames = failed.map(f => f.domain).slice(0, 3).join(', ')
      snackbar.value = { show: true, text: `✅ ${succeeded.length}: ${okNames}${succeeded.length > 3 ? '...' : ''} | ❌ ${failed.length}: ${failNames}${failed.length > 3 ? '...' : ''}`, color: 'warning' }
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Purge failed', color: 'error' }
  } finally {
    purging.value = null
  }
}

async function purgeAll() {
  if (!selectedProject.value || selectedProject.value === -1) return
  const targetDomains = filteredDomains.value.filter((d: any) => d.type === 'web')
  if (!targetDomains.length) {
    snackbar.value = { show: true, text: 'No web domains found for current project/env', color: 'warning' }
    return
  }
  if (!confirm(`Purge ALL cache for ${targetDomains.length} domains?`)) return
  purging.value = 'all'
  try {
    const domainNames = targetDomains.map((d: any) => d.domain)
    const { data } = await apiClient.post(
      `${CF_GATEWAY}/cacheRule/purgeAll`,
      { domains: domainNames },
    )
    const result = data?.data
    const succeeded: string[] = result?.succeeded || []
    const failed: { domain: string; reason: string }[] = result?.failed || []
    const total = result?.total || 0
    if (failed.length === 0) {
      snackbar.value = { show: true, text: `Purged ${succeeded.length}/${total}: ${succeeded.join(', ')}`, color: 'success' }
    } else if (succeeded.length === 0) {
      const names = failed.map(f => f.domain).join(', ')
      snackbar.value = { show: true, text: `All failed (${failed.length}): ${names}`, color: 'error' }
    } else {
      const okNames = succeeded.join(', ')
      const failNames = failed.map(f => f.domain).join(', ')
      snackbar.value = { show: true, text: `✅ ${succeeded.length}: ${okNames} | ❌ ${failed.length}: ${failNames}`, color: 'warning' }
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Purge all failed', color: 'error' }
  } finally {
    purging.value = null
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
          <VChip size="small" color="primary" variant="tonal">Domains: {{ filteredDomains.length }}</VChip>
          <VChip size="small" color="info" variant="tonal">Rules: {{ rules.length }}</VChip>
        </div>
        <VSpacer />
        <VBtn color="error" variant="tonal" :loading="purging === 'all'" :disabled="!selectedProject || selectedProject === -1" @click="purgeAll" prepend-icon="bx-trash" class="me-2">Purge All</VBtn>
        <VBtn color="primary" @click="openCreate" prepend-icon="bx-plus">Add Rule</VBtn>
      </VCardText>
    </VCard>

    <!-- Rules Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <div class="card-scroll">
        <VTable v-if="rules.length > 0" class="text-no-wrap sticky-table" hover density="compact" style="width: 100%;">
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th>Project</th>
              <th>Env</th>
              <th>Name</th>
              <th>URL</th>
              <th style="width: 140px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rules" :key="r.id">
              <td class="text-body-2">{{ projects.find(p => p.id === r.projectId)?.name || '-' }}</td>
              <td><VChip size="x-small" color="primary" variant="tonal">{{ (r.env || '-').toUpperCase() }}</VChip></td>
              <td>{{ r.name }}</td>
              <td><code class="text-caption">{{ r.url }}</code></td>

              <td>
                <VBtn size="x-small" variant="tonal" color="warning" :loading="purging === `rule-${r.id}`" :disabled="!selectedProject" class="me-1" @click="purgeCache(r)">Purge</VBtn>
                <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEdit(r)">Edit</VBtn>
                <VBtn size="x-small" variant="tonal" color="error" @click="deleteRule(r)">Delete</VBtn>
              </td>
            </tr>
          </tbody>
      </VTable>
      <VCardText v-else class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-bolt" size="48" class="mb-2" />
          <p>No cache rules yet. Click "Add Rule" to create one.</p>
          <p class="text-caption mt-1">Select a project first to enable purge.</p>
        </VCardText>
      </div>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialog" max-width="520">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle>
        <VCardText class="pt-2">
          <VSelect v-model="form.env" :items="envOptions" label="Environment" density="compact" hide-details class="mb-3" clearable />
          <VTextField v-model="form.name" label="Name" density="compact" hide-details class="mb-3" placeholder="getGameList" />
          <VTextField v-model="form.url" label="URL" density="compact" hide-details class="mb-3" placeholder="/apiKK/api/game/getGameList" />

        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!form.name.trim() || !form.url.trim()" @click="save">Save</VBtn>
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
.sticky-table :deep(td:nth-child(2)) { width: 50px; }
.sticky-table :deep(th:nth-child(3)),
.sticky-table :deep(td:nth-child(3)) { width: 60px; }
.sticky-table :deep(th:nth-child(4)),
.sticky-table :deep(td:nth-child(4)) { width: 120px; }
.sticky-table :deep(th:nth-child(5)),
.sticky-table :deep(td:nth-child(5)) { width: 140px; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
