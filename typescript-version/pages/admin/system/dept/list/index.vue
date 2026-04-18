<script setup lang="ts">
const search = ref('')
const isDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const addFormRef = ref<any>(null)
const editFormRef = ref<any>(null)
const isDeleteDialogVisible = ref(false)
const isExpandAll = ref<boolean | null>(null)
const expandedRows = ref<number[]>([])

const deptStorageKey = 'dept-list-expanded'

function loadExpandedState() {
  if (import.meta.client) {
    const saved = localStorage.getItem(deptStorageKey)
    if (saved) {
      try { expandedRows.value = JSON.parse(saved) } catch { /* ignore */ }
    }
  }
}

watch(expandedRows, (val) => {
  if (import.meta.client) localStorage.setItem(deptStorageKey, JSON.stringify(val))
}, { deep: true })

onMounted(loadExpandedState)
const editingItem = ref<any>(null)
const deletingItem = ref<any>(null)

const toggleExpand = (item: any) => {
  if (expandedRows.value.includes(item.id)) expandedRows.value.delete(item.id)
  else expandedRows.value.add(item.id)
}

const isRowExpanded = (item: any) => {
  if (isExpandAll.value === true) return true
  if (isExpandAll.value === false) return false
  return expandedRows.value.includes(item.id)
}

const departments = ref([
  {
    id: 1, name: 'Headquarters', type: 'office', children: [
      {
        id: 2, name: 'Research Department', type: 'department', children: [
          { id: 3, name: 'Frontend Team', type: 'team', leader: 'Mary', children: [] },
          { id: 4, name: 'Backend Team', type: 'team', leader: 'Tom', children: [] },
        ],
      },
      {
        id: 5, name: 'Operations Department', type: 'department', children: [
          { id: 8, name: 'DevOps Team', type: 'team', leader: 'Jerry', children: [] },
          { id: 9, name: 'SRE Team', type: 'team', leader: 'Anna', children: [] },
        ],
      },
      {
        id: 6, name: 'Finance Department', type: 'department', children: [
          { id: 10, name: 'Accounting Team', type: 'team', leader: 'Bob', children: [] },
        ],
      },
      {
        id: 7, name: 'Marketing Department', type: 'department', children: [
          { id: 11, name: 'Growth Team', type: 'team', leader: 'Diana', children: [] },
        ],
      },
    ],
  },
  {
    id: 12, name: 'Branch Office', type: 'office', children: [
      {
        id: 13, name: 'Sales Department', type: 'department', children: [
          { id: 14, name: 'Domestic Sales Team', type: 'team', leader: 'Liam', children: [] },
          { id: 15, name: 'Overseas Sales Team', type: 'team', leader: 'Noah', children: [] },
        ],
      },
      {
        id: 16, name: 'Support Department', type: 'department', children: [
          { id: 17, name: 'CS Team', type: 'team', leader: 'Oliver', children: [] },
        ],
      },
    ],
  },
])

