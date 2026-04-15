<script setup lang="ts">
const search = ref('')
const isDialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editingId = ref<number | null>(null)
const projectStore = useProjectStore()

const projects = computed(() => projectStore.projects)

const form = ref({ name: '', type: '', leader: '', status: 'active' })

const openAddDialog = () => {
  dialogMode.value = 'add'
  form.value = { name: '', type: '', leader: '', status: 'active' }
  editingId.value = null
  isDialogVisible.value = true
}

const openEditDialog = (item: any) => {
  dialogMode.value = 'edit'
  form.value = { name: item.name, type: item.type, leader: item.leader, status: item.status }
  editingId.value = item.id
  isDialogVisible.value = true
}

const deleteProject = (id: number) => {
  projectStore.deleteProject(id)
}

const submitForm = () => {
  if (dialogMode.value === 'add') {
    projectStore.addProject({ ...form.value, progress: 0, created: new Date().toISOString().split('T')[0] })
  } else {
    projectStore.updateProject(editingId.value!, form.value)
  }
  isDialogVisible.value = false
}
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Project List</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end">
        <VBtn prepend-icon="bx-plus" color="primary" @click="openAddDialog">New Project</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <VTextField v-model="search" placeholder="Search project" prepend-inner-icon="bx-search" density="compact" hide-details variant="outlined" style="max-inline-size: 280px;" />
      </VCardText>
      <VDivider />
      <VDataTable :headers="[{ title: 'PROJECT', key: 'project' }, { title: 'LEADER', key: 'leader' }, { title: 'STATUS', key: 'status' }, { title: 'PROGRESS', key: 'progress' }, { title: 'CREATED', key: 'created' }, { title: 'Actions', key: 'actions', sortable: false }]" :items="projects" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.project="{ item }">
          <NuxtLink :to="`/user/project/${item.id}/info`" class="d-flex align-center gap-x-3 text-decoration-none">
            <VAvatar variant="tonal" color="primary" rounded size="36">
              <span class="text-sm font-weight-medium">{{ item.name.charAt(0) }}</span>
            </VAvatar>
            <div>
              <h6 class="text-h6 text-no-wrap text-primary">{{ item.name }}</h6>
              <div class="text-body-2 text-medium-emphasis">{{ item.type }}</div>
            </div>
          </NuxtLink>
        </template>
        <template #item.leader="{ item }">
          <div class="text-base text-high-emphasis">{{ item.leader }}</div>
        </template>
        <template #item.status="{ item }">
          <VChip variant="tonal" :color="item.status === 'active' ? 'success' : item.status === 'completed' ? 'info' : 'warning'" size="small" label class="text-capitalize">
            {{ item.status }}
          </VChip>
        </template>
        <template #item.progress="{ item }">
          <div class="d-flex align-center gap-3">
            <div class="flex-grow-1"><VProgressLinear :model-value="item.progress" color="primary" rounded height="6" /></div>
            <div class="text-body-1 text-high-emphasis">{{ item.progress }}%</div>
          </div>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn size="small" @click="openEditDialog(item)"><VIcon icon="bx-edit" size="18" /></IconBtn>
            <IconBtn size="small" color="error" @click="deleteProject(item.id)"><VIcon icon="bx-trash" size="18" /></IconBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="isDialogVisible" max-width="550">
      <VCard :title="dialogMode === 'add' ? 'New Project' : 'Edit Project'">
        <VCardText>
          <VForm>
            <VTextField v-model="form.name" label="Project Name" class="mb-3" variant="outlined" />
            <VSelect v-model="form.type" label="Project Type" :items="['Vuejs Project', 'React Project', 'Figma Project', 'Xamarin Project', 'Python Project']" class="mb-3" variant="outlined" />
            <VTextField v-model="form.leader" label="Leader" class="mb-3" variant="outlined" />
            <VSelect v-model="form.status" label="Status" :items="['active', 'pending', 'completed']" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="submitForm">{{ dialogMode === 'add' ? 'Create' : 'Save' }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
