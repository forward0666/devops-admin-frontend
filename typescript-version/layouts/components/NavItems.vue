<script lang="ts" setup>
import VerticalNavSectionTitle from "@/@layouts/components/VerticalNavSectionTitle.vue";
import VerticalNavGroup from "@layouts/components/VerticalNavGroup.vue";
import VerticalNavLink from "@layouts/components/VerticalNavLink.vue";

const authStore = useAuthStore()
</script>

<template>
  <!-- 👉 Admin Navigation -->
  <template v-if="authStore.isAdmin">
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
  </template>

</template>
