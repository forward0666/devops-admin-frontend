<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const project = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value) || projectStore.projects[0])
const name = computed(() => project.value?.name || 'Unknown Project')

const projectDescriptions: Record<string, { description: string, techStack: string[], objectives: string[] }> = {
  '1': {
    description: 'A comprehensive admin dashboard design system built with Vue.js and Vuetify. Features reusable components, responsive layouts, dark/light theme support, and real-time data visualization for DevOps monitoring and management.',
    techStack: ['Vue 3', 'Vuetify 3', 'TypeScript', 'Pinia', 'Nuxt 3', 'Chart.js'],
    objectives: [
      'Build a responsive admin dashboard with real-time monitoring',
      'Implement role-based access control (Admin/User views)',
      'Design reusable UI components for DevOps workflows',
      'Integrate project management with team collaboration features',
    ],
  },
  '2': {
    description: 'A full-featured eCommerce platform for BGC (Bonifacio Global City) merchants. Built with React, featuring product catalog management, shopping cart, payment integration, and order tracking system.',
    techStack: ['React 18', 'Next.js', 'Redux', 'Tailwind CSS', 'Stripe API', 'PostgreSQL'],
    objectives: [
      'Launch MVP for BGC local merchants',
      'Implement secure payment processing',
      'Build real-time inventory management',
      'Create merchant analytics dashboard',
    ],
  },
  '3': {
    description: 'A brand identity and logo design project for Falcon Technologies. Includes logo variations, brand guidelines, color palette, typography system, and marketing collateral designs.',
    techStack: ['Figma', 'Adobe Illustrator', 'After Effects', 'Photoshop'],
    objectives: [
      'Design primary and secondary logo variations',
      'Create comprehensive brand guidelines document',
      'Develop marketing materials (business cards, letterheads)',
      'Design social media templates and assets',
    ],
  },
  '4': {
    description: 'A cross-platform mobile application for Foodista, a food delivery and restaurant discovery platform. Built with Xamarin for iOS and Android, featuring real-time order tracking and AI-powered restaurant recommendations.',
    techStack: ['Xamarin.Forms', 'C#', '.NET MAUI', 'Firebase', 'Google Maps API', 'ML.NET'],
    objectives: [
      'Build cross-platform mobile app for iOS and Android',
      'Implement real-time GPS order tracking',
      'Develop AI-powered restaurant recommendation engine',
      'Integrate multiple payment gateways',
    ],
  },
}

const info = reactive({ ...projectDescriptions[projectId.value] || projectDescriptions['1'] })

// Edit dialogs
const isOverviewDialogVisible = ref(false)
const isTechDialogVisible = ref(false)
const isObjectivesDialogVisible = ref(false)

const editOverview = ref({ description: '', status: '', progress: 0, leaders: '' })
const editTechStack = ref('')
const editObjectives = ref('')

function openOverviewDialog() {
  editOverview.value = { description: info.description, status: project.value.status, progress: project.value.progress, leaders: project.value.leader }
  isOverviewDialogVisible.value = true
}

function saveOverview() {
  info.description = editOverview.value.description
  projectStore.updateProject(Number(projectId.value), { status: editOverview.value.status, progress: editOverview.value.progress, leader: editOverview.value.leaders })
  isOverviewDialogVisible.value = false
}

function openTechDialog() {
  editTechStack.value = info.techStack.join(', ')
  isTechDialogVisible.value = true
}

function saveTechStack() {
  info.techStack = editTechStack.value.split(',').map(s => s.trim()).filter(Boolean)
  isTechDialogVisible.value = false
}

function openObjectivesDialog() {
  editObjectives.value = info.objectives.join('\n')
  isObjectivesDialogVisible.value = true
}

function saveObjectives() {
  info.objectives = editObjectives.value.split('\n').map(s => s.trim()).filter(Boolean)
  isObjectivesDialogVisible.value = false
}
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">{{ name }} - Info</h4></VCol>
    </VRow>

    <!-- Project Overview -->
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Project Overview</VCardTitle>
        <template #append><IconBtn size="small" @click="openOverviewDialog"><VIcon icon="bx-edit" size="18" /></IconBtn></template>
      </VCardItem>
      <VDivider />
      <VCardText>
        <p class="text-body-1 mb-4">{{ info.description }}</p>
        <VRow>
          <VCol cols="12" sm="6" md="3">
            <div class="text-body-2 text-medium-emphasis mb-1">Status</div>
            <VChip variant="tonal" :color="project.status === 'active' ? 'success' : project.status === 'completed' ? 'info' : 'warning'" size="small" label class="text-capitalize">{{ project.status }}</VChip>
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
            <div class="text-body-1">{{ project.created }}</div>
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
            <template #append><IconBtn size="small" @click="openTechDialog"><VIcon icon="bx-edit" size="18" /></IconBtn></template>
          </VCardItem>
          <VDivider />
          <VCardText>
            <div class="d-flex flex-wrap gap-2">
              <VChip v-for="tech in info.techStack" :key="tech" variant="tonal" color="primary" label>
                <VIcon icon="bx-code-block" size="16" start />
                {{ tech }}
              </VChip>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Objectives -->
      <VCol cols="12" md="6">
        <VCard class="h-100">
          <VCardItem>
            <VCardTitle>Objectives</VCardTitle>
            <template #append><IconBtn size="small" @click="openObjectivesDialog"><VIcon icon="bx-edit" size="18" /></IconBtn></template>
          </VCardItem>
          <VDivider />
          <VCardText>
            <VList density="compact" lines="one">
              <VListItem v-for="(obj, index) in info.objectives" :key="index">
                <template #prepend>
                  <VIcon icon="bx-check-circle" color="success" size="20" class="me-3" />
                </template>
                <VListItemTitle class="text-body-1">{{ obj }}</VListItemTitle>
              </VListItem>
            </VList>
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
              <VTextarea v-model="editOverview.leaders" label="Leader(s) (comma separated)" rows="2" variant="outlined" />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isOverviewDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveOverview">Save</VBtn>
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
          <VBtn color="primary" @click="saveTechStack">Save</VBtn>
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
          <VTextarea v-model="editObjectives" label="Objectives (one per line)" rows="6" variant="outlined" hint="Each line is a separate objective" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isObjectivesDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveObjectives">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
