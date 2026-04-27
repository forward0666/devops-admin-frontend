<script lang="ts" setup>
import NavItems from '@/layouts/components/NavItems.vue'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'

const authStore = useAuthStore()
const consoleRole = computed(() => authStore.consoleRole)

const isNavCollapsed = ref(false)

// SSR is disabled, localStorage is available at module level
const stored = typeof window !== 'undefined' ? localStorage.getItem('nav-collapsed') : null
if (stored === 'true') isNavCollapsed.value = true

watch(isNavCollapsed, (val) => {
  localStorage.setItem('nav-collapsed', String(val))
})
</script>

<template>
  <VerticalNavLayout :collapsed="isNavCollapsed">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <!-- 👉 Vertical nav toggle in overlay mode -->
        <IconBtn
          class="ms-1 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="bx-menu" />
        </IconBtn>

        <VSpacer />
      </div>
    </template>

    <template #vertical-nav-header>
    </template>

    <template #vertical-nav-content>
        <NavItems :key="consoleRole" />
    </template>

    <template #after-vertical-nav-items>
      <!-- 👉 Collapse toggle button -->
      <div class="nav-collapse-btn-wrapper">
        <IconBtn
          size="small"
          variant="text"
          @click="isNavCollapsed = !isNavCollapsed"
        >
          <VIcon :icon="isNavCollapsed ? 'bx-chevron-left' : 'bx-chevron-right'" size="20" />
        </IconBtn>
      </div>
    </template>

    <!-- 👉 Pages -->
    <div :key="consoleRole">
      <FloatingActionButton />
      <slot />
    </div>

    <!-- 👉 Footer -->
    <template #footer>
    </template>
  </VerticalNavLayout>
</template>

<style lang="scss" scoped>
.meta-key {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 1.5625rem;
  line-height: 1.3125rem;
  padding-block: 0.125rem;
  padding-inline: 0.25rem;
}

.nav-collapse-btn-wrapper {
  display: flex;
  justify-content: center;
  padding-block: 0.75rem;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-inline: 0.75rem;
}
</style>
