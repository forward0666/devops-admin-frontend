<script lang="ts" setup>
import VerticalNavSectionTitle from "@/@layouts/components/VerticalNavSectionTitle.vue";
import VerticalNavGroup from "@layouts/components/VerticalNavGroup.vue";
import VerticalNavLink from "@layouts/components/VerticalNavLink.vue";

const authStore = useAuthStore()
const route = useRoute()
const projectStore = useProjectStore()
const projectList = computed(() => projectStore.projects || [])
const projectKey = ref(0)

watch(() => projectStore.projects?.length, () => {
  projectKey.value++
})

const isProjectActive = (projectId: number) => {
  return route.path.includes(`/user/project/${projectId}/`)
}
</script>

<template>
  <template v-if="authStore.isReady">
    <template v-if="authStore.isAdmin">

      <!-- 👉 Pages -->
      <VerticalNavSectionTitle
        :item="{ heading: 'Pages' }"
      />
      <VerticalNavLink
        :item="{
          title: 'Dashboard',
          icon: 'bx-home',
          to: '/admin/dashboard',
        }"
      />

      <!-- 👉 User Management -->
      <VerticalNavSectionTitle
        :item="{ heading: 'User Management' }"
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

      <!-- 👉 Project Management -->
      <VerticalNavSectionTitle
        :item="{ heading: 'Project Management' }"
      />
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

      <!-- 👉 Settings -->
      <VerticalNavLink
        :item="{
          title: 'Settings',
          icon: 'bx-cog',
          to: '/admin/settings',
        }"
      />

    </template>

    <template v-else>
      <!-- User Console Nav -->
      <VerticalNavSectionTitle
        :item="{ heading: 'Main' }"
      />
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

      <!-- Projects -->
      <VerticalNavSectionTitle
        :item="{ heading: 'Projects' }"
      />
      <VerticalNavGroup
        :item="{
          title: 'Project',
          icon: 'bx-detail',
        }"
      >
        <VerticalNavLink :item="{ title: 'List', to: '/user/project/list' }" />
        <VerticalNavLink :item="{ title: 'View', to: '/user/project/view' }" />
      </VerticalNavGroup>

      <template v-for="project in projectList" :key="`project-nav-${project.id}-${projectKey}`">
        <VerticalNavGroup :item="{ title: project.name, icon: 'bx-detail' }" :open="isProjectActive(project.id)">
          <VerticalNavLink :item="{ title: 'Info', to: `/user/project/${project.id}/info` }" />
          <VerticalNavLink :item="{ title: 'Member', to: `/user/project/${project.id}/members` }" />
          <VerticalNavGroup :item="{ title: 'Asset', icon: 'bx-globe' }">
            <VerticalNavLink :item="{ title: 'Domain', to: `/user/project/${project.id}/assets` }" />
            <VerticalNavLink :item="{ title: 'Middleware', to: `/user/project/${project.id}/middleware` }" />
          </VerticalNavGroup>
        </VerticalNavGroup>
      </VerticalNavGroup>
    </template>

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
