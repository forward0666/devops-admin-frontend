<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'
import { useCfAccount } from '~/composables/useCfAccount'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const { accounts, loading: loadingAccounts, fetchAccounts, getToken } = useCfAccount()

// State
const rules = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editingId = ref<string | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })
const saving = ref(false)
const checkingIds = ref<number[]>([])

// Form
const form = ref({
  name: '',
  source: 'cloudflare' as 'cloudflare' | 'tencent' | 'custom',
  accountId: null as number | null,
  domains: [] as string[],
  customDomains: '',
  checkInterval: 5,
  enabled: true,
})

// Domain source options
const sourceOptions = [
  { title: 'Cloudflare', value: 'cloudflare' },
  { title: 'Tencent', value: 'tencent' },
  { title: 'Custom', value: 'custom' },
]

// Cloudflare domains (from dnsDomain)
const cfDomains = ref<string[]>([])
const loadingCfDomains = ref(false)

// Tencent domains (placeholder)
const tencentDomains = ref<string[]>([])
const loadingTencentDomains = ref(false)

// Check interval options
const intervalOptions = [
  { title: '1 min', value: 1 },
  { title: '5 min', value: 5 },
  { title: '10 min', value: 10 },
  { title: '30 min', value: 30 },
  { title: '60 min', value: 60 },
]

// Computed
const accountOptions = computed(() => [
  { title: 'All', value: -1 },
  ...accounts.value.map((a: any) => ({ title: a.name, value: a.id })),
])

const domainOptions = computed(() => {
  if (form.value.source === 'cloudflare') {
    return [{ title: 'All', value: 'all' }, ...cfDomains.value.map((d: string) => ({ title: d, value: d }))]
  } else if (form.value.source === 'tencent') {
    return [{ title: 'All', value: 'all' }, ...tencentDomains.value.map((d: string) => ({ title: d, value: d }))]
  }
  return []
})

// Methods
async function fetchCfDomains() {
  loadingCfDomains.value = true
  try {
    const params: Record<string, any> = {}
    if (form.value.accountId && form.value.accountId !== -1) params.account_id = form.value.accountId
    const { data } = await apiClient.get(`${CF_GATEWAY}/dnsDomain`, { params })
    const records = data.data || []
    // Extract unique domain names
    const names = [...new Set(records.map((r: any) => r.name).filter(Boolean))]
    cfDomains.value = names.sort()
  } catch (e: any) {
    console.error('Failed to fetch CF domains', e)
  } finally {
    loadingCfDomains.value = false
  }
}

async function fetchTencentDomains() {
  loadingTencentDomains.value = true
  try {
    // TODO: Replace with actual Tencent API call
    tencentDomains.value = []
  } catch (e: any) {
    console.error('Failed to fetch Tencent domains', e)
  } finally {
    loadingTencentDomains.value = false
  }
}

const MONITOR_GATEWAY = '/monitor'

