<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { TAG_LABELS, TAG_COLORS } from '~/composables/useCf'
import { useCfAccount } from '~/composables/useCfAccount'
import { cfApi } from '~/services/cfApi'

definePageMeta({ layout: 'default' })

const { accounts, loading, fetchAccounts, getToken } = useCfAccount()

const selectedAccountId = ref('')
const snackbar = ref({ show: false, text: '', color: 'success' })

const zones = ref<any[]>([])
const loadingZones = ref(false)

const zoneAccounts = computed(() => accounts.value.filter(a => (a.tags || []).includes('zone')))

watch(selectedAccountId, async (val) => {
  zones.value = []
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

onMounted(() => fetchAccounts())

const statusColors: Record<string, string> = { active: 'success', pending: 'warning', moved: 'info', deactivated: 'error' }
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Zone Config</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">View Cloudflare zones (manage on CF dashboard)</p>
        </div>
        <VSelect v-model="selectedAccountId" :items="zoneAccounts.map((a: any) => ({ title: a.name, value: a.id }))" label="Account" density="compact" style="max-width: 180px" hide-details :loading="loading" />
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
            <th>Name Servers</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="z in zones" :key="z.id">
            <td class="font-weight-medium">{{ z.name }}</td>
            <td><VChip size="x-small" :color="statusColors[z.status] || 'grey'" variant="tonal">{{ z.status }}</VChip></td>
            <td class="text-caption text-capitalize">{{ z.plan }}</td>
            <td>
              <div v-for="ns in z.nameServers" :key="ns" class="text-caption text-medium-emphasis">{{ ns }}</div>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loadingZones" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-globe" size="48" class="mb-2" />
        <p>No zones found for this account.</p>
      </VCardText>
    </VCard>
    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-globe" size="48" class="mb-2" />
        <p>Select an account to view zones</p>
      </VCardText>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
