<script setup lang="ts">
const features = [
  { icon: 'bx-shield-quarter', title: 'Role-Based Access Control', desc: 'Fine-grained permission system with Admin and User consoles. Sys admins, admins, and DevOps engineers have dedicated management views.', color: 'primary' },
  { icon: 'bx-briefcase', title: 'Project Management', desc: 'Create and manage projects with team members, track progress, and organize assets. Each project has its own Info, Member, and Asset modules.', color: 'info' },
  { icon: 'bx-group', title: 'Team Collaboration', desc: 'Invite members to projects, assign roles like Project Lead or Developer. Real-time team overview and member management.', color: 'success' },
  { icon: 'bx-bar-chart-alt-2', title: 'System Monitoring', desc: 'Login logs, operation logs, and online user tracking. Full audit trail of all system activities.', color: 'warning' },
  { icon: 'bx-buildings', title: 'Organization Structure', desc: 'Department management with hierarchical teams. Users are organized by department and position for clear accountability.', color: 'secondary' },
  { icon: 'bx-lock-alt', title: 'Security', desc: 'JWT authentication with Redis token caching. IP access control, password policies, and login security configuration.', color: 'error' },
]

const techStack = [
  { name: 'Vue 3', icon: 'bx-code-alt' },
  { name: 'Nuxt 3', icon: 'bx-globe' },
  { name: 'Vuetify 3', icon: 'bx-palette' },
  { name: 'TypeScript', icon: 'bx-file' },
  { name: 'Spring Boot', icon: 'bx-leaf' },
  { name: 'MySQL', icon: 'bx-data' },
  { name: 'Redis', icon: 'bx-server' },
  { name: 'Kafka', icon: 'bx-message-square-dots' },
]
</script>

<template>
  <div class="dashboard-page">
    <!-- Hero Section -->
    <VCard class="mb-8 overflow-hidden" variant="tonal" color="primary">
      <VCardText class="pa-8 pa-md-12 text-center">
        <VAvatar size="80" variant="tonal" color="primary" rounded class="mb-6">
          <VIcon icon="bx-shield-quarter" size="48" />
        </VAvatar>
        <h1 class="text-h3 text-md-h2 font-weight-bold mb-3">DevOps Admin</h1>
        <p class="text-body-1 text-medium-emphasis mx-auto" style="max-width: 600px;">
          A unified platform for DevOps team management — project tracking, team collaboration, system monitoring, and access control in one place.
        </p>
        <div class="d-flex justify-center ga-3 mt-6">
          <VChip variant="flat" color="primary" size="small" label>v1.0</VChip>
          <VChip variant="outlined" color="primary" size="small" label>Built with ❤️</VChip>
        </div>
      </VCardText>
    </VCard>

    <!-- Features -->
    <VRow>
      <VCol v-for="feature in features" :key="feature.title" cols="12" md="6" lg="4">
        <VCard hover class="h-100">
          <VCardText class="pa-6">
            <VAvatar variant="tonal" :color="feature.color" rounded size="52" class="mb-4">
              <VIcon :icon="feature.icon" size="28" />
            </VAvatar>
            <h5 class="text-h5 mb-2">{{ feature.title }}</h5>
            <p class="text-body-2 text-medium-emphasis">{{ feature.desc }}</p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tech Stack -->
    <VCard class="mt-8">
      <VCardItem>
        <VCardTitle>Tech Stack</VCardTitle>
      </VCardItem>
      <VDivider />
      <VCardText class="d-flex flex-wrap ga-4 pa-6">
        <VChip v-for="tech in techStack" :key="tech.name" variant="tonal" color="primary" size="large" label>
          <VIcon :icon="tech.icon" start size="18" />
          {{ tech.name }}
        </VChip>
      </VCardText>
    </VCard>

    <!-- Footer -->
    <VCard class="mt-8" variant="tonal" color="secondary">
      <VCardText class="text-center py-6">
        <p class="text-body-2 text-medium-emphasis">
          © 2025 DevOps Admin · Powered by <span class="font-weight-bold">JH DevOps</span>
        </p>
      </VCardText>
    </VCard>
  </div>
</template>
