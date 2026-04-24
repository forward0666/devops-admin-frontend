<script setup lang="ts">
import { projectService } from '~/services/api'

const route = useRoute()
const router = useRouter()
const projectId = computed(() => route.params.id as string)

const project = ref<any>(null)
const loading = ref(true)
const notFound = ref(false)

const snackbar = ref({ show: false, message: '', color: 'success' })

function showSnackbar(message: string, color = 'success') {
  snackbar.value = { show: true, message, color }
}

const techStack = computed(() => {
  if (!project.value?.techStack) return []
  return project.value.techStack.split(',').map(s => s.trim()).filter(Boolean)
})

const objectives = computed(() => {
  if (!project.value?.objectives) return []
  return project.value.objectives.split(',').map(s => s.trim()).filter(Boolean)
})

// Edit dialogs
const isOverviewDialogVisible = ref(false)
const isTechDialogVisible = ref(false)
const isObjectivesDialogVisible = ref(false)
const saving = ref(false)

const editOverview = ref({ description: '', status: '', progress: 0, leader: '' })
const editTechStack = ref('')
const editObjectives = ref('')

async function fetchProject() {
  loading.value = true
  notFound.value = false
  try {
    const res = await projectService.getById(projectId.value)
    project.value = Array.isArray(res) ? res[0] : res?.data || res
    if (!project.value) notFound.value = true
  }
  catch {
    notFound.value = true
  }
  finally {
    loading.value = false
  }
}

function openOverviewDialog() {
  editOverview.value = {
    description: project.value.description || '',
    status: project.value.status || 'active',
    progress: project.value.progress || 0,
    leader: project.value.leader || '',
  }
  isOverviewDialogVisible.value = true
}

async function saveOverview() {
  saving.value = true
  try {
    await projectService.update(projectId.value, {
      description: editOverview.value.description,
      status: editOverview.value.status,
      progress: editOverview.value.progress,
      leader: editOverview.value.leader,
    })
    showSnackbar('Overview updated successfully')
    await fetchProject()
    isOverviewDialogVisible.value = false
  }
  catch (e: any) {
    showSnackbar(e?.message || 'Failed to update overview', 'error')
  }
  finally {
    saving.value = false
  }
}

function openTechDialog() {
  editTechStack.value = techStack.value.join(', ')
  isTechDialogVisible.value = true
}

async function saveTechStack() {
  saving.value = true
  try {
    await projectService.update(projectId.value, { techStack: editTechStack.value })
    showSnackbar('Tech stack updated successfully')
    await fetchProject()
    isTechDialogVisible.value = false
  }
  catch (e: any) {
    showSnackbar(e?.message || 'Failed to update tech stack', 'error')
  }
  finally {
    saving.value = false
  }
}

function openObjectivesDialog() {
  editObjectives.value = objectives.value.join(', ')
  isObjectivesDialogVisible.value = true
}

async function saveObjectives() {
  saving.value = true
  try {
    await projectService.update(projectId.value, { objectives: editObjectives.value })
    showSnackbar('Objectives updated successfully')
    await fetchProject()
    isObjectivesDialogVisible.value = false
  }
  catch (e: any) {
    showSnackbar(e?.message || 'Failed to update objectives', 'error')
  }
  finally {
    saving.value = false
  }
}

onMounted(fetchProject)
</script>

