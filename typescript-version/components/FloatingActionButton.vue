<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'

const isExpanded = ref(false)
const isVisible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const authStore = useAuthStore()

const isDark = ref(false)
let themeInstance: any = null

onMounted(() => {
  themeInstance = useTheme()
  isDark.value = themeInstance.global.current.value.dark
  watch(() => themeInstance.global.current.value.dark, v => { isDark.value = v })
})

function toggleTheme() {
  if (!themeInstance) themeInstance = useTheme()
  themeInstance.global.name.value = themeInstance.global.current.value.dark ? 'light' : 'dark'
  isDark.value = !isDark.value
  resetHideTimer()
}

function goSettings() {
  isExpanded.value = false
  resetHideTimer()
}

async function logout() {
  await authStore.logout()
  navigateTo('/login')
}

function toggleMenu() {
  isVisible.value = true
  isExpanded.value = !isExpanded.value
  resetHideTimer()
}

function resetHideTimer() {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    isExpanded.value = false
    isVisible.value = false
  }, 5000)
}

// Show pill on hover even when hidden
function showPill() {
  isVisible.value = true
}

function hidePill() {
  if (!isExpanded.value && hideTimer === null) {
    hideTimer = setTimeout(() => {
      if (!isExpanded.value) isVisible.value = false
      hideTimer = null
    }, 2000)
  }
}

function handleClickOutside(e: MouseEvent) {
  if (isExpanded.value && !(e.target as HTMLElement).closest('.fab-container')) {
    isExpanded.value = false
    resetHideTimer()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<template>
  <div
    class="fab-container"
    :class="{ 'is-expanded': isExpanded, 'is-hidden': !isVisible }"
    @mouseenter="showPill"
    @mouseleave="hidePill"
  >
    <!-- Sub Buttons -->
    <TransitionGroup name="fab-item">
      <div v-if="isExpanded" key="logout" class="fab-action" style="--i: 0" @click.stop="logout">
        <VBtn icon size="small" color="error" elevation="4">
          <VIcon icon="bx-log-out" />
        </VBtn>
      </div>

      <div v-if="isExpanded" key="settings" class="fab-action" style="--i: 1" @click.stop="goSettings">
        <VBtn icon size="small" color="surface-variant" elevation="4">
          <VIcon icon="bx-cog" />
        </VBtn>
      </div>

      <div v-if="isExpanded" key="theme" class="fab-action" style="--i: 2" @click.stop="toggleTheme">
        <VBtn icon size="small" color="surface-variant" elevation="4">
          <VIcon :icon="isDark ? 'bx-sun' : 'bx-moon'" />
        </VBtn>
      </div>
    </TransitionGroup>

    <!-- Main Button -->
    <VBtn
      icon
      size="large"
      color="primary"
      class="fab-main"
      :class="{ 'fab-open': isExpanded }"
      elevation="6"
      @click="toggleMenu"
    >
      <VIcon v-if="isExpanded" icon="bx-x" />
    </VBtn>
  </div>
</template>

<style scoped>
.fab-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 8px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-container.is-hidden {
  transform: translateX(90%);
}

.fab-container.is-hidden:hover {
  transform: translateX(0);
}

.fab-main {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-open {
  transform: rotate(90deg);
}

.fab-action {
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: calc(var(--i) * 0.05s);
}

.is-expanded .fab-action {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.fab-item-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-item-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-item-enter-from {
  opacity: 0;
  transform: scale(0);
}

.fab-item-leave-to {
  opacity: 0;
  transform: scale(0);
}
</style>
