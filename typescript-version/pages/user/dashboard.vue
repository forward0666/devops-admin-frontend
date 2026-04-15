<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12" md="6" sm="6">
        <VCard>
          <VCardText class="d-flex align-center gap-x-4">
            <VAvatar color="primary" variant="tonal" rounded size="48">
              <VIcon icon="bx-check-circle" size="28" />
            </VAvatar>
            <div>
              <h5 class="text-h5 mb-1">Welcome, {{ authStore.userName }}!</h5>
              <p class="text-body-2 text-medium-emphasis mb-0">Here's your personal dashboard</p>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="3" sm="6">
        <VCard>
          <VCardText class="d-flex align-center gap-x-4">
            <VAvatar color="info" variant="tonal" rounded size="48">
              <VIcon icon="bx-folder" size="28" />
            </VAvatar>
            <div>
              <h5 class="text-h5 mb-1">5</h5>
              <span class="text-body-2 text-medium-emphasis">My Projects</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="3" sm="6">
        <VCard>
          <VCardText class="d-flex align-center gap-x-4">
            <VAvatar color="success" variant="tonal" rounded size="48">
              <VIcon icon="bx-task" size="28" />
            </VAvatar>
            <div>
              <h5 class="text-h5 mb-1">23</h5>
              <span class="text-body-2 text-medium-emphasis">Tasks</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-6">
      <VCol cols="12">
        <VCard>
          <VCardItem><VCardTitle>Recent Activity</VCardTitle></VCardItem>
          <VDivider />
          <VCardText>
            <VTimeline side="end" align="start" truncate-line="both" density="compact">
              <VTimelineItem dot-color="primary" size="x-small">
                <div class="d-flex align-start justify-space-between flex-wrap gap-x-4">
                  <div>
                    <h6 class="text-h6 mb-1">Updated profile settings</h6>
                    <span class="text-body-2 text-medium-emphasis">2 hours ago</span>
                  </div>
                  <VIcon icon="bx-user" size="20" class="text-medium-emphasis" />
                </div>
              </VTimelineItem>
              <VTimelineItem dot-color="success" size="x-small">
                <div class="d-flex align-start justify-space-between flex-wrap gap-x-4">
                  <div>
                    <h6 class="text-h6 mb-1">Completed task "Update API docs"</h6>
                    <span class="text-body-2 text-medium-emphasis">Yesterday</span>
                  </div>
                  <VIcon icon="bx-check-circle" size="20" class="text-medium-emphasis" />
                </div>
              </VTimelineItem>
              <VTimelineItem dot-color="info" size="x-small">
                <div class="d-flex align-start justify-space-between flex-wrap gap-x-4">
                  <div>
                    <h6 class="text-h6 mb-1">Joined project "Dashboard Design"</h6>
                    <span class="text-body-2 text-medium-emphasis">3 days ago</span>
                  </div>
                  <VIcon icon="bx-folder-plus" size="20" class="text-medium-emphasis" />
                </div>
              </VTimelineItem>
            </VTimeline>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
