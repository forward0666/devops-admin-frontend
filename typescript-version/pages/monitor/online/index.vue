<script setup lang="ts">
const search = ref('')

const headers = [
  { title: 'Session ID', key: 'sessionId' },
  { title: 'Username', key: 'username' },
  { title: 'IP Address', key: 'ip' },
  { title: 'Browser', key: 'browser' },
  { title: 'OS', key: 'os' },
  { title: 'Location', key: 'location' },
  { title: 'Login Time', key: 'loginTime', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const onlineUsers = ref([
  { sessionId: 'abc123def456', username: 'admin', ip: '192.168.1.100', browser: 'Chrome 120', os: 'macOS', location: 'Manila, PH', loginTime: '2024-12-14 10:30:00' },
  { sessionId: 'def456ghi789', username: 'john', ip: '192.168.1.101', browser: 'Firefox 121', os: 'Windows', location: 'Cebu, PH', loginTime: '2024-12-14 09:15:00' },
  { sessionId: 'ghi789jkl012', username: 'mary', ip: '10.0.0.50', browser: 'Safari 17', os: 'macOS', location: 'Davao, PH', loginTime: '2024-12-14 08:45:00' },
  { sessionId: 'jkl012mno345', username: 'tom', ip: '172.16.0.25', browser: 'Edge 120', os: 'Linux', location: 'Quezon City, PH', loginTime: '2024-12-13 16:20:00' },
  { sessionId: 'mno345pqr678', username: 'lucy', ip: '192.168.1.105', browser: 'Chrome 120', os: 'Windows', location: 'Makati, PH', loginTime: '2024-12-13 14:00:00' },
])
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Online Users</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end">
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="secondary">Refresh</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <AppTextField v-model="search" placeholder="Search username or IP" prepend-inner-icon="bx-search" density="compact" hide-details />
      </VCardText>
      <VDataTable :headers="headers" :items="onlineUsers" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.username="{ item }">
          <div class="d-flex align-center gap-x-2">
            <VAvatar size="30" variant="tonal" color="primary" class="text-white text-xs">{{ item.username.charAt(0).toUpperCase() }}</VAvatar>
            <span class="font-weight-medium">{{ item.username }}</span>
          </div>
        </template>
        <template #item.actions>
          <VBtn size="small" variant="tonal" color="error" prepend-icon="bx-log-out">Force Logout</VBtn>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
