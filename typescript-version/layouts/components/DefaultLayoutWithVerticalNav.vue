<script lang="ts" setup>
import NavItems from '@/layouts/components/NavItems.vue'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'

const authStore = useAuthStore()
const consoleRole = computed(() => authStore.consoleRole)

const isNavCollapsed = ref(false)

// Toggle collapsed class on the sidebar element
onMounted(() => {
  const nav = document.querySelector('.layout-vertical-nav') as HTMLElement
  const wrapper = document.querySelector('.layout-wrapper') as HTMLElement
  watch(isNavCollapsed, (val) => {
    nav?.classList.toggle('layout-vertical-nav-collapsed', val)
    wrapper?.classList.toggle('layout-vertical-nav-collapsed', val)
    // Also collapse the nav-header section
    const navHeader = document.querySelector('.nav-header') as HTMLElement
    if (navHeader) {
      navHeader.style.display = val ? 'flex' : 'flex'
    }
  })
})
</script>

<template>
  <VerticalNavLayout>
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
          <VIcon :icon="isNavCollapsed ? 'bx-menu' : 'bx-menu-alt-left'" size="20" />
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
