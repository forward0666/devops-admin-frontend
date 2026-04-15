<script setup lang="ts">
const search = ref('')
const isDialogVisible = ref(false)
const dialogTitle = ref('Add Menu')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Menu Name', key: 'name', sortable: true },
  { title: 'Icon', key: 'icon' },
  { title: 'Sort', key: 'sort', sortable: true },
  { title: 'Path', key: 'path' },
  { title: 'Type', key: 'type' },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const menus = ref([
  { id: 1, name: 'Dashboard', icon: 'bx-home-smile', sort: 1, path: '/dashboard', type: 'Directory', status: 'active', created: '2024-01-01' },
  { id: 2, name: 'User Management', icon: 'bx-user', sort: 2, path: '/system/user', type: 'Directory', status: 'active', created: '2024-01-01' },
  { id: 3, name: 'User List', icon: '', sort: 1, path: '/system/user/list', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 4, name: 'User View', icon: '', sort: 2, path: '/system/user/view', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 5, name: 'Roles & Permissions', icon: 'bx-check-shield', sort: 3, path: '/system/role', type: 'Directory', status: 'active', created: '2024-01-01' },
  { id: 6, name: 'Roles', icon: '', sort: 1, path: '/system/role', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 7, name: 'Permissions', icon: '', sort: 2, path: '/system/permission', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 8, name: 'Menu Management', icon: 'bx-menu', sort: 4, path: '/system/menu', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 9, name: 'Department', icon: 'bx-buildings', sort: 5, path: '/system/dept', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 10, name: 'Dictionary', icon: 'bx-book-open', sort: 6, path: '/system/dict', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 11, name: 'Operation Log', icon: 'bx-list-ul', sort: 1, path: '/monitor/log', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 12, name: 'Login Log', icon: 'bx-log-in', sort: 2, path: '/monitor/login-log', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 13, name: 'Online Users', icon: 'bx-user-circle', sort: 3, path: '/monitor/online', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 14, name: 'Code Generator', icon: 'bx-code-alt', sort: 1, path: '/tools/gen', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 15, name: 'System API', icon: 'bx-code-block', sort: 2, path: '/tools/api', type: 'Menu', status: 'active', created: '2024-01-01' },
  { id: 16, name: 'System Config', icon: 'bx-cog', sort: 3, path: '/tools/config', type: 'Menu', status: 'active', created: '2024-01-01' },
])

const form = ref({ name: '', icon: '', sort: 1, path: '', type: 'Menu', status: 'active', parentId: null, permission: '' })
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Menu</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" @click="dialogTitle = 'Add Menu'; isDialogVisible = true">Add</VBtn>
        <VBtn prepend-icon="bx-expand-alt" variant="tonal" color="secondary">Expand All</VBtn>
        <VBtn prepend-icon="bx-collapse-alt" variant="tonal" color="secondary">Collapse All</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <AppTextField v-model="search" placeholder="Search menu" prepend-inner-icon="bx-search" density="compact" hide-details />
      </VCardText>
      <VDataTable :headers="headers" :items="menus" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.icon="{ item }">
          <VIcon v-if="item.icon" :icon="item.icon" size="20" />
          <span v-else class="text-body-2 text-medium-emphasis">—</span>
        </template>
        <template #item.type="{ item }">
          <VChip variant="tonal" :color="item.type === 'Directory' ? 'info' : 'primary'" size="small" label>{{ item.type }}</VChip>
        </template>
        <template #item.status="{ item }">
          <VChip variant="tonal" :color="item.status === 'active' ? 'success' : 'error'" size="small" label>{{ item.status === 'active' ? 'Active' : 'Inactive' }}</VChip>
        </template>
        <template #item.actions>
          <div class="d-flex gap-1">
            <IconBtn size="small"><VIcon icon="bx-plus" size="18" /></IconBtn>
            <IconBtn size="small"><VIcon icon="bx-edit" size="18" /></IconBtn>
            <IconBtn size="small" color="error"><VIcon icon="bx-trash" size="18" /></IconBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <VDialog v-model="isDialogVisible" max-width="550">
      <VCard :title="dialogTitle">
        <VCardText>
          <VForm>
            <AppSelect v-model="form.parentId" label="Parent Menu" :items="['None', 'System Management', 'System Monitor', 'System Tools']" class="mb-3" />
            <AppSelect v-model="form.type" label="Type" :items="['Directory', 'Menu', 'Button']" class="mb-3" />
            <AppTextField v-model="form.name" label="Menu Name" class="mb-3" />
            <AppTextField v-model="form.icon" label="Icon" placeholder="e.g. bx-home-smile" class="mb-3" />
            <AppTextField v-model="form.path" label="Route Path" placeholder="e.g. /system/user" class="mb-3" />
            <AppTextField v-model="form.permission" label="Permission Key" placeholder="e.g. system:user:list" class="mb-3" />
            <AppTextField v-model="form.sort" label="Sort Order" type="number" class="mb-3" />
            <AppSelect v-model="form.status" label="Status" :items="['active', 'inactive']" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary">Submit</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
