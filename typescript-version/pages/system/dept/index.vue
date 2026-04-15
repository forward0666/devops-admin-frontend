<script setup lang="ts">
const search = ref('')
const isDialogVisible = ref(false)
const isExpandAll = ref(false)
const expandedRows = ref<Set<number>>(new Set())

const toggleExpand = (item: any) => {
  if (expandedRows.value.has(item.id)) expandedRows.value.delete(item.id)
  else expandedRows.value.add(item.id)
}

const isRowExpanded = (item: any) => {
  if (isExpandAll.value) return true
  if (item.depth === 0) return !expandedRows.value.has(item.id)
  // Check if parent is expanded
  return expandedRows.value.has(item.id)
}

const departments = ref([
  {
    id: 1, name: 'Headquarters', type: 'office', leader: 'admin', children: [
      {
        id: 2, name: 'R&D Department', type: 'department', leader: 'John', children: [
          { id: 3, name: 'Frontend Team', type: 'team', leader: 'Mary', children: [] },
          { id: 4, name: 'Backend Team', type: 'team', leader: 'Tom', children: [] },
        ],
      },
      {
        id: 5, name: 'Operations Department', type: 'department', leader: 'Lucy', children: [
          { id: 8, name: 'DevOps Team', type: 'team', leader: 'Jerry', children: [] },
          { id: 9, name: 'SRE Team', type: 'team', leader: 'Anna', children: [] },
        ],
      },
      {
        id: 6, name: 'Finance Department', type: 'department', leader: 'Jack', children: [
          { id: 10, name: 'Accounting Team', type: 'team', leader: 'Bob', children: [] },
        ],
      },
      {
        id: 7, name: 'Marketing Department', type: 'department', leader: 'Rose', children: [
          { id: 11, name: 'Growth Team', type: 'team', leader: 'Diana', children: [] },
        ],
      },
    ],
  },
  {
    id: 12, name: 'Branch Office', type: 'office', leader: 'Steven', children: [
      {
        id: 13, name: 'Sales Department', type: 'department', leader: 'Kevin', children: [
          { id: 14, name: 'Domestic Sales Team', type: 'team', leader: 'Liam', children: [] },
          { id: 15, name: 'Overseas Sales Team', type: 'team', leader: 'Noah', children: [] },
        ],
      },
      {
        id: 16, name: 'Support Department', type: 'department', leader: 'Mia', children: [
          { id: 17, name: 'CS Team', type: 'team', leader: 'Oliver', children: [] },
        ],
      },
    ],
  },
])

const headers = [
  { title: 'Office / Department / Team', key: 'name' },
  { title: 'Leader', key: 'leader' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const flatDepts = computed(() => {
  const result: any[] = []
  const flatten = (items: any[], depth: number, parentExpanded: boolean) => {
    items.forEach(item => {
      if (!parentExpanded) return
      const expanded = isExpandAll.value || !expandedRows.value.has(item.id)
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

const form = ref({ name: '', parentId: '', leader: '', type: 'department' })
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Department</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" @click="isDialogVisible = true">Add</VBtn>
        <VBtn prepend-icon="bx-expand-alt" variant="tonal" color="secondary" @click="isExpandAll = true">Expand</VBtn>
        <VBtn prepend-icon="bx-collapse-alt" variant="tonal" color="secondary" @click="isExpandAll = false; expandedRows = new Set()">Collapse</VBtn>
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
          <div class="d-flex gap-1">
            <IconBtn v-if="item.type !== 'team'" size="small"><VIcon icon="bx-plus" size="18" /></IconBtn>
            <div v-else style="inline-size: 32px; visibility: hidden;"><IconBtn size="small"><VIcon icon="bx-plus" size="18" /></IconBtn></div>
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
            <VSelect v-model="form.type" label="Type" :items="['office', 'department', 'team']" class="mb-3" variant="outlined" />
            <VSelect v-model="form.parentId" label="Parent" :items="['None', 'Headquarters', 'Branch Office']" class="mb-3" variant="outlined" clearable />
            <VTextField v-model="form.name" label="Name" class="mb-3" variant="outlined" />
            <VTextField v-model="form.leader" label="Leader" variant="outlined" />
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
