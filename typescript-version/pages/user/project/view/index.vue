<script setup lang="ts">
import { userConsoleProjectService as projectService, userConsoleMemberService as projectMemberService } from '~/services/api'

const activeTab = ref('overview')
const route = useRoute()
const router = useRouter()

const projectId = computed(() => Number(route.query.id))

const loading = ref(true)
const notFound = ref(false)
const snackbar = ref(false)
const snackbarMsg = ref('')

const project = ref<any>(null)
const members = ref<any[]>([])

const resolveStatusVariant = (status: string) => {
  const map: Record<string, string> = { active: 'success', completed: 'info', pending: 'warning', archived: 'secondary' }
  return map[status] || 'secondary'
}

const itemsPerPage = ref(5)

async function fetchProject() {
  loading.value = true
  try {
    const id = projectId.value
    // Store-first fallback
    const projectStore = useProjectStore()
    const stored = projectStore.projects?.find((p: any) => p.id === id)
    if (stored) {
      project.value = stored
    } else {
      const res = await projectService.getById(id)
      project.value = Array.isArray(res) ? res[0] : res?.data || res
    }

    if (!project.value) {
      notFound.value = true
      return
    }

    const mRes = await projectMemberService.list(id)
    members.value = Array.isArray(mRes) ? mRes : mRes?.data || []
  } catch (e: any) {
    snackbarMsg.value = e?.message || 'Failed to load project'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchProject)
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center align-center" style="block-size: 50vh;">
      <VProgressCircular indeterminate color="primary" size="48" />
    </div>

    <!-- Not Found -->
    <div v-else-if="notFound" class="d-flex flex-column align-center justify-center" style="block-size: 50vh;">
      <VIcon icon="bx-error-circle" size="64" color="warning" />
      <h4 class="text-h4 mt-4">Project Not Found</h4>
      <p class="text-body-1 text-medium-emphasis mt-2">The project you're looking for doesn't exist.</p>
      <VBtn color="primary" class="mt-4" prepend-icon="bx-arrow-back" @click="router.push('/user/project/list')">
        Back to Projects
      </VBtn>
    </div>

    <!-- Project Detail -->
    <template v-else-if="project">
      <VRow>
        <!-- Left Column -->
        <VCol cols="12" md="5" lg="4">
          <VCard>
            <VCardText class="text-center pt-12">
              <VAvatar size="120" variant="tonal" color="primary" rounded>
                <VIcon icon="bx-detail" size="56" />
              </VAvatar>
              <h5 class="text-h5 mt-4">{{ project.name }}</h5>
              <VChip variant="tonal" :color="resolveStatusVariant(project.status)" size="small" label class="text-capitalize mt-4">{{ project.status }}</VChip>
            </VCardText>
            <VCardText>
              <h5 class="text-h5">Details</h5>
              <VDivider class="my-4" />
              <VList class="card-list mt-2" density="compact" lines="one">
                <VListItem><VListItemTitle><h6 class="text-h6">Leader: <span class="text-body-1 d-inline-block">{{ project.leader || '-' }}</span></h6></VListItemTitle></VListItem>
                <VListItem><VListItemTitle><h6 class="text-h6">Created: <span class="text-body-1 d-inline-block">{{ project.createdAt || '-' }}</span></h6></VListItemTitle></VListItem>
                <VListItem><VListItemTitle><h6 class="text-h6">Progress: <span class="text-body-1 d-inline-block">{{ project.progress ?? 0 }}%</span></h6></VListItemTitle></VListItem>
              </VList>
              <VProgressLinear :model-value="project.progress ?? 0" color="primary" rounded height="6" class="mt-4" />
              <p class="text-body-2 text-medium-emphasis mt-3">{{ project.description || 'No description available.' }}</p>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Right Column: Tabs -->
        <VCol cols="12" md="7" lg="8">
          <VTabs v-model="activeTab">
            <VTab value="overview"><VIcon icon="bx-info-circle" size="18" class="me-1" />Overview</VTab>
            <VTab value="team"><VIcon icon="bx-group" size="18" class="me-1" />Team</VTab>
            <VTab value="activity"><VIcon icon="bx-time" size="18" class="me-1" />Activity</VTab>
          </VTabs>

          <!-- Overview Tab -->
          <div v-show="activeTab === 'overview'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Project Description</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <p class="text-body-1 mb-4">{{ project.description || 'No description available.' }}</p>
                <VRow>
                  <VCol cols="6">
                    <div class="d-flex align-center gap-x-3 mb-3">
                      <VAvatar variant="tonal" color="success" rounded size="36"><VIcon icon="bx-check-circle" size="20" /></VAvatar>
                      <div>
                        <h6 class="text-h6 text-capitalize">{{ project.status }}</h6>
                        <span class="text-body-2 text-medium-emphasis">Status</span>
                      </div>
                    </div>
                  </VCol>
                  <VCol cols="6">
                    <div class="d-flex align-center gap-x-3 mb-3">
                      <VAvatar variant="tonal" color="primary" rounded size="36"><VIcon icon="bx-user" size="20" /></VAvatar>
                      <div>
                        <h6 class="text-h6">{{ project.leader || '-' }}</h6>
                        <span class="text-body-2 text-medium-emphasis">Leader</span>
                      </div>
                    </div>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
            <VCard class="mt-6">
              <VCardItem><VCardTitle>Progress</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <div class="d-flex align-center gap-4 mb-4">
                  <div class="text-h4 font-weight-bold">{{ project.progress ?? 0 }}%</div>
                  <div class="flex-grow-1"><VProgressLinear :model-value="project.progress ?? 0" color="primary" rounded height="8" /></div>
                </div>
              </VCardText>
            </VCard>
          </div>

          <!-- Team Tab -->
          <div v-show="activeTab === 'team'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Team Members</VCardTitle></VCardItem>
              <VDivider />
              <VDataTable
                :items="members"
                :items-per-page="itemsPerPage"
                :headers="[
                  { title: 'MEMBER', key: 'fullName' },
                  { title: 'ROLE', key: 'role' },
                  { title: 'JOINED', key: 'joinedAt' },
                  { title: 'STATUS', key: 'active', sortable: false },
                ]"
                class="text-no-wrap"
              >
                <template #item.fullName="{ item }">
                  <div class="d-flex align-center gap-x-3">
                    <VAvatar size="34" rounded variant="tonal" color="primary">
                      <span class="text-sm font-weight-medium">{{ (item.fullName || item.username || '?')[0] }}</span>
                    </VAvatar>
                    <span class="text-base text-high-emphasis">{{ item.fullName || item.username || '-' }}</span>
                  </div>
                </template>
                <template #item.role="{ item }">
                  <span class="text-body-1">{{ item.role || item.position || '-' }}</span>
                </template>
                <template #item.active="{ item }">
                  <VChip variant="tonal" :color="item.active !== false ? 'success' : 'warning'" size="small" label class="text-capitalize">
                    {{ item.active !== false ? 'Active' : 'Inactive' }}
                  </VChip>
                </template>
              </VDataTable>
              <VCardText v-if="!members.length" class="text-center text-medium-emphasis py-6">
                No team members found.
              </VCardText>
            </VCard>
          </div>

          <!-- Activity Tab -->
          <div v-show="activeTab === 'activity'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Activity Timeline</VCardTitle></VCardItem>
              <VDivider />
              <VCardText class="text-center text-medium-emphasis py-8">
                <VIcon icon="bx-time" size="48" class="mb-3" />
                <p class="text-h6">Coming Soon</p>
                <p class="text-body-2">Activity tracking will be available in a future update.</p>
              </VCardText>
            </VCard>
          </div>
        </VCol>
      </VRow>
    </template>

    <VSnackbar v-model="snackbar" color="error" :timeout="3000">
      {{ snackbarMsg }}
    </VSnackbar>
  </div>
</template>
