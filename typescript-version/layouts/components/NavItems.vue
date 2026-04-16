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
  <template v-if="!authStore.isUser">
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

    <VerticalNavGroup
      :item="{
        title: 'Project',
        icon: 'bx-folder',
      }"
    >
      <VerticalNavLink :item="{ title: 'List', to: '/user/project/list' }" />
      <VerticalNavLink :item="{ title: 'View', to: '/user/project/view' }" />
      <VerticalNavLink :item="{ title: 'Permission', to: '/user/project/permission' }" />
    </VerticalNavGroup>

    <VerticalNavLink
      :item="{
        title: 'Menu',
        icon: 'bx-menu',
        to: '/admin/system/menu',
      }"
    />

    <VerticalNavLink
      :item="{
        title: 'Department',
        icon: 'bx-buildings',
        to: '/admin/system/dept',
      }"
    />

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
    <VerticalNavSectionTitle
      :item="{ heading: 'System Tools' }"
    />

    <VerticalNavLink
      :item="{
        title: 'System API',
        icon: 'bx-code-block',
        to: '/admin/tools/api',
      }"
    />

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
          <VerticalNavLink :item="{ title: 'Asset', to: `/user/project/${project.id}/assets` }" />
        </VerticalNavGroup>
      </template>
      </VerticalNavGroup>
    </template>
  </template>
</template>
