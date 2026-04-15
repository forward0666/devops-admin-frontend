<script lang="ts" setup>
import type { NavGroup } from '@layouts/types'

const props = defineProps<{
  item: Omit<NavGroup, 'children'>
  open?: boolean
}>()

const isOpen = ref(true)
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
    <div v-show="isOpen" class="nav-group-children-wrapper">
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
