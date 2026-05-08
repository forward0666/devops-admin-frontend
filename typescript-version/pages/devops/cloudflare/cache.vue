<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCfAccounts, useCfData } from '~/composables/useCf'

definePageMeta({ layout: 'default' })

const { accounts, getByTag } = useCfAccounts()
const { zones, cacheLogs } = useCfData()

const selectedAccountId = ref('')
const selectedZoneId = ref('')
const snackbar = ref({ show: false, text: '', color: 'success' }
)
const purgeDialog = ref(false)
const purgeMode = ref<'all' | 'url' | 'tag' | 'host'>('all')
const purgeInput = ref('')

const cacheAccounts = computed(() => getByTag('cache'))
const filteredZones = computed(() => zones.value.filter(z => z.accountId === selectedAccountId.value))

function openPurge(mode: typeof purgeMode.value) {
  purgeMode.value = mode
  purgeInput.value = mode === 'all' ? '' : ''
  purgeDialog.value = true
}

function executePurge() {
  if (!selectedZoneId.value) return
  const zone = zones.value.find(z => z.id === selectedZoneId.value)
  const zoneName = zone?.name || 'unknown'

  if (purgeMode.value === 'all') {
    addLog('Purge All', zoneName)
  } else if (purgeInput.value.trim()) {
    const target = purgeInput.value.trim()
    addLog(`Purge ${purgeMode.value === 'url' ? 'URL' : purgeMode.value === 'tag' ? 'Tag' : 'Host'}`, target)
  } else {
    snackbar.value = { show: true, text: 'Please enter a value', color: 'error' }
    return
  }

  snackbar.value = { show: true, text: 'Cache purge initiated', color: 'success' }
  purgeDialog.value = false
}

function addLog(type: string, target: string) {
  cacheLogs.value.unshift({
    id: Date.now().toString(36),
    zoneId: selectedZoneId.value,
    type,
    target,
    timestamp: new Date().toISOString(),
  })
  if (cacheLogs.value.length > 100) cacheLogs.value = cacheLogs.value.slice(0, 100)
}

const zoneLogs = computed(() => cacheLogs.value.filter(l => l.zoneId === selectedZoneId.value))

const purgeModes = [
  { value: 'all' as const, label: 'Purge All', icon: 'bx-trash', desc: 'Remove all cached files for this zone', color: 'error' },
  { value: 'url' as const, label: 'Purge by URL', icon: 'bx-link', desc: 'Remove cached file by specific URL', color: 'warning' },
  { value: 'tag' as const, label: 'Purge by Tag', icon: 'bx-purchase-tag', desc: 'Remove files with a specific cache tag', color: 'info' },
  { value: 'host' as const, label: 'Purge by Host', icon: 'bx-server', desc: 'Remove all cached files for a specific hostname', color: 'primary' },
]
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Cache Purge</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Purge Cloudflare cache</p>
        </div>
        <VSelect v-model="selectedAccountId" :items="cacheAccounts.map((a: any) => ({ title: a.name, value: a.id }))" label="Account" density="compact" style="max-width: 180px" hide-details />
        <VSelect v-model="selectedZoneId" :items="filteredZones.map((z: any) => ({ title: z.name, value: z.id }))" label="Zone" density="compact" style="max-width: 220px" hide-details :disabled="!selectedAccountId" />
      </VCardText>
    </VCard>

    <template v-if="selectedZoneId">
      <!-- Purge Options -->
      <div class="d-flex flex-wrap gap-3 mb-4">
        <VCard v-for="mode in purgeModes" :key="mode.value" variant="outlined" class="flex-grow-1" style="min-width: 200px; max-width: 280px">
          <VCardText class="text-center pa-4">
            <VBtn :color="mode.color" variant="tonal" :icon="mode.icon" class="mb-2" @click="openPurge(mode.value)" />
            <div class="text-subtitle-2">{{ mode.label }}</div>
            <div class="text-caption text-medium-emphasis mt-1">{{ mode.desc }}</div>
          </VCardText>
        </VCard>
      </div>

      <!-- Purge History -->
      <VCard>
        <VCardTitle class="text-subtitle-1">Purge History</VCardTitle>
        <VTable v-if="zoneLogs.length > 0">
          <thead>
            <tr>
              <th style="width: 160px">Time</th>
              <th style="width: 130px">Type</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in zoneLogs" :key="log.id">
              <td class="text-caption">{{ new Date(log.timestamp).toLocaleString() }}</td>
              <td><VChip size="x-small" :color="log.type === 'Purge All' ? 'error' : 'info'" variant="tonal">{{ log.type }}</VChip></td>
              <td><code class="text-caption">{{ log.target }}</code></td>
            </tr>
          </tbody>
        </VTable>
        <VCardText v-else class="text-center py-6 text-medium-emphasis">No purge history</VCardText>
      </VCard>
    </template>

    <VCard v-else>
      <VCardText class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-bolt" size="48" class="mb-2" />
        <p>Select an account and zone to manage cache</p>
      </VCardText>
    </VCard>

    <!-- Purge Dialog -->
    <VDialog v-model="purgeDialog" max-width="450">
      <VCard>
        <VCardTitle>{{ purgeModes.find(m => m.value === purgeMode)?.label }}</VCardTitle>
        <VCardText>
          <VAlert v-if="purgeMode === 'all'" type="error" variant="tonal" density="compact" class="mb-3">
            This will purge ALL cached files for this zone. Are you sure?
          </VAlert>
          <VTextField v-if="purgeMode === 'url'" v-model="purgeInput" label="URL" density="compact" placeholder="https://example.com/page.html" class="mb-2" />
          <VTextField v-if="purgeMode === 'tag'" v-model="purgeInput" label="Cache Tag" density="compact" placeholder="e.g. product-123" class="mb-2" />
          <VTextField v-if="purgeMode === 'host'" v-model="purgeInput" label="Hostname" density="compact" placeholder="e.g. cdn.example.com" class="mb-2" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="purgeDialog = false">Cancel</VBtn>
          <VBtn color="error" :loading="false" @click="executePurge">Purge</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
