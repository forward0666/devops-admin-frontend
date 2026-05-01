<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { telegramHealthService, telegramSessionService } from '~/services/api'

definePageMeta({ layout: 'default' })

const loading = ref(false)
const overall = ref<any>(null)
const botMetrics = ref<any>(null)
const sessionStats = ref<any>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

const statusColor = (s: string) => s === 'healthy' ? 'success' : s === 'unhealthy' ? 'error' : 'warning'

async function loadAll() {
  loading.value = true
  try {
    const [o, b, s] = await Promise.all([
      telegramHealthService.overall(),
      telegramHealthService.botMetrics(),
      telegramSessionService.stats(),
    ])
    overall.value = o
    botMetrics.value = b
    sessionStats.value = s
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load health data', color: 'error' }
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadAll() })
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center py-3">
        <div>
          <h4 class="text-h4 mb-1">System Health</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Telegram bot platform status and metrics</p>
        </div>
        <VSpacer />
        <VBtn variant="outlined" :loading="loading" @click="loadAll">
          <VIcon start icon="bx-refresh" />Refresh
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Overall Status -->
    <VRow class="mb-4">
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="text-center pa-6">
            <VIcon icon="bx-check-circle" size="48" :color="statusColor(overall?.overallStatus)" class="mb-2" />
            <h5 class="text-h5">System</h5>
            <VChip :color="statusColor(overall?.overallStatus)" size="small" class="mt-1">
              {{ overall?.overallStatus || 'loading...' }}
            </VChip>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="text-center pa-6">
            <VIcon icon="bx-data" size="48" :color="statusColor(overall?.database)" class="mb-2" />
            <h5 class="text-h5">Database</h5>
            <VChip :color="statusColor(overall?.database)" size="small" class="mt-1">
              {{ overall?.database || 'loading...' }}
            </VChip>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard>
          <VCardText class="text-center pa-6">
            <VIcon icon="bx-server" size="48" :color="statusColor(overall?.cache)" class="mb-2" />
            <h5 class="text-h5">Cache</h5>
            <VChip :color="statusColor(overall?.cache)" size="small" class="mt-1">
              {{ overall?.cache || 'loading...' }}
            </VChip>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Metrics -->
    <VRow>
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle>Bot Metrics</VCardTitle>
          <VDivider />
          <VCardText v-if="botMetrics">
            <VList density="compact">
              <VListItem title="Total Bots" :subtitle="String(botMetrics.totalBots || 0)" prepend-icon="bx-bot" />
              <VListItem title="Active Bots" :subtitle="String(botMetrics.activeBots || 0)" prepend-icon="bx-check" color="success" />
              <VListItem title="Inactive Bots" :subtitle="String(botMetrics.inactiveBots || 0)" prepend-icon="bx-x" color="error" />
            </VList>
            <VDivider class="my-2" />
            <p class="text-body-2 text-medium-emphasis mb-1">By Type</p>
            <div v-if="botMetrics.botsByType" class="d-flex flex-wrap gap-2">
              <VChip v-for="(count, type) in botMetrics.botsByType" :key="type" size="small">
                {{ type }}: {{ count }}
              </VChip>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle>Session Stats</VCardTitle>
          <VDivider />
          <VCardText v-if="sessionStats">
            <VList density="compact">
              <VListItem title="Total Sessions" :subtitle="String(sessionStats.totalSessions || 0)" prepend-icon="bx-group" />
              <VListItem title="Active Sessions" :subtitle="String(sessionStats.activeSessions || 0)" prepend-icon="bx-user-check" />
              <VListItem title="Expired Sessions" :subtitle="String(sessionStats.expiredSessions || 0)" prepend-icon="bx-user-x" />
            </VList>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top end">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