<template>
  <div>
    <div v-if="loading" class="d-flex justify-center align-center" style="min-block-size: 400px;">
      <VProgressCircular indeterminate size="48" color="primary" />
    </div>

    <div v-else-if="notFound" class="d-flex flex-column align-center justify-center" style="min-block-size: 400px;">
      <VIcon icon="bx-error-circle" size="64" color="warning" class="mb-4" />
      <h4 class="text-h4 mb-2">Project Not Found</h4>
      <p class="text-body-1 text-medium-emphasis mb-4">The project you're looking for doesn't exist.</p>
      <VBtn prepend-icon="bx-arrow-back" color="primary" variant="tonal" to="/user/project/list">Back to Projects</VBtn>
    </div>

    <div v-else>
      <VRow class="mb-4">
        <VCol cols="12" md="6">
          <h4 class="text-h4">{{ project.name }} - Info</h4>
        </VCol>
      </VRow>

      <!-- Project Overview -->
      <VCard class="mb-6">
        <VCardItem>
          <VCardTitle>Project Overview</VCardTitle>
          <template #append>
            <IconBtn size="small" @click="openOverviewDialog"><VIcon icon="bx-edit" size="18" /></IconBtn>
          </template>
        </VCardItem>
        <VDivider />
        <VCardText>
          <p class="text-body-1 mb-4">{{ project.description }}</p>
          <VRow>
            <VCol cols="12" sm="6" md="3">
              <div class="text-body-2 text-medium-emphasis mb-1">Status</div>
              <VChip
                variant="tonal"
                :color="project.status === 'active' ? 'success' : project.status === 'completed' ? 'info' : 'warning'"
                size="small"
                label
                class="text-capitalize"
              >
                {{ project.status }}
              </VChip>
            </VCol>
            <VCol cols="12" sm="6" md="3">
              <div class="text-body-2 text-medium-emphasis mb-1">Progress</div>
              <div class="d-flex align-center gap-2">
                <VProgressLinear :model-value="project.progress" color="primary" rounded height="6" style="flex: 1;" />
                <span class="text-body-1 font-weight-medium">{{ project.progress }}%</span>
              </div>
            </VCol>
            <VCol cols="12" sm="6" md="4">
              <div class="text-body-2 text-medium-emphasis mb-1">Leader(s)</div>
              <div class="text-body-1 font-weight-medium">{{ project.leader }}</div>
            </VCol>
            <VCol cols="12" sm="6" md="4">
              <div class="text-body-2 text-medium-emphasis mb-1">Created</div>
              <div class="text-body-1">{{ project.createdAt }}</div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <VRow>
        <!-- Tech Stack -->
        <VCol cols="12" md="6">
          <VCard class="h-100">
            <VCardItem>
              <VCardTitle>Tech Stack</VCardTitle>
              <template #append>
                <IconBtn size="small" @click="openTechDialog"><VIcon icon="bx-edit" size="18" /></IconBtn>
              </template>
            </VCardItem>
            <VDivider />
            <VCardText>
              <div v-if="techStack.length" class="d-flex flex-wrap gap-2">
                <VChip v-for="tech in techStack" :key="tech" variant="tonal" color="primary" label>
                  <VIcon icon="bx-code-block" size="16" start />
                  {{ tech }}
                </VChip>
              </div>
              <p v-else class="text-body-2 text-medium-emphasis">No tech stack defined</p>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Objectives -->
        <VCol cols="12" md="6">
          <VCard class="h-100">
            <VCardItem>
              <VCardTitle>Objectives</VCardTitle>
              <template #append>
                <IconBtn size="small" @click="openObjectivesDialog"><VIcon icon="bx-edit" size="18" /></IconBtn>
              </template>
            </VCardItem>
            <VDivider />
            <VCardText>
              <VList v-if="objectives.length" density="compact" lines="one">
                <VListItem v-for="(obj, index) in objectives" :key="index">
                  <template #prepend>
                    <VIcon icon="bx-check-circle" color="success" size="20" class="me-3" />
                  </template>
                  <VListItemTitle class="text-body-1">{{ obj }}</VListItemTitle>
                </VListItem>
              </VList>
              <p v-else class="text-body-2 text-medium-emphasis">No objectives defined</p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Edit Overview Dialog -->
      <VDialog v-model="isOverviewDialogVisible" max-width="600">
        <VCard>
          <VCardItem>
            <VCardTitle>Edit Project Overview</VCardTitle>
            <VBtn icon variant="text" @click="isOverviewDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
          </VCardItem>
          <VCardText>
            <VTextarea v-model="editOverview.description" label="Description" rows="4" class="mb-3" variant="outlined" />
            <VRow>
              <VCol cols="12" sm="6">
                <VSelect v-model="editOverview.status" label="Status" :items="['active', 'completed', 'pending']" density="comfortable" class="mb-3" variant="outlined" />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField v-model.number="editOverview.progress" label="Progress (%)" type="number" density="comfortable" class="mb-3" variant="outlined" />
              </VCol>
              <VCol cols="12">
                <VTextarea v-model="editOverview.leader" label="Leader(s) (comma separated)" rows="2" variant="outlined" />
              </VCol>
            </VRow>
          </VCardText>
          <VCardActions class="justify-end">
            <VBtn variant="tonal" @click="isOverviewDialogVisible = false">Cancel</VBtn>
            <VBtn color="primary" :loading="saving" @click="saveOverview">Save</VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- Edit Tech Stack Dialog -->
      <VDialog v-model="isTechDialogVisible" max-width="500">
        <VCard>
          <VCardItem>
            <VCardTitle>Edit Tech Stack</VCardTitle>
            <VBtn icon variant="text" @click="isTechDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
          </VCardItem>
          <VCardText>
            <VTextarea v-model="editTechStack" label="Tech Stack (comma separated)" rows="4" variant="outlined" hint="Separate each technology with a comma" />
          </VCardText>
          <VCardActions class="justify-end">
            <VBtn variant="tonal" @click="isTechDialogVisible = false">Cancel</VBtn>
            <VBtn color="primary" :loading="saving" @click="saveTechStack">Save</VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- Edit Objectives Dialog -->
      <VDialog v-model="isObjectivesDialogVisible" max-width="500">
        <VCard>
          <VCardItem>
            <VCardTitle>Edit Objectives</VCardTitle>
            <VBtn icon variant="text" @click="isObjectivesDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
          </VCardItem>
          <VCardText>
            <VTextarea v-model="editObjectives" label="Objectives (comma separated)" rows="6" variant="outlined" hint="Separate each objective with a comma" />
          </VCardText>
          <VCardActions class="justify-end">
            <VBtn variant="tonal" @click="isObjectivesDialogVisible = false">Cancel</VBtn>
            <VBtn color="primary" :loading="saving" @click="saveObjectives">Save</VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- Snackbar -->
      <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top end">
        {{ snackbar.message }}
      </VSnackbar>
    </div>
  </div>
</template>
