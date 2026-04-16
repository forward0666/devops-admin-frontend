<script setup lang="ts">
const activeTab = ref('overview')
const isConfirmDeleteDialogVisible = ref(false)

const projectData = {
  name: 'Dashboard Design',
  type: 'Vuejs Project',
  status: 'Active',
  progress: 62,
  leader: 'Keith',
  created: '2024-01-01',
  team: 'Frontend Team',
  department: 'Engineering',
  description: 'A comprehensive admin dashboard design system with reusable components and responsive layouts.',
  taskDone: '1.23k',
  totalTask: '2.1k',
}

const teamMembers = ref([
  { name: 'Keith', role: 'Project Lead', status: 'Active', avatar: 'K' },
  { name: 'Eileen', role: 'Senior Developer', status: 'Active', avatar: 'E' },
  { name: 'Owen', role: 'UI Designer', status: 'Active', avatar: 'O' },
  { name: 'Merline', role: 'Developer', status: 'Away', avatar: 'M' },
  { name: 'Harmonia', role: 'QA Engineer', status: 'Active', avatar: 'H' },
])

const activityTimeline = ref([
  { text: 'Created project "Dashboard Design"', time: '2 min ago', icon: 'bx-folder-plus', color: 'primary' },
  { text: 'Added team member Eileen to project', time: '1 hour ago', icon: 'bx-user-plus', color: 'success' },
  { text: 'Completed task "Update API endpoints"', time: '3 hours ago', icon: 'bx-check-circle', color: 'info' },
  { text: 'Commented on "Dashboard Layout"', time: '5 hours ago', icon: 'bx-message-dots', color: 'warning' },
  { text: 'Updated project status to Active', time: 'Yesterday', icon: 'bx-edit', color: 'error' },
  { text: 'Pushed 3 commits to main branch', time: 'Yesterday', icon: 'bx-git-commit', color: 'primary' },
])

const itemsPerPage = ref(5)
</script>

