<script setup lang="ts">
defineProps<{ class?: string }>()
</script>

<template>
  <div class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
    <slot />
  </div>
</template>
