<script setup lang="ts">
import { userConsoleProjectService as projectService } from '~/services/api'

const router = useRouter()
const projectStore = useProjectStore()
const searchQuery = ref('')
const selectedStatus = ref<string | null>(null)
const itemsPerPage = ref(10)

const loading = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')
const projects = ref<any[]>([])

const resolveStatusVariant = (status: string) => {
  const map: Record<string, string> = { active: 'success', completed: 'info', pending: 'warning', archived: 'secondary' }
  return map[status] || 'secondary'
}

const filteredProjects = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return projects.value.filter(p => {
    const matchStatus = !selectedStatus.value || p.status === selectedStatus.value
    const matchSearch = !query || p.name?.toLowerCase().includes(query) || p.leader?.toLowerCase().includes(query)
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

async function fetchProjects() {
  loading.value = true
  try {
    const res = await projectService.list()
    projects.value = Array.isArray(res) ? res : res?.data || []
    projectStore.projects = projects.value
  } catch (e: any) {
    snackbarMsg.value = e?.message || 'Failed to load projects'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchProjects)
</script>

<template>
  <div>
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCardTitle>Projects</VCardTitle>
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
      </VCardText>
      <VDivider />

      <div v-if="loading" class="d-flex justify-center align-center pa-8">
        <VProgressCircular indeterminate color="primary" size="40" />
      </div>

      <VDataTable
        v-else
        :headers="headers"
        :items="filteredProjects"
        :items-per-page="itemsPerPage"
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
          <span class="text-body-2">{{ item.createdAt }}</span>
        </template>
        <template #item.actions="{ item }">
          <NuxtLink :to="`/user/project/view?id=${item.id}`">
            <IconBtn><VIcon icon="bx-show" /></IconBtn>
          </NuxtLink>
        </template>
      </VDataTable>
    </VCard>

    <VSnackbar v-model="snackbar" color="error" :timeout="3000">
      {{ snackbarMsg }}
    </VSnackbar>
  </div>
</template>
