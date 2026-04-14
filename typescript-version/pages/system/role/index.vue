<script setup lang="ts">
const search = ref('')

const roles = ref([
  {
    id: 1,
    name: 'sys_admin',
    label: 'System Administrator',
    description: 'Full system access, manage all settings, users, and permissions',
    builtin: true,
    users: 1,
    color: 'error',
  },
  {
    id: 2,
    name: 'admin',
    label: 'Administrator',
    description: 'Manage users, groups, and most system configurations',
    builtin: true,
    users: 3,
    color: 'warning',
  },
  {
    id: 3,
    name: 'user',
    label: 'User',
    description: 'Basic access to assigned resources only',
    builtin: true,
    users: 12,
    color: 'primary',
  },
])

const roleMenuPermissions = ref([
  {
    id: 1, role: 'sys_admin', menu: 'Dashboard', permission: 'edit',
  },
  {
    id: 2, role: 'sys_admin', menu: 'User Management', permission: 'edit',
  },
  {
    id: 3, role: 'sys_admin', menu: 'Roles & Permissions', permission: 'edit',
  },
  {
    id: 4, role: 'sys_admin', menu: 'Menu Management', permission: 'edit',
  },
  {
    id: 5, role: 'sys_admin', menu: 'Permission', permission: 'edit',
  },
  {
    id: 6, role: 'sys_admin', menu: 'Department', permission: 'edit',
  },
  {
    id: 7, role: 'sys_admin', menu: 'Dictionary', permission: 'edit',
  },
  {
    id: 8, role: 'sys_admin', menu: 'Online Users', permission: 'edit',
  },
  {
    id: 9, role: 'sys_admin', menu: 'Operation Log', permission: 'edit',
  },
  {
    id: 10, role: 'sys_admin', menu: 'Login Log', permission: 'edit',
  },
  {
    id: 11, role: 'sys_admin', menu: 'Code Generator', permission: 'edit',
  },
  {
    id: 12, role: 'sys_admin', menu: 'System API', permission: 'edit',
  },
  {
    id: 13, role: 'sys_admin', menu: 'System Config', permission: 'edit',
  },
  {
    id: 14, role: 'admin', menu: 'Dashboard', permission: 'view',
  },
  {
    id: 15, role: 'admin', menu: 'User Management', permission: 'view',
  },
  {
    id: 16, role: 'admin', menu: 'Roles & Permissions', permission: 'none',
  },
  {
    id: 17, role: 'admin', menu: 'Menu Management', permission: 'none',
  },
  {
    id: 18, role: 'admin', menu: 'Permission', permission: 'none',
  },
  {
    id: 19, role: 'admin', menu: 'Department', permission: 'view',
  },
  {
    id: 20, role: 'admin', menu: 'Dictionary', permission: 'edit',
  },
  {
    id: 21, role: 'admin', menu: 'Online Users', permission: 'view',
  },
  {
    id: 22, role: 'admin', menu: 'Operation Log', permission: 'view',
  },
  {
    id: 23, role: 'admin', menu: 'Login Log', permission: 'view',
  },
  {
    id: 24, role: 'admin', menu: 'Code Generator', permission: 'none',
  },
  {
    id: 25, role: 'admin', menu: 'System API', permission: 'none',
  },
  {
    id: 26, role: 'admin', menu: 'System Config', permission: 'view',
  },
  {
    id: 27, role: 'user', menu: 'Dashboard', permission: 'view',
  },
  {
    id: 28, role: 'user', menu: 'User Management', permission: 'none',
  },
  {
    id: 29, role: 'user', menu: 'Roles & Permissions', permission: 'none',
  },
  {
    id: 30, role: 'user', menu: 'Menu Management', permission: 'none',
  },
  {
    id: 31, role: 'user', menu: 'Permission', permission: 'none',
  },
  {
    id: 32, role: 'user', menu: 'Department', permission: 'none',
  },
  {
    id: 33, role: 'user', menu: 'Dictionary', permission: 'none',
  },
  {
    id: 34, role: 'user', menu: 'Online Users', permission: 'none',
  },
  {
    id: 35, role: 'user', menu: 'Operation Log', permission: 'none',
  },
  {
    id: 36, role: 'user', menu: 'Login Log', permission: 'none',
  },
  {
    id: 37, role: 'user', menu: 'Code Generator', permission: 'none',
  },
  {
    id: 38, role: 'user', menu: 'System API', permission: 'none',
  },
  {
    id: 39, role: 'user', menu: 'System Config', permission: 'none',
  },
])

