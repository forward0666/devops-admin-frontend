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

const form = ref({ name: '', description: '', enabled: true })

async function fetchRules() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${MONITOR_GATEWAY}/rules`)
    rules.value = data.data || []
  } catch (e: any) {
    console.error('Failed to fetch rules', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', description: '', enabled: true }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = { name: rule.name || '', description: rule.description || '', enabled: !!rule.enabled }
  dialog.value = true
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
              <th style="width: 200px;">Name</th>
              <th>Description</th>
              <th style="width: 80px;">Enabled</th>
              <th style="width: 100px;">Status</th>
              <th style="width: 160px;">Last Check</th>
              <th style="width: 120px;">Action</th>
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
                <VBtn size="x-small" variant="tonal" color="success" class="me-1" @click="triggerCheck(rule.id)" :loading="checkingIds.includes(rule.id)">Run</VBtn>
                <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEdit(rule)">Edit</VBtn>
                <VBtn size="x-small" variant="tonal" color="error" @click="handleDelete(rule.id)">Del</VBtn>
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
.sticky-table :deep(.v-table__wrapper) table th:nth-child(1), .sticky-table :deep(.v-table__wrapper) table td:nth-child(1) { width: 200px !important; min-width: 200px !important; max-width: 200px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(3), .sticky-table :deep(.v-table__wrapper) table td:nth-child(3) { width: 80px !important; min-width: 80px !important; max-width: 80px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(4), .sticky-table :deep(.v-table__wrapper) table td:nth-child(4) { width: 100px !important; min-width: 100px !important; max-width: 100px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(5), .sticky-table :deep(.v-table__wrapper) table td:nth-child(5) { width: 160px !important; min-width: 160px !important; max-width: 160px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(6), .sticky-table :deep(.v-table__wrapper) table td:nth-child(6) { width: 120px !important; min-width: 120px !important; max-width: 120px !important; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
