<script setup lang="ts">
definePageMeta({ layout: 'default' })

const itToolsUrl = import.meta.env.VITE_IT_TOOLS_URL

if (itToolsUrl) {
  window.location.href = itToolsUrl
}
</script>

<template>
  <div>
    <VCard v-if="!itToolsUrl" class="pa-8 text-center">
      <VCardText>
        <VIcon size="48" color="grey" class="mb-4">bx-error</VIcon>
        <h4 class="text-h4 mb-2">IT Tools</h4>
        <p class="text-body-1 text-medium-emphasis">
          未配置 IT Tools 地址，请联系管理员
        </p>
      </VCardText>
    </VCard>
    <div v-else class="text-center pa-8">
      <VProgressCircular indeterminate color="primary" />
      <p class="mt-4">正在跳转到 IT Tools...</p>
    </div>
  </div>
</template>
