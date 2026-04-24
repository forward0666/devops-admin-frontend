<script setup lang="ts">
import { projectService, projectMemberService, userService } from '~/services/api'

const activeTab = ref('overview')
const isConfirmDeleteDialogVisible = ref(false)
const route = useRoute()

const projectId = computed(() => Number(route.query.id))
const projectStore = useProjectStore()
const loading = ref(false)
const project = ref<any>(null)

// Team members
const members = ref<any[]>([])
const membersLoading = ref(false)
const allUsers = ref<any[]>([])
const isAddMemberDialog = ref(false)
const newMember = ref({ userId: null as number | null })
const memberHeaders = [
  { title: 'Member', key: 'member', sortable: false },
  { title: 'Project Role', key: 'role' },
  { title: 'System Role', key: 'systemRole' },
  { title: 'Position', key: 'position' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const getSystemRole = (userId: number) => {
  const user = allUsers.value.find(u => u.id === userId)
  return user?.role || '-'
}

async function fetchMembers() {
  if (!projectId.value) return
  membersLoading.value = true
  try {
    const res: any = await projectMemberService.list(projectId.value)
    console.log('Members response:', res)
    members.value = Array.isArray(res) ? res : res?.data || []
    console.log('Members loaded:', members.value.length)
  } catch (e) {
    console.error('Failed to fetch members:', e)
  } finally {
    membersLoading.value = false
  }
}

async function fetchUsers() {
  try {
    const res: any = await userService.list()
    allUsers.value = Array.isArray(res) ? res : res?.data || []
  } catch (e) {
    console.error('Failed to fetch users:', e)
  }
}

const availableUsers = computed(() => {
  const memberUserIds = new Set(members.value.map((m: any) => Number(m.userId)))
  return allUsers.value.filter(u => !memberUserIds.has(Number(u.id)))
})

async function addMember() {
  if (!newMember.value.userId || !projectId.value) return
  try {
    const user = allUsers.value.find(u => u.id === newMember.value.userId)
    await projectMemberService.create({
      projectId: projectId.value,
      userId: newMember.value.userId,
      username: user?.username,
      fullName: user?.fullName,
      role: 'Developer',
      position: user?.position,
    })
    isAddMemberDialog.value = false
    newMember.value = { userId: null }
    await fetchMembers()
  } catch (e: any) {
    console.error('Failed to add member:', e)
    alert(e.message || '添加成员失败，该成员可能已存在')
  }
}

async function removeMember(id: number) {
  try {
    await projectMemberService.delete(id)
    await fetchMembers()
  } catch (e) {
    console.error('Failed to remove member:', e)
  }
}

const resolveMemberStatusVariant = (status: string) => {
  const map: Record<string, string> = { active: 'success', away: 'warning', inactive: 'secondary' }
  return map[status] || 'secondary'
}



async function fetchProject() {
  if (!projectId.value) return
  loading.value = true
  try {
    const res: any = await projectService.getById(projectId.value)
    project.value = Array.isArray(res) ? res[0] : res?.data || res
  } catch (e) {
    console.error('Failed to fetch project:', e)
  } finally {
    loading.value = false
  }
}

// 优先从 store 取，store 没有则从 API 获取
const dbProject = computed(() => projectStore.projects?.find((p: any) => p.id === projectId.value))
const currentProject = computed(() => project.value || dbProject.value || null)

const projectData = computed(() => ({
  name: currentProject.value?.name || 'Unknown Project',
  status: currentProject.value?.status || 'active',
  progress: currentProject.value?.progress || 0,
  leader: currentProject.value?.leader || '-',
  created: currentProject.value?.createdAt || '-',
  department: currentProject.value?.departmentId || '-',
  description: currentProject.value?.description || 'No description.',
  techStack: currentProject.value?.techStack || '',
  objectives: currentProject.value?.objectives || '',
}))

const resolveStatusVariant = (status: string) => {
  const map: Record<string, string> = { active: 'success', completed: 'info', pending: 'warning', archived: 'secondary' }
  return map[status] || 'secondary'
}

const itemsPerPage = ref(5)

onMounted(() => {
  if (!dbProject.value)
    fetchProject()
  fetchMembers()
  fetchUsers()
})

watch(projectId, (newId) => {
  project.value = null
  if (!projectStore.projects?.find((p: any) => p.id === newId))
    fetchProject()
})
</script>

<template>
  <div>
    <VRow v-if="loading">
      <VCol cols="12" class="text-center py-16">
        <VProgressCircular indeterminate color="primary" size="48" />
        <p class="text-body-1 mt-4">Loading project...</p>
      </VCol>
    </VRow>

    <VRow v-else-if="!currentProject">
      <VCol cols="12" class="text-center py-16">
        <VIcon icon="bx-error-circle" size="64" color="warning" />
        <h5 class="text-h5 mt-4">Project Not Found</h5>
        <VBtn variant="tonal" class="mt-4" to="/admin/project/list">Back to Projects</VBtn>
      </VCol>
    </VRow>

    <template v-else>
      <VRow>
        <!-- Left Column -->
        <VCol cols="12" md="5" lg="4">
          <VRow>
            <VCol cols="12">
              <VCard>
                <VCardText class="text-center pt-12">
                  <VAvatar size="120" variant="tonal" color="primary" rounded>
                    <VIcon icon="bx-detail" size="56" />
                  </VAvatar>
                  <h5 class="text-h5 mt-4">{{ projectData.name }}</h5>
                  <VChip variant="tonal" :color="resolveStatusVariant(projectData.status)" size="small" label class="text-capitalize mt-4">{{ projectData.status }}</VChip>
                </VCardText>
                <VCardText>
                  <div class="d-flex justify-space-around gap-x-6 gap-y-2 flex-wrap mb-6">
                    <div class="d-flex align-center me-8">
                      <VAvatar variant="tonal" color="primary" rounded size="40" class="me-4"><VIcon icon="bx-check" size="24" /></VAvatar>
                      <div>
                        <h5 class="text-h5">{{ projectData.progress }}%</h5>
                        <span class="text-body-1 d-inline-block">Progress</span>
                      </div>
                    </div>
                  </div>
                  <h5 class="text-h5">Details</h5>
                  <VDivider class="my-4" />
                  <VList class="card-list mt-2" density="compact" lines="one">
                    <VListItem><VListItemTitle><h6 class="text-h6">Leader: <span class="text-body-1 d-inline-block">{{ projectData.leader }}</span></h6></VListItemTitle></VListItem>
                    <VListItem><VListItemTitle><h6 class="text-h6">Department ID: <span class="text-body-1 d-inline-block">{{ projectData.department }}</span></h6></VListItemTitle></VListItem>
                    <VListItem><VListItemTitle><h6 class="text-h6">Created: <span class="text-body-1 d-inline-block">{{ projectData.created }}</span></h6></VListItemTitle></VListItem>
                    <VListItem><VListItemTitle><h6 class="text-h6">Progress: <span class="text-body-1 d-inline-block">{{ projectData.progress }}%</span></h6></VListItemTitle></VListItem>
                  </VList>
                  <VProgressLinear :model-value="projectData.progress" color="primary" rounded height="6" class="mt-4" />
                  <p class="text-body-2 text-medium-emphasis mt-3">{{ projectData.description }}</p>
                </VCardText>
                <VCardText class="d-flex justify-center gap-x-4">
                  <VBtn variant="elevated" color="primary" :to="`/admin/project/list`">Back</VBtn>
                  <VBtn variant="tonal" color="error" @click="isConfirmDeleteDialogVisible = !isConfirmDeleteDialogVisible">Archive</VBtn>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
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
                <p class="text-body-1 mb-4">{{ projectData.description }}</p>
                <VRow>
                  <VCol cols="6">
                    <div class="d-flex align-center gap-x-3 mb-3">
                      <VAvatar variant="tonal" color="primary" rounded size="36"><VIcon icon="bx-code-block" size="20" /></VAvatar>
                      <div>
                        <h6 class="text-h6" v-if="projectData.techStack">{{ projectData.techStack }}</h6>
                        <h6 class="text-h6 text-medium-emphasis" v-else>-</h6>
                        <span class="text-body-2 text-medium-emphasis">Tech Stack</span>
                      </div>
                    </div>
                  </VCol>
                  <VCol cols="6">
                    <div class="d-flex align-center gap-x-3 mb-3">
                      <VAvatar variant="tonal" color="success" rounded size="36"><VIcon icon="bx-check-circle" size="20" /></VAvatar>
                      <div><h6 class="text-h6 text-capitalize">{{ projectData.status }}</h6><span class="text-body-2 text-medium-emphasis">Status</span></div>
                    </div>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
            <VCard class="mt-6" v-if="projectData.objectives">
              <VCardItem><VCardTitle>Objectives</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <p class="text-body-1">{{ projectData.objectives }}</p>
              </VCardText>
            </VCard>
            <VCard class="mt-6">
              <VCardItem><VCardTitle>Progress</VCardTitle></VCardItem>
              <VDivider />
              <VCardText>
                <div class="d-flex align-center gap-4 mb-4">
                  <div class="text-h4 font-weight-bold">{{ projectData.progress }}%</div>
                  <div class="flex-grow-1"><VProgressLinear :model-value="projectData.progress" color="primary" rounded height="8" /></div>
                </div>
              </VCardText>
            </VCard>
          </div>

          <!-- Team Tab -->
          <div v-show="activeTab === 'team'" class="mt-6">
            <VCard>
              <VCardItem class="d-flex justify-space-between">
                <VCardTitle>Team Members</VCardTitle>
                <VBtn color="primary" size="small" prepend-icon="bx-plus" @click="isAddMemberDialog = true">Add Member</VBtn>
              </VCardItem>
              <VDivider />
              <VDataTable
                :headers="memberHeaders"
                :items="members"
                :loading="membersLoading"
                items-per-page="10"
                class="text-no-wrap"
              >
                <template #item.member="{ item }">
                  <div class="d-flex align-center gap-x-3">
                    <VAvatar size="34" variant="tonal" color="primary" class="text-white">
                      {{ item.fullName?.charAt(0) || 'U' }}
                    </VAvatar>
                    <div>
                      <div class="text-body-1 font-weight-medium">{{ item.fullName || item.username || '-' }}</div>
                      <div class="text-caption text-medium-emphasis">@{{ item.username || '-' }}</div>
                    </div>
                  </div>
                </template>
                <template #item.systemRole="{ item }">
                  <VChip variant="tonal" color="secondary" size="small" label class="text-capitalize">{{ getSystemRole(item.userId) }}</VChip>
                </template>
                <template #item.status="{ item }">
                  <VChip variant="tonal" :color="resolveMemberStatusVariant(item.status)" size="small" label class="text-capitalize">{{ item.status }}</VChip>
                </template>
                <template #item.actions="{ item }">
                  <VBtn icon="bx-trash" size="small" variant="text" color="error" @click="removeMember(item.id)" />
                </template>
              </VDataTable>
            </VCard>

            <!-- Add Member Dialog -->
            <VDialog v-model="isAddMemberDialog" max-width="480">
              <VCard>
                <VCardItem><VCardTitle>Add Team Member</VCardTitle></VCardItem>
                <VDivider />
                <VCardText class="pt-4">
                  <VSelect
                    v-model="newMember.userId"
                    :items="availableUsers.map(u => ({ title: `${u.fullName || u.username} (@${u.username})`, value: u.id }))"
                    label="Select User"
                    variant="outlined"
                    density="compact"
                    class="mb-4"
                  />
                </VCardText>
                <VCardActions class="justify-end">
                  <VBtn variant="text" @click="isAddMemberDialog = false">Cancel</VBtn>
                  <VBtn color="primary" variant="elevated" :disabled="!newMember.userId" @click="addMember">Add</VBtn>
                </VCardActions>
              </VCard>
            </VDialog>
          </div>

          <!-- Activity Tab -->
          <div v-show="activeTab === 'activity'" class="mt-6">
            <VCard>
              <VCardItem><VCardTitle>Activity Timeline</VCardTitle></VCardItem>
              <VDivider />
              <VCardText class="text-center py-8">
                <VIcon icon="bx-time" size="48" color="grey" />
                <p class="text-body-1 text-medium-emphasis mt-3">Activity timeline coming soon</p>
              </VCardText>
            </VCard>
          </div>
        </VCol>
      </VRow>
    </template>

    <VDialog v-model="isConfirmDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardItem><VCardTitle>Archive Project</VCardTitle></VCardItem>
        <VDivider />
        <VCardText>Are you sure you want to archive this project?</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isConfirmDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="isConfirmDeleteDialogVisible = false">Yes, Archive</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
