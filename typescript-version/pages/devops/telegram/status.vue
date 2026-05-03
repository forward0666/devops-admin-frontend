<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const loading = ref(true)
const status = ref<any>(null)
const deletions = ref<any[]>([])
const autoRefresh = ref(true)
let timer: ReturnType<typeof setInterval> | null = null

async function fetchStatus() {
  try {
    const { telegramBotService } = await import('~/services/api')
    const [statusRes, deletionsRes] = await Promise.all([
      telegramBotService.getServiceStatus(),
      telegramBotService.getPendingDeletions()
    ])
    status.value = statusRes
    deletions.value = deletionsRes
  } catch (e: any) {
    console.error('Failed to fetch service status', e)
  } finally {
    loading.value = false
  }
}

function startAutoRefresh() {
  if (timer) clearInterval(timer)
  if (autoRefresh.value) {
    timer = setInterval(fetchStatus, 3000)
  }
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  startAutoRefresh()
}

function formatMs(ms: number) {
  return ms < 100 ? `${ms}ms` : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

onMounted(() => {
  fetchStatus()
  startAutoRefresh()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h4 class="text-h4 mb-1">Service Status</h4>
        <p class="text-body-2 text-medium-emphasis mb-0">Monitor bot service health and pending tasks</p>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          size="small"
          :variant="autoRefresh ? 'flat' : 'tonal'"
          :color="autoRefresh ? 'success' : 'default'"
          @click="toggleAutoRefresh"
        >
          <VIcon start size="16">{{ autoRefresh ? 'bx-refresh' : 'bx-pause' }}</VIcon>
          {{ autoRefresh ? 'Auto (3s)' : 'Paused' }}
        </VBtn>
        <VBtn size="small" variant="tonal" @click="fetchStatus">
          <VIcon start size="16">bx-reload</VIcon>
          Refresh
        </VBtn>
      </div>
    </div>

    <VAlert v-if="loading" type="info" variant="tonal" class="mb-4">
      Loading...
    </VAlert>

    <template v-if="status">
      <!-- Active Requests -->
      <VCard class="mb-4">
        <VCardTitle class="d-flex align-center">
          <VIcon start :color="(status.activeRequests?.count || 0) > 0 ? 'error' : 'success'">bx-transfer-alt</VIcon>
          Active Webhook Requests
          <VSpacer />
          <VChip :color="(status.activeRequests?.count || 0) > 0 ? 'error' : 'success'" size="small" label>
            {{ status.activeRequests?.count || 0 }}
          </VChip>
        </VCardTitle>
        <VCardText v-if="(status.activeRequests?.requests?.length || 0) > 0">
          <VAlert type="error" variant="tonal" class="mb-3" density="compact">
            ⚠️ These requests are stuck and not completing!
          </VAlert>
          <div v-for="(req, idx) in status.activeRequests.requests" :key="idx" class="text-body-2 mb-1 font-monospace">
            {{ req }}
          </div>
        </VCardText>
        <VCardText v-else class="text-medium-emphasis">
          ✅ No stuck requests
        </VCardText>
      </VCard>

      <!-- Redis -->
      <VCard class="mb-4">
        <VCardTitle class="d-flex align-center">
          <VIcon start color="error">bx-data</VIcon>
          Redis
          <VSpacer />
          <VChip :color="status.redis?.status === 'UP' ? 'success' : 'error'" size="small" label>
            {{ status.redis?.status }}
          </VChip>
        </VCardTitle>
        <VCardText>
          <div class="d-flex gap-6">
            <div>
              <div class="text-caption text-medium-emphasis">Ping Latency</div>
              <div class="text-h6">{{ formatMs(status.redis?.pingMs || 0) }}</div>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Pending Deletions -->
      <VCard class="mb-4">
        <VCardTitle class="d-flex align-center">
          <VIcon start color="warning">bx-time-five</VIcon>
          Pending Deletions
          <VSpacer />
          <VChip :color="(status.pendingDeletions?.expired || 0) > 0 ? 'error' : 'success'" size="small" label>
            {{ status.pendingDeletions?.expired || 0 }} expired
          </VChip>
        </VCardTitle>
        <VCardText>
          <div class="d-flex gap-6">
            <div>
              <div class="text-caption text-medium-emphasis">Total in Queue</div>
              <div class="text-h6">{{ status.pendingDeletions?.total || 0 }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Expired (waiting for scan)</div>
              <div class="text-h6" :class="{ 'text-error': (status.pendingDeletions?.expired || 0) > 0 }">
                {{ status.pendingDeletions?.expired || 0 }}
              </div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Pending (not yet expired)</div>
              <div class="text-h6">{{ status.pendingDeletions?.pending || 0 }}</div>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Deletion List -->
      <VCard class="mb-4" v-if="deletions.length > 0">
        <VCardTitle class="d-flex align-center">
          <VIcon start>bx-list-check</VIcon>
          Deletion Queue Detail
        </VCardTitle>
        <VTable density="compact">
          <thead>
            <tr>
              <th>Chat ID</th>
              <th>Message ID</th>
              <th>User ID</th>
              <th>Status</th>
              <th>Remaining</th>
              <th>Scheduled At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in deletions" :key="idx" :class="{ 'text-error': item.expired }">
              <td>{{ item.chatId }}</td>
              <td>{{ item.messageId }}</td>
              <td>{{ item.userId }}</td>
              <td>
                <VChip :color="item.expired ? 'error' : 'warning'" size="x-small" label>
                  {{ item.expired ? 'EXPIRED' : 'WAITING' }}
                </VChip>
              </td>
              <td>{{ item.remainingSeconds }}s</td>
              <td class="text-caption">{{ new Date(item.expireAt).toLocaleTimeString() }}</td>
            </tr>
          </tbody>
        </VTable>
      </VCard>

      <!-- JVM -->
      <VCard class="mb-4">
        <VCardTitle class="d-flex align-center">
          <VIcon start color="info">bx-chip</VIcon>
          JVM
          <VSpacer />
          <VChip size="small" label>{{ status.jvm?.uptime }}</VChip>
        </VCardTitle>
        <VCardText>
          <div class="d-flex gap-6 flex-wrap">
            <div>
              <div class="text-caption text-medium-emphasis">Heap Used / Max</div>
              <div class="text-h6">{{ status.jvm?.heapUsed }} / {{ status.jvm?.heapMax }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Total Memory</div>
              <div class="text-h6">{{ status.jvm?.totalMemory }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Free Memory</div>
              <div class="text-h6">{{ status.jvm?.freeMemory }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Processors</div>
              <div class="text-h6">{{ status.jvm?.processors }}</div>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Threads -->
      <VCard class="mb-4">
        <VCardTitle class="d-flex align-center">
          <VIcon start color="secondary">bx-loader-alt</VIcon>
          Threads
        </VCardTitle>
        <VCardText>
          <div class="d-flex gap-6">
            <div>
              <div class="text-caption text-medium-emphasis">Current</div>
              <div class="text-h6">{{ status.threads?.current }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Peak</div>
              <div class="text-h6">{{ status.threads?.peak }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Daemon</div>
              <div class="text-h6">{{ status.threads?.daemon }}</div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </template>
  </div>
</template>
