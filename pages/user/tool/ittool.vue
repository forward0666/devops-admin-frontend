<script setup lang="ts">
definePageMeta({ layout: 'default' })

const toolUrl = import.meta.env.VITE_IT_TOOLS_URL || '/user/tool/ittool/'
</script>

<template>
  <div style="height: calc(100vh - 64px); overflow: hidden;">
    <iframe
      :src="toolUrl"
      style="width: 100%; height: 100%; border: none;"
      allow="clipboard-read; clipboard-write"
    />
  </div>
</template>
