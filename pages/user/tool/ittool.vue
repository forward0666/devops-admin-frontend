<script setup lang="ts">
definePageMeta({ layout: 'default' })

const itToolsUrl = import.meta.env.VITE_IT_TOOLS_URL || '/user/tool/ittool/'

onMounted(() => {
  window.location.href = itToolsUrl
})
</script>

<template>
  <div />
</template>