async function fetchRules() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${MONITOR_GATEWAY}/rules`)
    rules.value = (data.data || []).map((r: any) => {
      let domains = r.domains
      if (typeof domains === 'string') {
        try { domains = JSON.parse(domains) } catch { domains = [] }
      }
      return {
        ...r,
        domains: domains || [],
        checkInterval: r.check_interval ?? r.checkInterval ?? 5,
        accountId: r.account_id ?? r.accountId,
        customDomains: r.custom_domains ?? r.customDomains ?? '',
        lastCheck: r.last_check ?? r.lastCheck,
      }
    })
  } catch (e: any) {
    console.error('Failed to fetch rules', e)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = {
    name: '',
    source: 'cloudflare',
    accountId: null,
    domains: [],
    customDomains: '',
    checkInterval: 5,
    enabled: true,
  }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = {
    name: rule.name,
    source: rule.source,
    accountId: rule.accountId || rule.account_id || null,
    domains: Array.isArray(rule.domains) ? [...rule.domains] : [],
    customDomains: rule.customDomains || rule.custom_domains || '',
    checkInterval: rule.checkInterval || rule.check_interval || 5,
    enabled: !!rule.enabled,
  }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim()) {
    snackbar.value = { show: true, text: 'Name is required', color: 'error' }
    return
  }

  if (form.value.source === 'custom' && !form.value.customDomains.trim()) {
    snackbar.value = { show: true, text: 'Please enter at least one domain', color: 'error' }
    return
  }

  if (form.value.source !== 'custom' && form.value.domains.length === 0) {
    snackbar.value = { show: true, text: 'Please select at least one domain', color: 'error' }
    return
  }

  saving.value = true
  try {
    const body = {
      name: form.value.name,
      source: form.value.source,
      accountId: form.value.accountId,
      domains: form.value.domains,
      customDomains: form.value.customDomains,
      checkInterval: form.value.checkInterval,
      enabled: form.value.enabled,
    }
    if (editingId.value) {
      await apiClient.put(`${MONITOR_GATEWAY}/rules/${editingId.value}`, body)
      snackbar.value = { show: true, text: 'Rule updated', color: 'success' }
    } else {
      await apiClient.post(`${MONITOR_GATEWAY}/rules`, body)
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

async function handleDelete(id: string) {
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
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed to trigger check', color: 'error' }
  } finally {
    checkingIds.value = checkingIds.value.filter(i => i !== id)
  }
}

// Watchers
watch(() => form.value.domains, (val) => {
  if (val.includes('all') && val.length > 1) {
    // If 'all' is selected along with specific domains, just keep 'all'
    form.value.domains = ['all']
  }
}, { deep: true })

watch(() => form.value.source, (val) => {
  form.value.domains = []
  form.value.accountId = null
  if (val === 'tencent' && tencentDomains.value.length === 0) {
    fetchTencentDomains()
  }
})

watch(() => form.value.accountId, (val) => {
  form.value.domains = []
  if (val) fetchCfDomains()
})

// Lifecycle
onMounted(async () => {
  await fetchAccounts()
  await fetchRules()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Domain Monitor</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Create monitoring rules for your domains</p>
        </div>
        <VBtn color="primary" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Rule
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Rules Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="rules.length > 0" class="sticky-table" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 200px" />
          <col style="width: 120px" />
          <col style="width: 250px" />
          <col style="width: 120px" />
          <col style="width: 100px" />
          <col style="width: 130px" />
        </colgroup>
        <thead>
          <tr>
            <th style="width: 200px">Name</th>
            <th style="width: 120px">Source</th>
            <th style="width: 250px">Domain</th>
            <th style="width: 120px">Interval</th>
            <th style="width: 100px; text-align: center;">Status</th>
            <th style="width: 130px; text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in rules" :key="rule.id">
            <td class="font-weight-medium">{{ rule.name }}</td>
            <td>
              <VChip
                size="x-small"
                :color="rule.source === 'cloudflare' ? 'primary' : rule.source === 'tencent' ? 'success' : 'warning'"
                variant="tonal"
              >
                {{ rule.source === 'cloudflare' ? 'CF' : rule.source === 'tencent' ? 'Tencent' : 'Custom' }}
              </VChip>
            </td>
            <td>
              <template v-if="Array.isArray(rule.domains) && rule.domains.length">
                <VChip v-for="d in rule.domains" :key="d" size="x-small" variant="tonal" color="primary" class="me-1 mb-1">{{ d === 'all' ? 'All' : d }}</VChip>
              </template>
              <template v-else-if="rule.customDomains">
                <span class="text-caption">{{ rule.customDomains }}</span>
              </template>
              <template v-else>
                <span class="text-caption text-medium-emphasis">-</span>
              </template>
            </td>
            <td class="text-caption">{{ rule.checkInterval }} min</td>
            <td style="text-align: center;">
              <VChip size="x-small" :color="rule.enabled ? 'success' : 'grey'" variant="tonal">
                {{ rule.enabled ? 'Active' : 'Paused' }}
              </VChip>
            </td>
            <td style="text-align: center;">
              <VBtn icon size="x-small" variant="text" color="success" @click="triggerCheck(rule.id)" :loading="checkingIds.includes(rule.id)">
                <VIcon icon="bx-play" size="16" />
              </VBtn>
              <VBtn icon size="x-small" variant="text" color="primary" @click="openEdit(rule)">
                <VIcon icon="bx-edit" size="16" />
              </VBtn>
              <VBtn icon size="x-small" variant="text" color="error" @click="handleDelete(rule.id)">
                <VIcon icon="bx-trash" size="16" />
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loading" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-radar" size="48" class="mb-2" />
        <p>No monitoring rules yet. Click "Add Rule" to create one.</p>
      </VCardText>
    </VCard>

    <!-- Dialog -->
    <VDialog v-model="dialog" max-width="600">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle>
        <VCardText>
          <!-- Name -->
          <VTextField
            v-model="form.name"
            label="Rule Name"
            density="compact"
            class="mb-3"
            hint="e.g. Production Monitor"
            persistent-hint
          />

          <!-- Source -->
          <VSelect
            v-model="form.source"
            :items="sourceOptions"
            label="Domain Source"
            density="compact"
            class="mb-3"
          />

          <!-- Cloudflare: Account + Domain -->
          <template v-if="form.source === 'cloudflare'">
            <VSelect
              v-model="form.accountId"
              :items="accountOptions"
              label="CF Account"
              density="compact"
              class="mb-3"
              :loading="loadingAccounts"
              clearable
            />
            <VSelect
              v-model="form.domains"
              :items="domainOptions"
              label="Domain"
              density="compact"
              class="mb-3"
              :loading="loadingCfDomains"
              :disabled="!form.accountId"
              clearable
              multiple
              chips
            />
          </template>

          <!-- Tencent: Domain -->
          <template v-if="form.source === 'tencent'">
            <VSelect
              v-model="form.domains"
              :items="domainOptions"
              label="Domain"
              density="compact"
              class="mb-3"
              :loading="loadingTencentDomains"
              clearable
              multiple
              chips
            />
          </template>

          <!-- Custom: Text input -->
          <template v-if="form.source === 'custom'">
            <VTextarea
              v-model="form.customDomains"
              label="Domains"
              density="compact"
              class="mb-3"
              rows="3"
              hint="Enter one domain per line"
              persistent-hint
            />
          </template>

          <!-- Interval -->
          <VSelect
            v-model="form.checkInterval"
            :items="intervalOptions"
            label="Check Interval"
            density="compact"
            class="mb-3"
          />

          <!-- Enabled -->
          <VSwitch
            v-model="form.enabled"
            label="Enabled"
            color="primary"
            density="compact"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="save">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.sortable:hover {
  color: rgb(var(--v-theme-primary));
}
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
