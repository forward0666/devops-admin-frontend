<script setup lang="ts">
const logStore = useOperationLogStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const search = ref('')
const filterStatus = ref('')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Username', key: 'username' },
  { title: 'IP Address', key: 'ip' },
  { title: 'Action', key: 'action' },
  { title: 'Status', key: 'status' },
  { title: 'Time', key: 'createdAt', sortable: true },
]

const filteredLogs = computed(() => {
  let items = logStore.logs
  if (search.value) items = items.filter((l: any) => (l.username || '').toLowerCase().includes(search.value.toLowerCase()))
  if (filterStatus.value) items = items.filter((l: any) => l.status === filterStatus.value)
  return items
})

onMounted(() => logStore.fetchLogs({ module: 'auth' }))

async function refresh() {
  try {
    await logStore.fetchLogs({ module: 'auth' })
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to load login logs', color: 'error' }
  }
}
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Login Log</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="secondary" @click="refresh">Refresh</VBtn>
      </VCol>
    </VRow>

    <VCard :loading="logStore.loading">
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="3">
            <AppTextField v-model="search" placeholder="Search username" prepend-inner-icon="bx-search" density="compact" hide-details clearable />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <AppSelect v-model="filterStatus" placeholder="Status" :items="['success', 'error']" density="compact" hide-details clearable />
          </VCol>
          <VCol cols="12" md="3">
            <VBtn color="primary" block prepend-icon="bx-search" size="small" @click="refresh">Search</VBtn>
          </VCol>
        </VRow>
      </VCardText>
      <VDataTable :headers="headers" :items="filteredLogs" :items-per-page="10" class="text-no-wrap">
        <template #item.username="{ item }">
          <span :class="item.status === 'success' ? 'font-weight-medium' : 'font-weight-medium text-error'">{{ item.username || '-' }}</span>
        </template>
        <template #item.status="{ item }">
          <VChip v-if="item.status" variant="tonal" :color="item.status === 'success' ? 'success' : 'error'" size="small" label>{{ item.status === 'success' ? 'Success' : 'Failed' }}</VChip>
          <span v-else class="text-body-2 text-medium-emphasis">-</span>
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ item.createdAt || '-' }}</span>
        </template>
        <template #bottom>
          <div v-if="!filteredLogs.length && !logStore.loading" class="text-center py-6 text-medium-emphasis">
            No login logs found
          </div>
        </template>
      </VDataTable>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
