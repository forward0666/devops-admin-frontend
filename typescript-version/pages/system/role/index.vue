<script setup lang="ts">
const search = ref('')
const isDialogVisible = ref(false)
const dialogTitle = ref('Add Role')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Role Name', key: 'name', sortable: true },
  { title: 'Role Key', key: 'key' },
  { title: 'Sort', key: 'sort', sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Remark', key: 'remark' },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const roles = ref([
  { id: 1, name: 'Super Admin', key: 'admin', sort: 1, status: 'active', remark: 'Super administrator', created: '2024-01-01' },
  { id: 2, name: 'Editor', key: 'editor', sort: 2, status: 'active', remark: 'Content editor', created: '2024-02-15' },
  { id: 3, name: 'Viewer', key: 'viewer', sort: 3, status: 'active', remark: 'Read-only access', created: '2024-03-20' },
  { id: 4, name: 'Operator', key: 'operator', sort: 4, status: 'active', remark: 'DevOps operator', created: '2024-04-10' },
  { id: 5, name: 'Auditor', key: 'auditor', sort: 5, status: 'inactive', remark: 'Audit logs viewer', created: '2024-05-05' },
])

const form = ref({ name: '', key: '', sort: 1, status: 'active', remark: '' })
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Role Management</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" @click="dialogTitle = 'Add Role'; isDialogVisible = true">Add</VBtn>
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="secondary">Refresh</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="3">
            <AppTextField v-model="search" placeholder="Search role" prepend-inner-icon="bx-search" density="compact" hide-details />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppSelect placeholder="Status" :items="['Active', 'Inactive']" density="compact" hide-details clearable />
          </VCol>
        </VRow>
      </VCardText>
      <VDataTable :headers="headers" :items="roles" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.status="{ item }">
          <VChip variant="tonal" :color="item.status === 'active' ? 'success' : 'error'" size="small" label>{{ item.status === 'active' ? 'Active' : 'Inactive' }}</VChip>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn size="small" variant="tonal" color="primary" prepend-icon="bx-check-shield" @click="dialogTitle = 'Assign Permissions'">Permissions</VBtn>
            <IconBtn size="small" @click="dialogTitle = 'Edit Role'; isDialogVisible = true"><VIcon icon="bx-edit" size="18" /></IconBtn>
            <IconBtn size="small" color="error"><VIcon icon="bx-trash" size="18" /></IconBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <VDialog v-model="isDialogVisible" max-width="550">
      <VCard :title="dialogTitle">
        <VCardText>
          <VForm>
            <AppTextField v-model="form.name" label="Role Name" class="mb-3" />
            <AppTextField v-model="form.key" label="Role Key" placeholder="e.g. editor, viewer" class="mb-3" />
            <AppTextField v-model="form.sort" label="Sort Order" type="number" class="mb-3" />
            <AppSelect v-model="form.status" label="Status" :items="['active', 'inactive']" class="mb-3" />
            <AppTextarea v-model="form.remark" label="Remark" />
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
