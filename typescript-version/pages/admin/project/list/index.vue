<script setup lang="ts">
import { userService } from '~/services/api'

const projectStore = useProjectStore()
const searchQuery = ref('')
const selectedStatus = ref()
const itemsPerPage = ref(10)
const selectedProjects = ref<any[]>([])

const isAddDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const editingProject = ref<any>(null)

const leaders = ref<any[]>([])

const newProject = ref({
  name: '',
  status: 'active',
  progress: 0,
  leader: '',
})

async function fetchLeaders() {
  try {
    const res: any = await userService.list()
    const users = Array.isArray(res) ? res : res?.data || []
    console.log('All users:', users)
    const filtered = users.filter((u: any) => u.role === 'leader')
    console.log('Leaders:', filtered)
    leaders.value = filtered
  } catch (e) {
    console.error('Failed to fetch leaders:', e)
  }
}

const resolveStatusVariant = (status: string) => {
  const map: Record<string, string> = { active: 'success', completed: 'info', pending: 'warning', archived: 'secondary' }
  return map[status] || 'secondary'
}

const filteredProjects = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return projectStore.projects.filter(p => {
    const matchStatus = !selectedStatus.value || p.status === selectedStatus.value
    const matchSearch = !query || p.name.toLowerCase().includes(query) || p.leader.toLowerCase().includes(query)
    return matchStatus && matchSearch
  })
})

const headers = [
  { title: 'Project', key: 'project', sortable: true },
  { title: 'Leader', key: 'leader', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Progress', key: 'progress', sortable: true },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
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
      leader: newProject.value.leader,
    })
    newProject.value = { name: '', status: 'active', progress: 0, leader: '' }
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



function deleteProject(id: number) {
  projectStore.deleteProject(id)
}

onMounted(() => {
  projectStore.fetchProjects()
  fetchLeaders()
})
</script>

<template>
  <div>
    <!-- Filters Card -->
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCardTitle>Filter</VCardTitle>
      </VCardItem>
      <VCardText class="pt-0">
        <VRow>
          <VCol cols="12" sm="4">
            <VSelect v-model="selectedStatus" placeholder="Select Status" :items="['active', 'completed', 'pending', 'archived']" density="comfortable" clearable hide-details variant="outlined" />
          </VCol>
        </VRow>
      </VCardText>
      <VDivider />
      <VCardText class="d-flex flex-wrap gap-4">
        <VTextField v-model="searchQuery" placeholder="Search Project" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" prepend-inner-icon="bx-search" />
        <VSpacer />
        <VBtn prepend-icon="bx-plus" color="primary" @click="isAddDialogVisible = true">
          Add New Project
        </VBtn>
      </VCardText>
      <VDivider />
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
      <VDataTable
        v-model:selected="selectedProjects"
        :headers="headers"
        :items="filteredProjects"
        :items-per-page="itemsPerPage"
        show-select
        class="text-no-wrap"
      >
        <template #item.project="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VAvatar size="34" variant="tonal" color="primary">
              <VIcon icon="bx-detail" size="18" />
            </VAvatar>
            <div class="d-flex flex-column">
              <h6 class="text-base font-weight-medium">{{ item.name }}</h6>
            </div>
          </div>
        </template>
        <template #item.leader="{ item }">
          <div class="text-body-1 text-high-emphasis">{{ item.leader }}</div>
        </template>
        <template #item.status="{ item }">
          <VChip variant="tonal" :color="resolveStatusVariant(item.status)" size="small" label class="text-capitalize">{{ item.status }}</VChip>
        </template>
        <template #item.progress="{ item }">
          <div class="d-flex align-center gap-3" style="min-inline-size: 120px;">
            <VProgressLinear :model-value="item.progress" color="primary" rounded height="6" style="flex: 1;" />
            <span class="text-body-2 text-high-emphasis">{{ item.progress }}%</span>
          </div>
        </template>
        <template #item.created="{ item }">
          <span class="text-body-2">{{ item.created }}</span>
        </template>
        <template #item.actions="{ item }">
          <NuxtLink :to="`/user/project/view?id=${item.id}`">
            <IconBtn><VIcon icon="bx-show" /></IconBtn>
          </NuxtLink>
          <IconBtn @click="openEdit(item)">
            <VIcon icon="bx-edit" />
          </IconBtn>
          <IconBtn @click="deleteProject(item.id)">
            <VIcon icon="bx-trash" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- Add Project Dialog -->
    <VDialog v-model="isAddDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Add New Project</VCardTitle>
          <VBtn icon variant="text" @click="isAddDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VTextField v-model="newProject.name" label="Project Name" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="newProject.leader" label="Leader" :items="leaders.map(l => l.fullName || l.username)" density="comfortable" class="mb-3" variant="outlined" />
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
          <VSelect v-model="editingProject.leader" label="Leader" :items="leaders.map(l => l.fullName || l.username)" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingProject.status" label="Status" :items="['active', 'pending', 'completed', 'archived']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model.number="editingProject.progress" label="Progress (%)" type="number" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveEdit">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
