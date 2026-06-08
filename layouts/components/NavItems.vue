<script lang="ts" setup>
import VerticalNavSectionTitle from "@/@layouts/components/VerticalNavSectionTitle.vue";
import VerticalNavGroup from "@layouts/components/VerticalNavGroup.vue";
import VerticalNavLink from "@layouts/components/VerticalNavLink.vue";
import { userConsoleProjectService } from '~/services/api'

const authStore = useAuthStore()
import { ADMIN, DEVOPS, USER, LOGIN, HOME_ROUTE_MAP, USER_PROJECT } from '~/constants/routes'
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

  // Fetch admin/devops projects only when authenticated
  const fetchAdminProjects = () => {
    if (authStore.isAuthenticated && !authStore.isUser && !projectStore.value.projects?.length) {
      projectStore.value.fetchProjects()
    }
  }

  // Fetch user's own projects only when authenticated & in user console
  const fetchUserProjects = async () => {
    if (!authStore.isAuthenticated) return
    try {
      const res = await userConsoleProjectService.list()
      userProjectList.value = Array.isArray(res) ? res : res?.data || []
    } catch { userProjectList.value = [] }
  }

  fetchAdminProjects()
  fetchUserProjects()
  watch(() => projectStore.value?.projects.length, () => { projectKey.value++ })
  watch(() => authStore.isAuthenticated, (v) => { if (v) { fetchAdminProjects(); fetchUserProjects() } })
  watch(() => authStore.consoleRole, fetchUserProjects)
}

function switchConsole(role: 'admin' | 'user' | 'devops') {
  const authStore = useAuthStore()
  authStore.setConsoleRole(role)
  navigateTo(HOME_ROUTE_MAP[role] || USER.DASHBOARD)
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
          to: ADMIN.DASHBOARD,
        }"
      />

      <VerticalNavGroup
        :item="{
          title: 'User',
          icon: 'bx-user',
        }"
        :open="currentRoute?.path?.startsWith('/admin/system/user')"
      >
        <VerticalNavLink :item="{ title: 'List', to: ADMIN.SYSTEM_USER_LIST }" />
        <VerticalNavLink :item="{ title: 'View', to: ADMIN.SYSTEM_USER_VIEW }" />
      </VerticalNavGroup>

      <VerticalNavGroup :item="{ title: 'Department', icon: 'bx-buildings' }" :open="currentRoute?.path?.startsWith('/admin/system/dept')">
        <VerticalNavLink :item="{ title: 'List', to: ADMIN.SYSTEM_DEPT_LIST }" />
        <VerticalNavLink :item="{ title: 'View', to: ADMIN.SYSTEM_DEPT_VIEW }" />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Project',
          icon: 'bx-folder',
        }"
        :open="currentRoute?.path?.startsWith('/admin/project')"
      >
        <VerticalNavLink :item="{ title: 'List', to: ADMIN.PROJECT_LIST }" />
        <VerticalNavLink :item="{ title: 'View', to: ADMIN.PROJECT_VIEW }" />
      </VerticalNavGroup>

      <!-- 👉 Online -->
      <VerticalNavLink
        :item="{
          title: 'Online User',
          icon: 'bx-wifi',
          to: ADMIN.MONITOR_ONLINE,
        }"
      />

      <VerticalNavLink
        :item="{
          title: 'Login Log',
          icon: 'bx-log-in',
          to: ADMIN.MONITOR_LOGIN_LOG,
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Operation Log',
          icon: 'bx-list-ul',
          to: ADMIN.MONITOR_OPERATION_LOG,
        }"
      />
      <VDivider class="my-2 mx-3" />
      <VerticalNavLink
        :item="{
          title: 'Setting',
          icon: 'bx-cog',
          to: ADMIN.MONITOR_SETTING,
        }"
      />

    </template>

    <template v-else-if="authStore.consoleRole === 'devops'">
      <!-- DevOps Console Nav -->
      <VerticalNavLink
        :item="{
          title: 'Dashboard',
          icon: 'bx-home',
          to: DEVOPS.DASHBOARD,
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
            to: DEVOPS.TG_INDEX,
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Authorized Chat',
            to: DEVOPS.TG_CHATS,
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Blacklist Chat',
            to: DEVOPS.TG_BLACKLIST,
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Group Binding',
            to: DEVOPS.TG_GROUP,
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Service Status',
            to: DEVOPS.TG_STATUS,
          }"
        />
        <VerticalNavLink
          :item="{
            title: 'Menu Config',
            to: DEVOPS.TG_MENU,
          }"
        />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Cloudflare',
          icon: 'bx-cloud',
        }"
      >
        <VerticalNavLink :item="{ title: 'Account', to: DEVOPS.CF_ACCOUNT }" />
        <VerticalNavLink :item="{ title: 'Zone', to: DEVOPS.CF_ZONE }" />
        <VerticalNavLink :item="{ title: 'DNS', to: DEVOPS.CF_DNS }" />
        <VerticalNavLink :item="{ title: 'Security', to: DEVOPS.CF_SECURITY }" />
        <VerticalNavLink :item="{ title: 'Rate Limit', to: DEVOPS.CF_RATELIMIT }" />
        <VerticalNavLink :item="{ title: 'SSL', to: DEVOPS.CF_SSL }" />
        <VerticalNavLink :item="{ title: 'Cache', to: DEVOPS.CF_CACHE }" />
        <VerticalNavLink :item="{ title: 'DDoS', to: DEVOPS.CF_DDOS }" />
        <VerticalNavLink :item="{ title: 'Managed', to: DEVOPS.CF_MANAGED }" />
        <VerticalNavLink :item="{ title: 'Domain', to: DEVOPS.CF_DOMAIN }" />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Tool',
          icon: 'bx-wrench',
        }"
      >
        <VerticalNavLink :item="{ title: 'Purge Cache', to: DEVOPS.TOOL_PURGE_CACHE }" />
        <VerticalNavLink :item="{ title: 'Security Rule', to: DEVOPS.TOOL_SECURITY }" />
        <VerticalNavLink :item="{ title: 'Sync Rule', to: DEVOPS.TOOL_SYNC_RULE }" />
        <VerticalNavLink :item="{ title: 'WhiteList IP', to: DEVOPS.TOOL_WHITELIST }" />
        <VerticalNavLink :item="{ title: 'Monitor Rule', to: DEVOPS.TOOL_MONITOR }" />
        <VerticalNavLink :item="{ title: 'Task', to: DEVOPS.TOOL_TASK }" />
      </VerticalNavGroup>

      <VerticalNavGroup
        :item="{
          title: 'Tencent',
          icon: 'bx-cloud',
        }"
      >
        <VerticalNavLink :item="{ title: 'Dashboard', to: DEVOPS.TENCENT }" />
      </VerticalNavGroup>
    </template>

    <template v-else>
      <VerticalNavLink
        :item="{
          title: 'Dashboard',
          icon: 'bx-home',
          to: USER.DASHBOARD,
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Profile',
          icon: 'bx-user',
          to: USER.PROFILE,
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
            <VerticalNavLink :item="{ title: 'Info', to: USER_PROJECT(project.id, 'info') }" />
            <VerticalNavLink :item="{ title: 'Member', to: USER_PROJECT(project.id, 'members') }" />
            <VerticalNavLink :item="{ title: 'Domain', to: USER_PROJECT(project.id, 'domain') }" />
            <VerticalNavLink :item="{ title: 'Middleware', to: USER_PROJECT(project.id, 'middleware') }" />
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
        to: LOGIN,
      }"
    />
  </template>
</template>
