<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectNames: Record<string, string> = {
  '1': 'Dashboard Design',
  '2': 'BGC eCommerce App',
  '3': 'Falcon Logo Design',
  '4': 'Foodista Mobile App',
}

const projectData: Record<string, any> = {
  '1': { type: 'Vuejs Project', status: 'active', progress: 62, leader: 'Keith', startDate: '2024-01-01', endDate: '2024-06-30' },
  '2': { type: 'React Project', status: 'active', progress: 78, leader: 'Eileen', startDate: '2024-01-15', endDate: '2024-08-30' },
  '3': { type: 'Figma Project', status: 'completed', progress: 100, leader: 'Owen', startDate: '2023-10-01', endDate: '2024-01-10' },
  '4': { type: 'Xamarin Project', status: 'pending', progress: 8, leader: 'Merline', startDate: '2024-02-01', endDate: '2024-12-31' },
}

const project = computed(() => projectData[projectId.value] || projectData['1'])
const name = computed(() => projectNames[projectId.value] || 'Unknown Project')

const teamMembers = ref([
  { name: 'Keith', role: 'Lead', initials: 'K' },
  { name: 'Mary', role: 'Designer', initials: 'M' },
  { name: 'Tom', role: 'Developer', initials: 'T' },
  { name: 'Jerry', role: 'Developer', initials: 'J' },
])

const activityTimeline = ref([
  { text: 'Updated project progress to 62%', time: '2 hours ago', icon: 'bx-check-circle', color: 'success' },
  { text: 'Added new design assets', time: 'Yesterday', icon: 'bx-folder-plus', color: 'primary' },
  { text: 'Code review completed', time: '2 days ago', icon: 'bx-git-pull-request', color: 'info' },
  { text: 'Sprint planning meeting', time: '3 days ago', icon: 'bx-calendar', color: 'warning' },
])
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">{{ name }} - Project Info</h4></VCol>
    </VRow>

    <!-- Overview Card -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6" md="3">
            <div class="text-body-2 text-medium-emphasis mb-1">Status</div>
            <VChip variant="tonal" :color="project.status === 'active' ? 'success' : project.status === 'completed' ? 'info' : 'warning'" size="small" label class="text-capitalize">
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
          <VCol cols="12" sm="6" md="3">
            <div class="text-body-2 text-medium-emphasis mb-1">Leader</div>
            <div class="text-body-1 font-weight-medium">{{ project.leader }}</div>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <div class="text-body-2 text-medium-emphasis mb-1">Type</div>
            <div class="text-body-1">{{ project.type }}</div>
          </VCol>
        </VRow>
        <VDivider class="my-4" />
        <VRow>
          <VCol cols="12" sm="6">
            <div class="text-body-2 text-medium-emphasis mb-1">Start Date</div>
            <div class="text-body-1">{{ project.startDate }}</div>
          </VCol>
          <VCol cols="12" sm="6">
            <div class="text-body-2 text-medium-emphasis mb-1">End Date</div>
            <div class="text-body-1">{{ project.endDate }}</div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VRow>
      <!-- Team -->
      <VCol cols="12" md="5">
        <VCard>
          <VCardItem><VCardTitle>Team Members</VCardTitle></VCardItem>
          <VDivider />
          <VList>
            <VListItem v-for="member in teamMembers" :key="member.name">
              <template #prepend>
                <VAvatar variant="tonal" color="primary" size="36" class="me-3">
                  <span class="text-sm font-weight-medium">{{ member.initials }}</span>
                </VAvatar>
              </template>
              <VListItemTitle>{{ member.name }}</VListItemTitle>
              <VListItemSubtitle>{{ member.role }}</VListItemSubtitle>
            </VListItem>
          </VList>
        </VCard>
      </VCol>

      <!-- Activity -->
      <VCol cols="12" md="7">
        <VCard>
          <VCardItem><VCardTitle>Recent Activity</VCardTitle></VCardItem>
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
      </VCol>
    </VRow>
  </div>
</template>
