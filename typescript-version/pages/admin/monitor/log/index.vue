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
  { title: 'Module', key: 'module' },
  { title: 'Action', key: 'action' },
  { title: 'Username', key: 'username' },
  { title: 'IP', key: 'ip' },
  { title: 'Path', key: 'path' },
  { title: 'Status', key: 'status' },
  { title: 'Time', key: 'createdAt', sortable: true },
  { title: 'Detail', key: 'actions', sortable: false },
]

const filteredLogs = computed(() => {
  let items = logStore.logs
  if (search.value) items = items.filter((l: any) => (l.module || '').toLowerCase().includes(search.value.toLowerCase()) || (l.username || '').toLowerCase().includes(search.value.toLowerCase()))
  if (filterType.value) items = items.filter((l: any) => l.action === filterType.value)
  if (filterStatus.value) items = items.filter((l: any) => l.status === filterStatus.value)
  return items
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
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="secondary" @click="refresh">Refresh</VBtn>
      </VCol>
    </VRow>

    <VCard :loading="logStore.loading">
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="3">
            <AppTextField v-model="search" placeholder="Search module / username" prepend-inner-icon="bx-search" density="compact" hide-details clearable @update:model-value="" />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <AppSelect v-model="filterType" placeholder="Action" :items="['INSERT', 'UPDATE', 'DELETE', 'SELECT', 'OTHER']" density="compact" hide-details clearable />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <AppSelect v-model="filterStatus" placeholder="Status" :items="['success', 'error']" density="compact" hide-details clearable />
          </VCol>
          <VCol cols="12" md="2">
            <VBtn color="primary" block prepend-icon="bx-search" size="small" @click="refresh">Search</VBtn>
          </VCol>
        </VRow>
      </VCardText>
      <VDataTable :headers="headers" :items="filteredLogs" :items-per-page="10" class="text-no-wrap">
        <template #item.action="{ item }">
          <VChip v-if="item.action" variant="tonal" :color="item.action === 'INSERT' ? 'success' : item.action === 'UPDATE' ? 'info' : item.action === 'DELETE' ? 'error' : 'secondary'" size="small" label>{{ item.action }}</VChip>
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
        <template #bottom>
          <div v-if="!filteredLogs.length && !logStore.loading" class="text-center py-6 text-medium-emphasis">
            No logs found
          </div>
        </template>
      </VDataTable>
    </VCard>

    <VDialog v-model="isDetailDialogVisible" max-width="600">
      <VCard title="Operation Detail">
        <VCardText v-if="selectedLog">
          <VList density="compact" lines="one">
            <VListItem v-if="selectedLog.module"><VListItemTitle><strong>Module:</strong> {{ selectedLog.module }}</VListItemTitle></VListItem>
            <VListItem v-if="selectedLog.action"><VListItemTitle><strong>Action:</strong> {{ selectedLog.action }}</VListItemTitle></VListItem>
            <VListItem v-if="selectedLog.username"><VListItemTitle><strong>Operator:</strong> {{ selectedLog.username }}</VListItemTitle></VListItem>
            <VListItem v-if="selectedLog.userId"><VListItemTitle><strong>User ID:</strong> {{ selectedLog.userId }}</VListItemTitle></VListItem>
            <VListItem v-if="selectedLog.ip"><VListItemTitle><strong>IP:</strong> {{ selectedLog.ip }}</VListItemTitle></VListItem>
            <VListItem v-if="selectedLog.path"><VListItemTitle><strong>Path:</strong> {{ selectedLog.path }}</VListItemTitle></VListItem>
            <VListItem v-if="selectedLog.status"><VListItemTitle><strong>Status:</strong> {{ selectedLog.status }}</VListItemTitle></VListItem>
            <VListItem v-if="selectedLog.createdAt"><VListItemTitle><strong>Time:</strong> {{ selectedLog.createdAt }}</VListItemTitle></VListItem>
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
