<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const GATEWAY = '/task'
const MONITOR_GATEWAY = '/monitor'
const CF_GATEWAY = '/cloudflare'
const tasks = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editingId = ref<string | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })
const saving = ref(false)

// Form
const form = ref({
  name: '',
  type: '' as string,
  cron: '*/5 * * * *',
  enabled: true,
  description: '',
  config: {} as Record<string, any>,
})

// Task type options
const typeOptions = [
  { title: 'Check Domain', value: 'check_domain', color: 'warning' },
  { title: 'Sync Cloudflare Zone', value: 'sync_zone', color: 'info' },
  { title: 'Sync Domain', value: 'sync_domain', color: 'info' },
  { title: 'Sync Project Domain', value: 'sync_project_domain', color: 'info' },
  { title: 'Sync Cloudflare DNS', value: 'sync_dns', color: 'primary' },
  { title: 'Sync Cloudflare Security', value: 'sync_security', color: 'error' },
  { title: 'Sync Cloudflare Cache', value: 'sync_cache', color: 'success' },
  { title: 'Sync Rule (Push)', value: 'sync_rule', color: 'secondary' },
]

// Cron preset options
const cronPresetOptions = [
  { title: 'Every minute', value: '* * * * *' },
  { title: 'Every 5 minutes', value: '*/5 * * * *' },
  { title: 'Every 10 minutes', value: '*/10 * * * *' },
  { title: 'Every 30 minutes', value: '*/30 * * * *' },
  { title: 'Every hour', value: '0 * * * *' },
  { title: 'Every 6 hours', value: '0 */6 * * *' },
  { title: 'Every day 00:00', value: '0 0 * * *' },
  { title: 'Every day 06:00', value: '0 6 * * *' },
  { title: 'Every week (Mon 00:00)', value: '0 0 * * 1' },
  { title: 'Custom', value: 'custom' },
]

const customCron = ref('')

// Computed
const activeTasks = computed(() => tasks.value.filter(t => t.enabled))
const disabledTasks = computed(() => tasks.value.filter(t => !t.enabled))
const totalTasks = computed(() => tasks.value.length)

const typeColor = (type: string) => {
  const found = typeOptions.find(o => o.value === type)
  return found?.color || 'grey'
}

const typeTitle = (type: string) => {
  const found = typeOptions.find(o => o.value === type)
  return found?.title || type
}

const cronDisplay = (cron: string) => {
  const preset = cronPresetOptions.find(o => o.value === cron)
  if (preset && preset.value !== 'custom') return preset.title
  return cron
}

const isCustomCron = computed(() => form.value.cron === 'custom')
const isCheckDomain = computed(() => form.value.type === 'check_domain')
const isSyncZone = computed(() => ['sync_zone', 'sync_dns', 'sync_security', 'sync_cache'].includes(form.value.type))
const isSyncRule = computed(() => form.value.type === 'sync_rule')
const isSyncProjectDomain = computed(() => form.value.type === 'sync_project_domain')
const monitorRules = ref<any[]>([])
const selectedRuleIds = ref<number[]>([])
const cfAccounts = ref<any[]>([])
const selectedAccountIds = ref<string[]>(['all'])
const syncRules = ref<any[]>([])
const selectedSyncRuleIds = ref<number[]>([])
const syncProjectDomainRules = ref<any[]>([])
const selectedSyncProjectDomainRuleIds = ref<number[]>([])

// When 'all' is selected, clear others; when empty, default to 'all'
watch(selectedAccountIds, (val) => {
  if (val.includes('all') && val.length > 1) {
    selectedAccountIds.value = ['all']
  } else if (val.length === 0) {
    selectedAccountIds.value = ['all']
  }
})
watch(selectedSyncProjectDomainRuleIds, (val) => {
  if (val.includes(-1) && val.length > 1) {
    selectedSyncProjectDomainRuleIds.value = [-1]
  } else if (val.length === 0) {
    selectedSyncProjectDomainRuleIds.value = [-1]
  }
})

