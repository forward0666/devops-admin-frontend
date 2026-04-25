<script lang="ts" setup>
import VerticalNavSectionTitle from "@/@layouts/components/VerticalNavSectionTitle.vue";
import VerticalNavGroup from "@layouts/components/VerticalNavGroup.vue";
import VerticalNavLink from "@layouts/components/VerticalNavLink.vue";

const authStore = useAuthStore()
const projectStore = ref<any>(null)
const projectList = computed(() => projectStore.value?.projects || [])
const projectKey = ref(0)

if (import.meta.client) {
  projectStore.value = useProjectStore()
  if (!projectStore.value.projects?.length) {
    projectStore.value.fetchProjects()
  }
  watch(() => projectStore.value?.projects.length, () => {
    projectKey.value++
  })
}

function switchConsole(role: 'admin' | 'user') {
  const authStore = useAuthStore()
  authStore.setConsoleRole(role)
  navigateTo(role === 'admin' ? '/admin/dashboard' : '/user/dashboard')
}

const isProjectActive = (projectId: number) => {
  if (!import.meta.client) return false
  const route = useRoute()
  return route.path.includes(`/user/project/${projectId}/`)
}
</script>

<template>
  <template v-if="authStore.isReady">

    <!-- 👉 Console Switch (admin/devops/sys_admin only) -->
    <ClientOnly>
    <VMenu v-if="authStore.isAdmin" location="end top" open-on-hover offset="4">
      <template #activator="{ props }">
        <li class="nav-link">
          <a v-bind="props">
            <VIcon icon="bx-desktop" class="nav-item-icon" />
            <span class="nav-item-title">Console</span>
            <svg class="nav-group-arrow" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 8h12M11 4l4 4-4 4M14 8H2M5 4L1 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            </svg>
          </a>
        </li>
      </template>
      <VList min-width="180" density="comfortable">
        <VListItem prepend-icon="bx-shield" title="Admin" @click="switchConsole('admin')" />
        <VListItem prepend-icon="bx-user" title="User" @click="switchConsole('user')" />
      </VList>
    </VMenu>
    </ClientOnly>

    <template v-if="authStore.isConsoleAdmin">

      <VerticalNavLink
        :item="{
          title: 'Dashboard',
          icon: 'bx-home',
          to: '/admin/dashboard',
        }"
      />

      <VerticalNavGroup
        :item="{
          title: 'User',
          icon: 'bx-user',
        }"
      >
        <VerticalNavLink :item="{ title: 'List', to: '/admin/system/user/list' }" />
        <VerticalNavLink :item="{ title: 'View', to: '/admin/system/user/view' }" />
      </VerticalNavGroup>

      <VerticalNavGroup :item="{ title: 'Department', icon: 'bx-buildings' }">
        <VerticalNavLink :item="{ title: 'List', to: '/admin/system/dept/list' }" />
        <VerticalNavLink :item="{ title: 'View', to: '/admin/system/dept/view' }" />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Project',
          icon: 'bx-folder',
        }"
      >
        <VerticalNavLink :item="{ title: 'List', to: '/admin/project/list' }" />
        <VerticalNavLink :item="{ title: 'View', to: '/admin/project/view' }" />
      </VerticalNavGroup>

      <VerticalNavLink
        :item="{
          title: 'Login Log',
          icon: 'bx-log-in',
          to: '/admin/monitor/login-log',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Operation Log',
          icon: 'bx-list-ul',
          to: '/admin/monitor/log',
        }"
      />

      <!-- 👉 Online -->
      <VerticalNavLink
        :item="{
          title: 'Online Users',
          icon: 'bx-wifi',
          to: '/admin/monitor/online',
        }"
      />

    </template>

    <template v-else>
      <!-- User Console Nav -->
      <VerticalNavLink
        :item="{
          title: 'Dashboard',
          icon: 'bx-home',
          to: '/user/dashboard',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Profile',
          icon: 'bx-user',
          to: '/user/profile',
        }"
      />

      <VerticalNavGroup
        :item="{
          title: 'Project',
          icon: 'bx-detail',
        }"
      >
        <template v-for="project in projectList" :key="`project-nav-${project.id}-${projectKey}`">
          <VerticalNavGroup :item="{ title: project.name, icon: 'bx-detail' }" :open="isProjectActive(project.id)">
            <VerticalNavLink :item="{ title: 'Info', to: `/user/project/${project.id}/info` }" />
            <VerticalNavLink :item="{ title: 'Member', to: `/user/project/${project.id}/members` }" />
            <VerticalNavGroup :item="{ title: 'Asset', icon: 'bx-globe' }">
              <VerticalNavLink :item="{ title: 'Domain', to: `/user/project/${project.id}/assets` }" />
              <VerticalNavLink :item="{ title: 'Middleware', to: `/user/project/${project.id}/middleware` }" />
            </VerticalNavGroup>
          </VerticalNavGroup>
        </template>
      </VerticalNavGroup>

    </template>
  </template>

  <template v-else>
    <VerticalNavLink
      :item="{
        title: 'Login',
        icon: 'bx-log-in',
        to: '/login',
      }"
    />
  </template>
</template>
