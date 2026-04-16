<script lang="ts" setup>
import type { NavGroup } from '@layouts/types'

const props = defineProps<{
  item: Omit<NavGroup, 'children'>
  open?: boolean
}>()

const route = useRoute()

const isOpen = ref(props.open || false)

// Auto-expand when user navigates into a child route
const slotEl = ref<HTMLElement | null>(null)
onMounted(() => {
 const links = slotEl.value?.querySelectorAll('a[href]')
  if (links) {
    const checkActive = () => {
      const isActive = Array.from(links).some((a: HTMLAnchorElement) => route.path.startsWith(a.getAttribute('href') || ''))
      if (isActive && !isOpen.value) isOpen.value = true
    }
    checkActive()
    watch(() => route.path, checkActive)
  }
})
</script>

<template>
  <li
    class="nav-group"
    :class="isOpen && 'open'"
  >
    <div
      class="nav-group-label"
      @click="isOpen = !isOpen"
    >
      <VIcon
        :icon="item.icon || 'bxs-circle'"
        class="nav-item-icon"
      />
      <span class="nav-item-title">{{ item.title }}</span>
      <span
        class="nav-item-badge"
        :class="item.badgeClass"
      >
        {{ item.badgeContent }}
      </span>
      <VIcon
        icon="bx-chevron-right"
        class="nav-group-arrow"
        :class="isOpen && 'rotate-180'"
      />
    </div>
    <div ref="slotEl" v-show="isOpen" class="nav-group-children-wrapper">
      <ul class="nav-group-children">
        <slot />
      </ul>
    </div>
  </li>
</template>

<style lang="scss">
.layout-vertical-nav {
  .nav-group {
    &-label {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .nav-group-arrow {
      transition: transform 0.25s ease;

      &.rotate-180 {
        transform: rotate(90deg);
      }
    }
  }
}
</style>