<template>
  <div>
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
                <VChip variant="tonal" :color="projectData.status === 'Active' ? 'success' : 'warning'" size="small" label class="text-capitalize mt-4">{{ projectData.status }}</VChip>
              </VCardText>
              <VCardText>
                <div class="d-flex justify-space-around gap-x-6 gap-y-2 flex-wrap mb-6">
                  <div class="d-flex align-center me-8">
                    <VAvatar variant="tonal" color="primary" rounded size="40" class="me-4"><VIcon icon="bx-check" size="24" /></VAvatar>
                    <div>
                      <h5 class="text-h5">{{ projectData.taskDone }}</h5>
                      <span class="text-body-1 d-inline-block">Task Done</span>
                    </div>
                  </div>
                  <div class="d-flex align-center me-4">
                    <VAvatar variant="tonal" color="primary" rounded size="38" class="me-4"><VIcon icon="bx-list-check" size="24" /></VAvatar>
                    <div>
                      <h5 class="text-h5">{{ projectData.totalTask }}</h5>
                      <span class="text-body-1 d-inline-block">Total Task</span>
                    </div>
                  </div>
                </div>
                <h5 class="text-h5">Details</h5>
                <VDivider class="my-4" />
                <VList class="card-list mt-2" density="compact" lines="one">
                  <VListItem><VListItemTitle><h6 class="text-h6">Type: <span class="text-body-1 d-inline-block">{{ projectData.type }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Leader: <span class="text-body-1 d-inline-block">{{ projectData.leader }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Department: <span class="text-body-1 d-inline-block">{{ projectData.department }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Team: <span class="text-body-1 d-inline-block">{{ projectData.team }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Created: <span class="text-body-1 d-inline-block">{{ projectData.created }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Progress: <span class="text-body-1 d-inline-block">{{ projectData.progress }}%</span></h6></VListItemTitle></VListItem>
                </VList>
                <VProgressLinear :model-value="projectData.progress" color="primary" rounded height="6" class="mt-4" />
                <p class="text-body-2 text-medium-emphasis mt-3">{{ projectData.description }}</p>
              </VCardText>
              <VCardText class="d-flex justify-center gap-x-4">
                <VBtn variant="elevated" color="primary">Edit</VBtn>
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
                    <div><h6 class="text-h6">{{ projectData.type }}</h6><span class="text-body-2 text-medium-emphasis">Project Type</span></div>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="d-flex align-center gap-x-3 mb-3">
                    <VAvatar variant="tonal" color="success" rounded size="36"><VIcon icon="bx-check-circle" size="20" /></VAvatar>
                    <div><h6 class="text-h6">{{ projectData.status }}</h6><span class="text-body-2 text-medium-emphasis">Status</span></div>
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
                <div class="text-h4 font-weight-bold">{{ projectData.progress }}%</div>
                <div class="flex-grow-1"><VProgressLinear :model-value="projectData.progress" color="primary" rounded height="8" /></div>
              </div>
              <div class="d-flex justify-space-between text-body-2 text-medium-emphasis">
                <span>{{ projectData.taskDone }} tasks completed</span>
                <span>{{ projectData.totalTask }} total tasks</span>
              </div>
            </VCardText>
          </VCard>
        </div>

        <!-- Team Tab -->
        <div v-show="activeTab === 'team'" class="mt-6">
          <VCard>
            <VCardItem><VCardTitle>Team Members</VCardTitle></VCardItem>
            <VDivider />
            <VDataTable :items="teamMembers" :items-per-page="itemsPerPage" :headers="[{ title: 'MEMBER', key: 'name' }, { title: 'ROLE', key: 'role' }, { title: 'STATUS', key: 'status' }, { title: 'Action', key: 'action', sortable: false }]" class="text-no-wrap">
              <template #item.name="{ item }">
                <div class="d-flex align-center gap-x-3">
                  <VAvatar size="34" rounded variant="tonal" color="primary"><span class="text-sm font-weight-medium">{{ item.avatar }}</span></VAvatar>
                  <span class="text-base text-high-emphasis">{{ item.name }}</span>
                </div>
              </template>
              <template #item.status="{ item }">
                <VChip variant="tonal" :color="item.status === 'Active' ? 'success' : 'warning'" size="small" label class="text-capitalize">{{ item.status }}</VChip>
              </template>
              <template #item.action><IconBtn><VIcon icon="bx-dots-vertical-rounded" /></IconBtn></template>
            </VDataTable>
          </VCard>
        </div>

        <!-- Activity Tab -->
        <div v-show="activeTab === 'activity'" class="mt-6">
          <VCard>
            <VCardItem><VCardTitle>Activity Timeline</VCardTitle></VCardItem>
            <VDivider />
            <VCardText>
              <VTimeline side="end" align="start" truncate-line="both" density="compact">
                <VTimelineItem v-for="(item, index) in activityTimeline" :key="index" :dot-color="item.color" size="x-small">
                  <div class="d-flex align-start justify-space-between flex-wrap gap-x-4">
                    <div>
                      <h6 class="text-h6 mb-1">{{ item.text }}</h6>
                      <span class="text-body-2 text-medium-emphasis">{{ item.time }}</span>
                    </div>
                    <VIcon :icon="item.icon" size="20" class="text-medium-emphasis" />
                  </div>
                </VTimelineItem>
              </VTimeline>
            </VCardText>
          </VCard>
        </div>
      </VCol>
    </VRow>

    <ConfirmDialog v-model:is-dialog-visible="isConfirmDeleteDialogVisible" title="Archive Project" message="Are you sure you want to archive this project?" confirm-text="Yes, Archive" cancel-text="Cancel" @confirm="isConfirmDeleteDialogVisible = false" @cancel="isConfirmDeleteDialogVisible = false" />
  </div>
</template>
