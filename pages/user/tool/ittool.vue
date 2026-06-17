<script setup lang="ts">
definePageMeta({ layout: 'default' })

const itToolsUrl = import.meta.env.VITE_IT_TOOLS_URL || '/user/tool/ittool/'

// 强制全页跳转，不走 SPA 路由
if (import.meta.client) {
  window.location.replace(itToolsUrl)
}
</script>

<template>
  <div />
</template>
