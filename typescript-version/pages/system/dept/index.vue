<script setup lang="ts">
const search = ref('')
const isDialogVisible = ref(false)

const departments = ref([
  { id: 1, name: 'JH DevOps', leader: 'admin', phone: '15888888888', email: 'admin@jhdevops.com', status: 'active', children: [
    { id: 2, name: 'R&D Department', leader: 'John', phone: '15666666666', email: 'rd@jhdevops.com', status: 'active', children: [
      { id: 3, name: 'Frontend Team', leader: 'Mary', phone: '13888888888', email: 'frontend@jhdevops.com', status: 'active', children: [] },
      { id: 4, name: 'Backend Team', leader: 'Tom', phone: '13999999999', email: 'backend@jhdevops.com', status: 'active', children: [] },
    ]},
    { id: 5, name: 'Operations', leader: 'Lucy', phone: '15877777777', email: 'ops@jhdevops.com', status: 'active', children: [] },
    { id: 6, name: 'Finance', leader: 'Jack', phone: '13666666666', email: 'finance@jhdevops.com', status: 'active', children: [] },
    { id: 7, name: 'Marketing', leader: 'Rose', phone: '13555555555', email: 'marketing@jhdevops.com', status: 'inactive', children: [] },
  ]},
])

const headers = [
  { title: 'Department', key: 'name' },
  { title: 'Leader', key: 'leader' },
  { title: 'Phone', key: 'phone' },
  { title: 'Email', key: 'email' },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'created' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const flatDepts = computed(() => {
  const result: any[] = []
  const flatten = (items: any[], depth = 0) => {
    items.forEach(item => {
      result.push({ ...item, depth, created: '2024-01-01' })
      if (item.children?.length) flatten(item.children, depth + 1)
    })
  }
  flatten(departments.value)
  return result
})

const form = ref({ name: '', parentId: '', leader: '', phone: '', email: '', status: 'active', sort: 0 })
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Department Management</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" @click="isDialogVisible = true">Add</VBtn>
        <VBtn prepend-icon="bx-expand-alt" variant="tonal" color="secondary">Expand</VBtn>
        <VBtn prepend-icon="bx-collapse-alt" variant="tonal" color="secondary">Collapse</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <AppTextField v-model="search" placeholder="Search department" prepend-inner-icon="bx-search" density="compact" hide-details />
      </VCardText>
      <VDataTable :headers="headers" :items="flatDepts" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.name="{ item }">
          <div class="d-flex align-center" :style="{ paddingLeft: `${item.depth * 32}px` }">
            <VIcon v-if="item.depth > 0" icon="bx-chevron-right" size="16" class="me-1 text-medium-emphasis" />
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
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
      <VCard title="Add Department">
        <VCardText>
          <VForm>
            <AppSelect v-model="form.parentId" label="Parent Department" :items="['None', 'JH DevOps', 'R&D Department']" class="mb-3" />
            <AppTextField v-model="form.name" label="Department Name" class="mb-3" />
            <AppTextField v-model="form.leader" label="Leader" class="mb-3" />
            <AppTextField v-model="form.phone" label="Phone" class="mb-3" />
            <AppTextField v-model="form.email" label="Email" class="mb-3" />
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
