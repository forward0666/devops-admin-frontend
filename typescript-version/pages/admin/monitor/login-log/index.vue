<script setup lang="ts">
const search = ref('')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Username', key: 'username' },
  { title: 'IP Address', key: 'ip' },
  { title: 'Location', key: 'location' },
  { title: 'Browser', key: 'browser' },
  { title: 'OS', key: 'os' },
  { title: 'Status', key: 'status' },
  { title: 'Message', key: 'message' },
  { title: 'Login Time', key: 'time', sortable: true },
]

const loginLogs = ref([
  { id: 1, username: 'admin', ip: '192.168.1.100', location: 'Manila, PH', browser: 'Chrome 120', os: 'macOS', status: 'success', message: 'Login successful', time: '2024-12-14 10:30:00' },
  { id: 2, username: 'admin', ip: '192.168.1.100', location: 'Manila, PH', browser: 'Chrome 120', os: 'macOS', status: 'success', message: 'Login successful', time: '2024-12-14 08:00:00' },
  { id: 3, username: 'john', ip: '192.168.1.101', location: 'Cebu, PH', browser: 'Firefox 121', os: 'Windows', status: 'success', message: 'Login successful', time: '2024-12-14 09:15:00' },
  { id: 4, username: 'unknown', ip: '45.33.32.156', location: 'New York, US', browser: 'Chrome 120', os: 'Linux', status: 'error', message: 'Invalid password', time: '2024-12-14 07:45:00' },
  { id: 5, username: 'admin', ip: '103.224.182.250', location: 'Beijing, CN', browser: 'Chrome 119', os: 'Windows', status: 'error', message: 'Invalid captcha', time: '2024-12-14 06:30:00' },
  { id: 6, username: 'mary', ip: '10.0.0.50', location: 'Davao, PH', browser: 'Safari 17', os: 'macOS', status: 'success', message: 'Login successful', time: '2024-12-13 16:20:00' },
  { id: 7, username: 'tom', ip: '172.16.0.25', location: 'QC, PH', browser: 'Edge 120', os: 'Linux', status: 'success', message: 'Login successful', time: '2024-12-13 14:00:00' },
  { id: 8, username: 'admin', ip: '192.168.1.100', location: 'Manila, PH', browser: 'Chrome 120', os: 'macOS', status: 'success', message: 'Login successful', time: '2024-12-13 09:00:00' },
])
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Login Log</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-trash" variant="tonal" color="error">Clear All</VBtn>
        <VBtn prepend-icon="bx-lock-open-alt" variant="tonal" color="warning">Unlock All</VBtn>
        <VBtn prepend-icon="bx-export" variant="tonal" color="secondary">Export</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="3">
            <AppTextField v-model="search" placeholder="Search username" prepend-inner-icon="bx-search" density="compact" hide-details />
          </VCol>
          <VCol cols="12" sm="6" md="2">
            <AppSelect placeholder="Status" :items="['Success', 'Error']" density="compact" hide-details clearable />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppTextField placeholder="Date range" prepend-inner-icon="bx-calendar" density="compact" hide-details />
          </VCol>
          <VCol cols="12" md="4">
            <VBtn color="primary" block prepend-icon="bx-search" size="small">Search</VBtn>
          </VCol>
        </VRow>
      </VCardText>
      <VDataTable :headers="headers" :items="loginLogs" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.username="{ item }">
          <span :class="item.status === 'success' ? 'font-weight-medium' : 'font-weight-medium text-error'">{{ item.username }}</span>
        </template>
        <template #item.status="{ item }">
          <VChip variant="tonal" :color="item.status === 'success' ? 'success' : 'error'" size="small" label>{{ item.status === 'success' ? 'Success' : 'Failed' }}</VChip>
        </template>
        <template #item.message="{ item }">
          <span :class="item.status === 'success' ? 'text-success' : 'text-error'" class="text-body-2">{{ item.message }}</span>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
