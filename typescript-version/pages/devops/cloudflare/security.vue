<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import apiClient from '~/services/api'
import { useCfAccount } from '~/composables/useCfAccount'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const { accounts, loading, fetchAccounts, getToken } = useCfAccount()

const selectedAccountId = ref<number | null>(null)
const selectedZoneId = ref<string | null>(null)
const search = ref('')

const zones = ref<any[]>([])
const rules = ref<any[]>([])
const loadingZones = ref(false)
const loadingRules = ref(false)
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const accountOptions = computed(() => accounts.value.map((a: any) => ({ title: a.name, value: a.id })))

watch(selectedAccountId, async (val) => {
  selectedZoneId.value = null
  zones.value = []
  rules.value = []
  if (val) await fetchZones()
})

async function fetchZones() {
  if (!selectedAccountId.value) return
  loadingZones.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones`, { params: { account_id: selectedAccountId.value } })
    zones.value = data.data || []
  } catch (e: any) {
    console.error('Failed to fetch zones', e)
  } finally {
    loadingZones.value = false
  }
}

watch(selectedZoneId, (val) => {
  rules.value = []
  if (val) fetchRules()
})

async function fetchRules() {
  if (!selectedAccountId.value || !selectedZoneId.value) return
  loadingRules.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/zones/${selectedZoneId.value}/security`, {
      params: { account_id: selectedAccountId.value, zone_id: selectedZoneId.value },
    })
    rules.value = data.data || []
  } catch (e: any) {
    console.error('Failed to fetch rules', e)
  } finally {
    loadingRules.value = false
  }
}

async function syncFromCF() {
  if (!selectedAccountId.value || !selectedZoneId.value) return
  syncing.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const { data } = await apiClient.post(
      `${CF_GATEWAY}/zones/${selectedZoneId.value}/security/sync`,
      null,
      {
        params: { account_id: selectedAccountId.value, zone_id: selectedZoneId.value },
        headers: { 'X-Cf-Token': token },
      },
    )
    snackbar.value = { show: true, text: `Synced ${data.data?.synced || 0} rules`, color: 'success' }
    await fetchRules()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}

const filteredRules = computed(() => {
  let list = rules.value
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(r => (r.description || '').toLowerCase().includes(s) || (r.expression || '').toLowerCase().includes(s))
  }
  return list
})

const zoneOptions = computed(() => zones.value.map((z: any) => ({ title: z.name, value: z.zone_id })))

onMounted(async () => {
  await fetchAccounts()
  if (accounts.value.length > 0) {
    selectedAccountId.value = accounts.value[0].id
  }
})

const actionColors: Record<string, string> = { block: 'error', allow: 'success', challenge: 'warning', skip: 'info' }

const page = ref(1)
const pageSize = ref(50)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRules.value.length / pageSize.value)))
const pagedRules = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRules.value.slice(start, start + pageSize.value)
})
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="selectedAccountId" :items="accountOptions" label="Account" density="compact" style="max-width: 180px" hide-details :loading="loading" />
        <VSelect v-model="selectedZoneId" :items="zoneOptions" label="Zone" density="compact" style="max-width: 220px" hide-details :disabled="!selectedAccountId" :loading="loadingZones" item-value="value" item-title="title" />
        <div class="d-flex align-center flex-wrap gap-4">
          <VChip size="small" color="primary" variant="tonal">Total: {{ rules.length }}</VChip>
          <VChip size="small" color="error" variant="tonal">Block: {{ rules.filter(r => r.action === 'block').length }}</VChip>
          <VChip size="small" color="success" variant="tonal">Allow: {{ rules.filter(r => r.action === 'allow').length }}</VChip>
        </div>
        <VSpacer />
        <VBtn color="primary" variant="tonal" :loading="syncing" :disabled="!selectedZoneId" prepend-icon="bx-refresh" @click="syncFromCF">Sync</VBtn>
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[20, 50, 100]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <VCard v-if="selectedZoneId">
      <VProgressLinear v-if="loadingRules" indeterminate color="primary" />
      <VCardText class="pb-0">
        <VTextField v-model="search" prepend-inner-icon="bx-search" placeholder="Search rules..." density="compact" hide-details clearable class="mb-3" />
      </VCardText>
      <VTable v-if="pagedRules.length > 0">
        <thead>
          <tr>
            <th>Rule Name</th>
            <th>Expression</th>
            <th style="width: 90px">Action</th>
            <th style="width: 70px">Priority</th>
            <th style="width: 90px">Status</th>
            <th style="width: 180px">Synced</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in pagedRules" :key="r.rule_id">
            <td class="font-weight-medium">{{ r.description || r.rule_id }}</td>
            <td><code class="text-caption">{{ r.expression }}</code></td>
            <td><VChip size="x-small" :color="actionColors[r.action] || 'grey'" variant="tonal">{{ r.action }}</VChip></td>
            <td class="text-caption">{{ r.priority }}</td>
            <td>
              <VChip size="x-small" :color="r.paused ? 'grey' : 'success'" variant="tonal">{{ r.paused ? 'paused' : 'active' }}</VChip>
            </td>
            <td class="text-caption text-medium-emphasis">{{ r.synced_at ? new Date(r.synced_at).toLocaleString() : '-' }}</td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loadingRules" class="text-center py-6 text-medium-emphasis">
        <VIcon icon="bx-cloud-download" size="48" class="mb-2" />
        <p>{{ search ? 'No matching rules' : 'No synced rules. Click Sync to fetch from Cloudflare.' }}</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-shield-quarter" size="48" class="mb-2" />
        <p>Select an account and zone to manage security rules</p>
      </VCardText>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
