<script setup lang="ts">
const departmentStore = useDepartmentStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const search = ref('')
const isDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const addFormRef = ref<any>(null)
const editFormRef = ref<any>(null)
const isDeleteDialogVisible = ref(false)
const expandedRows = ref<number[]>([])

const deptStorageKey = 'dept-list-expanded'

function loadExpandedState() {
  if (import.meta.client) {
    const saved = localStorage.getItem(deptStorageKey)
    if (saved) {
      try { const ids = JSON.parse(saved); expandedRows.value = Array.isArray(ids) ? ids : Object.keys(ids).map(Number) } catch { /* ignore */ }
    }
  }
}

watch(expandedRows, (val) => {
  if (import.meta.client) localStorage.setItem(deptStorageKey, JSON.stringify(val))
}, { deep: true })

onMounted(async () => {
  loadExpandedState()
  await departmentStore.fetchDepartments()
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!val) { departmentStore.fetchDepartments(); return }
  searchTimer = setTimeout(() => departmentStore.searchDepartments(val), 300)
})

const editingItem = ref<any>(null)
const deletingItem = ref<any>(null)

const toggleExpand = (item: any) => {
  if (expandedRows.value.includes(item.id)) { const i = expandedRows.value.indexOf(item.id); expandedRows.value.splice(i, 1) }
  else expandedRows.value.push(item.id)
}

const isRowExpanded = (item: any) => {
  return expandedRows.value.includes(item.id)
}

const departments = computed(() => departmentStore.departments)

const headers = [
  { title: 'Department', key: 'name' },
  { title: 'Members', key: 'userCount' },
  { title: 'Description', key: 'description' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
]

const flatDepts = computed(() => {
  const result: any[] = []
  const flatten = (items: any[], depth: number, parentExpanded: boolean) => {
    items.forEach(item => {
      if (!parentExpanded) return
      const expanded = isRowExpanded(item)
      result.push({ ...item, depth })
      if (item.children?.length) flatten(item.children, depth + 1, expanded)
    })
  }
  flatten(departments.value, 0, true)
  return result
})

const typeIcon = (type?: string) => {
  const map: Record<string, string> = { office: 'bx-building', department: 'bx-briefcase', team: 'bx-group' }
  return map[type || 'department'] || 'bx-folder'
}

const typeColor = (type?: string) => {
  const map: Record<string, string> = { office: 'primary', department: 'info', team: 'success' }
  return map[type || 'department'] || 'grey'
}

const form = ref({ name: '', parentId: null as number | null, managerId: null as number | null, description: '', type: 'department' })

function openAddDialog() {
  form.value = { name: '', parentId: null, managerId: null, description: '', type: 'department' }
  isDialogVisible.value = true
}

function addItem() {
  addFormRef.value?.validate().then(async ({ valid }: any) => {
    if (!valid) return
    try {
      await departmentStore.createDepartment(form.value)
      isDialogVisible.value = false
      snackbar.value = { show: true, text: 'Department created successfully', color: 'success' }
    } catch (e: any) {
      snackbar.value = { show: true, text: e.message || 'Failed to create department', color: 'error' }
    }
  })
}

function openEditDialog(item: any) {
  editingItem.value = { id: item.id, name: item.name, managerId: item.managerId, description: item.description, type: item.type, parentId: item.parentId }
  isEditDialogVisible.value = true
}

function saveEdit() {
  editFormRef.value?.validate().then(async ({ valid }: any) => {
    if (!valid) return
    if (!editingItem.value) return
    try {
      await departmentStore.updateDepartment(editingItem.value.id, {
        name: editingItem.value.name,
        managerId: editingItem.value.managerId,
        description: editingItem.value.description,
      })
      isEditDialogVisible.value = false
      snackbar.value = { show: true, text: 'Department updated successfully', color: 'success' }
    } catch (e: any) {
      snackbar.value = { show: true, text: e.message || 'Failed to update department', color: 'error' }
    }
  })
}

function openDeleteDialog(item: any) {
  deletingItem.value = item
  isDeleteDialogVisible.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) return
  try {
    await departmentStore.deleteDepartment(deletingItem.value.id)
    isDeleteDialogVisible.value = false
    snackbar.value = { show: true, text: 'Department deleted successfully', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to delete department', color: 'error' }
  }
}
</script>

<template>
  <div>
    <VRow class="mb-4 align-center">
      <VCol cols="12" md="6"><h4 class="text-h4">Department</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end align-center gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" size="small" @click="openAddDialog">Add</VBtn>
      </VCol>
    </VRow>

    <VCard :loading="departmentStore.loading">
      <VCardText>
        <VTextField v-model="search" placeholder="Search" prepend-inner-icon="bx-search" density="compact" hide-details variant="outlined" style="max-inline-size: 280px;" @update:model-value="" />
      </VCardText>
      <VDivider />
      <VDataTable :headers="headers" :items="flatDepts" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.name="{ item }">
          <div class="d-flex align-center" :style="{ paddingLeft: `${item.depth * 32}px` }">
            <VIcon
              v-if="item.children?.length"
              :icon="isRowExpanded(item) ? 'bx-chevron-down' : 'bx-chevron-right'"
              size="18"
              class="me-2 text-medium-emphasis cursor-pointer"
              @click.stop="toggleExpand(item)"
            />
            <div v-else style="inline-size: 26px;" class="me-2" />
            <VIcon :icon="typeIcon(item.type)" :color="typeColor(item.type)" size="20" class="me-2" />
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
        <template #item.userCount="{ item }">
          <VChip v-if="item.userCount" variant="tonal" color="primary" size="small">{{ item.userCount }}</VChip>
          <span v-else class="text-body-2 text-medium-emphasis">0</span>
        </template>
        <template #item.actions="{ item }">
          <NuxtLink :to="`/admin/system/dept/view?id=${item.id}`"><IconBtn><VIcon icon="bx-show" /></IconBtn></NuxtLink>
          <IconBtn @click="openEditDialog(item)"><VIcon icon="bx-edit" /></IconBtn>
          <IconBtn color="error" @click="openDeleteDialog(item)"><VIcon icon="bx-trash" /></IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- Add Dialog -->
    <VDialog v-model="isDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Add New Department</VCardTitle>
          <VBtn icon variant="text" @click="isDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VForm ref="addFormRef">
            <VTextField v-model="form.name" label="Name" density="comfortable" class="mb-3" :rules="[v => !!v || 'Name is required']" variant="outlined" />
            <VTextField v-model="form.description" label="Description" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model.number="form.managerId" label="Manager ID" density="comfortable" type="number" class="mb-3" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="departmentStore.loading" @click="addItem">Submit</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Dialog -->
    <VDialog v-model="isEditDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Edit Department</VCardTitle>
          <VBtn icon variant="text" @click="isEditDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VForm ref="editFormRef">
            <VTextField v-model="editingItem.name" label="Name" density="comfortable" class="mb-3" :rules="[v => !!v || 'Name is required']" variant="outlined" />
            <VTextField v-model="editingItem.description" label="Description" density="comfortable" class="mb-3" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="departmentStore.loading" @click="saveEdit">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardItem>
          <VCardTitle>Delete</VCardTitle>
          <VBtn icon variant="text" @click="isDeleteDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>Are you sure you want to delete <strong>{{ deletingItem?.name }}</strong>?</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" :loading="departmentStore.loading" @click="confirmDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
