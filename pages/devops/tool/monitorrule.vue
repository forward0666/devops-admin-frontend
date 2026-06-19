<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const MONITOR_GATEWAY = '/monitor'

const rules = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editingId = ref<number | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })
const saving = ref(false)
const checkingIds = ref<number[]>([])

const form = ref({ name: '', description: '', enabled: true, domains: [] as string[] })
const allDomains = ref<string[]>([])
const domainSearch = ref('')
const loadingDomains = ref(false)

const filteredDomains = computed(() => {
  if (!domainSearch.value) return allDomains.value
  const s = domainSearch.value.toLowerCase()
  return allDomains.value.filter(d => d.toLowerCase().includes(s))
})
const allFilteredSelected = computed(() =>
  filteredDomains.value.length > 0 && filteredDomains.value.every(d => form.value.domains.includes(d))
)

async function fetchAllDomains() {
  loadingDomains.value = true
  try {
    const { data } = await apiClient.get('/domain/domain')
    const records = data.data || []
    const names = [...new Set(records.map((r: any) => r.name).filter(Boolean))]
    allDomains.value = names.sort()
  } catch { allDomains.value = [] }
  finally { loadingDomains.value = false }
}

function toggleAllDomains() {
  if (allFilteredSelected.value) {
    form.value.domains = form.value.domains.filter(d => !filteredDomains.value.includes(d))
  } else {
    const s = new Set(form.value.domains)
    filteredDomains.value.forEach(d => s.add(d))
    form.value.domains = [...s]
  }
}

