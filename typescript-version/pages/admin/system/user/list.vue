<script setup lang="ts">
const searchQuery = ref('')
const selectedRole = ref()
const selectedTeam = ref()
const selectedStatus = ref()
const itemsPerPage = ref(10)
const selectedUsers = ref<any[]>([])

const isAddUserDialogVisible = ref(false)
const isImportDialogVisible = ref(false)
const isEditUserDialogVisible = ref(false)
const isDeleteDialogVisible = ref(false)
const editingUser = ref<any>(null)
const deletingUser = ref<any>(null)
const userStore = useUserStore()

function openEditDialog(user: any) {
  editingUser.value = { ...user }
  isEditUserDialogVisible.value = true
}

function saveEditUser() {
  if (editingUser.value) {
    const idx = userStore.users.findIndex(u => u.id === editingUser.value.id)
    if (idx !== -1) userStore.users[idx] = { ...editingUser.value }
    isEditUserDialogVisible.value = false
  }
}

function openDeleteDialog(user: any) {
  deletingUser.value = user
  isDeleteDialogVisible.value = true
}

function confirmDelete() {
  if (deletingUser.value) {
    userStore.users = userStore.users.filter(u => u.id !== deletingUser.value.id)
    isDeleteDialogVisible.value = false
  }
}

function addUser() {
  const maxId = Math.max(...userStore.users.map(u => u.id), 0)
  userStore.users.push({
    id: maxId + 1,
    fullName: newUser.value.fullName,
    email: newUser.value.email,
    role: newUser.value.role,
    team: newUser.value.team,
    department: newUser.value.department,
    status: newUser.value.status,
    avatar: Math.floor(Math.random() * 6) + 1,
  })
  newUser.value = { fullName: '', email: '', role: '', team: '', department: '', status: 'active' }
  isAddUserDialogVisible.value = false
}

const newUser = ref({
  fullName: '',
  email: '',
  role: '',
  team: '',
  department: '',
  status: 'active',
})

const resolveUserRoleIcon = (role: string) => {
  const roleIcons: Record<string, { icon: string; color: string }> = {
    admin: { icon: 'bx-crown', color: 'primary' },
    editor: { icon: 'bx-edit', color: 'warning' },
    subscriber: { icon: 'bx-user', color: 'success' },
    maintainer: { icon: 'bx-pie-chart-alt', color: 'info' },
    author: { icon: 'bx-desktop', color: 'error' },
  }

  return roleIcons[role] || { icon: 'bx-user', color: 'primary' }
}

const resolveUserStatusVariant = (status: string) => {
  const statusColor: Record<string, string> = {
    active: 'success',
    inactive: 'secondary',
    pending: 'warning',
  }

  return statusColor[status] || 'secondary'
}

const resolveAvatarUrl = (avatarNum: number) => `/images/avatars/avatar-${avatarNum}.png`

const resolveAvatarColor = (name: string) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
  const index = name.charCodeAt(0) % colors.length

  return colors[index]
}

const users = computed(() => userStore.users)

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => {
    const matchRole = !selectedRole.value || user.role === selectedRole.value
    const matchTeam = !selectedTeam.value || user.team === selectedTeam.value
    const matchStatus = !selectedStatus.value || user.status === selectedStatus.value.toLowerCase()
    const matchSearch = !query || user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)

    return matchRole && matchTeam && matchStatus && matchSearch
  })
})

