<script setup lang="ts">
const projectStore = useProjectStore()
const searchQuery = ref('')
const selectedStatus = ref()
const selectedProjects = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProjects.value.length / pageSize.value)))
const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const isAddDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const editingProject = ref<any>(null)

const newProject = ref({
  name: '',
  status: 'active',
  progress: 0,
})

const resolveStatusVariant = (status: string) => {
  const map: Record<string, string> = { active: 'success', completed: 'info', pending: 'warning', archived: 'secondary' }
  return map[status] || 'secondary'
}

const filteredProjects = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return projectStore.projects.filter(p => {
    const matchStatus = !selectedStatus.value || p.status === selectedStatus.value
    const matchSearch = !query || p.name.toLowerCase().includes(query)
    return matchStatus && matchSearch
  })
})

const headers = [
  { title: 'Project', key: 'project', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Progress', key: 'progress', sortable: true },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Action', key: 'actions', sortable: false },
]

function openEdit(project: any) {
  editingProject.value = { ...project }
  isEditDialogVisible.value = true
}

async function saveNew() {
  if (!newProject.value.name) return
  try {
    await projectStore.addProject({
      name: newProject.value.name,
      status: newProject.value.status,
      progress: newProject.value.progress,
    })
    newProject.value = { name: '', status: 'active', progress: 0 }
    isAddDialogVisible.value = false
  } catch (e) {
    console.error('Failed to add project:', e)
  }
}

function saveEdit() {
  if (!editingProject.value) return
  projectStore.updateProject(editingProject.value.id, editingProject.value)
  isEditDialogVisible.value = false
}

const isDeleteDialogVisible = ref(false)
const deletingProjectId = ref<number | null>(null)

function deleteProject(id: number) {
  deletingProjectId.value = id
  isDeleteDialogVisible.value = true
}

function confirmDelete() {
  if (deletingProjectId.value) projectStore.deleteProject(deletingProjectId.value)
  isDeleteDialogVisible.value = false
}

const allProjectsSelected = computed(() => pagedItems.value.length > 0 && pagedItems.value.every((p: any) => selectedProjects.value.some((s: any) => s.id === p.id)))
const someProjectsSelected = computed(() => selectedProjects.value.length > 0 && !allProjectsSelected.value)
function toggleAllProjects(val: boolean) {
  if (val) {
    const existing = new Set(selectedProjects.value.map((s: any) => s.id))
    pagedItems.value.forEach((p: any) => { if (!existing.has(p.id)) selectedProjects.value.push(p) })
  } else {
    const pagedIds = new Set(pagedItems.value.map((p: any) => p.id))
    selectedProjects.value = selectedProjects.value.filter((s: any) => !pagedIds.has(s.id))
  }
}

onMounted(() => {
  projectStore.fetchProjects()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap gap-4">
        <VTextField v-model="searchQuery" placeholder="Search Project" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" prepend-inner-icon="bx-search" />
        <VSpacer />
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[10, 20, 50, 100]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
        <VBtn prepend-icon="bx-plus" color="primary" @click="isAddDialogVisible = true">
          Add New Project
        </VBtn>
      </VCardText>
    </VCard>

    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <!-- Batch Action Bar -->
      <VExpandTransition>
        <VCardText v-if="selectedProjects.length > 0" class="d-flex align-center gap-3 bg-primary-lighten-4 rounded-lg ma-3">
          <VIcon icon="bx-check-double" color="primary" size="20" />
          <span class="text-body-1 font-weight-medium">{{ selectedProjects.length }} project(s) selected</span>
          <VSpacer />
          <VBtn size="small" variant="tonal" color="error" prepend-icon="bx-trash">
            Delete Selected
          </VBtn>
        </VCardText>
      </VExpandTransition>
      <VTable hover density="compact" class="text-no-wrap sticky-table">
        <thead>
          <tr>
            <th class="ps-4" style="width: 48px;"><VCheckbox v-model="allProjectsSelected" :indeterminate="someProjectsSelected" hide-details density="compact" @update:model-value="toggleAllProjects" /></th>
            <th>Project</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pagedItems" :key="item.id">
            <td class="ps-4"><VCheckbox v-model="selectedProjects" :value="item" hide-details density="compact" /></td>
            <td>
              <div class="d-flex align-center gap-x-4">
                <VAvatar size="34" variant="tonal" color="primary">
                  <VIcon icon="bx-detail" size="18" />
                </VAvatar>
                <div class="d-flex flex-column">
                  <h6 class="text-base font-weight-medium">{{ item.name }}</h6>
                </div>
              </div>
            </td>
            <td><VChip variant="tonal" :color="resolveStatusVariant(item.status)" size="small" label class="text-capitalize">{{ item.status }}</VChip></td>
            <td>
              <div class="d-flex align-center gap-3" style="min-inline-size: 120px;">
                <VProgressLinear :model-value="item.progress" color="primary" rounded height="6" style="flex: 1;" />
                <span class="text-body-2 text-high-emphasis">{{ item.progress }}%</span>
              </div>
            </td>
            <td><span class="text-body-2">{{ item.created }}</span></td>
            <td>
              <NuxtLink :to="`/admin/project/view?id=${item.id}`"><IconBtn><VIcon icon="bx-show" /></IconBtn></NuxtLink>
              <IconBtn @click="openEdit(item)"><VIcon icon="bx-edit" /></IconBtn>
              <IconBtn @click="deleteProject(item.id)"><VIcon icon="bx-trash" /></IconBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- Add Project Dialog -->
    <VDialog v-model="isAddDialogVisible" max-width="500">
      <VCard>
        <VCardTitle>Add New Project</VCardTitle>
        <VCardText>
          <VTextField v-model="newProject.name" label="Project Name" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="newProject.status" label="Status" :items="['active', 'pending', 'completed']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model.number="newProject.progress" label="Progress (%)" type="number" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveNew">Add Project</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Project Dialog -->
    <VDialog v-model="isEditDialogVisible" max-width="500">
      <VCard v-if="editingProject">
        <VCardItem>
          <VCardTitle>Edit Project</VCardTitle>
          <VBtn icon variant="text" @click="isEditDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VTextField v-model="editingProject.name" label="Project Name" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingProject.status" label="Status" :items="['active', 'pending', 'completed', 'archived']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model.number="editingProject.progress" label="Progress (%)" type="number" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveEdit">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirm Dialog -->
    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardItem>
          <VCardTitle>Delete Project</VCardTitle>
          <VBtn icon variant="text" @click="isDeleteDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>Are you sure you want to delete this project? This action cannot be undone.</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
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
