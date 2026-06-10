<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const AGENT_GATEWAY = '/agent'
const items = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const form = ref({
  name: '',
  description: '',
  config: {} as Record<string, any>,
  enabled: true,
})

async function fetchItems() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${AGENT_GATEWAY}/tools`)
    items.value = data?.data || []
  } catch (e) {
    console.error('Failed to fetch tools', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', description: '', config: {}, enabled: true }
  dialog.value = true
}

function openEdit(item: any) {
  editingId.value = item.id
  form.value = {
    name: item.name || '',
    description: item.description || '',
    config: item.config || {},
    enabled: !!item.enabled,
  }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim()) {
    snackbar.value = { show: true, text: 'Name is required', color: 'error' }
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await apiClient.put(`${AGENT_GATEWAY}/tools/${editingId.value}`, form.value)
      snackbar.value = { show: true, text: 'Tool updated', color: 'success' }
    } else {
      await apiClient.post(`${AGENT_GATEWAY}/tools`, form.value)
      snackbar.value = { show: true, text: 'Tool created', color: 'success' }
    }
    dialog.value = false
    await fetchItems()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function handleDelete(item: any) {
  if (!confirm(`Delete "${item.name}"?`)) return
  try {
    await apiClient.delete(`${AGENT_GATEWAY}/tools/${item.id}`)
    snackbar.value = { show: true, text: 'Tool deleted', color: 'success' }
    await fetchItems()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  }
}

async function toggleEnabled(item: any) {
  try {
    await apiClient.patch(`${AGENT_GATEWAY}/tools/${item.id}`, { enabled: !item.enabled })
    item.enabled = !item.enabled
  } catch (e: any) {
    snackbar.value = { show: true, text: 'Failed to toggle', color: 'error' }
  }
}

const statusColors: Record<string, string> = { online: 'success', offline: 'grey', error: 'error' }

onMounted(() => fetchItems())
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Tool Management</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage custom tools</p>
        </div>
        <VBtn color="primary" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Tool
        </VBtn>
      </VCardText>
    </VCard>

    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="items.length > 0" class="sticky-table" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 180px" />
          <col style="width: 280px" />
          <col style="width: 200px" />
          <col style="width: 80px" />
          <col style="width: 80px" />
          <col style="width: 130px" />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Enabled</th>
            <th>Created</th>
            <th style="text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td class="font-weight-medium">{{ item.name }}</td>
            <td class="text-caption text-medium-emphasis">{{ item.description || '-' }}</td>
            <td>
              <VChip size="x-small" :color="statusColors[item.status] || 'grey'" variant="tonal">
                {{ item.status || 'offline' }}
              </VChip>
            </td>
            <td>
              <VSwitch :model-value="item.enabled" @update:model-value="toggleEnabled(item)" color="success" density="compact" hide-details />
            </td>
            <td class="text-caption text-medium-emphasis">{{ item.created_at ? new Date(item.created_at + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
            <td style="text-align: center;">
              <VTooltip text="Edit">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="primary" @click="openEdit(item)">
                    <VIcon icon="bx-edit" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
              <VTooltip text="Delete">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="error" @click="handleDelete(item)">
                    <VIcon icon="bx-trash" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loading" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-wrench" size="48" class="mb-2" />
        <p>No tools yet. Click "Add Tool" to create one.</p>
      </VCardText>
    </VCard>

    <VDialog v-model="dialog" max-width="600">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Tool' : 'Add Tool' }}</VCardTitle>
        <VDivider />
        <VCardText>
          <VTextField v-model="form.name" label="Tool Name" class="mb-3" variant="outlined" hint="e.g. tool-weather, tool-k8s" persistent-hint />
          <VTextarea v-model="form.description" label="Description" rows="3" variant="outlined" hide-details />
          <VSwitch v-model="form.enabled" label="Enabled" color="success" hide-details class="mt-3" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="save">{{ editingId ? 'Save' : 'Create' }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>

<style scoped>
.sticky-table { display: flex; flex-direction: column; }
.sticky-table :deep(.v-table__wrapper) { flex: 1; min-height: 0; overflow-y: auto; }
.sticky-table :deep(thead) { position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface)); }
</style>