async function fetchRules() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${MONITOR_GATEWAY}/rules`)
    rules.value = (data.data || []).map((r: any) => ({
      ...r,
      domains: Array.isArray(r.domains) ? r.domains : (typeof r.domains === 'string' ? (() => { try { return JSON.parse(r.domains) } catch { return [] } })() : []),
      enabled: !!r.enabled,
    }))
  } catch (e: any) {
    console.error('Failed to fetch rules', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', description: '', enabled: true, domains: [] }
  dialog.value = true
  fetchAllDomains()
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = { name: rule.name || '', description: rule.description || '', enabled: !!rule.enabled, domains: rule.domains ? [...rule.domains] : [] }
  dialog.value = true
  fetchAllDomains()
}

async function save() {
  if (!form.value.name.trim()) { snackbar.value = { show: true, text: 'Name is required', color: 'error' }; return }
  saving.value = true
  try {
    if (editingId.value) {
      await apiClient.put(`${MONITOR_GATEWAY}/rules/${editingId.value}`, form.value)
      snackbar.value = { show: true, text: 'Rule updated', color: 'success' }
    } else {
      await apiClient.post(`${MONITOR_GATEWAY}/rules`, form.value)
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

async function handleDelete(id: number) {
  if (!confirm('Delete this rule?')) return
  try {
    await apiClient.delete(`${MONITOR_GATEWAY}/rules/${id}`)
    snackbar.value = { show: true, text: 'Rule deleted', color: 'success' }
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed to delete', color: 'error' }
  }
}

async function triggerCheck(id: number) {
  checkingIds.value.push(id)
  try {
    await apiClient.post(`${MONITOR_GATEWAY}/rules/${id}/check`)
    snackbar.value = { show: true, text: 'Check triggered', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  } finally {
    checkingIds.value = checkingIds.value.filter(i => i !== id)
  }
}

async function toggleEnabled(rule: any) {
  try {
    await apiClient.post(`${MONITOR_GATEWAY}/rules/${rule.id}/toggle`)
    rule.enabled = !rule.enabled
  } catch (e: any) {
    snackbar.value = { show: true, text: 'Failed to toggle', color: 'error' }
  }
}

onMounted(fetchRules)
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VIcon icon="bx-radar" color="primary" />
        <span class="text-h6">Monitor Rules</span>
        <VChip size="small" color="info" variant="tonal">All domains from domain DB</VChip>
        <VSpacer />
        <VBtn color="primary" size="small" prepend-icon="bx-plus" @click="openCreate">Add Rule</VBtn>
      </VCardText>
    </VCard>

    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <div class="card-scroll">
        <VProgressLinear v-if="loading" indeterminate color="primary" />

        <div v-else-if="rules.length === 0" class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-radar" size="48" class="mb-2" />
          <p>No monitoring rules yet.</p>
        </div>

        <VTable v-else class="text-no-wrap sticky-table" hover density="compact" style="width: 100%;">
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th style="width: 120px;">Name</th>
              <th>Description</th>
              <th style="width: 60px;">Enabled</th>
              <th style="width: 80px;">Status</th>
              <th style="width: 140px;">Last Check</th>
              <th style="width: 60px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.id">
              <td class="font-weight-medium">{{ rule.name }}</td>
              <td class="text-body-2 text-medium-emphasis">{{ rule.description || '-' }}</td>
              <td>
                <VSwitch :model-value="rule.enabled" @click="toggleEnabled(rule)" density="compact" hide-details color="primary" />
              </td>
              <td>
                <VChip size="x-small" :color="rule.status === 'ok' ? 'success' : rule.status === 'running' ? 'info' : rule.status === 'error' ? 'error' : 'grey'" variant="tonal">
                  {{ rule.status || 'pending' }}
                </VChip>
              </td>
              <td class="text-caption">
                <template v-if="rule.last_check">
                  {{ new Date(rule.last_check + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) }}
                </template>
                <span v-else class="text-medium-emphasis">Never</span>
              </td>
              <td>
                <VBtn icon size="x-small" variant="text" color="success" @click="triggerCheck(rule.id)" :loading="checkingIds.includes(rule.id)"><VIcon icon="bx-play" size="16" /></VBtn>
                <VBtn icon size="x-small" variant="text" color="info" @click="openEdit(rule)"><VIcon icon="bx-edit" size="16" /></VBtn>
                <VBtn icon size="x-small" variant="text" color="error" @click="handleDelete(rule.id)"><VIcon icon="bx-trash" size="16" /></VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </VCard>

    <VDialog v-model="dialog" max-width="500">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle>
        <VCardText>
          <VTextField v-model="form.name" label="Rule Name" density="compact" hide-details class="mb-3" />

          <!-- Domain selector -->
          <div class="mb-3">
            <div class="text-caption text-medium-emphasis mb-1">Domains (check to include)</div>
            <VTextField v-model="domainSearch" prepend-inner-icon="bx-search" placeholder="Search domains..." density="compact" hide-details clearable class="mb-2" />
            <div class="d-flex align-center gap-2 mb-1">
              <VCheckbox :model-value="allFilteredSelected" :indeterminate="form.domains.length > 0 && !allFilteredSelected" @click="toggleAllDomains" label="Select All" density="compact" hide-details class="ma-0 pa-0" />
              <VChip size="x-small" color="primary" variant="tonal">{{ form.domains.length }} selected</VChip>
            </div>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid rgba(0,0,0,0.12); border-radius: 4px; padding: 4px 8px;">
              <div v-if="loadingDomains" class="text-center py-2"><VProgressCircular indeterminate size="20" /></div>
              <div v-else-if="filteredDomains.length === 0" class="text-caption text-medium-emphasis py-2">No domains found</div>
              <VCheckbox
                v-for="d in filteredDomains"
                :key="d"
                :model-value="form.domains.includes(d)"
                @click="form.domains.includes(d) ? form.domains = form.domains.filter(x => x !== d) : form.domains.push(d)"
                :label="d"
                density="compact"
                hide-details
                class="ma-0 pa-0"
              />
            </div>
          </div>

          <VTextarea v-model="form.description" label="Description" density="compact" hide-details class="mb-3" rows="2" />
          <VSwitch v-model="form.enabled" label="Enabled" density="compact" hide-details color="primary" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="save">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>

<style scoped>
.sticky-table { display: flex; flex-direction: column; width: 100%; }
.sticky-table :deep(.v-table__wrapper) table { table-layout: fixed !important; width: 100% !important; }
.sticky-table :deep(th), .sticky-table :deep(td) { padding: 2px 8px !important; font-size: 13px; }
.sticky-table :deep(.v-table__wrapper) { flex: 1; min-height: 0; overflow-y: auto; }
.sticky-table :deep(thead) { position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface)); }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(1), .sticky-table :deep(.v-table__wrapper) table td:nth-child(1) { width: 120px !important; min-width: 120px !important; max-width: 120px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(2), .sticky-table :deep(.v-table__wrapper) table td:nth-child(2) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(3), .sticky-table :deep(.v-table__wrapper) table td:nth-child(3) { width: 60px !important; min-width: 60px !important; max-width: 60px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(4), .sticky-table :deep(.v-table__wrapper) table td:nth-child(4) { width: 80px !important; min-width: 80px !important; max-width: 80px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(5), .sticky-table :deep(.v-table__wrapper) table td:nth-child(5) { width: 140px !important; min-width: 140px !important; max-width: 140px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(6), .sticky-table :deep(.v-table__wrapper) table td:nth-child(6) { width: 60px !important; min-width: 60px !important; max-width: 60px !important; text-align: center; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
