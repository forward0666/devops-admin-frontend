<script lang="ts" setup>
import VerticalNavSectionTitle from "@/@layouts/components/VerticalNavSectionTitle.vue";
import VerticalNavGroup from "@layouts/components/VerticalNavGroup.vue";
import VerticalNavLink from "@layouts/components/VerticalNavLink.vue";
</script>

<template>
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
      title: 'User Management',
      icon: 'bx-user',
    }"
  >
    <VerticalNavLink :item="{ title: 'User List', to: '/system/user/list' }" />
    <VerticalNavLink :item="{ title: 'User View', to: '/system/user/view' }" />
  </VerticalNavGroup>

  <VerticalNavGroup
    :item="{
      title: 'Roles & Permissions',
      icon: 'bx-check-shield',
    }"
  >
    <VerticalNavLink :item="{ title: 'Roles', to: '/system/role' }" />
    <VerticalNavLink :item="{ title: 'Permissions', to: '/system/permission' }" />
  </VerticalNavGroup>

  <VerticalNavLink
    :item="{
      title: 'Menu Management',
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

  <VerticalNavLink
    :item="{
      title: 'Dictionary',
      icon: 'bx-book-open',
      to: '/system/dict',
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
      title: 'Code Generator',
      icon: 'bx-code-alt',
      to: '/tools/gen',
    }"
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
