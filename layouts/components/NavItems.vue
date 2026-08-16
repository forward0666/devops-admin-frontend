<script lang="ts" setup>
import VerticalNavSectionTitle from "@/@layouts/components/VerticalNavSectionTitle.vue";
import VerticalNavGroup from "@layouts/components/VerticalNavGroup.vue";
import VerticalNavLink from "@layouts/components/VerticalNavLink.vue";
import { userConsoleProjectService } from '~/services/api'

const authStore = useAuthStore()
const projectStore = ref<any>(null)
const userProjectList = ref<any[]>([])
const projectList = computed(() => {
  if (authStore.isUser) return userProjectList.value
  return projectStore.value?.projects || []
})
const projectKey = ref(0)
const currentRoute = import.meta.client ? useRoute() : null

if (import.meta.client) {
  projectStore.value = useProjectStore()
  if (!projectStore.value.projects?.length) {
    projectStore.value.fetchProjects()
  }
  watch(() => projectStore.value?.projects.length, () => {
    projectKey.value++
  })

  // Fetch user's own projects for user console
  const fetchUserProjects = async () => {
    try {
      const res = await userConsoleProjectService.list()
      userProjectList.value = Array.isArray(res) ? res : res?.data || []
    } catch { userProjectList.value = [] }
  }
  fetchUserProjects()
  watch(() => authStore.consoleRole, fetchUserProjects)
}

function switchConsole(role: 'admin' | 'user' | 'devops') {
  const authStore = useAuthStore()
  authStore.setConsoleRole(role)
  const routeMap: Record<string, string> = {
    admin: '/admin/dashboard',
    devops: '/devops/dashboard',
    user: '/user/dashboard',
  }
  navigateTo(routeMap[role] || '/user/dashboard')
}

const isProjectActive = (projectId: number) => {
  if (!currentRoute) return false
  return currentRoute.path.includes(`/user/project/${projectId}/`)
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

          </a>
        </li>
      </template>
      <VList min-width="180" density="comfortable">
        <VListItem prepend-icon="bx-shield" title="Admin" @click="switchConsole('admin')" />
        <VListItem prepend-icon="bx-code" title="DevOps" @click="switchConsole('devops')" />
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
        :open="currentRoute?.path?.includes('/admin/system/user')"
      >
        <VerticalNavLink :item="{ title: 'List', to: '/admin/system/user/list' }" />
        <VerticalNavLink :item="{ title: 'View', to: '/admin/system/user/view' }" />
      </VerticalNavGroup>

      <VerticalNavGroup :item="{ title: 'Department', icon: 'bx-buildings' }" :open="currentRoute?.path?.includes('/admin/system/dept')">
        <VerticalNavLink :item="{ title: 'List', to: '/admin/system/dept/list' }" />
        <VerticalNavLink :item="{ title: 'View', to: '/admin/system/dept/view' }" />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Project',
          icon: 'bx-folder',
        }"
        :open="currentRoute?.path?.includes('/admin/project')"
      >
        <VerticalNavLink :item="{ title: 'List', to: '/admin/project/list' }" />
        <VerticalNavLink :item="{ title: 'View', to: '/admin/project/view' }" />
      </VerticalNavGroup>

      <!-- 👉 Online -->
      <VerticalNavLink
        :item="{
          title: 'Online User',
          icon: 'bx-wifi',
          to: '/admin/monitor/online',
        }"
      />

      <VerticalNavLink
        :item="{
          title: 'Login Log',
          icon: 'bx-log-in',
          to: '/admin/monitor/loginlog',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Operation Log',
          icon: 'bx-list-ul',
          to: '/admin/monitor/operationlog',
        }"
      />
      <VDivider class="my-2 mx-3" />
      <VerticalNavLink
        :item="{
          title: 'Setting',
          icon: 'bx-cog',
          to: '/admin/monitor/setting',
        }"
      />

    </template>

    <template v-else-if="authStore.consoleRole === 'devops'">
      <!-- DevOps Console Nav -->
      <VerticalNavLink
        :item="{
          title: 'Dashboard',
          icon: 'bx-home',
          to: '/devops/dashboard',
        }"
      />

      <VerticalNavGroup
        :item="{
          title: 'Telegram',
          icon: 'bx-bot',
        }"
      >
        <VerticalNavLink
          :item="{
            title: 'Bot Manager',
            to: '/devops/telegram',
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Authorized Chat',
            to: '/devops/telegram/chats',
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Blacklist Chat',
            to: '/devops/telegram/blacklist',
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Group Binding',
            to: '/devops/telegram/group',
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Service Status',
            to: '/devops/telegram/status',
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Menu Config',
            to: '/devops/telegram/menu',
          }"
        />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Cloudflare',
          icon: 'bx-cloud',
        }"
      >
        <VerticalNavLink :item="{ title: 'Account', to: '/devops/cloudflare' }" />
        <VerticalNavLink :item="{ title: 'DNS', to: '/devops/cloudflare/dns' }" />
        <VerticalNavLink :item="{ title: 'Zone', to: '/devops/cloudflare/zone' }" />
        <VerticalNavLink :item="{ title: 'Security', to: '/devops/cloudflare/security' }" />
        <VerticalNavLink :item="{ title: 'SSL', to: '/devops/cloudflare/ssl' }" />
        <VerticalNavLink :item="{ title: 'Cache', to: '/devops/cloudflare/cache' }" />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Tools',
          icon: 'bx-wrench',
        }"
      >
        <VerticalNavLink :item="{ title: 'Domain', to: '/devops/tools/domain' }" />
        <VerticalNavLink :item="{ title: 'Purge Cache', to: '/devops/tools/purgecache' }" />
        <VerticalNavLink :item="{ title: 'Security Rules', to: '/devops/tools/security' }" />
        <VerticalNavLink :item="{ title: 'WhiteList IP', to: '/devops/tools/whitelist' }" />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Tencent',
          icon: 'bx-cloud',
        }"
      >
        <VerticalNavLink :item="{ title: 'Dashboard', to: '/devops/tencent' }" />
      </VerticalNavGroup>
    </template>

    <template v-else>
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
          icon: 'bx-folder',
        }"
        :open="projectList.some((p: any) => isProjectActive(p.id))"
      >
        <template v-for="project in projectList" :key="`project-nav-${project.id}-${projectKey}`">
          <VerticalNavGroup :item="{ title: project.name, icon: 'bx-folder' }" :open="isProjectActive(project.id)">
            <VerticalNavLink :item="{ title: 'Info', to: `/user/project/${project.id}/info` }" />
            <VerticalNavLink :item="{ title: 'Member', to: `/user/project/${project.id}/members` }" />
            <VerticalNavLink :item="{ title: 'Domain', to: `/user/project/${project.id}/domain` }" />
            <VerticalNavLink :item="{ title: 'Middleware', to: `/user/project/${project.id}/middleware` }" />
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
