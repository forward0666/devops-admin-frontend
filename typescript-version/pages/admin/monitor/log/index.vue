<script setup lang="ts">
const logStore = useOperationLogStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const search = ref('')
const page = ref(1)
const pageSize = ref(20)
const isDetailDialogVisible = ref(false)
const selectedLog = ref<any>(null)
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
    // Today: start of today
    from.setHours(0, 0, 0, 0)
    dateRange.value = [from.toISOString().split('T')[0], now.toISOString().split('T')[0]]
    selectedPreset.value = 'Today'
  } else if (days === -1) {
    // Yesterday
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
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Module', key: 'resourceType', sortable: true },
  { title: 'Action', key: 'operationType', sortable: true },
  { title: 'Username', key: 'username', sortable: true },
  { title: 'IP', key: 'ipAddress', sortable: true },
  { title: 'Path', key: 'url', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Time', key: 'createdAt', sortable: true },
  { title: 'Detail', key: 'actions', sortable: false },
]

const filteredLogs = computed(() => {
  let items = logStore.logs
  if (search.value) {
    const q = search.value.toLowerCase()
    items = items.filter((l: any) =>
      (l.resourceType || '').toLowerCase().includes(q) ||
      (l.operationName || '').toLowerCase().includes(q) ||
      (l.username || '').toLowerCase().includes(q) ||
      (l.ipAddress || '').toLowerCase().includes(q) ||
      (l.url || '').toLowerCase().includes(q),
    )
  }
  return items
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / pageSize.value)))
const pagedLogs = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

async function fetchWithDate() {
  const params: any = {}
  if (dateRange.value.length === 2) {
    params.startDate = dateRange.value[0]
    params.endDate = dateRange.value[1]
  }
  await logStore.fetchLogs(params)
}

function resetDateFilter() {
  dateRange.value = []
  logStore.fetchLogs()
}

async function refresh() {
  try {
    await fetchWithDate()
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to load logs', color: 'error' }
  }
}

onMounted(() => applyPreset('30d'))

</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap align-center gap-4">
        <VTextField v-model="search" placeholder="Keyword search" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" />
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
                  <VBtn size="small" variant="tonal" color="primary" @click="dateRange = [customFrom, customTo]; selectedPreset = displayLabel(); dateMenuOpen.value = false; showCustomRange = false; refresh()">Apply</VBtn>
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
            <th style="width: 80px;">ID</th>
            <th style="width: 100px;">Module</th>
            <th style="width: 100px;">Action</th>
            <th style="width: 120px;">Username</th>
            <th style="width: 130px;">IP</th>
            <th>Path</th>
            <th style="width: 80px;">Status</th>
            <th style="width: 160px;">Time</th>
            <th style="width: 80px;">Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedLogs" :key="item.id">
            <td>{{ item.id || '-' }}</td>
            <td>{{ item.resourceType || '-' }}</td>
            <td>
              <VChip v-if="item.operationType" variant="tonal" :color="item.operationType === 'INSERT' ? 'success' : item.operationType === 'UPDATE' ? 'info' : item.operationType === 'DELETE' ? 'error' : 'secondary'" size="small" label>{{ item.operationType }}</VChip>
              <span v-else class="text-body-2 text-medium-emphasis">-</span>
            </td>
            <td>{{ item.username || '-' }}</td>
            <td>{{ item.ipAddress || '-' }}</td>
            <td>{{ item.url || '-' }}</td>
            <td>
              <VChip v-if="item.status" variant="tonal" :color="item.status === 'success' ? 'success' : 'error'" size="small" label>{{ item.status }}</VChip>
              <span v-else class="text-body-2 text-medium-emphasis">-</span>
            </td>
            <td><span class="text-body-2">{{ item.createdAt || item.time || '-' }}</span></td>
            <td>
              <IconBtn size="small" @click="selectedLog = item; isDetailDialogVisible = true">
                <VIcon icon="bx-show" size="18" />
              </IconBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <VDialog v-model="isDetailDialogVisible" max-width="600">
      <VCard title="Operation Detail">
        <VCardText v-if="selectedLog">
          <VList density="compact" lines="one">
            <VListItem><VListItemTitle><strong>Module:</strong> {{ selectedLog.resourceType || '-' }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>Action:</strong> {{ selectedLog.operationName || selectedLog.operationType || '-' }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>Operator:</strong> {{ selectedLog.username || '-' }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>User ID:</strong> {{ selectedLog.userId || '-' }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>IP:</strong> {{ selectedLog.ipAddress || '-' }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>Path:</strong> {{ selectedLog.url || '-' }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>Status:</strong> {{ selectedLog.status || '-' }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>Time:</strong> {{ selectedLog.createdAt || selectedLog.timestamp || '-' }}</VListItemTitle></VListItem>
          </VList>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDetailDialogVisible = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

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
