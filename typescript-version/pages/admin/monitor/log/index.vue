<script setup lang="ts">
const logStore = useOperationLogStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const search = ref('')
const filterModule = ref('')
const filterType = ref('')
const filterStatus = ref('')
const isDetailDialogVisible = ref(false)
const selectedLog = ref<any>(null)

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Module', key: 'resourceType' },
  { title: 'Action', key: 'operationType' },
  { title: 'Username', key: 'username' },
  { title: 'IP', key: 'ipAddress' },
  { title: 'Path', key: 'url' },
  { title: 'Status', key: 'status' },
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
  if (filterModule.value) items = items.filter((l: any) => (l.resourceType || '').toLowerCase() === filterModule.value.toLowerCase())
  if (filterType.value) items = items.filter((l: any) => l.operationType === filterType.value)
  if (filterStatus.value) items = items.filter((l: any) => (l.status || '').toLowerCase() === filterStatus.value.toLowerCase())
  return items
})

const uniqueModules = computed(() => {
  console.log('Log store data:', logStore.logs)
  return [...new Set(logStore.logs.map((l: any) => l.resourceType).filter(Boolean))].sort()
})

onMounted(() => logStore.fetchLogs())

async function refresh() {
  try {
    await logStore.fetchLogs()
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to load logs', color: 'error' }
  }
}
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Operation Log</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="primary" @click="refresh">Refresh</VBtn>
      </VCol>
    </VRow>

    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-4">
        <VTextField v-model="search" placeholder="Keyword search" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" />
      </VCardText>
    </VCard>

    <VCard :loading="logStore.loading">
      <VDataTable :headers="headers" :items="filteredLogs" :items-per-page="10" :items-per-page-options="[10, 20, 50, 100]" class="text-no-wrap">
        <template #item.operationType="{ item }">
          <VChip v-if="item.operationType" variant="tonal" :color="item.operationType === 'INSERT' ? 'success' : item.operationType === 'UPDATE' ? 'info' : item.operationType === 'DELETE' ? 'error' : 'secondary'" size="small" label>{{ item.operationType }}</VChip>
          <span v-else class="text-body-2 text-medium-emphasis">-</span>
        </template>
        <template #item.status="{ item }">
          <VChip v-if="item.status" variant="tonal" :color="item.status === 'success' ? 'success' : 'error'" size="small" label>{{ item.status }}</VChip>
          <span v-else class="text-body-2 text-medium-emphasis">-</span>
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ item.createdAt || item.time || '-' }}</span>
        </template>
        <template #item.actions="{ item }">
          <IconBtn size="small" @click="selectedLog = item; isDetailDialogVisible = true">
            <VIcon icon="bx-show" size="18" />
          </IconBtn>
        </template>
      </VDataTable>
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
