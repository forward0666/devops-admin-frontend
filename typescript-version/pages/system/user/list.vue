<script setup lang="ts">
const searchQuery = ref('')
const selectedRole = ref()
const selectedPlan = ref()
const selectedStatus = ref()
const itemsPerPage = ref(10)
const selectedUsers = ref<any[]>([])

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

const users = ref([
  { id: 50, fullName: 'Beverlie Krabbe', email: 'bkrabbe1d@home.pl', role: 'editor', team: 'Product', department: 'Engineering', status: 'active', avatar: 1 },
  { id: 49, fullName: 'Paulie Durber', email: 'pdurber1c@gov.uk', role: 'subscriber', team: 'Design', department: 'Marketing', status: 'inactive', avatar: 2 },
  { id: 48, fullName: 'Onfre Wind', email: 'owind1b@yandex.ru', role: 'admin', team: 'Backend', department: 'Engineering', status: 'pending', avatar: 3 },
  { id: 47, fullName: 'Karena Courtliff', email: 'kcourtliff1a@bbc.co.uk', role: 'admin', team: 'DevOps', department: 'Operations', status: 'active', avatar: 6 },
  { id: 46, fullName: 'Saunder Offner', email: 'soffner19@mac.com', role: 'maintainer', team: 'QA', department: 'Engineering', status: 'pending', avatar: 4 },
  { id: 45, fullName: 'Corrie Perot', email: 'cperot18@goo.ne.jp', role: 'subscriber', team: 'Frontend', department: 'Engineering', status: 'pending', avatar: 5 },
  { id: 44, fullName: 'Vladamir Koschek', email: 'vkoschek17@abc.net.au', role: 'author', team: 'Security', department: 'IT', status: 'active', avatar: 1 },
  { id: 43, fullName: 'Micaela McNirlan', email: 'mmcnirlan16@hc360.com', role: 'admin', team: 'Data', department: 'Analytics', status: 'inactive', avatar: 2 },
  { id: 42, fullName: 'Benedetto Rossiter', email: 'brossiter15@craigslist.org', role: 'editor', team: 'Mobile', department: 'Engineering', status: 'inactive', avatar: 1 },
  { id: 41, fullName: 'Garvin Odem', email: 'godem14@eepurl.com', role: 'subscriber', team: 'Support', department: 'Customer Success', status: 'active', avatar: 3 },
])

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
                <div class="text-body-1 text-high-emphasis">Paid Users</div>
                <div class="d-flex gap-x-2 align-center">
                  <h4 class="text-h4">4,567</h4>
                  <div class="text-base text-success"> (+18%) </div>
                </div>
                <div class="text-sm">Last Week Analytics</div>
              </div>
              <VAvatar color="error" variant="tonal" rounded size="40">
                <VIcon icon="bx-user-plus" size="24" />
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
                  <div class="text-base text-error"> (-14%) </div>
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
            <VSelect placeholder="Select Role" :items="['admin', 'editor', 'subscriber', 'maintainer', 'author']" density="comfortable" clearable hide-details variant="outlined" />
          </VCol>
          <VCol cols="12" sm="4">
            <VSelect placeholder="Select Team" :items="['Product', 'Design', 'Backend', 'Frontend', 'DevOps', 'QA', 'Mobile', 'Data', 'Security', 'Support']" density="comfortable" clearable hide-details variant="outlined" />
          </VCol>
          <VCol cols="12" sm="4">
            <VSelect placeholder="Select Status" :items="['Active', 'Inactive', 'Pending']" density="comfortable" clearable hide-details variant="outlined" />
          </VCol>
        </VRow>
      </VCardText>
      <VDivider />
      <VCardText class="d-flex flex-wrap gap-4">
        <div class="me-3 d-flex gap-3">
          <AppSelect v-model="itemsPerPage" :items="[5, 10, 25, 50]" density="comfortable" style="inline-size: 6.25rem;" hide-details />
        </div>
        <VSpacer />
        <div class="d-flex align-center flex-wrap gap-4">
          <VTextField v-model="searchQuery" placeholder="Search User" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" />
          <VBtn prepend-icon="bx-export" variant="tonal" color="secondary">
            Export
          </VBtn>
          <VBtn prepend-icon="bx-plus" color="primary">
            Add New User
          </VBtn>
        </div>
      </VCardText>
      <VDivider />
      <VDataTable
        v-model:selected="selectedUsers"
        :headers="userHeaders"
        :items="users"
        :items-per-page="itemsPerPage"
        :search="searchQuery"
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

        <template #item.actions>
          <IconBtn>
            <VIcon icon="bx-trash" />
          </IconBtn>
          <IconBtn>
            <VIcon icon="bx-show" />
          </IconBtn>
          <IconBtn>
            <VIcon icon="bx-dots-vertical-rounded" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
