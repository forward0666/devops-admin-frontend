<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { SSL_MODES, TAG_LABELS, TAG_COLORS } from '~/composables/useCf'
import { useCfAccount } from '~/composables/useCfAccount'
import { cfApi } from '~/services/cfApi'

definePageMeta({ layout: 'default' })

const { accounts, loading, fetchAccounts, getToken } = useCfAccount()

const selectedAccountId = ref('')
const selectedZoneId = ref('')
const snackbar = ref({ show: false, text: '', color: 'success' })
const saving = ref(false)
const loadingSsl = ref(false)

const zones = ref<any[]>([])
const sslMode = ref('off')
const loadingZones = ref(false)

const sslAccounts = computed(() => accounts.value.filter(a => (a.tags || []).includes('ssl')))

watch(selectedAccountId, async (val) => {
  selectedZoneId.value = ''
  zones.value = []
  sslMode.value = 'off'
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
  sslMode.value = 'off'
  if (!val || !selectedAccountId.value) return
  loadingSsl.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    const res = await cfApi.getSsl(token, val)
    sslMode.value = res.result?.value || 'off'
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Failed to load SSL settings', color: 'error' }
  } finally {
    loadingSsl.value = false
  }
})

async function saveSslMode(mode: string) {
  if (!selectedZoneId.value || !selectedAccountId.value) return
  saving.value = true
  try {
    const token = await getToken(selectedAccountId.value)
    await cfApi.updateSsl(token, selectedZoneId.value, mode)
    sslMode.value = mode
    snackbar.value = { show: true, text: 'SSL mode updated', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.errors?.[0]?.message || 'Failed to update SSL', color: 'error' }
  } finally {
    saving.value = false
  }
}

onMounted(() => fetchAccounts())

const sslModeInfo: Record<string, { title: string; desc: string; color: string; icon: string }> = {
  off: { title: 'Off', desc: 'No encryption between visitor and Cloudflare, or Cloudflare and origin server.', color: 'error', icon: 'bx-x-circle' },
  flexible: { title: 'Flexible', desc: 'Encrypts traffic between visitor and Cloudflare, but not between Cloudflare and origin server.', color: 'warning', icon: 'bx-lock-open' },
  full: { title: 'Full', desc: 'Encrypts end-to-end, but allows self-signed certificates on origin server.', color: 'info', icon: 'bx-lock' },
  full_strict: { title: 'Full (Strict)', desc: 'Encrypts end-to-end with a valid SSL certificate on origin server.', color: 'success', icon: 'bx-shield-check' },
}

const edgeCerts = [
  { label: 'HTTPS', desc: 'Always redirect to HTTPS', enabled: true },
  { label: 'Automatic HTTPS Rewrites', desc: 'Automatically rewrite HTTP to HTTPS for known sites', enabled: true },
  { label: 'HSTS', desc: 'Enable HTTP Strict Transport Security', enabled: false },
  { label: 'Minimum TLS Version', desc: 'TLS 1.2 or higher', enabled: true },
  { label: 'TLS 1.3', desc: 'Enable TLS 1.3 support', enabled: true },
  { label: 'Opportunistic Encryption', desc: 'Serve resources over HTTPS when possible', enabled: true },
]
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">SSL/TLS Settings</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Configure SSL encryption mode</p>
        </div>
        <VSelect v-model="selectedAccountId" :items="sslAccounts.map((a: any) => ({ title: a.name, value: a.id }))" label="Account" density="compact" style="max-width: 180px" hide-details :loading="loading" />
        <VSelect v-model="selectedZoneId" :items="zones.map((z: any) => ({ title: z.name, value: z.id }))" label="Zone" density="compact" style="max-width: 220px" hide-details :disabled="!selectedAccountId" :loading="loadingZones" />
      </VCardText>
    </VCard>

    <template v-if="selectedZoneId">
      <VProgressLinear v-if="loadingSsl" indeterminate color="primary" />

      <!-- SSL Mode Selection -->
      <VCard class="mb-4">
        <VCardTitle class="text-subtitle-1">Encryption Mode</VCardTitle>
        <VCardText>
          <div class="d-flex flex-column gap-3">
            <VCard
              v-for="mode in SSL_MODES" :key="mode"
              variant="outlined"
              :color="sslMode === mode ? 'primary' : undefined"
              class="cursor-pointer pa-3"
              @click="saveSslMode(mode)"
            >
              <div class="d-flex align-center gap-3">
                <VRadio :model-value="sslMode" :value="mode" hide-details density="compact" />
                <VIcon :icon="sslModeInfo[mode].icon" :color="sslModeInfo[mode].color" size="24" />
                <div class="flex-grow-1">
                  <div class="font-weight-medium text-body-1">{{ sslModeInfo[mode].title }}</div>
                  <div class="text-caption text-medium-emphasis">{{ sslModeInfo[mode].desc }}</div>
                </div>
                <VChip v-if="sslMode === mode" size="small" color="primary" variant="flat">Active</VChip>
                <VProgressCircular v-if="saving && sslMode === mode" size="20" indeterminate color="primary" />
              </div>
            </VCard>
          </div>
        </VCardText>
      </VCard>

      <!-- Edge Certificates -->
      <VCard class="mb-4">
        <VCardTitle class="text-subtitle-1">Edge Certificates</VCardTitle>
        <VTable>
          <thead>
            <tr>
              <th>Setting</th>
              <th>Description</th>
              <th style="width: 100px">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cert in edgeCerts" :key="cert.label">
              <td class="font-weight-medium">{{ cert.label }}</td>
              <td class="text-caption text-medium-emphasis">{{ cert.desc }}</td>
              <td><VChip size="x-small" :color="cert.enabled ? 'success' : 'grey'" variant="tonal">{{ cert.enabled ? 'ON' : 'OFF' }}</VChip></td>
            </tr>
          </tbody>
        </VTable>
      </VCard>

      <!-- Recommendations -->
      <VCard>
        <VCardTitle class="text-subtitle-1">SSL Recommendations</VCardTitle>
        <VCardText>
          <VAlert v-if="sslMode === 'off'" type="error" variant="tonal" density="compact" class="mb-2">
            SSL is disabled. Enable encryption to protect your visitors.
          </VAlert>
          <VAlert v-if="sslMode === 'flexible'" type="warning" variant="tonal" density="compact" class="mb-2">
            Flexible mode may cause mixed content issues. Consider upgrading to Full.
          </VAlert>
          <VAlert v-if="sslMode === 'full'" type="info" variant="tonal" density="compact" class="mb-2">
            For maximum security, use Full (Strict) mode with a valid origin certificate.
          </VAlert>
          <VAlert v-if="sslMode === 'full_strict'" type="success" variant="tonal" density="compact">
            Your zone is using the most secure SSL mode.
          </VAlert>
        </VCardText>
      </VCard>
    </template>

    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-lock" size="48" class="mb-2" />
        <p>Select an account and zone to configure SSL/TLS</p>
      </VCardText>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
