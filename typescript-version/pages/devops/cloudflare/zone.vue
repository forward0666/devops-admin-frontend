<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCfAccounts, useCfData, SSL_MODES, TAG_COLORS, TAG_LABELS } from '~/composables/useCf'

definePageMeta({ layout: 'default' })

const { accounts, getByTag } = useCfAccounts()
const { zones, dnsRecords } = useCfData()

const selectedAccountId = ref('')
const dialog = ref(false)
const editingId = ref<string | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

const zoneAccounts = computed(() => getByTag('zone'))

const filteredZones = computed(() => zones.value.filter(z => z.accountId === selectedAccountId.value))

const form = ref({
  name: '',
  status: 'active',
  plan: 'free',
  nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
  sslMode: 'full',
})

function openCreate() {
  editingId.value = null
  form.value = { name: '', status: 'active', plan: 'free', nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'], sslMode: 'full' }
  dialog.value = true
}

function openEdit(zone: any) {
  editingId.value = zone.id
  form.value = { name: zone.name, status: zone.status, plan: zone.plan, nameServers: [...zone.nameServers], sslMode: zone.sslMode }
  dialog.value = true
}

function save() {
  if (!form.value.name.trim()) {
    snackbar.value = { show: true, text: 'Domain name is required', color: 'error' }
    return
  }
  const id = editingId.value || Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const existing = zones.value.findIndex(z => z.id === id)
  const zone = { ...form.value, id, accountId: selectedAccountId.value }
  if (existing !== -1) zones.value[existing] = zone
  else zones.value.push(zone)
  snackbar.value = { show: true, text: editingId.value ? 'Zone updated' : 'Zone added', color: 'success' }
  dialog.value = false
}

function handleDelete(id: string) {
  if (!confirm('Delete this zone? Related DNS records will also be removed.')) return
  zones.value = zones.value.filter(z => z.id !== id)
  dnsRecords.value = dnsRecords.value.filter(r => r.zoneId !== id)
  snackbar.value = { show: true, text: 'Zone deleted', color: 'success' }
}

const statusColors: Record<string, string> = { active: 'success', pending: 'warning', moved: 'info', deactivated: 'error' }
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Zone Config</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage Cloudflare zones</p>
        </div>
        <VSelect v-model="selectedAccountId" :items="zoneAccounts.map((a: any) => ({ title: a.name, value: a.id }))" label="Account" density="compact" style="max-width: 180px" hide-details />
        <VBtn color="primary" :disabled="!selectedAccountId" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Zone
        </VBtn>
      </VCardText>
    </VCard>

    <VCard v-if="selectedAccountId">
      <VTable v-if="filteredZones.length > 0">
        <thead>
          <tr>
            <th>Domain</th>
            <th style="width: 100px">Status</th>
            <th style="width: 90px">Plan</th>
            <th style="width: 100px">SSL Mode</th>
            <th>Name Servers</th>
            <th style="width: 100px">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="z in filteredZones" :key="z.id">
            <td class="font-weight-medium">{{ z.name }}</td>
            <td><VChip size="x-small" :color="statusColors[z.status] || 'grey'" variant="tonal">{{ z.status }}</VChip></td>
            <td class="text-caption text-capitalize">{{ z.plan }}</td>
            <td><VChip size="x-small" :color="z.sslMode === 'full_strict' ? 'success' : z.sslMode === 'full' ? 'info' : 'warning'" variant="tonal">{{ z.sslMode }}</VChip></td>
            <td>
              <div v-for="ns in z.nameServers" :key="ns" class="text-caption text-medium-emphasis">{{ ns }}</div>
            </td>
            <td>
              <VBtn icon size="x-small" variant="text" color="primary" @click="openEdit(z)"><VIcon icon="bx-edit" size="16" /></VBtn>
              <VBtn icon size="x-small" variant="text" color="error" @click="handleDelete(z.id)"><VIcon icon="bx-trash" size="16" /></VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-globe" size="48" class="mb-2" />
        <p>No zones found. Add a zone to get started.</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-globe" size="48" class="mb-2" />
        <p>Select an account to manage zones</p>
      </VCardText>
    </VCard>

    <VDialog v-model="dialog" max-width="500">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Zone' : 'Add Zone' }}</VCardTitle>
        <VCardText>
          <VTextField v-model="form.name" label="Domain Name" density="compact" class="mb-3" placeholder="e.g. example.com" />
          <VSelect v-model="form.status" :items="['active', 'pending', 'moved', 'deactivated']" label="Status" density="compact" class="mb-3" />
          <VSelect v-model="form.plan" :items="['free', 'pro', 'business', 'enterprise']" label="Plan" density="compact" class="mb-3" />
          <VSelect v-model="form.sslMode" :items="SSL_MODES" label="SSL Mode" density="compact" class="mb-3" />
          <VTextarea v-model="form.nameServers.join('\n')" label="Name Servers (one per line)" density="compact" rows="2" class="mb-3" @update:model-value="(v: any) => form.nameServers = v.split('\n').filter((s: string) => s.trim())" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!form.name.trim()" @click="save">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
