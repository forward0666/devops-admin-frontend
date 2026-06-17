<script setup lang="ts">
const searchQuery = ref('')
const selectedRole = ref()
const selectedStatus = ref()
const selectedUsers = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)))
const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const isAddUserDialogVisible = ref(false)
const isImportDialogVisible = ref(false)
const isEditUserDialogVisible = ref(false)
const isDeleteDialogVisible = ref(false)
const editingUser = ref<any>(null)
const deletingUser = ref<any>(null)
const snackMessage = ref('')
const snackColor = ref('success')
const isSnackVisible = ref(false)

const userStore = useUserStore()
const departmentStore = useDepartmentStore()

onMounted(() => {
  userStore.fetchUsers()
  departmentStore.fetchDepartments()
})

function showSnack(msg: string, color = 'success') {
  snackMessage.value = msg
  snackColor.value = color
  isSnackVisible.value = true
}

function openEditDialog(user: any) {
  editingUser.value = { ...user }
  isEditUserDialogVisible.value = true
}

async function saveEditUser() {
  if (!editingUser.value) return
  try {
    await userStore.updateUser(editingUser.value.id, {
      ...editingUser.value,
      tgUsername: editingUser.value.tgUsername?.replace(/^@/, ''),
    })
    isEditUserDialogVisible.value = false
    showSnack('User updated')
    await userStore.fetchUsers()
  }
  catch (e: any) {
    showSnack(e.message || 'Update failed', 'error')
  }
}

function openDeleteDialog(user: any) {
  deletingUser.value = user
  isDeleteDialogVisible.value = true
}

async function confirmDelete() {
  if (!deletingUser.value) return
  try {
    await userStore.deleteUser(deletingUser.value.id)
    isDeleteDialogVisible.value = false
    showSnack('User deleted')
    await userStore.fetchUsers()
  }
  catch (e: any) {
    showSnack(e.message || 'Delete failed', 'error')
  }
}

async function addUser() {
  try {
    if (!newUser.value.username?.trim() || !newUser.value.password || !newUser.value.fullName?.trim() || !newUser.value.position) {
      alert('Username, Password, Full Name and Position are required')
      return
    }
    await userStore.createUser({
      username: newUser.value.username.trim(),
      password: newUser.value.password,
      fullName: newUser.value.fullName.trim(),
      email: newUser.value.email,
      tgUsername: newUser.value.tgUsername?.replace(/^@/, ''),
      role: newUser.value.role,
      departmentId: newUser.value.departmentId,
      position: newUser.value.position,
    })
    newUser.value = { username: '', password: '', fullName: '', email: '', tgUsername: '', role: 'user', departmentId: null, position: '' }
    isAddUserDialogVisible.value = false
    showSnack('User created')
    await userStore.fetchUsers()
  }
  catch (e: any) {
    showSnack(e.message || 'Create failed', 'error')
  }
}

const newUser = ref({
  username: '',
  password: '',
  fullName: '',
  email: '',
  role: 'user' as string,
  departmentId: null as number | null,
  tgUsername: '',
  position: '',
})

const resolveUserRoleIcon = (role: string) => {
  const roleIcons: Record<string, { icon: string; color: string }> = {
    sys_admin: { icon: 'bx-crown', color: 'primary' },
    admin: { icon: 'bx-crown', color: 'primary' },
    devops: { icon: 'bx-crown', color: 'info' },
    user: { icon: 'bx-user', color: 'success' },
  }

  return roleIcons[role] || { icon: 'bx-user', color: 'primary' }
}

const resolveUserStatusVariant = (status: boolean) => status ? 'success' : 'error'

const resolveAvatarColor = (name: string) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
  const index = (name?.charCodeAt(0) || 0) % colors.length
  return colors[index]
}

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return userStore.users.filter((user: any) => {
    const matchRole = !selectedRole.value || user.role === selectedRole.value
    const matchStatus = !selectedStatus.value || (selectedStatus.value === 'active' ? user.active : !user.active)
    const matchSearch = !query
      || user.username?.toLowerCase().includes(query)
      || user.fullName?.toLowerCase().includes(query)
      || user.email?.toLowerCase().includes(query)
    return matchRole && matchStatus && matchSearch
  })
})

