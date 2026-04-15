<script lang="ts" setup>
import VerticalNavSectionTitle from "@/@layouts/components/VerticalNavSectionTitle.vue";
import VerticalNavGroup from "@layouts/components/VerticalNavGroup.vue";
import VerticalNavLink from "@layouts/components/VerticalNavLink.vue";

const authStore = useAuthStore()
const projectStore = useProjectStore()
const projectList = computed(() => [...projectStore.projects])
const projectKey = ref(0)
const route = useRoute()

watch(() => projectStore.projects.length, () => {
  projectKey.value++
})

const isProjectActive = (projectId: number) => route.path.includes(`/user/project/${projectId}/`)
</script>

<template>
  <template v-if="authStore.isReady">
  <!-- 👉 Admin Navigation -->
  <template v-if="!authStore.isUser">
    <!-- 👉 Dashboard -->
    <VerticalNavLink
      :item="{
        title: 'Dashboard',
        icon: 'bx-home-smile',
        to: '/dashboard',
      }"
    />

    <!-- 👉 System Management -->
    <VerticalNavSectionTitle
      :item="{ heading: 'System Management' }"
    />

    <VerticalNavGroup
      :item="{
        title: 'User & Permission',
        icon: 'bx-user',
      }"
    >
      <VerticalNavLink :item="{ title: 'User List', to: '/system/user/list' }" />
      <VerticalNavLink :item="{ title: 'User View', to: '/system/user/view' }" />
      <VerticalNavLink :item="{ title: 'Permission', to: '/system/permission' }" />
    </VerticalNavGroup>

    <VerticalNavLink
      :item="{
        title: 'Menu',
        icon: 'bx-menu',
        to: '/system/menu',
      }"
    />

    <VerticalNavLink
      :item="{
        title: 'Department',
        icon: 'bx-buildings',
        to: '/system/dept',
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
        to: '/monitor/online',
      }"
    />

    <VerticalNavLink
      :item="{
        title: 'Operation Log',
        icon: 'bx-list-ul',
        to: '/monitor/log',
      }"
    />

    <VerticalNavLink
      :item="{
        title: 'Login Log',
        icon: 'bx-log-in',
        to: '/monitor/login-log',
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
        to: '/tools/api',
      }"
    />

    <VerticalNavLink
      :item="{
        title: 'System Config',
        icon: 'bx-cog',
        to: '/tools/config',
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
          title: 'Menu & Permission',
          icon: 'bx-list-check',
        }"
      >
        <VerticalNavLink :item="{ title: 'Project List', to: '/user/project/list' }" />
        <VerticalNavLink :item="{ title: 'Permission', to: '/user/project/permission' }" />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Project',
          icon: 'bx-folder',
        }"
      >
      <template v-for="project in projectList" :key="`project-nav-${project.id}-${projectKey}`">
        <VerticalNavGroup :item="{ title: project.name, icon: 'bx-detail' }" :open="isProjectActive(project.id)">
          <VerticalNavLink :item="{ title: 'Project Info', to: `/user/project/${project.id}/info` }" />
          <VerticalNavLink :item="{ title: 'Project Assets', to: `/user/project/${project.id}/assets` }" />
        </VerticalNavGroup>
      </template>
      </VerticalNavGroup>
    </template>
  </template>
</template>