// Methods
function resetForm() {
  form.value = {
    name: '',
    type: '',
    cron: '*/5 * * * *',
    enabled: true,
    description: '',
    config: {},
  }
  customCron.value = ''
  selectedRuleIds.value = []
  selectedAccountIds.value = ['all']
  selectedSyncRuleIds.value = []
  selectedSyncProjectDomainRuleIds.value = []
}

function openCreateDialog() {
  editingId.value = null
  resetForm()
  dialog.value = true
}

function openEditDialog(task: any) {
  editingId.value = task.id
  form.value = {
    name: task.name,
    type: task.type,
    cron: task.cron,
    enabled: !!task.enabled,
    description: task.description || '',
    config: task.config || {},
  }
  selectedRuleIds.value = task.config?.rule_ids || []
  selectedAccountIds.value = task.config?.account_ids || ['all']
  selectedSyncRuleIds.value = task.config?.sync_rule_ids || []
  selectedSyncProjectDomainRuleIds.value = task.config?.sync_project_domain_rule_ids || []
  if (!cronPresetOptions.find(o => o.value === task.cron)) {
    form.value.cron = 'custom'
    customCron.value = task.cron
  }
  dialog.value = true
}

async function fetchCfAccounts() {
  try {
    const { data } = await apiClient.get('/cloudflare/accounts', { params: { platform: 'cloudflare' } })
    cfAccounts.value = data.data || data || []
  } catch (e) {
    console.error('Failed to fetch CF accounts', e)
  }
}

async function fetchMonitorRules() {
  try {
    const { data } = await apiClient.get(`${MONITOR_GATEWAY}/rules`)
    monitorRules.value = (data.data || data || []).filter((r: any) => r.enabled)
  } catch (e) {
    console.error('Failed to fetch monitor rules', e)
  }
}

async function fetchSyncProjectDomainRules() {
  try {
    const { data } = await apiClient.get('/domain/sync_domain/rules')
    syncProjectDomainRules.value = (data.data || []).map((r: any) => ({ id: r.id, name: r.name || `Rule #${r.id}` }))
  } catch (e) {
    console.error('Failed to fetch sync project domain rules', e)
  }
}

async function fetchSyncRules() {
  try {
    const resp = await apiClient.get(`${CF_GATEWAY}/syncRules`, { params: { account_id: -1, platform: 'cloudflare' }, timeout: 200000 })
    const rows = resp?.data?.data || resp?.data || []
    syncRules.value = Array.isArray(rows) ? rows.map((r: any) => ({
      id: r.id,
      name: r.description || r.name || `Rule #${r.id}`,
    })) : []
  } catch (e) {
    console.error('Failed to fetch sync rules', e)
  }
}