const userHeaders = [
  { title: 'User', key: 'user', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Position', key: 'position', sortable: true },
  { title: 'Department', key: 'department', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Lock', key: 'locked', sortable: true },
  { title: 'Action', key: 'actions', sortable: false },
]

const allUsersSelected = computed(() => pagedItems.value.length > 0 && pagedItems.value.every((u: any) => selectedUsers.value.some((s: any) => s.id === u.id)))
const someUsersSelected = computed(() => selectedUsers.value.length > 0 && !allUsersSelected.value)
function toggleAllUsers(val: boolean) {
  if (val) {
    const existing = new Set(selectedUsers.value.map((s: any) => s.id))
    pagedItems.value.forEach((u: any) => { if (!existing.has(u.id)) selectedUsers.value.push(u) })
  } else {
    const pagedIds = new Set(pagedItems.value.map((u: any) => u.id))
    selectedUsers.value = selectedUsers.value.filter((s: any) => !pagedIds.has(s.id))
  }
}

const roleOptions = ['admin', 'devops', 'user']
const positionOptions = ['DevOps', 'Backend Developer', 'Frontend Developer', 'UI', 'Project Manager', 'Product Manager', 'QA Tester']
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-4">
        <VTextField v-model="searchQuery" placeholder="Search User" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" />
        <VSpacer />
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[10, 20, 50, 100]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
        <VBtn prepend-icon="bx-plus" color="primary" @click="isAddUserDialogVisible = true">
          Add New User
        </VBtn>
      </VCardText>
    </VCard>

    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VExpandTransition>
        <VCardText v-if="selectedUsers.length > 0" class="d-flex align-center gap-3 bg-primary-lighten-4 rounded-lg ma-3">
          <VIcon icon="bx-check-double" color="primary" size="20" />
          <span class="text-body-1 font-weight-medium">{{ selectedUsers.length }} user(s) selected</span>
        </VCardText>
      </VExpandTransition>
      <VTable hover density="compact" class="text-no-wrap sticky-table">
        <thead>
          <tr>
            <th class="ps-4" style="width: 48px;"><VCheckbox v-model="allUsersSelected" :indeterminate="someUsersSelected" hide-details density="compact" @update:model-value="toggleAllUsers" /></th>
            <th>User</th>
            <th>Role</th>
            <th>Position</th>
            <th>Department</th>
            <th>Status</th>
            <th>Source</th>
            <th>Lock</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedItems" :key="item.id">
            <td class="ps-4"><VCheckbox v-model="selectedUsers" :value="item" hide-details density="compact" /></td>
            <td>
              <div class="d-flex align-center gap-x-4">
                <VAvatar size="34" variant="tonal" :color="resolveAvatarColor(item.fullName || item.username)">
                  <span class="text-sm font-weight-medium">{{ (item.fullName || item.username)?.charAt(0)?.toUpperCase() }}</span>
                </VAvatar>
                <div class="d-flex flex-column" style="min-inline-size: 180px;">
                  <h6 class="text-base">
                    <NuxtLink :to="`/admin/system/user/view?id=${item.id}`" class="font-weight-medium text-link">
                      {{ item.fullName || item.username }}
                    </NuxtLink>
                  </h6>
                  <div class="text-sm text-medium-emphasis">{{ item.email || item.username }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="d-flex align-center gap-x-2">
                <VIcon :icon="resolveUserRoleIcon(item.role).icon" :color="resolveUserRoleIcon(item.role).color" size="20" />
                <div class="text-capitalize text-high-emphasis text-body-1">{{ item.role }}</div>
              </div>
            </td>
            <td><div class="text-body-1 text-high-emphasis">{{ item.position || '-' }}</div></td>
            <td><div class="text-body-1">{{ departmentStore.departments.find((d: any) => d.id === item.departmentId)?.name || '-' }}</div></td>
            <td><VChip variant="tonal" :color="resolveUserStatusVariant(item.active)" size="small" label>{{ item.active ? 'Active' : 'Inactive' }}</VChip></td>
            <td><VChip variant="tonal" :color="item.source === 'keycloak' ? 'info' : 'default'" size="small" label>{{ item.source || 'local' }}</VChip></td>
            <td><VChip variant="tonal" :color="item.locked ? 'error' : 'success'" size="small" label>{{ item.locked ? 'Lock' : 'Unlock' }}</VChip></td>
            <td>
              <NuxtLink :to="`/admin/system/user/view?id=${item.id}`"><IconBtn><VIcon icon="bx-show" /></IconBtn></NuxtLink>
              <IconBtn @click="openEditDialog(item)"><VIcon icon="bx-edit" /></IconBtn>
              <IconBtn @click="openDeleteDialog(item)"><VIcon icon="bx-trash" /></IconBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- Add User Dialog -->
    <VDialog v-model="isAddUserDialogVisible" max-width="500">
      <VCard>
        <VCardTitle>Add New User</VCardTitle>
        <VCardText>
          <VTextField v-model="newUser.username" label="Username" :rules="[v => !!v?.trim() || 'Username is required']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newUser.password" label="Password" type="password" :rules="[v => !!v || 'Password is required']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newUser.fullName" label="Full Name" :rules="[v => !!v?.trim() || 'Full Name is required']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newUser.email" label="Email" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newUser.tgUsername" label="Telegram" density="comfortable" class="mb-3" variant="outlined" prefix="@" />
          <VSelect v-model="newUser.role" label="Role" :items="roleOptions" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="newUser.departmentId" label="Department" :items="departmentStore.departments.map((d: any) => ({ title: d.name, value: d.id }))" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="newUser.position" label="Position" :items="positionOptions" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddUserDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="addUser">Add User</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit User Dialog -->
    <VDialog v-model="isEditUserDialogVisible" max-width="500">
      <VCard>
        <VCardTitle>Edit User</VCardTitle>
        <VCardText>
          <VTextField v-model="editingUser.username" label="Username" :rules="[v => !!v?.trim() || 'Username is required']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editingUser.fullName" label="Full Name" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editingUser.email" label="Email" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editingUser.tgUsername" label="Telegram" density="comfortable" class="mb-3" variant="outlined" prefix="@" />
          <VTextField v-model="editingUser.phone" label="Phone" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingUser.role" label="Role" :items="roleOptions" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingUser.active" label="Status" :items="[{ title: 'Active', value: true }, { title: 'Inactive', value: false }]" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingUser.departmentId" label="Department" :items="departmentStore.departments.map((d: any) => ({ title: d.name, value: d.id }))" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingUser.position" label="Position" :items="positionOptions" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditUserDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveEditUser">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirm Dialog -->
    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardTitle>Delete User</VCardTitle>
        <VCardText>Are you sure you want to delete <strong>{{ deletingUser?.fullName || deletingUser?.username }}</strong>? This action cannot be undone.</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="isSnackVisible" :color="snackColor" :timeout="3000" location="top">
      {{ snackMessage }}
    </VSnackbar>
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
