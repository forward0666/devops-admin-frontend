<script setup lang="ts">
const searchQuery = ref('')
const selectedRole = ref()
const selectedStatus = ref()
const itemsPerPage = ref(10)
const selectedUsers = ref<any[]>([])

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
    await userStore.updateUser(editingUser.value.id, editingUser.value)
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
      tgUsername: newUser.value.tgUsername,
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
  { title: 'Actions', key: 'actions', sortable: false },
]

const roleOptions = ['admin', 'devops', 'user']
const positionOptions = ['DevOps', 'Backend Developer', 'Frontend Developer', 'UI', 'Project Manager', 'Product Manager', 'QA Tester']
</script>

<template>
  <div>
    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex justify-space-between">
              <div class="d-flex flex-column gap-y-1">
                <div class="text-body-1 text-high-emphasis">Total Users</div>
                <div class="d-flex gap-x-2 align-center">
                  <h4 class="text-h4">{{ userStore.users.length }}</h4>
                </div>
              </div>
              <VAvatar color="primary" variant="tonal" rounded size="40">
                <VIcon icon="bx-group" size="24" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex justify-space-between">
              <div class="d-flex flex-column gap-y-1">
                <div class="text-body-1 text-high-emphasis">Active</div>
                <div class="d-flex gap-x-2 align-center">
                  <h4 class="text-h4">{{ userStore.users.filter((u: any) => u.active).length }}</h4>
                </div>
              </div>
              <VAvatar color="success" variant="tonal" rounded size="40">
                <VIcon icon="bx-user-check" size="24" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex justify-space-between">
              <div class="d-flex flex-column gap-y-1">
                <div class="text-body-1 text-high-emphasis">Inactive</div>
                <div class="d-flex gap-x-2 align-center">
                  <h4 class="text-h4">{{ userStore.users.filter((u: any) => !u.active).length }}</h4>
                </div>
              </div>
              <VAvatar color="error" variant="tonal" rounded size="40">
                <VIcon icon="bx-user-x" size="24" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex justify-space-between">
              <div class="d-flex flex-column gap-y-1">
                <div class="text-body-1 text-high-emphasis">Departments</div>
                <div class="d-flex gap-x-2 align-center">
                  <h4 class="text-h4">{{ departmentStore.departments.length }}</h4>
                </div>
              </div>
              <VAvatar color="warning" variant="tonal" rounded size="40">
                <VIcon icon="bx-building" size="24" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCardTitle>Filters</VCardTitle>
      </VCardItem>
      <VCardText class="pt-0">
        <VRow>
          <VCol cols="12" sm="4">
            <VSelect v-model="selectedRole" placeholder="Select Role" :items="roleOptions" density="comfortable" clearable hide-details variant="outlined" />
          </VCol>
          <VCol cols="12" sm="4">
            <VSelect v-model="selectedStatus" placeholder="Select Status" :items="['active', 'inactive']" density="comfortable" clearable hide-details variant="outlined" />
          </VCol>
        </VRow>
      </VCardText>
      <VDivider />
      <VCardText class="d-flex flex-wrap gap-4">
        <VTextField v-model="searchQuery" placeholder="Search User" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" />
        <VSpacer />
        <VBtn prepend-icon="bx-plus" color="primary" @click="isAddUserDialogVisible = true">
          Add New User
        </VBtn>
      </VCardText>
      <VDivider />
      <VExpandTransition>
        <VCardText v-if="selectedUsers.length > 0" class="d-flex align-center gap-3 bg-primary-lighten-4 rounded-lg ma-3">
          <VIcon icon="bx-check-double" color="primary" size="20" />
          <span class="text-body-1 font-weight-medium">{{ selectedUsers.length }} user(s) selected</span>
        </VCardText>
      </VExpandTransition>
      <VDataTable
        v-model:selected="selectedUsers"
        :headers="userHeaders"
        :items="filteredUsers"
        :items-per-page="itemsPerPage"
        :loading="userStore.loading"
        show-select
        class="text-no-wrap"
      >
        <template #item.user="{ item }">
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
        </template>

        <template #item.role="{ item }">
          <div class="d-flex align-center gap-x-2">
            <VIcon :icon="resolveUserRoleIcon(item.role).icon" :color="resolveUserRoleIcon(item.role).color" size="20" />
            <div class="text-capitalize text-high-emphasis text-body-1">{{ item.role }}</div>
          </div>
        </template>

        <template #item.position="{ item }">
          <div class="text-body-1 text-high-emphasis">{{ item.position || '-' }}</div>
        </template>

        <template #item.department="{ item }">
          <div class="text-body-1">{{ departmentStore.departments.find((d: any) => d.id === item.departmentId)?.name || '-' }}</div>
        </template>

        <template #item.status="{ item }">
          <VChip variant="tonal" :color="resolveUserStatusVariant(item.active)" size="small" label>
            {{ item.active ? 'Active' : 'Inactive' }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <NuxtLink :to="`/admin/system/user/view?id=${item.id}`">
            <IconBtn><VIcon icon="bx-show" /></IconBtn>
          </NuxtLink>
          <IconBtn @click="openEditDialog(item)">
            <VIcon icon="bx-edit" />
          </IconBtn>
          <IconBtn @click="openDeleteDialog(item)">
            <VIcon icon="bx-trash" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- Add User Dialog -->
    <VDialog v-model="isAddUserDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Add New User</VCardTitle>
          <VBtn icon variant="text" @click="isAddUserDialogVisible = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardItem>
        <VCardText>
          <VTextField v-model="newUser.username" label="Username" :rules="[v => !!v?.trim() || 'Username is required']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newUser.password" label="Password" type="password" :rules="[v => !!v || 'Password is required']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newUser.fullName" label="Full Name" :rules="[v => !!v?.trim() || 'Full Name is required']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newUser.email" label="Email" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newUser.tgUsername" label="Telegram" density="comfortable" class="mb-3" variant="outlined" />
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
        <VCardItem>
          <VCardTitle>Edit User</VCardTitle>
          <VBtn icon variant="text" @click="isEditUserDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VTextField v-model="editingUser.fullName" label="Full Name" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editingUser.email" label="Email" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editingUser.tgUsername" label="Telegram" density="comfortable" class="mb-3" variant="outlined" />
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
        <VCardItem>
          <VCardTitle>Delete User</VCardTitle>
          <VBtn icon variant="text" @click="isDeleteDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
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
