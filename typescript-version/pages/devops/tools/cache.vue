<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'
import { useCfAccount } from '~/composables/useCfAccount'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const { accounts, loading: loadingAccounts, fetchAccounts, getToken } = useCfAccount()

const route = useRoute()
if (route.query.project) selectedProject.value = Number(route.query.project)
if (route.query.env) selectedEnv.value = route.query.env as string

const projects = ref<any[]>([])
const domains = ref<any[]>([])
const rules = ref<any[]>([])
const selectedProject = ref<number | null>(null)
const selectedEnv = ref<string | null>(null)
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
    const [projectRes, domainRes] = await Promise.all([
      apiClient.get('/user/project'),
      apiClient.get('/user/domain/list', selectedProject.value ? { params: { projectId: selectedProject.value } } : {}),
    ])
    projects.value = projectRes.data?.data || []
    domains.value = domainRes.data?.data || []
    // TODO: fetch cache rules from backend when ready
    // rules.value = (await apiClient.get('/user/cacheRule/list', { params: { projectId: selectedProject.value } })).data?.data || []
  } catch (e) {
    console.error('Failed to fetch', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
watch(selectedProject, fetchData)

// --- CRUD Dialog ---
const dialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', url: '', callbackData: '', cfAccountId: null as number | null })
const saving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

function openCreate() {
  editingId.value = null
  form.value = { name: '', url: '', callbackData: '', cfAccountId: accounts.value.length > 0 ? accounts.value[0].id : null }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = { name: rule.name, url: rule.url, callbackData: rule.callbackData, cfAccountId: rule.cfAccountId }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim() || !form.value.url.trim()) return
  saving.value = true
  try {
    // TODO: POST/PUT to backend
    snackbar.value = { show: true, text: editingId.value ? 'Rule updated' : 'Rule created', color: 'success' }
    dialog.value = false
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Failed', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function deleteRule(rule: any) {
  if (!confirm(`Delete "${rule.name}"?`)) return
  try {
    // TODO: DELETE to backend
    snackbar.value = { show: true, text: 'Rule deleted', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: 'Failed to delete', color: 'error' }
  }
}

// --- Purge ---
const purging = ref<string | null>(null)

async function purgeCache(rule: any) {
  if (!selectedProject.value) return
  purging.value = `rule-${rule.id}`
  try {
    const token = await getToken(rule.cfAccountId)
    let purged = 0
    for (const d of filteredDomains.value) {
      const fullUrl = `https://${d.domain}${rule.url}`
      try {
        await apiClient.post(`${CF_GATEWAY}/cache/purgeByUrl`, { files: [fullUrl] }, { headers: { 'X-Cf-Token': token } })
        purged++
      } catch (e: any) {
        console.error(`Purge failed for ${fullUrl}`, e)
      }
    }
    snackbar.value = { show: true, text: `Purged ${purged}/${filteredDomains.value.length} domains`, color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Purge failed', color: 'error' }
  } finally {
    purging.value = null
  }
}

const cfAccountOptions = computed(() => accounts.value.map((a: any) => ({ title: a.name, value: a.id })))

onMounted(() => fetchAccounts())
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
      <VCardTitle class="pt-4 px-6">Cache Rules</VCardTitle>
      <VCardSubtitle class="px-6">Manage API cache purge rules</VCardSubtitle>
      <div style="flex: 1; min-height: 0; overflow-y: auto;">
        <VTable v-if="rules.length > 0" class="text-no-wrap" hover density="compact" style="table-layout: fixed; width: 100%;">
          <colgroup>
            <col style="width: 160px" />
            <col style="width: 280px" />
            <col style="width: 280px" />
            <col style="width: 140px" />
            <col style="width: 180px" />
          </colgroup>
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th>Name</th>
              <th>URL</th>
              <th>Callback Data</th>
              <th>CF Account</th>
              <th style="text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rules" :key="r.id">
              <td class="font-weight-medium">{{ r.name }}</td>
              <td><code class="text-caption">{{ r.url }}</code></td>
              <td><code class="text-caption">{{ r.callbackData }}</code></td>
              <td class="text-caption">{{ r.cfAccountName || '-' }}</td>
              <td class="text-center">
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
          <VTextField v-model="form.name" label="Name" density="compact" hide-details class="mb-3" placeholder="getGameList" />
          <VTextField v-model="form.url" label="URL" density="compact" hide-details class="mb-3" placeholder="/apiKK/api/game/getGameList" />
          <VTextField v-model="form.callbackData" label="TG Callback Data" density="compact" hide-details class="mb-3" placeholder="callback_data_getGameList" />
          <VSelect v-model="form.cfAccountId" :items="cfAccountOptions" label="CF Account" density="compact" hide-details />
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
