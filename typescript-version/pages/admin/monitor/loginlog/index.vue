<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useOperationLogStore } from '~/stores/operation-logs'

const logStore = useOperationLogStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const search = ref('')
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref<string[]>([])
const customFrom = ref('')
const customTo = ref('')
const dateMenuOpen = ref(false)
const showCustomRange = ref(false)
const selectedPreset = ref('Last 30 days')

const presets = [
  { label: 'Today', value: '0d' },
  { label: 'Yesterday', value: '-1d' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 180 days', value: '180d' },
  { label: 'Last 365 days', value: '365d' },
]

function applyPreset(preset: string) {
  const now = new Date()
  const from = new Date(now)
  const days = parseInt(preset)
  if (days === 0) {
    from.setHours(0, 0, 0, 0)
    dateRange.value = [from.toISOString().split('T')[0], now.toISOString().split('T')[0]]
    selectedPreset.value = 'Today'
  } else if (days === -1) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    dateRange.value = [yesterday.toISOString().split('T')[0], yesterday.toISOString().split('T')[0]]
    selectedPreset.value = 'Yesterday'
  } else {
    from.setDate(from.getDate() - days)
    dateRange.value = [from.toISOString().split('T')[0], now.toISOString().split('T')[0]]
    selectedPreset.value = `Last ${days} days`
  }
  dateMenuOpen.value = false
  refresh()
}

function displayLabel() {
  if (dateRange.value.length === 2) {
    if (dateRange.value[0] === dateRange.value[1]) return dateRange.value[0]
    return `${dateRange.value[0]} ~ ${dateRange.value[1]}`
  }
  return 'Date Range'
}

const headers = [
  { title: 'Username', key: 'username', sortable: true },
  { title: 'IP Address', key: 'ipAddress', sortable: true },
  { title: 'Operation', key: 'operationName', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Time', key: 'createdAt', sortable: true },
]

const items = ref<any[]>([])

watch(() => logStore.logs, (newLogs) => {
  items.value = newLogs
}, { immediate: true })

const filteredLogs = computed(() => {
  let filtered = [...items.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    filtered = filtered.filter((l: any) =>
      (l.username || '').toLowerCase().includes(q) ||
      (l.ipAddress || '').toLowerCase().includes(q)
    )
  }
  return filtered
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / pageSize.value)))
const pagedLogs = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

async function fetchWithDate() {
  if (dateRange.value.length !== 2 || !dateRange.value[0] || !dateRange.value[1]) {
    snackbar.value = { show: true, text: '请先选择日期范围', color: 'warning' }
    return
  }
  const params: any = { category: 'AUTH' }
  params.startDate = dateRange.value[0]
  params.endDate = dateRange.value[1]
  await logStore.fetchLogs(params)
}

async function refresh() {
  try {
    await fetchWithDate()
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to load login logs', color: 'error' }
  }
}

onMounted(() => applyPreset('30d'))
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap align-center gap-4">
        <VTextField v-model="search" placeholder="Search username / IP" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" />
        <VMenu v-model="dateMenuOpen" :close-on-content-click="false" min-width="280">
          <template #activator="{ props }">
            <VBtn variant="outlined" density="comfortable" size="small" v-bind="props" class="text-none">
              <VIcon start icon="bx-calendar" size="18" />
              {{ selectedPreset }}
              <VIcon end icon="bx-chevron-down" size="16" />
            </VBtn>
          </template>
          <VCard min-width="280">
            <VList density="compact" class="pa-0">
              <VListItem
                v-for="p in presets" :key="p.value"
                :active="selectedPreset === p.label"
                class="cursor-pointer"
                @click="applyPreset(p.value)"
              >
                <VListItemTitle>{{ p.label }}</VListItemTitle>
              </VListItem>
              <VDivider />
              <VListItem @click="showCustomRange = true">
                <VListItemTitle class="d-flex align-center">
                  <VIcon icon="bx-calendar-event" size="18" class="me-2" />
                  Custom Range
                </VListItemTitle>
              </VListItem>
            </VList>
            <VExpandTransition>
              <div v-if="showCustomRange" class="pa-3">
                <div class="d-flex gap-2 align-center mb-2">
                  <VTextField v-model="customFrom" type="date" label="From" density="compact" hide-details variant="outlined" />
                  <span class="text-medium-emphasis">~</span>
                  <VTextField v-model="customTo" type="date" label="To" density="compact" hide-details variant="outlined" />
                </div>
                <div class="d-flex justify-end gap-2">
                  <VBtn size="small" variant="text" @click="showCustomRange = false">Cancel</VBtn>
                  <VBtn size="small" variant="tonal" color="primary" @click="dateRange = [customFrom, customTo]; selectedPreset = displayLabel(); dateMenuOpen = false; showCustomRange = false; refresh()">Apply</VBtn>
                </div>
              </div>
            </VExpandTransition>
          </VCard>
        </VMenu>
        <VSpacer />
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="primary" size="small" @click="refresh">Refresh</VBtn>
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[10, 20, 50, 100]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
      </VCardText>
    </VCard>

    <VCard :loading="logStore.loading" style="display: flex; flex-direction: column; flex: 1; min-height: 0; height: 0;">
      <VTable hover density="compact" class="text-no-wrap sticky-table">
        <thead>
          <tr>
            <th style="width: 150px;">Username</th>
            <th style="width: 150px;">IP Address</th>
            <th style="width: 150px;">Operation</th>
            <th style="width: 100px;">Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedLogs" :key="item.id">
            <td><span class="font-weight-medium">{{ item.username || '-' }}</span></td>
            <td>{{ item.ipAddress || '-' }}</td>
            <td>{{ item.operationName || '-' }}</td>
            <td>
              <VChip v-if="item.status" variant="tonal" :color="item.status === 'SUCCESS' ? 'success' : 'error'" size="small" label>{{ item.status }}</VChip>
              <span v-else class="text-body-2 text-medium-emphasis">-</span>
            </td>
            <td><span class="text-body-2">{{ item.createdAt || item.timestamp || '-' }}</span></td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>

<style scoped>
.sticky-table {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.sticky-table :deep(.v-table__wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.sticky-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
}
</style>