async function fetchTasks() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${GATEWAY}/tasks`)
    tasks.value = data.data || data || []
  } catch (e: any) {
    console.error('Failed to fetch tasks', e)
  } finally {
    loading.value = false
  }
}

async function saveTask() {
  if (!form.value.name.trim()) {
    snackbar.value = { show: true, text: 'Task name is required', color: 'error' }
    return
  }
  const cron = isCustomCron.value ? customCron.value.trim() : form.value.cron
  if (!cron) {
    snackbar.value = { show: true, text: 'Cron expression is required', color: 'error' }
    return
  }
  if (isSyncZone.value && selectedAccountIds.value.length === 0) {
    snackbar.value = { show: true, text: 'Select at least one account', color: 'error' }
    return
  }
  if (isCheckDomain.value && selectedRuleIds.value.length === 0) {
    snackbar.value = { show: true, text: 'Select at least one monitor rule', color: 'error' }
    return
  }
  if (isSyncRule.value && selectedSyncRuleIds.value.length === 0) {
    snackbar.value = { show: true, text: 'Select at least one sync rule', color: 'error' }
    return
  }
  if (isSyncProjectDomain.value && selectedSyncProjectDomainRuleIds.value.length === 0) {
    snackbar.value = { show: true, text: 'Select at least one rule', color: 'error' }
    return
  }
  saving.value = true
  try {
    const payload = { ...form.value, cron, config: { rule_ids: selectedRuleIds.value, account_ids: selectedAccountIds.value, sync_rule_ids: selectedSyncRuleIds.value, sync_project_domain_rule_ids: selectedSyncProjectDomainRuleIds.value } }
    if (editingId.value) {
      await apiClient.put(`${GATEWAY}/tasks/${editingId.value}`, payload)
      snackbar.value = { show: true, text: 'Task updated', color: 'success' }
    } else {
      await apiClient.post(`${GATEWAY}/tasks`, payload)
      snackbar.value = { show: true, text: 'Task created', color: 'success' }
    }
    dialog.value = false
    await fetchTasks()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to save task', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function deleteTask(task: any) {
  if (!confirm(`Delete task "${task.name}"?`)) return
  try {
    await apiClient.delete(`${GATEWAY}/tasks/${task.id}`)
    snackbar.value = { show: true, text: 'Task deleted', color: 'success' }
    await fetchTasks()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to delete task', color: 'error' }
  }
}

async function toggleTask(task: any) {
  try {
    await apiClient.patch(`${GATEWAY}/tasks/${task.id}`, { enabled: !task.enabled })
    task.enabled = !task.enabled
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to toggle', color: 'error' }
  }
}

async function runTaskNow(task: any) {
  try {
    await apiClient.post(`${GATEWAY}/tasks/${task.id}/run`, null, { timeout: 200000 })
    snackbar.value = { show: true, text: `Task "${task.name}" triggered`, color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to trigger', color: 'error' }
  }
}

onMounted(() => {
  fetchTasks()
  fetchMonitorRules()
  fetchCfAccounts()
  fetchSyncRules()
  fetchSyncProjectDomainRules()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Stats Cards -->
    <div class="d-flex gap-4 mb-4 flex-wrap">
      <VCard class="pa-4" style="min-width: 140px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Total</div>
        <div class="text-h4 font-weight-bold">{{ totalTasks }}</div>
      </VCard>
      <VCard class="pa-4" style="min-width: 140px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Active</div>
        <div class="text-h4 font-weight-bold text-success">{{ activeTasks.length }}</div>
      </VCard>
      <VCard class="pa-4" style="min-width: 140px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Disabled</div>
        <div class="text-h4 font-weight-bold text-disabled">{{ disabledTasks.length }}</div>
      </VCard>
    </div>

    <!-- Filter Bar -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" @click="openCreateDialog">
          Add Task
        </VBtn>
        <VSpacer />
        <VBtn icon="bx-refresh" variant="text" size="small" :loading="loading" @click="fetchTasks" />
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VTable hover density="compact" class="text-no-wrap sticky-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Cron</th>
            <th>Description</th>
            <th>Status</th>
            <th>Last Run</th>
            <th style="width: 120px;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tasks" :key="item.id">
            <td>
              <div class="text-body-1 font-weight-medium">{{ item.name }}</div>
            </td>
            <td>
              <VChip variant="tonal" :color="typeColor(item.type)" size="small" label>
                {{ typeTitle(item.type) }}
              </VChip>
            </td>
            <td>
              <code class="text-body-2">{{ item.cron }}</code>
              <div class="text-caption text-medium-emphasis">{{ cronDisplay(item.cron) }}</div>
            </td>
            <td class="text-body-2 text-medium-emphasis">{{ item.description || '-' }}</td>
            <td>
              <VChip variant="tonal" :color="item.enabled ? 'success' : 'error'" size="small" label>
                {{ item.enabled ? 'Active' : 'Disabled' }}
              </VChip>
            </td>
            <td>
              <div v-if="item.last_run_at" class="text-caption">
                <div>{{ new Date(item.last_run_at + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) }}</div>
                <VChip size="x-small" :color="item.last_status === 'success' ? 'success' : 'error'" variant="tonal" class="mt-1">{{ item.last_status || '-' }}</VChip>
              </div>
              <span v-else class="text-caption text-medium-emphasis">Never</span>
            </td>
            <td>
              <VTooltip text="Run Now">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon variant="text" color="success" size="small" @click="runTaskNow(item)">
                    <VIcon icon="bx-play" />
                  </VBtn>
                </template>
              </VTooltip>
              <VTooltip text="Edit">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon variant="text" color="primary" size="small" @click="openEditDialog(item)">
                    <VIcon icon="bx-edit" />
                  </VBtn>
                </template>
              </VTooltip>
              <VTooltip text="Delete">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon variant="text" color="error" size="small" @click="deleteTask(item)">
                    <VIcon icon="bx-trash" />
                  </VBtn>
                </template>
              </VTooltip>
            </td>
          </tr>
          <tr v-if="!loading && tasks.length === 0">
            <td colspan="8" class="text-center py-16 text-medium-emphasis">
              <VIcon icon="bx-list-check" size="48" class="mb-4" style="opacity: 0.3" />
              <div class="text-body-1">No tasks configured</div>
              <div class="text-caption">Click "Add Task" to create a scheduled task</div>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- Create/Edit Dialog -->
    <VDialog v-model="dialog" max-width="550">
      <VCard>
        <VCardTitle class="d-flex align-center">
          {{ editingId ? 'Edit Task' : 'Add Task' }}
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VTextField v-model="form.name" label="Task Name" class="mb-4" variant="outlined" :rules="[v => !!v?.trim() || 'Required']" />
          <VSelect v-model="form.type" :items="typeOptions" item-title="title" item-value="value" label="Task Type" class="mb-4" variant="outlined" />
          <VSelect
            v-model="form.cron"
            :items="cronPresetOptions"
            item-title="title"
            item-value="value"
            label="Schedule"
            class="mb-4"
            variant="outlined"
          />
          <VTextField
            v-if="isCustomCron"
            v-model="customCron"
            label="Custom Cron Expression"
            placeholder="0 */2 * * *"
            class="mb-4"
            variant="outlined"
            hint="Example: 0 */2 * * * (every 2 hours)"
          />
          <VTextarea v-model="form.description" label="Description" rows="2" class="mb-4" variant="outlined" hide-details />
          <VSelect
            v-if="isCheckDomain"
            v-model="selectedRuleIds"
            :items="monitorRules"
            item-title="name"
            item-value="id"
            label="Monitor Rules"
            class="mb-4"
            variant="outlined"
            multiple
            chips
            hint="Select monitor rules to check (required)"
            persistent-hint
          />
          <VSelect
            v-if="isSyncZone"
            v-model="selectedAccountIds"
            :items="[{ id: 'all', name: 'All' }, ...cfAccounts]"
            item-title="name"
            item-value="id"
            label="Cloudflare Accounts"
            class="mb-4"
            variant="outlined"
            multiple
            chips
            hint="Select accounts to sync (required)"
            persistent-hint
          />
          <VSelect
            v-if="isSyncRule"
            v-model="selectedSyncRuleIds"
            :items="syncRules"
            item-title="name"
            item-value="id"
            label="Sync Rules"
            class="mb-4"
            variant="outlined"
            multiple
            chips
            hint="Select sync rules to push (required)"
            persistent-hint
          />
          <VSelect
            v-if="isSyncProjectDomain"
            v-model="selectedSyncProjectDomainRuleIds"
            :items="[{ id: -1, name: 'All' }, ...syncProjectDomainRules]"
            item-title="name"
            item-value="id"
            label="Sync Project Domain Rules"
            class="mb-4"
            variant="outlined"
            multiple
            chips
            hint="Select rules to sync (required, or select All)"
            persistent-hint
          />
          <VSwitch v-model="form.enabled" label="Enabled" color="success" hide-details />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="saveTask">{{ editingId ? 'Save' : 'Create' }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top" :timeout="3000">
      {{ snackbar.text }}
    </VSnackbar>
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