const userHeaders = [
  { title: 'User', key: 'user', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Team', key: 'team', sortable: true },
  { title: 'Department', key: 'department', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]
</script>

<template>
  <div>
    <!-- Stat Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="6" md="3">
        <VCard>
          <VCardText>
            <div class="d-flex justify-space-between">
              <div class="d-flex flex-column gap-y-1">
                <div class="text-body-1 text-high-emphasis">Session</div>
                <div class="d-flex gap-x-2 align-center">
                  <h4 class="text-h4">21,459</h4>
                  <div class="text-base text-success"> (+29%) </div>
                </div>
                <div class="text-sm">Total Users</div>
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
                <div class="text-body-1 text-high-emphasis">Active Users</div>
                <div class="d-flex gap-x-2 align-center">
                  <h4 class="text-h4">19,860</h4>
                  <div class="text-base text-success"> (+14%) </div>
                </div>
                <div class="text-sm">Last Week Analytics</div>
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
                <div class="text-body-1 text-high-emphasis">Block Users</div>
                <div class="d-flex gap-x-2 align-center">
                  <h4 class="text-h4">4,567</h4>
                  <div class="text-base text-error"> (-18%) </div>
                </div>
                <div class="text-sm">Last Week Analytics</div>
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
                <div class="text-body-1 text-high-emphasis">Pending Users</div>
                <div class="d-flex gap-x-2 align-center">
                  <h4 class="text-h4">237</h4>
                  <div class="text-base text-success"> (+42%) </div>
                </div>
                <div class="text-sm">Last Week Analytics</div>
              </div>
              <VAvatar color="warning" variant="tonal" rounded size="40">
                <VIcon icon="bx-user-voice" size="24" />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filters Card -->
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCardTitle>Filters</VCardTitle>
      </VCardItem>
      <VCardText class="pt-0">
        <VRow>
          <VCol cols="12" sm="4">
            <VSelect v-model="selectedRole" placeholder="Select Role" :items="['admin', 'user']" density="comfortable" clearable hide-details variant="outlined" />
          </VCol>
          <VCol cols="12" sm="4">
            <VSelect v-model="selectedTeam" placeholder="Select Team" :items="['Product', 'Design', 'Backend', 'Frontend', 'DevOps', 'QA', 'Mobile', 'Data', 'Security', 'Support']" density="comfortable" clearable hide-details variant="outlined" />
          </VCol>
          <VCol cols="12" sm="4">
            <VSelect v-model="selectedStatus" placeholder="Select Status" :items="['Active', 'Inactive', 'Pending']" density="comfortable" clearable hide-details variant="outlined" />
          </VCol>
        </VRow>
      </VCardText>
      <VDivider />
      <VCardText class="d-flex flex-wrap gap-4">
        <VTextField v-model="searchQuery" placeholder="Search User" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" />
        <VSpacer />
          <VBtn prepend-icon="bx-export" variant="tonal" color="secondary">
            Export
          </VBtn>
          <VBtn prepend-icon="bx-import" variant="tonal" color="secondary" @click="isImportDialogVisible = true">
            Import
          </VBtn>
          <VBtn prepend-icon="bx-plus" color="primary" @click="isAddUserDialogVisible = true">
            Add New User
          </VBtn>
      </VCardText>
      <VDivider />
      <!-- Batch Action Bar -->
      <VExpandTransition>
        <VCardText v-if="selectedUsers.length > 0" class="d-flex align-center gap-3 bg-primary-lighten-4 rounded-lg ma-3">
          <VIcon icon="bx-check-double" color="primary" size="20" />
          <span class="text-body-1 font-weight-medium">{{ selectedUsers.length }} user(s) selected</span>
          <VSpacer />
          <VBtn size="small" variant="tonal" color="error" prepend-icon="bx-trash">
            Delete Selected
          </VBtn>
          <VBtn size="small" variant="tonal" color="warning" prepend-icon="bx-block">
            Block Selected
          </VBtn>
        </VCardText>
      </VExpandTransition>
      <VDataTable
        v-model:selected="selectedUsers"
        :headers="userHeaders"
        :items="filteredUsers"
        :items-per-page="itemsPerPage"
        show-select
        class="text-no-wrap"
      >
        <template #item.user="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VAvatar size="34" variant="tonal" :color="resolveAvatarColor(item.fullName)">
              <span class="text-sm font-weight-medium">{{ item.fullName.charAt(0) }}</span>
            </VAvatar>
            <div class="d-flex flex-column" style="min-inline-size: 180px;">
              <h6 class="text-base">
                <NuxtLink :to="`/system/user/view?id=${item.id}`" class="font-weight-medium text-link">
                  {{ item.fullName }}
                </NuxtLink>
              </h6>
              <div class="text-sm">{{ item.email }}</div>
            </div>
          </div>
        </template>

        <template #item.role="{ item }">
          <div class="d-flex align-center gap-x-2">
            <VIcon :icon="resolveUserRoleIcon(item.role).icon" :color="resolveUserRoleIcon(item.role).color" size="20" />
            <div class="text-capitalize text-high-emphasis text-body-1">{{ item.role }}</div>
          </div>
        </template>

        <template #item.team="{ item }">
          <div class="text-body-1 text-high-emphasis">{{ item.team }}</div>
        </template>

        <template #item.department="{ item }">
          <div class="text-body-1">{{ item.department }}</div>
        </template>

        <template #item.status="{ item }">
          <VChip variant="tonal" :color="resolveUserStatusVariant(item.status)" size="small" label class="text-capitalize">
            {{ item.status }}
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
          <VTextField v-model="newUser.fullName" label="Full Name" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newUser.email" label="Email" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="newUser.role" label="Role" :items="['admin', 'user']" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="newUser.team" label="Team" :items="['Product', 'Design', 'Backend', 'Frontend', 'DevOps', 'QA', 'Mobile', 'Data', 'Security', 'Support']" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="newUser.department" label="Department" :items="['Engineering', 'Marketing', 'Operations', 'IT', 'Analytics', 'Customer Success']" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="newUser.status" label="Status" :items="['active', 'inactive', 'pending']" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddUserDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="addUser">Add User</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Import Dialog -->
    <VDialog v-model="isImportDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Import Users</VCardTitle>
          <VBtn icon variant="text" @click="isImportDialogVisible = false">
            <VIcon icon="bx-x" />
          </VBtn>
        </VCardItem>
        <VCardText>
          <div class="drop-zone pa-8 text-center border-dashed border-2 border-primary rounded-lg" @dragover.prevent @drop.prevent>
            <VIcon icon="bx-cloud-upload" size="48" color="primary" class="mb-3" />
            <h6 class="text-h6 mb-1">Drag & Drop files here</h6>
            <p class="text-body-2 text-medium-emphasis mb-3">or click to browse</p>
            <VBtn variant="tonal" color="primary" size="small">Browse Files</VBtn>
            <p class="text-body-2 text-medium-emphasis mt-3">Supports CSV, XLS, XLSX format</p>
          </div>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isImportDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="isImportDialogVisible = false">Import</VBtn>
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
          <VSelect v-model="editingUser.role" label="Role" :items="['admin', 'user']" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingUser.team" label="Team" :items="['Product', 'Design', 'Backend', 'Frontend', 'DevOps', 'QA', 'Mobile', 'Data', 'Security', 'Support']" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingUser.department" label="Department" :items="['Engineering', 'Marketing', 'Operations', 'IT', 'Analytics', 'Customer Success']" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingUser.status" label="Status" :items="['active', 'inactive', 'pending']" density="comfortable" variant="outlined" />
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
        <VCardText>Are you sure you want to delete <strong>{{ deletingUser?.fullName }}</strong>? This action cannot be undone.</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
