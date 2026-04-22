<script setup lang="ts">
const dashboardStore = useDashboardStore()

onMounted(async () => {
  try {
    await Promise.all([dashboardStore.fetchRecentActivities(), dashboardStore.fetchStats()])
  } catch {
    // Empty state if API unavailable
  }
})

const stats = computed(() => dashboardStore.stats || {
  totalUsers: 0,
  activeUsers: 0,
  totalProjects: 0,
  totalDepartments: 0,
})

const activities = computed(() => dashboardStore.recentActivities || [])
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12" md="6">
        <VCard variant="tonal" color="primary">
          <VCardText class="d-flex align-center">
            <VAvatar variant="tonal" color="primary" rounded size="48" class="me-4"><VIcon icon="bx-user" size="28" /></VAvatar>
            <div>
              <h4 class="text-h4">{{ stats.totalUsers }}</h4>
              <span class="text-body-2">Total Users</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard variant="tonal" color="info">
          <VCardText class="d-flex align-center">
            <VAvatar variant="tonal" color="info" rounded size="48" class="me-4"><VIcon icon="bx-check-circle" size="28" /></VAvatar>
            <div>
              <h4 class="text-h4">{{ stats.activeUsers }}</h4>
              <span class="text-body-2">Active Users</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard variant="tonal" color="success">
          <VCardText class="d-flex align-center">
            <VAvatar variant="tonal" color="success" rounded size="48" class="me-4"><VIcon icon="bx-briefcase" size="28" /></VAvatar>
            <div>
              <h4 class="text-h4">{{ stats.totalProjects }}</h4>
              <span class="text-body-2">Total Projects</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard variant="tonal" color="warning">
          <VCardText class="d-flex align-center">
            <VAvatar variant="tonal" color="warning" rounded size="48" class="me-4"><VIcon icon="bx-buildings" size="28" /></VAvatar>
            <div>
              <h4 class="text-h4">{{ stats.totalDepartments }}</h4>
              <span class="text-body-2">Departments</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-6">
      <VCol cols="12">
        <VCard :loading="dashboardStore.loading">
          <VCardItem><VCardTitle>Recent Activities</VCardTitle></VCardItem>
          <VDivider />
          <VTimeline v-if="activities.length" side="end" align="start" truncate-line="both" density="compact" class="pa-4">
            <VTimelineItem v-for="(item, index) in activities" :key="index" dot-color="primary" size="x-small">
              <div>
                <h6 class="text-h6 mb-1">{{ item.action || item.description || 'Activity' }}</h6>
                <span class="text-body-2 text-medium-emphasis">{{ item.username || '' }} · {{ item.createdAt || '' }}</span>
              </div>
            </VTimelineItem>
          </VTimeline>
          <VCardText v-else-if="!dashboardStore.loading" class="text-center py-8 text-medium-emphasis">
            No recent activities
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
