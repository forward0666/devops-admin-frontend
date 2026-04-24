<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useOperationLogStore } from '~/stores/operation-logs'

const logStore = useOperationLogStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const search = ref('')
const filterStatus = ref('')
const filterDate = ref('')

const headers = [
  { title: 'Username', key: 'username' },
  { title: 'IP Address', key: 'ipAddress' },
  { title: 'Operation', key: 'operationName' },
  { title: 'Status', key: 'status' },
  { title: 'Time', key: 'createdAt', sortable: true },
]

const items = ref([])

// Watch for changes in the log store
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
  
  if (filterStatus.value) {
    filtered = filtered.filter((l: any) => (l.status || '').toUpperCase() === filterStatus.value.toUpperCase())
  }
  
  if (filterDate.value) {
    filtered = filtered.filter((l: any) => (l.timestamp || '').startsWith(filterDate.value))
  }
  
  return filtered
})

const isAuthLogin = (l: any) => {
  const rt = (l.resourceType || '').toUpperCase()
  return rt.includes('AUTH') || rt.includes('LOGIN') || rt.includes('USER') && (l.operationType || '').includes('LOGIN')
}

onMounted(() => logStore.fetchLogs({ category: 'AUTH' }))

async function refresh() {
  try {
    await logStore.fetchLogs({ category: 'AUTH' })
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
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="primary" @click="refresh">Refresh</VBtn>
      </VCol>
    </VRow>

    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-4">
        <VTextField v-model="search" placeholder="Search username / IP" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" />
      </VCardText>
    </VCard>

    <VCard :loading="logStore.loading">
      <VDataTable :headers="headers" :items="filteredLogs" :items-per-page="10" :items-per-page-options="[10, 20, 50, 100]" class="text-no-wrap">
        <template #item.username="{ item }">
          <span class="font-weight-medium">{{ item.username || '-' }}</span>
        </template>
        <template #item.status="{ item }">
          <VChip v-if="item.status" variant="tonal" :color="item.status === 'SUCCESS' ? 'success' : 'error'" size="small" label>{{ item.status }}</VChip>
          <span v-else class="text-body-2 text-medium-emphasis">-</span>
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ item.createdAt || item.timestamp || '-' }}</span>
        </template>
      </VDataTable>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
