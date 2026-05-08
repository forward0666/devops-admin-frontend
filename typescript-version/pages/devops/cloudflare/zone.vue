<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'
import { useCfAccount, useCfAccountSync } from '~/composables/useCfAccount'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'
const { accounts, loading, fetchAccounts, getToken } = useCfAccount()

const selectedAccountId = ref<number | null>(null)
const zones = ref<any[]>([])
const loadingZones = ref(false)
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const accountOptions = computed(() => accounts.value.map((a: any) => ({ title: a.name, value: a.id })))

watch(selectedAccountId, (val) => {
  if (val) fetchZones()
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

async function syncFromCF() {
  if (!selectedAccountId.value) return
  syncing.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const { data } = await apiClient.post(
      `${CF_GATEWAY}/zones/sync`,
      null,
      {
        params: { account_id: selectedAccountId.value },
        headers: { 'X-Cf-Token': token },
      },
    )
    snackbar.value = { show: true, text: `Synced ${data.data?.synced || 0} zones`, color: 'success' }
    await fetchZones()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  fetchAccounts()
})

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
        <VSelect
          v-model="selectedAccountId"
          :items="accountOptions"
          label="Account"
          density="compact"
          style="max-width: 180px"
          hide-details
          :loading="loading"
        />
        <VBtn
          color="primary"
          variant="tonal"
          :loading="syncing"
          :disabled="!selectedAccountId"
          prepend-icon="bx-refresh"
          @click="syncFromCF"
        >
          Sync
        </VBtn>
      </VCardText>
    </VCard>

    <VCard v-if="selectedAccountId">
      <VProgressLinear v-if="loadingZones" indeterminate color="primary" />
      <VTable v-if="zones.length > 0">
        <thead>
          <tr>
            <th>Domain</th>
            <th style="width: 100px">Status</th>
            <th style="width: 90px">Plan</th>
            <th style="width: 140px">Name Server</th>
            <th style="width: 150px">Account</th>
            <th style="width: 150px">Synced</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="z in zones" :key="z.zone_id">
            <td class="font-weight-medium">{{ z.name }}</td>
            <td>
              <VChip size="x-small" :color="statusColors[z.status] || 'grey'" variant="tonal">{{ z.status }}</VChip>
              <VChip v-if="z.paused" size="x-small" color="grey" variant="tonal" class="ms-1">Paused</VChip>
            </td>
            <td class="text-caption text-capitalize">{{ z.plan }}</td>
            <td>
              <div v-for="ns in (z.name_servers || []).slice(0, 2)" :key="ns" class="text-caption text-medium-emphasis">
                {{ ns }}
              </div>
            </td>
            <td class="text-caption">{{ z.account_name }}</td>
            <td class="text-caption text-medium-emphasis">{{ z.synced_at ? new Date(z.synced_at).toLocaleString() : '-' }}</td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loadingZones" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-cloud-download" size="48" class="mb-2" />
        <p>No synced zones. Click Sync to fetch from Cloudflare.</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-globe" size="48" class="mb-2" />
        <p>Select an account to manage zones</p>
      </VCardText>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
