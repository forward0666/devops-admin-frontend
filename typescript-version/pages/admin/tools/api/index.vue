<script setup lang="ts">
const search = ref('')

const headers = [
  { title: 'API Method', key: 'method' },
  { title: 'Path', key: 'path' },
  { title: 'Description', key: 'description' },
  { title: 'Auth', key: 'auth' },
  { title: 'Status', key: 'status' },
]

const apis = ref([
  { method: 'GET', path: '/api/system/user/list', description: 'Get user list (paginated)', auth: 'Bearer', status: 'active' },
  { method: 'GET', path: '/api/system/user/{id}', description: 'Get user detail', auth: 'Bearer', status: 'active' },
  { method: 'POST', path: '/api/system/user', description: 'Create user', auth: 'Bearer', status: 'active' },
  { method: 'PUT', path: '/api/system/user', description: 'Update user', auth: 'Bearer', status: 'active' },
  { method: 'DELETE', path: '/api/system/user/{id}', description: 'Delete user', auth: 'Bearer', status: 'active' },
  { method: 'GET', path: '/api/system/role/list', description: 'Get role list', auth: 'Bearer', status: 'active' },
  { method: 'POST', path: '/api/system/role', description: 'Create role', auth: 'Bearer', status: 'active' },
  { method: 'PUT', path: '/api/system/role', description: 'Update role', auth: 'Bearer', status: 'active' },
  { method: 'DELETE', path: '/api/system/role/{id}', description: 'Delete role', auth: 'Bearer', status: 'active' },
  { method: 'GET', path: '/api/system/menu/list', description: 'Get menu tree', auth: 'Bearer', status: 'active' },
  { method: 'GET', path: '/api/system/menu/permissions', description: 'Get permission tree', auth: 'Bearer', status: 'active' },
  { method: 'POST', path: '/api/auth/login', description: 'User login', auth: 'None', status: 'active' },
  { method: 'POST', path: '/api/auth/logout', description: 'User logout', auth: 'Bearer', status: 'active' },
  { method: 'GET', path: '/api/monitor/online/list', description: 'Online users', auth: 'Bearer', status: 'active' },
  { method: 'DELETE', path: '/api/monitor/online/{sessionId}', description: 'Force logout', auth: 'Bearer', status: 'active' },
  { method: 'GET', path: '/api/monitor/log/list', description: 'Operation logs', auth: 'Bearer', status: 'active' },
  { method: 'GET', path: '/api/system/dict/type/list', description: 'Dictionary types', auth: 'Bearer', status: 'active' },
  { method: 'GET', path: '/api/system/dict/data/list', description: 'Dictionary data', auth: 'Bearer', status: 'active' },
])
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">System API</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-clipboard" variant="tonal" color="secondary">Copy All</VBtn>
        <VBtn prepend-icon="bx-export" variant="tonal" color="secondary">Export</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <AppTextField v-model="search" placeholder="Search API path or description" prepend-inner-icon="bx-search" density="compact" hide-details />
      </VCardText>
      <VDataTable :headers="headers" :items="apis" :search="search" :items-per-page="15" class="text-no-wrap">
        <template #item.method="{ item }">
          <VChip :color="item.method === 'GET' ? 'success' : item.method === 'POST' ? 'info' : item.method === 'PUT' ? 'warning' : 'error'" size="small" label class="font-weight-bold">
            {{ item.method }}
          </VChip>
        </template>
        <template #item.path="{ item }">
          <code class="text-body-2">{{ item.path }}</code>
        </template>
        <template #item.auth="{ item }">
          <VChip variant="tonal" :color="item.auth === 'Bearer' ? 'primary' : 'secondary'" size="small" label>{{ item.auth }}</VChip>
        </template>
        <template #item.status="{ item }">
          <VChip variant="tonal" color="success" size="small" label>{{ item.status }}</VChip>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
