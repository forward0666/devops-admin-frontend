<script setup lang="ts">
const search = ref('')
const dateRange = ref('')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Module', key: 'module' },
  { title: 'Type', key: 'type' },
  { title: 'Operator', key: 'operator' },
  { title: 'IP', key: 'ip' },
  { title: 'Status', key: 'status' },
  { title: 'Time', key: 'time', sortable: true },
  { title: 'Detail', key: 'actions', sortable: false },
]

const logs = ref([
  { id: 1, module: 'User Management', type: 'INSERT', operator: 'admin', ip: '192.168.1.100', status: 'success', time: '2024-12-14 10:30:00', detail: 'Created user "jack"' },
  { id: 2, module: 'Role Management', type: 'UPDATE', operator: 'admin', ip: '192.168.1.100', status: 'success', time: '2024-12-14 10:25:00', detail: 'Updated role "editor" permissions' },
  { id: 3, module: 'Menu Management', type: 'DELETE', operator: 'admin', ip: '192.168.1.100', status: 'success', time: '2024-12-14 10:20:00', detail: 'Deleted menu "Legacy Page"' },
  { id: 4, module: 'Dictionary', type: 'INSERT', operator: 'john', ip: '192.168.1.101', status: 'success', time: '2024-12-14 09:15:00', detail: 'Added dict type "sys_job_group"' },
  { id: 5, module: 'Department', type: 'UPDATE', operator: 'admin', ip: '192.168.1.100', status: 'error', time: '2024-12-14 09:00:00', detail: 'Failed to update dept: duplicate name' },
  { id: 6, module: 'User Management', type: 'UPDATE', operator: 'admin', ip: '192.168.1.100', status: 'success', time: '2024-12-14 08:30:00', detail: 'Updated user "mary" status' },
  { id: 7, module: 'System Config', type: 'UPDATE', operator: 'admin', ip: '192.168.1.100', status: 'success', time: '2024-12-13 17:00:00', detail: 'Updated config "sys.index.skinName"' },
  { id: 8, module: 'Code Generator', type: 'INSERT', operator: 'john', ip: '192.168.1.101', status: 'success', time: '2024-12-13 16:30:00', detail: 'Generated code for "sys_dept"' },
])

const isDetailDialogVisible = ref(false)
const selectedLog = ref<any>(null)
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Operation Log</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-trash" variant="tonal" color="error">Clear All</VBtn>
        <VBtn prepend-icon="bx-export" variant="tonal" color="secondary">Export</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="3">
            <AppTextField v-model="search" placeholder="Search module" prepend-inner-icon="bx-search" density="compact" hide-details />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <AppSelect placeholder="Type" :items="['INSERT', 'UPDATE', 'DELETE', 'OTHER']" density="compact" hide-details clearable />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <AppSelect placeholder="Status" :items="['Success', 'Error']" density="compact" hide-details clearable />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppTextField v-model="dateRange" placeholder="Date range" prepend-inner-icon="bx-calendar" density="compact" hide-details />
          </VCol>
          <VCol cols="12" md="2">
            <VBtn color="primary" block prepend-icon="bx-search" size="small">Search</VBtn>
          </VCol>
        </VRow>
      </VCardText>
      <VDataTable :headers="headers" :items="logs" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.type="{ item }">
          <VChip variant="tonal" :color="item.type === 'INSERT' ? 'success' : item.type === 'UPDATE' ? 'info' : item.type === 'DELETE' ? 'error' : 'secondary'" size="small" label>{{ item.type }}</VChip>
        </template>
        <template #item.status="{ item }">
          <VChip variant="tonal" :color="item.status === 'success' ? 'success' : 'error'" size="small" label>{{ item.status === 'success' ? 'Success' : 'Error' }}</VChip>
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
            <VListItem><VListItemTitle><strong>Module:</strong> {{ selectedLog.module }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>Type:</strong> {{ selectedLog.type }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>Operator:</strong> {{ selectedLog.operator }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>IP:</strong> {{ selectedLog.ip }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>Status:</strong> {{ selectedLog.status }}</VListItemTitle></VListItem>
            <VListItem><VListItemTitle><strong>Time:</strong> {{ selectedLog.time }}</VListItemTitle></VListItem>
            <VDivider class="my-3" />
            <VListItem><VListItemTitle><strong>Detail:</strong></VListItemTitle></VListItem>
            <VCard variant="outlined" class="pa-3 mt-2"><code class="text-body-2">{{ selectedLog.detail }}</code></VCard>
          </VList>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDetailDialogVisible = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
