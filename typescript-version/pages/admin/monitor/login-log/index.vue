<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useOperationLogStore } from '~/stores/operation-logs'

const logStore = useOperationLogStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const search = ref('')
const filterStatus = ref('')
const filterDate = ref('')

const headers = [
  { title: 'Username', key: 'username', sortable: true },
  { title: 'IP Address', key: 'ipAddress', sortable: true },
  { title: 'Operation', key: 'operationName', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Time', key: 'createdAt', sortable: true },
]

const items = ref([])
const page = ref(1)
const pageSize = ref(20)

// Watch for changes in the log store
watch(() => logStore.logs, (newLogs) => {
  console.log('Login logs updated:', newLogs)
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

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / pageSize.value)))
const pagedLogs = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
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
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap align-center gap-4">
        <VTextField v-model="search" placeholder="Search username / IP" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" />
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
