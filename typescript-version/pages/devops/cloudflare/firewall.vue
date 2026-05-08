<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCfAccounts, useCfData, FIREWALL_ACTIONS } from '~/composables/useCf'

definePageMeta({ layout: 'default' })

const { accounts, getByTag } = useCfAccounts()
const { zones, firewallRules } = useCfData()

const selectedAccountId = ref('')
const selectedZoneId = ref('')
const search = ref('')
const dialog = ref(false)
const editingId = ref<string | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

const fwAccounts = computed(() => getByTag('firewall'))
const filteredZones = computed(() => zones.value.filter(z => z.accountId === selectedAccountId.value))

const filteredRules = computed(() => {
  let list = firewallRules.value.filter(r => r.zoneId === selectedZoneId.value)
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(r => r.name.toLowerCase().includes(s) || r.expression.toLowerCase().includes(s))
  }
  return list.sort((a, b) => a.priority - b.priority)
})

const form = ref({
  name: '',
  expression: '',
  action: 'block',
  priority: 0,
  status: 'active',
})

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

function save() {
  if (!form.value.name.trim() || !form.value.expression.trim() || !selectedZoneId.value) {
    snackbar.value = { show: true, text: 'Name, expression and zone are required', color: 'error' }
    return
  }
  const id = editingId.value || Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const existing = firewallRules.value.findIndex(r => r.id === id)
  const rule = { ...form.value, id, zoneId: selectedZoneId.value }
  if (existing !== -1) firewallRules.value[existing] = rule
  else firewallRules.value.push(rule)
  snackbar.value = { show: true, text: editingId.value ? 'Rule updated' : 'Rule created', color: 'success' }
  dialog.value = false
}

function handleDelete(id: string) {
  if (!confirm('Delete this rule?')) return
  firewallRules.value = firewallRules.value.filter(r => r.id !== id)
  snackbar.value = { show: true, text: 'Rule deleted', color: 'success' }
}

function toggleStatus(rule: any) {
  const idx = firewallRules.value.findIndex(r => r.id === rule.id)
  if (idx !== -1) {
    firewallRules.value[idx].status = rule.status === 'active' ? 'paused' : 'active'
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
        <VSelect v-model="selectedAccountId" :items="fwAccounts.map((a: any) => ({ title: a.name, value: a.id }))" label="Account" density="compact" style="max-width: 180px" hide-details />
        <VSelect v-model="selectedZoneId" :items="filteredZones.map((z: any) => ({ title: z.name, value: z.id }))" label="Zone" density="compact" style="max-width: 220px" hide-details :disabled="!selectedAccountId" />
        <VBtn color="primary" :disabled="!selectedZoneId" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Rule
        </VBtn>
      </VCardText>
    </VCard>

    <VCard v-if="selectedZoneId">
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
      <VCardText v-else class="text-center py-6 text-medium-emphasis">
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
          <VBtn color="primary" :disabled="!form.name.trim() || !form.expression.trim()" @click="save">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
