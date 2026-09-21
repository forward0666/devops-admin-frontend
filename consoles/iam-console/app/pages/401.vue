<script setup lang="ts">
definePageMeta({ layout: false })
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4">
    <div class="text-center">
      <div class="text-red-400 text-6xl mb-4">🔒</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">401 Unauthorized</h1>
      <p class="text-gray-500 mb-6">Valid token required to access this service.</p>
    </div>
  </div>
</template>
