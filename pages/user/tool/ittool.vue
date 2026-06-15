<script setup lang="ts">
definePageMeta({ layout: 'default' })

if (import.meta.client) {
  window.location.href = '/user/tool/ittool/'
}
</script>

<template>
  <div class="d-flex align-center justify-center" style="height: 100vh;">
    <VProgressCircular indeterminate color="primary" />
  </div>
</template>
