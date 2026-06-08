<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const AGENT_GATEWAY = '/agent'
const agents = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const form = ref({
  name: '',
  type: 'weather',
  mcp_url: '',
  description: '',
  config: {} as Record<string, any>,
  enabled: true,
})

const typeOptions = [
  { title: 'Weather', value: 'weather' },
  { title: 'DevOps', value: 'devops' },
  { title: 'Custom', value: 'custom' },
]

const statusColors: Record<string, string> = {
  online: 'success',
  offline: 'grey',
  error: 'error',
}

async function fetchAgents() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${AGENT_GATEWAY}`)
    agents.value = data?.data || []
  } catch (e) {
    console.error('Failed to fetch agents', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', type: 'weather', mcp_url: '', description: '', config: {}, enabled: true }
  dialog.value = true
}

function openEdit(agent: any) {
  editingId.value = agent.id
  form.value = {
    name: agent.name || '',
    type: agent.type || 'weather',
    mcp_url: agent.mcp_url || '',
    description: agent.description || '',
    config: agent.config || {},
    enabled: !!agent.enabled,
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
      await apiClient.put(`${AGENT_GATEWAY}/${editingId.value}`, form.value)
      snackbar.value = { show: true, text: 'Agent updated', color: 'success' }
    } else {
      await apiClient.post(`${AGENT_GATEWAY}`, form.value)
      snackbar.value = { show: true, text: 'Agent created', color: 'success' }
    }
    dialog.value = false
    await fetchAgents()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function handleDelete(agent: any) {
  if (!confirm(`Delete "${agent.name}"?`)) return
  try {
    await apiClient.delete(`${AGENT_GATEWAY}/${agent.id}`)
    snackbar.value = { show: true, text: 'Agent deleted', color: 'success' }
    await fetchAgents()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  }
}

async function toggleEnabled(agent: any) {
  try {
    await apiClient.patch(`${AGENT_GATEWAY}/${agent.id}`, { enabled: !agent.enabled })
    agent.enabled = !agent.enabled
  } catch (e: any) {
    snackbar.value = { show: true, text: 'Failed to toggle', color: 'error' }
  }
}

async function checkStatus(agent: any) {
  try {
    const { data } = await apiClient.get(`${AGENT_GATEWAY}/${agent.id}/status`)
    agent.status = data?.data?.status || 'offline'
  } catch {
    agent.status = 'offline'
  }
}

const activeAgents = computed(() => agents.value.filter(a => a.enabled))
const onlineAgents = computed(() => agents.value.filter(a => a.status === 'online'))

onMounted(() => fetchAgents())
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Agent Management</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage AI agents and their MCP connections</p>
        </div>
        <VChip size="small" color="primary" variant="tonal">Total: {{ agents.length }}</VChip>
        <VChip size="small" color="success" variant="tonal">Online: {{ onlineAgents.length }}</VChip>
        <VBtn color="primary" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Agent
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="agents.length > 0" class="sticky-table" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 180px" />
          <col style="width: 100px" />
          <col style="width: 280px" />
          <col style="width: 200px" />
          <col style="width: 80px" />
          <col style="width: 80px" />
          <col style="width: 130px" />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>MCP URL</th>
            <th>Description</th>
            <th>Status</th>
            <th>Enabled</th>
            <th style="text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="agent in agents" :key="agent.id">
            <td class="font-weight-medium">{{ agent.name }}</td>
            <td>
              <VChip size="x-small" variant="tonal" color="primary">{{ agent.type }}</VChip>
            </td>
            <td>
              <code class="text-caption">{{ agent.mcp_url || '-' }}</code>
            </td>
            <td class="text-caption text-medium-emphasis">{{ agent.description || '-' }}</td>
            <td>
              <VChip size="x-small" :color="statusColors[agent.status] || 'grey'" variant="tonal">
                {{ agent.status || 'offline' }}
              </VChip>
            </td>
            <td>
              <VSwitch
                :model-value="agent.enabled"
                @update:model-value="toggleEnabled(agent)"
                color="success"
                density="compact"
                hide-details
              />
            </td>
            <td style="text-align: center;">
              <VTooltip text="Check Status">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="info" @click="checkStatus(agent)">
                    <VIcon icon="bx-refresh" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
              <VTooltip text="Edit">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="primary" @click="openEdit(agent)">
                    <VIcon icon="bx-edit" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
              <VTooltip text="Delete">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="error" @click="handleDelete(agent)">
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
        <p>No agents yet. Click "Add Agent" to create one.</p>
      </VCardText>
    </VCard>

    <!-- Dialog -->
    <VDialog v-model="dialog" max-width="600">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Agent' : 'Add Agent' }}</VCardTitle>
        <VDivider />
        <VCardText>
          <VTextField v-model="form.name" label="Agent Name" class="mb-3" variant="outlined" hint="e.g. Weather Assistant" persistent-hint />
          <VSelect v-model="form.type" :items="typeOptions" label="Type" class="mb-3" variant="outlined" />
          <VTextField v-model="form.mcp_url" label="MCP Server URL" class="mb-3" variant="outlined" hint="e.g. http://192.168.86.24:8092/sse" persistent-hint />
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
