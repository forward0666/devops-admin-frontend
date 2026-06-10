<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const AGENT_GATEWAY = '/agent'
const models = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const showApiKey = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const form = ref({
  name: '',
  provider: 'openai',
  model_id: '',
  base_url: '',
  api_key: '',
  description: '',
  enabled: true,
})

const providerOptions = [
  { title: 'OpenAI', value: 'openai' },
  { title: 'Anthropic', value: 'anthropic' },
  { title: 'Xiaomi (MiMo)', value: 'xiaomi' },
  { title: 'Google (Gemini)', value: 'google' },
  { title: 'DeepSeek', value: 'deepseek' },
  { title: 'Zhipu (GLM)', value: 'zhipu' },
  { title: 'Custom', value: 'custom' },
]

const providerDefaults: Record<string, { base_url: string; model_id: string }> = {
  openai: { base_url: 'https://api.openai.com/v1', model_id: 'gpt-4o' },
  anthropic: { base_url: 'https://api.anthropic.com', model_id: 'claude-sonnet-4-20250514' },
  xiaomi: { base_url: 'https://token-plan-sgp.xiaomimimo.com/v1', model_id: 'mimo-v2.5-pro' },
  google: { base_url: 'https://generativelanguage.googleapis.com/v1beta', model_id: 'gemini-2.5-pro' },
  deepseek: { base_url: 'https://api.deepseek.com/v1', model_id: 'deepseek-chat' },
  zhipu: { base_url: 'https://open.bigmodel.cn/api/paas/v4', model_id: 'glm-5' },
}

function onProviderChange() {
  const defaults = providerDefaults[form.value.provider]
  if (defaults) {
    if (!form.value.base_url) form.value.base_url = defaults.base_url
    if (!form.value.model_id) form.value.model_id = defaults.model_id
  }
}

async function fetchModels() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${AGENT_GATEWAY}/models`)
    models.value = data?.data || []
  } catch (e) {
    console.error('Failed to fetch models', e)
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  editingId.value = null
  showApiKey.value = false
  form.value = { name: '', provider: 'openai', model_id: '', base_url: '', api_key: '', description: '', enabled: true }
  onProviderChange()
  dialog.value = true
}

function openEdit(model: any) {
  editingId.value = model.id
  showApiKey.value = false
  form.value = {
    name: model.name || '',
    provider: model.provider || 'openai',
    model_id: model.model_id || '',
    base_url: model.base_url || '',
    api_key: '', // Don't fill in for security
    description: model.description || '',
    enabled: !!model.enabled,
  }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim()) {
    snackbar.value = { show: true, text: 'Name is required', color: 'error' }
    return
  }
  if (!form.value.model_id.trim()) {
    snackbar.value = { show: true, text: 'Model ID is required', color: 'error' }
    return
  }
  saving.value = true
  try {
    const payload: any = { ...form.value }
    // Don't overwrite with empty api_key on edit
    if (editingId.value && !payload.api_key) {
      delete payload.api_key
    }
    if (editingId.value) {
      await apiClient.put(`${AGENT_GATEWAY}/models/${editingId.value}`, payload)
      snackbar.value = { show: true, text: 'Model updated', color: 'success' }
    } else {
      await apiClient.post(`${AGENT_GATEWAY}/models`, payload)
      snackbar.value = { show: true, text: 'Model created', color: 'success' }
    }
    dialog.value = false
    await fetchModels()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function handleDelete(model: any) {
  if (!confirm(`Delete "${model.name}"?`)) return
  try {
    await apiClient.delete(`${AGENT_GATEWAY}/models/${model.id}`)
    snackbar.value = { show: true, text: 'Model deleted', color: 'success' }
    await fetchModels()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  }
}

async function toggleEnabled(model: any) {
  try {
    await apiClient.patch(`${AGENT_GATEWAY}/models/${model.id}`, { enabled: !model.enabled })
    model.enabled = !model.enabled
  } catch (e: any) {
    snackbar.value = { show: true, text: 'Failed to toggle', color: 'error' }
  }
}

onMounted(() => {
  fetchModels()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Model Management</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage AI model configurations for agents</p>
        </div>
        <VChip size="small" color="primary" variant="tonal">Total: {{ models.length }}</VChip>
        <VBtn color="primary" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Model
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="models.length > 0" class="sticky-table" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 150px" />
          <col style="width: 100px" />
          <col style="width: 200px" />
          <col style="width: 280px" />
          <col style="width: 120px" />
          <col style="width: 200px" />
          <col style="width: 80px" />
          <col style="width: 120px" />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Provider</th>
            <th>Model ID</th>
            <th>Base URL</th>
            <th>API Key</th>
            <th>Description</th>
            <th>Enabled</th>
            <th style="text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="model in models" :key="model.id">
            <td class="font-weight-medium">{{ model.name }}</td>
            <td>
              <VChip size="x-small" variant="tonal" color="primary">{{ model.provider }}</VChip>
            </td>
            <td>
              <code class="text-caption">{{ model.model_id }}</code>
            </td>
            <td>
              <code class="text-caption">{{ model.base_url || '-' }}</code>
            </td>
            <td>
              <code class="text-caption">{{ model.api_key_masked || '-' }}</code>
            </td>
            <td class="text-caption text-medium-emphasis">{{ model.description || '-' }}</td>
            <td>
              <VSwitch
                :model-value="model.enabled"
                @update:model-value="toggleEnabled(model)"
                color="success"
                density="compact"
                hide-details
              />
            </td>
            <td style="text-align: center;">
              <VTooltip text="Edit">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="primary" @click="openEdit(model)">
                    <VIcon icon="bx-edit" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
              <VTooltip text="Delete">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="error" @click="handleDelete(model)">
                    <VIcon icon="bx-trash" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loading" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-bot" size="48" class="mb-2" />
        <p>No models yet. Click "Add Model" to create one.</p>
      </VCardText>
    </VCard>

    <!-- Dialog -->
    <VDialog v-model="dialog" max-width="650">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Model' : 'Add Model' }}</VCardTitle>
        <VDivider />
        <VCardText>
          <VTextField v-model="form.name" label="Display Name" class="mb-3" variant="outlined" hint="e.g. GPT-4o, MiMo Pro" persistent-hint />
          <VSelect v-model="form.provider" :items="providerOptions" label="Provider" class="mb-3" variant="outlined" @update:model-value="onProviderChange" />
          <VTextField v-model="form.model_id" label="Model ID" class="mb-3" variant="outlined" hint="e.g. gpt-4o, mimo-v2.5-pro, glm-5" persistent-hint />
          <VTextField v-model="form.base_url" label="Base URL" class="mb-3" variant="outlined" hint="API endpoint base URL" persistent-hint />
          <VTextField
            v-model="form.api_key"
            :type="showApiKey ? 'text' : 'password'"
            :label="editingId ? 'API Key (leave empty to keep current)' : 'API Key'"
            class="mb-3"
            variant="outlined"
            :append-inner-icon="showApiKey ? 'bx-hide' : 'bx-show'"
            @click:append-inner="showApiKey = !showApiKey"
          />
          <VTextarea v-model="form.description" label="Description" rows="2" class="mb-3" variant="outlined" hide-details />
          <VSwitch v-model="form.enabled" label="Enabled" color="success" hide-details />
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
.sticky-table {
  display: flex;
  flex-direction: column;
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
