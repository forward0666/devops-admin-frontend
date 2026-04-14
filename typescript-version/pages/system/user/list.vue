<script setup lang="ts">
const search = ref('')
const isAddDialogVisible = ref(false)
const isEditDialogVisible = ref(false)

const isPasswordVisible = ref(false)

const form = ref({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  sex: 'male',
  status: 'active',
  dept: '',
  role: '',
  remark: '',
  password: '',
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Nickname', key: 'nickname', sortable: true },
  { title: 'Department', key: 'dept' },
  { title: 'Phone', key: 'phone' },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'created' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const users = ref([
  { id: 1, username: 'admin', nickname: 'Administrator', dept: 'R&D', phone: '15888888888', status: 'active', created: '2024-01-01', avatar: 1 },
  { id: 2, username: 'john', nickname: 'John Doe', dept: 'Marketing', phone: '15666666666', status: 'active', created: '2024-02-15', avatar: 2 },
  { id: 3, username: 'mary', nickname: 'Mary Smith', dept: 'Finance', phone: '13888888888', status: 'inactive', created: '2024-03-20', avatar: 3 },
  { id: 4, username: 'tom', nickname: 'Tom Wilson', dept: 'Operations', phone: '13999999999', status: 'active', created: '2024-04-10', avatar: 4 },
  { id: 5, username: 'lucy', nickname: 'Lucy Brown', dept: 'R&D', phone: '15877777777', status: 'active', created: '2024-05-05', avatar: 5 },
  { id: 6, username: 'jack', nickname: 'Jack Lee', dept: 'HR', phone: '13666666666', status: 'active', created: '2024-06-18', avatar: 6 },
])

const selectedUsers = ref<number[]>([])
</script>

<template>
  <div>
    <!-- Header -->
    <VRow class="mb-4">
      <VCol cols="12" md="6">
        <h4 class="text-h4">User Management</h4>
      </VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" @click="isAddDialogVisible = true">
          Add
        </VBtn>
        <VBtn prepend-icon="bx-export" variant="tonal" color="secondary">
          Export
        </VBtn>
      </VCol>
    </VRow>

    <!-- Filters -->
    <VCard>
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="3">
            <AppTextField v-model="search" placeholder="Search username" prepend-inner-icon="bx-search" density="compact" hide-details />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppSelect placeholder="Status" :items="['Active', 'Inactive']" density="compact" hide-details clearable />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppSelect placeholder="Department" :items="['R&D', 'Marketing', 'Finance', 'Operations', 'HR']" density="compact" hide-details clearable />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VBtn prepend-icon="bx-search" color="primary" block>Search</VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard class="mt-4">
      <VDataTable
        v-model:selected="selectedUsers"
        :headers="headers"
        :items="users"
        :search="search"
        :items-per-page="10"
        show-select
        class="text-no-wrap"
      >
        <template #item.username="{ item }">
          <div class="d-flex align-center gap-x-3">
            <VAvatar size="34" variant="flat" color="primary">
              <span class="text-xs text-white">{{ item.nickname.charAt(0) }}</span>
            </VAvatar>
            <div>
              <div class="font-weight-medium">{{ item.username }}</div>
            </div>
          </div>
        </template>

        <template #item.status="{ item }">
          <VChip variant="tonal" :color="item.status === 'active' ? 'success' : 'error'" size="small" label>
            {{ item.status === 'active' ? 'Active' : 'Inactive' }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn size="small" @click="isEditDialogVisible = true">
              <VIcon icon="bx-edit" size="18" />
            </IconBtn>
            <IconBtn size="small" color="error">
              <VIcon icon="bx-trash" size="18" />
            </IconBtn>
            <IconBtn size="small" color="primary" :to="`/system/user/view`">
              <VIcon icon="bx-show" size="18" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="isAddDialogVisible" max-width="600">
      <VCard title="Add User">
        <VCardText>
          <VForm>
            <AppTextField v-model="form.username" label="Username" class="mb-3" />
            <AppTextField v-model="form.nickname" label="Nickname" class="mb-3" />
            <AppTextField v-model="form.password" :type="isPasswordVisible ? 'text' : 'password'" label="Password" :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'" @click:append-inner="isPasswordVisible = !isPasswordVisible" class="mb-3" />
            <AppTextField v-model="form.email" label="Email" class="mb-3" />
            <AppTextField v-model="form.phone" label="Phone" class="mb-3" />
            <AppSelect v-model="form.sex" label="Gender" :items="['male', 'female']" class="mb-3" />
            <AppSelect v-model="form.status" label="Status" :items="['active', 'inactive']" class="mb-3" />
            <AppSelect v-model="form.dept" label="Department" :items="['R&D', 'Marketing', 'Finance', 'Operations', 'HR']" class="mb-3" />
            <AppSelect v-model="form.role" label="Role" :items="['admin', 'editor', 'viewer']" class="mb-3" />
            <AppTextarea v-model="form.remark" label="Remark" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary">Submit</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="isEditDialogVisible" max-width="600">
      <VCard title="Edit User">
        <VCardText>
          <VForm>
            <AppTextField v-model="form.nickname" label="Nickname" class="mb-3" />
            <AppTextField v-model="form.phone" label="Phone" class="mb-3" />
            <AppSelect v-model="form.sex" label="Gender" :items="['male', 'female']" class="mb-3" />
            <AppSelect v-model="form.status" label="Status" :items="['active', 'inactive']" class="mb-3" />
            <AppTextarea v-model="form.remark" label="Remark" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
