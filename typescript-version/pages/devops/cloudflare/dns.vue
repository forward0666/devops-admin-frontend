<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { DNS_TYPES, TAG_LABELS, TAG_COLORS } from '~/composables/useCf'
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
const dnsRecords = ref<any[]>([])
const loadingZones = ref(false)
const loadingRecords = ref(false)

const dnsAccounts = computed(() => accounts.value.filter(a => (a.tags || []).includes('dns')))

watch(selectedAccountId, async (val) => {
  selectedZoneId.value = ''
  zones.value = []
  dnsRecords.value = []
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

watch(selectedZoneId, async (val) => {
  dnsRecords.value = []
  if (!val || !selectedAccountId.value) return
  loadingRecords.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const res = await cfApi.listDns(token, val)
    dnsRecords.value = res.result || []
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Failed to load DNS records', color: 'error' }
  } finally {
    loadingRecords.value = false
  }
})

const filteredRecords = computed(() => {
  if (!search.value) return dnsRecords.value
  const s = search.value.toLowerCase()
  return dnsRecords.value.filter(r => r.name.toLowerCase().includes(s) || r.content.toLowerCase().includes(s) || r.type.toLowerCase().includes(s))
})

const form = ref({ type: 'A', name: '', content: '', proxied: true, ttl: 1 })

onMounted(() => fetchAccounts())

function openCreate() {
  editingId.value = null
  form.value = { type: 'A', name: '', content: '', proxied: true, ttl: 1 }
  dialog.value = true
}

function openEdit(record: any) {
  editingId.value = record.id
  form.value = { type: record.type, name: record.name, content: record.content, proxied: record.proxied, ttl: record.ttl }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim() || !form.value.content.trim() || !selectedZoneId.value) {
    snackbar.value = { show: true, text: 'Zone, name and content are required', color: 'error' }
    return
  }
  saving.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const body: any = { type: form.value.type, name: form.value.name, content: form.value.content, proxied: form.value.proxied, ttl: form.value.ttl }
    if (editingId.value) {
      await cfApi.updateDns(token, selectedZoneId.value, editingId.value, body)
      snackbar.value = { show: true, text: 'Record updated', color: 'success' }
    } else {
      await cfApi.createDns(token, selectedZoneId.value, body)
      snackbar.value = { show: true, text: 'Record created', color: 'success' }
    }
    dialog.value = false
    // Refresh records
    const res = await cfApi.listDns(token, selectedZoneId.value)
    dnsRecords.value = res.result || []
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.errors?.[0]?.message || e?.response?.data?.message || 'Failed to save', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete this record?')) return
  try {
    const token = await getToken(selectedAccountId.value)
    await cfApi.deleteDns(token, selectedZoneId.value, id)
    snackbar.value = { show: true, text: 'Record deleted', color: 'success' }
    const res = await cfApi.listDns(token, selectedZoneId.value)
    dnsRecords.value = res.result || []
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.errors?.[0]?.message || 'Failed to delete', color: 'error' }
  }
}
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">DNS Management</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage DNS records</p>
        </div>
        <VSelect v-model="selectedAccountId" :items="dnsAccounts.map((a: any) => ({ title: a.name, value: a.id }))" label="Account" density="compact" style="max-width: 180px" hide-details :loading="loading" />
        <VSelect v-model="selectedZoneId" :items="zones.map((z: any) => ({ title: z.name, value: z.id }))" label="Zone" density="compact" style="max-width: 220px" hide-details :disabled="!selectedAccountId" :loading="loadingZones" />
        <VBtn color="primary" :disabled="!selectedZoneId" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Record
        </VBtn>
      </VCardText>
    </VCard>

    <VCard v-if="selectedZoneId">
      <VProgressLinear v-if="loadingRecords" indeterminate color="primary" />
      <VCardText class="pb-0">
        <VTextField v-model="search" prepend-inner-icon="bx-search" placeholder="Search records..." density="compact" hide-details clearable class="mb-3" />
      </VCardText>
      <VTable v-if="filteredRecords.length > 0">
        <thead>
          <tr>
            <th style="width: 90px">Type</th>
            <th>Name</th>
            <th>Content</th>
            <th style="width: 80px">Proxied</th>
            <th style="width: 70px">TTL</th>
            <th style="width: 100px">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredRecords" :key="r.id">
            <td><VChip size="x-small" color="info" variant="tonal">{{ r.type }}</VChip></td>
            <td><code class="text-caption">{{ r.name }}</code></td>
            <td><code class="text-caption">{{ r.content }}</code></td>
            <td>
              <VChip size="x-small" :color="r.proxied ? 'success' : 'grey'" variant="tonal">{{ r.proxied ? 'ON' : 'OFF' }}</VChip>
            </td>
            <td class="text-caption">{{ r.ttl === 1 ? 'Auto' : r.ttl + 's' }}</td>
            <td>
              <VBtn icon size="x-small" variant="text" color="primary" @click="openEdit(r)"><VIcon icon="bx-edit" size="16" /></VBtn>
              <VBtn icon size="x-small" variant="text" color="error" @click="handleDelete(r.id)"><VIcon icon="bx-trash" size="16" /></VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loadingRecords" class="text-center py-6 text-medium-emphasis">
        {{ search ? 'No matching records' : 'No DNS records in this zone' }}
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-dns" size="48" class="mb-2" />
        <p>Select an account and zone to manage DNS records</p>
      </VCardText>
    </VCard>

    <!-- Dialog -->
    <VDialog v-model="dialog" max-width="500">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Record' : 'Add Record' }}</VCardTitle>
        <VCardText>
          <VSelect v-model="form.type" :items="DNS_TYPES" label="Type" density="compact" class="mb-3" />
          <VTextField v-model="form.name" label="Name" density="compact" class="mb-3" placeholder="e.g. @, www, api" />
          <VTextField v-model="form.content" label="Content" density="compact" class="mb-3" placeholder="e.g. 1.2.3.4, example.com" />
          <div class="d-flex gap-3">
            <VSwitch v-model="form.proxied" label="Proxied" color="primary" density="compact" hide-details />
            <VTextField v-model.number="form.ttl" label="TTL (seconds)" type="number" density="compact" class="flex-grow-1" hint="1 = Auto" persistent-hint />
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!form.name.trim() || !form.content.trim()" @click="save">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
