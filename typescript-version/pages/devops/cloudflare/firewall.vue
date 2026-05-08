<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { FIREWALL_ACTIONS, TAG_LABELS, TAG_COLORS } from '~/composables/useCf'
import { useCfAccount } from '~/composables/useCfAccount'
import { cfApi } from '~/services/cfApi'

definePageMeta({ layout: 'default' })

const { accounts, loading, fetchAccounts, getToken } = useCfAccount()

const selectedAccountId = ref('')
const selectedZoneId = ref('')
const search = ref('')
const dialog = ref(false)
const editingId = ref<string | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })
const saving = ref(false)

const zones = ref<any[]>([])
const rules = ref<any[]>([])
const loadingZones = ref(false)
const loadingRules = ref(false)

const fwAccounts = computed(() => accounts.value.filter(a => (a.tags || []).includes('firewall')))

async function loadRules() {
  rules.value = []
  if (!selectedZoneId.value || !selectedAccountId.value) return
  loadingRules.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const res = await cfApi.listFirewallRules(token, selectedZoneId.value)
    rules.value = (res.result || []).map((r: any) => ({
      id: r.id,
      name: r.description || r.id,
      expression: r.expression || '',
      action: r.action || 'block',
      priority: r.priority || 0,
      status: r.paused ? 'paused' : 'active',
    }))
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Failed to load rules', color: 'error' }
  } finally {
    loadingRules.value = false
  }
}

watch(selectedAccountId, async (val) => {
  selectedZoneId.value = ''
  zones.value = []
  rules.value = []
  if (!val) return
  loadingZones.value = true
  try {
    const token = await getToken(val)
    const res = await cfApi.listZones(token)
    zones.value = (res.result || []).map((z: any) => ({
      id: z.id,
      name: z.name,
      status: z.status,
      plan: z.plan?.name || 'free',
      nameServers: z.name_servers || [],
    }))
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Failed to load zones', color: 'error' }
  } finally {
    loadingZones.value = false
  }
})

watch(selectedZoneId, () => loadRules())

const filteredRules = computed(() => {
  let list = rules.value
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(r => r.name.toLowerCase().includes(s) || r.expression.toLowerCase().includes(s))
  }
  return list.sort((a, b) => a.priority - b.priority)
})

const form = ref({ name: '', expression: '', action: 'block', priority: 0, status: 'active' })

onMounted(() => fetchAccounts())

function openCreate() {
  editingId.value = null
  form.value = { name: '', expression: '', action: 'block', priority: 0, status: 'active' }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = { name: rule.name, expression: rule.expression, action: rule.action, priority: rule.priority, status: rule.status }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim() || !form.value.expression.trim() || !selectedZoneId.value) {
    snackbar.value = { show: true, text: 'Name, expression and zone are required', color: 'error' }
    return
  }
  saving.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const body = {
      description: form.value.name,
      expression: form.value.expression,
      action: form.value.action,
      priority: form.value.priority,
      paused: form.value.status === 'paused',
    }
    if (editingId.value) {
      await cfApi.updateFirewallRule(token, selectedZoneId.value, editingId.value, body)
      snackbar.value = { show: true, text: 'Rule updated', color: 'success' }
    } else {
      await cfApi.createFirewallRule(token, selectedZoneId.value, body)
      snackbar.value = { show: true, text: 'Rule created', color: 'success' }
    }
    dialog.value = false
    await loadRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.errors?.[0]?.message || e?.response?.data?.message || 'Failed to save', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete this rule?')) return
  try {
    const token = await getToken(selectedAccountId.value)
    await cfApi.deleteFirewallRule(token, selectedZoneId.value, id)
    snackbar.value = { show: true, text: 'Rule deleted', color: 'success' }
    await loadRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.errors?.[0]?.message || 'Failed to delete', color: 'error' }
  }
}

async function toggleStatus(rule: any) {
  try {
    const token = await getToken(selectedAccountId.value)
    const newPaused = rule.status === 'active'
    await cfApi.updateFirewallRule(token, selectedZoneId.value, rule.id, { paused: newPaused })
    snackbar.value = { show: true, text: newPaused ? 'Rule paused' : 'Rule enabled', color: 'success' }
    await loadRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Failed to update', color: 'error' }
  }
}

const actionColors: Record<string, string> = { block: 'error', allow: 'success', challenge: 'warning', skip: 'info' }
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Firewall Rules</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage WAF firewall rules</p>
        </div>
        <VSelect v-model="selectedAccountId" :items="fwAccounts.map((a: any) => ({ title: a.name, value: a.id }))" label="Account" density="compact" style="max-width: 180px" hide-details :loading="loading" />
        <VSelect v-model="selectedZoneId" :items="zones.map((z: any) => ({ title: z.name, value: z.id }))" label="Zone" density="compact" style="max-width: 220px" hide-details :disabled="!selectedAccountId" :loading="loadingZones" />
        <VBtn color="primary" :disabled="!selectedZoneId" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Rule
        </VBtn>
      </VCardText>
    </VCard>

    <VCard v-if="selectedZoneId">
      <VProgressLinear v-if="loadingRules" indeterminate color="primary" />
      <VCardText class="pb-0">
        <VTextField v-model="search" prepend-inner-icon="bx-search" placeholder="Search rules..." density="compact" hide-details clearable class="mb-3" />
      </VCardText>
      <VTable v-if="filteredRules.length > 0">
        <thead>
          <tr>
            <th>Rule Name</th>
            <th>Expression</th>
            <th style="width: 90px">Action</th>
            <th style="width: 70px">Priority</th>
            <th style="width: 90px">Status</th>
            <th style="width: 120px">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRules" :key="r.id">
            <td class="font-weight-medium">{{ r.name }}</td>
            <td><code class="text-caption">{{ r.expression }}</code></td>
            <td><VChip size="x-small" :color="actionColors[r.action]" variant="tonal">{{ r.action }}</VChip></td>
            <td class="text-caption">{{ r.priority }}</td>
            <td>
              <VChip size="x-small" :color="r.status === 'active' ? 'success' : 'grey'" variant="tonal" class="cursor-pointer" @click="toggleStatus(r)">
                {{ r.status }}
              </VChip>
            </td>
            <td>
              <VBtn icon size="x-small" variant="text" color="primary" @click="openEdit(r)"><VIcon icon="bx-edit" size="16" /></VBtn>
              <VBtn icon size="x-small" variant="text" color="error" @click="handleDelete(r.id)"><VIcon icon="bx-trash" size="16" /></VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loadingRules" class="text-center py-6 text-medium-emphasis">
        {{ search ? 'No matching rules' : 'No firewall rules in this zone' }}
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-shield-quarter" size="48" class="mb-2" />
        <p>Select an account and zone to manage firewall rules</p>
      </VCardText>
    </VCard>

    <VDialog v-model="dialog" max-width="550">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle>
        <VCardText>
          <VTextField v-model="form.name" label="Rule Name" density="compact" class="mb-3" />
          <VTextarea v-model="form.expression" label="Expression" density="compact" rows="3" class="mb-3" placeholder='e.g. ip.src eq 1.2.3.4' hint="Cloudflare Rules language expression" persistent-hint />
          <VSelect v-model="form.action" :items="FIREWALL_ACTIONS" label="Action" density="compact" class="mb-3" />
          <VTextField v-model.number="form.priority" label="Priority" type="number" density="compact" class="mb-3" hint="Lower = higher priority" persistent-hint />
          <VSelect v-model="form.status" :items="['active', 'paused']" label="Status" density="compact" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!form.name.trim() || !form.expression.trim()" @click="save">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