const menus = ['Dashboard', 'User Management', 'Roles & Permissions', 'Menu Management', 'Permission', 'Department', 'Dictionary', 'Online Users', 'Operation Log', 'Login Log', 'Code Generator', 'System API', 'System Config']

const getPermission = (role: string, menu: string) => {
  const item = roleMenuPermissions.value.find(r => r.role === role && r.menu === menu)
  return item?.permission || 'none'
}

const setPermission = (role: string, menu: string, perm: string) => {
  const item = roleMenuPermissions.value.find(r => r.role === role && r.menu === menu)
  if (item) item.permission = perm
}

const permissionColor = (perm: string) => {
  if (perm === 'edit') return 'success'
  if (perm === 'view') return 'info'
  return 'error'
}
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Role Management</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end">
        <VBtn prepend-icon="bx-info-circle" variant="tonal" color="info">About Roles</VBtn>
      </VCol>
    </VRow>

    <!-- Role Cards -->
    <VRow>
      <VCol v-for="role in roles" :key="role.id" cols="12" md="4">
        <VCard :color="role.builtin ? undefined : undefined" variant="flat" class="h-100">
          <VCardText class="pa-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <VAvatar size="52" variant="tonal" :color="role.color">
                <VIcon icon="bx-shield-quarter" size="28" />
              </VAvatar>
              <VChip variant="tonal" :color="role.color" size="small" label class="font-weight-bold">
                {{ role.name }}
              </VChip>
            </div>
            <h5 class="text-h5 mb-1">{{ role.label }}</h5>
            <p class="text-body-2 text-medium-emphasis mb-4">{{ role.description }}</p>
            <div class="d-flex align-center gap-x-2 text-body-2">
              <VIcon icon="bx-user" size="18" class="text-medium-emphasis" />
              <span>{{ role.users }} users</span>
              <VChip v-if="role.builtin" size="x-small" variant="flat" color="primary" class="ms-2">Built-in</VChip>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Permission Matrix -->
    <VCard class="mt-6">
      <VCardItem>
        <VCardTitle>Menu Permissions by Role</VCardTitle>
        <VCardSubtitle>Configure what each role can access: none / view / edit</VCardSubtitle>
      </VCardItem>
      <VDivider />
      <VDataTable
        :items="menus"
        :items-per-page="-1"
        :headers="[
          { title: 'Menu', key: 'menu' },
          { title: 'sys_admin', key: 'sys_admin', align: 'center' },
          { title: 'admin', key: 'admin', align: 'center' },
          { title: 'user', key: 'user', align: 'center' },
        ]"
        hide-default-footer
        class="text-no-wrap"
      >
        <template #item.menu="{ item }">
          <span class="font-weight-medium">{{ item }}</span>
        </template>
        <template v-for="role in roles" :key="role.name" #[`item.${role.name}`]="{ item }">
          <div class="d-flex justify-center">
            <VBtnToggle
              :model-value="getPermission(role.name, item)"
              density="compact"
              color="primary"
              variant="outlined"
              divided
              mandatory
              @update:model-value="setPermission(role.name, item, $event)"
            >
              <VBtn value="none" size="small" :color="getPermission(role.name, item) === 'none' ? 'error' : undefined" variant="flat">
                <VIcon icon="bx-x" size="16" />
                <VTooltip activator="parent" location="top">None</VTooltip>
              </VBtn>
              <VBtn value="view" size="small" :color="getPermission(role.name, item) === 'view' ? 'info' : undefined" variant="flat">
                <VIcon icon="bx-show" size="16" />
                <VTooltip activator="parent" location="top">View</VTooltip>
              </VBtn>
              <VBtn value="edit" size="small" :color="getPermission(role.name, item) === 'edit' ? 'success' : undefined" variant="flat">
                <VIcon icon="bx-pencil" size="16" />
                <VTooltip activator="parent" location="top">Edit</VTooltip>
              </VBtn>
            </VBtnToggle>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Legend -->
    <VCard class="mt-4" variant="flat">
      <VCardText class="d-flex gap-x-6">
        <div class="d-flex align-center gap-x-2">
          <VIcon icon="bx-x" color="error" size="18" />
          <span class="text-body-2">None — No access</span>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon icon="bx-show" color="info" size="18" />
          <span class="text-body-2">View — Read only</span>
        </div>
        <div class="d-flex align-center gap-x-2">
          <VIcon icon="bx-pencil" color="success" size="18" />
          <span class="text-body-2">Edit — Full access</span>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>