const headers = [
  { title: 'Office / Department / Team', key: 'name' },
  { title: 'Leader', key: 'leader' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
]

const flatDepts = computed(() => {
  const result: any[] = []
  const flatten = (items: any[], depth: number, parentExpanded: boolean) => {
    items.forEach(item => {
      if (!parentExpanded) return
      const expanded = isExpandAll.value || isRowExpanded(item)
      result.push({ ...item, depth })
      if (item.children?.length) flatten(item.children, depth + 1, expanded)
    })
  }
  flatten(departments.value, 0, true)
  return result
})

const typeIcon = (type: string) => {
  const map: Record<string, string> = { office: 'bx-building', department: 'bx-briefcase', team: 'bx-group' }
  return map[type] || 'bx-folder'
}

const typeColor = (type: string) => {
  const map: Record<string, string> = { office: 'primary', department: 'info', team: 'success' }
  return map[type] || 'grey'
}

const officeOptions = computed(() => departments.value.filter(d => d.type === 'office').map(d => d.name))
const deptOptions = computed(() => {
  const names: string[] = []
 const collect = (items: any[]) => {
    items.forEach(item => {
      if (item.type === 'department') { names.push(item.name) }
      if (item.children?.length) collect(item.children)
    })
  }
  collect(departments.value)
  return names
})

const parentOptions = computed(() => {
  if (form.value.type === 'office') return ['None (Top Level)']
  if (form.value.type === 'department') return officeOptions.value
  if (form.value.type === 'team') return deptOptions.value
  return ['None (Top Level)']
})

const form = ref({ name: '', parentId: 'None (Top Level)', leader: '', type: 'department' })

function openAddDialog() {
  form.value = { name: '', parentId: '', leader: '', type: 'department' }
  isDialogVisible.value = true
}

function onTypeChange() {
  form.value.parentId = parentOptions.value[0] || ''
}

function addChildTo(item: any) {
  form.value = { name: '', parentId: item.name, leader: '', type: item.type === 'office' ? 'department' : 'team' }
  isDialogVisible.value = true
}

function addItem() {
  addFormRef.value?.validate().then(({ valid }: any) => {
    if (!valid) return
    const newId = Date.now()
    const newItem = { id: newId, name: form.value.name, type: form.value.type, leader: form.value.leader, children: [] }
    if (form.value.parentId === 'None (Top Level)') {
      departments.value.push(newItem)
    } else {
      const parent = findInTree(departments.value, form.value.parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(newItem)
      }
    }
    isDialogVisible.value = false
  })
}

function findInTree(items: any[], name: string): any {
  for (const item of items) {
    if (item.name === name) return item
    if (item.children) { const found = findInTree(item.children, name); if (found) return found }
  }
  return null
}

function openEditDialog(item: any) {
  editingItem.value = { ...item }
  isEditDialogVisible.value = true
}

function saveEdit() {
  editFormRef.value?.validate().then(({ valid }: any) => {
    if (!valid) return
    if (!editingItem.value) return
    const target = findInTree(departments.value, editingItem.value._originalName)
    if (target) {
      target.name = editingItem.value.name
      target.leader = editingItem.value.leader
    }
    isEditDialogVisible.value = false
  })
}

function openDeleteDialog(item: any) {
  deletingItem.value = item
  isDeleteDialogVisible.value = true
}

function confirmDelete() {
  if (!deletingItem.value) return
  deleteFromTree(departments.value, deletingItem.value.name)
  isDeleteDialogVisible.value = false
}

function deleteFromTree(items: any[], name: string): boolean {
  for (let i = 0; i < items.length; i++) {
    if (items[i].name === name) { items.splice(i, 1); return true }
    if (items[i].children && deleteFromTree(items[i].children, name)) return true
  }
  return false
}
</script>

<template>
  <div>
    <VRow class="mb-4 align-center">
      <VCol cols="12" md="6"><h4 class="text-h4">Department</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end align-center gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" size="small" @click="openAddDialog">Add</VBtn>
        <VBtn prepend-icon="bx-expand-alt" variant="tonal" color="secondary" size="small" @click="isExpandAll = true">Expand</VBtn>
        <VBtn prepend-icon="bx-collapse-alt" variant="tonal" color="secondary" size="small" @click="isExpandAll = false; expandedRows.value = []; flatDepts">Collapse</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <VTextField v-model="search" placeholder="Search" prepend-inner-icon="bx-search" density="compact" hide-details variant="outlined" style="max-inline-size: 280px;" />
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
        <template #item.actions="{ item }">
          <NuxtLink :to="`/admin/system/dept/view?name=${item.name}`"><IconBtn><VIcon icon="bx-show" /></IconBtn></NuxtLink>
          <IconBtn @click="openEditDialog({ ...item, _originalName: item.name })"><VIcon icon="bx-edit" /></IconBtn>
          <IconBtn color="error" @click="openDeleteDialog(item)"><VIcon icon="bx-trash" /></IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- Add Dialog -->
    <VDialog v-model="isDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Add New</VCardTitle>
          <VBtn icon variant="text" @click="isDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VForm ref="addFormRef">
            <VSelect v-model="form.type" label="Type" :items="['office', 'department', 'team']" density="comfortable" class="mb-3" variant="outlined" @update:model-value="onTypeChange" />
          <VSelect v-model="form.parentId" label="Parent" :items="parentOptions" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="form.name" label="Name" density="comfortable" class="mb-3" :rules="[v => !!v || 'Name is required']" variant="outlined" />
          <VTextField v-model="form.leader" label="Leader" density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="addItem">Submit</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Dialog -->
    <VDialog v-model="isEditDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Edit</VCardTitle>
          <VBtn icon variant="text" @click="isEditDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VForm ref="editFormRef">
            <VTextField :model-value="editingItem?.type" label="Type" density="comfortable" class="mb-3" variant="outlined" readonly />
          <VTextField v-model="editingItem.name" label="Name" density="comfortable" class="mb-3" :rules="[v => !!v || 'Name is required']" variant="outlined" />
          <VTextField v-model="editingItem.leader" label="Leader" density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveEdit">Save</VBtn>
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
        <VCardText>Are you sure you want to delete <strong>{{ deletingItem?.name }}</strong>? This will also remove all children.</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
