<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'

const isExpanded = ref(false)

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
}

function goSettings() {
  isExpanded.value = false
}

async function logout() {
  await authStore.logout()
  navigateTo('/login')
  isExpanded.value = false
}

function toggleMenu() {
  isExpanded.value = !isExpanded.value
}

// Close on click outside
function handleClickOutside(e: MouseEvent) {
  if (isExpanded.value && !(e.target as HTMLElement).closest('.fab-container')) {
    isExpanded.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="fab-container" :class="{ 'is-expanded': isExpanded }">
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
      <VIcon :icon="isExpanded ? 'bx-x' : 'bx-dots-vertical-rounded'" />
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
}

.fab-main {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-open {
  transform: rotate(90deg);
}

.fab-action {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
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

  position: absolute;
  right: 48px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
