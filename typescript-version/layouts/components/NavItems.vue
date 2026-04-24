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
  watch(() => projectStore.value?.projects.length, () => {
    projectKey.value++
  })
}

const isProjectActive = (projectId: number) => {
  if (!import.meta.client) return false
  const route = useRoute()
  return route.path.includes(`/user/project/${projectId}/`)
}</script>

<template>
  <template v-if="authStore.isReady">
  <!-- 👉 Admin Navigation -->
  <template v-if="authStore.isReady && authStore.isConsoleAdmin && authStore.isAdmin">
    <!-- 👉 Dashboard -->
    <VerticalNavLink
      :item="{
        title: 'Dashboard',
        icon: 'bx-home-smile',
        to: '/admin/dashboard',
      }"
    />

    <!-- 👉 System Management -->
    <VerticalNavSectionTitle
      :item="{ heading: 'System Management' }"
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



    <!-- 👉 System Monitor -->
    <VerticalNavSectionTitle
      :item="{ heading: 'System Monitor' }"
    />

    <VerticalNavLink
      :item="{
        title: 'Online Users',
        icon: 'bx-user-circle',
        to: '/admin/monitor/online',
      }"
    />

    <VerticalNavLink
      :item="{
        title: 'Operation Log',
        icon: 'bx-list-ul',
        to: '/admin/monitor/log',
      }"
    />

    <VerticalNavLink
      :item="{
        title: 'Login Log',
        icon: 'bx-log-in',
        to: '/admin/monitor/login-log',
      }"
    />

    <!-- 👉 System Tools -->
    <VerticalNavLink
      :item="{
        title: 'System Config',
        icon: 'bx-cog',
        to: '/admin/tools/config',
      }"
    />
  </template>

  <!-- 👉 User Navigation -->
  <template v-else>
    <VerticalNavLink
      :item="{
        title: 'Dashboard',
        icon: 'bx-home-smile',
        to: '/user/dashboard',
      }"
    />

    <VerticalNavLink
      :item="{
        title: 'My Profile',
        icon: 'bx-user',
        to: '/user/profile',
      }"
    />

      <VerticalNavGroup
        :item="{
          title: 'Project',
          icon: 'bx-folder',
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
</template>
