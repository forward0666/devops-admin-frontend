<script setup lang="ts">
definePageMeta({ layout: 'default' })

const itToolsUrl = import.meta.env.VITE_IT_TOOLS_URL

if (itToolsUrl) {
  window.location.href = itToolsUrl
}
</script>

<template>
  <div />
</template>
