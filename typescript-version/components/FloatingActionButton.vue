<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'

const isExpanded = ref(false)
const fabRef = ref<HTMLElement | null>(null)

// Position
const position = ref({ x: 24, y: 0 })

// Draggable
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const hasMoved = ref(false)

function startDrag(e: MouseEvent | TouchEvent) {
  const el = fabRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  dragOffset.value = {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
  isDragging.value = true
  hasMoved.value = false
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  const newX = clientX - dragOffset.value.x
  const newY = clientY - dragOffset.value.y

  // Clamp to viewport
  const maxX = window.innerWidth - 56
  const maxY = window.innerHeight - 56

  position.value = {
    x: Math.max(0, Math.min(maxX, newX)),
    y: Math.max(0, Math.min(maxY, newY)),
  }

  if (Math.abs(clientX - dragOffset.value.x - position.value.x) > 3 || Math.abs(clientY - dragOffset.value.y - position.value.y) > 3) {
    hasMoved.value = true
  }
}

function stopDrag() {
  isDragging.value = false

  // Snap to nearest edge
  const midX = window.innerWidth / 2
  if (position.value.x < midX) {
    position.value.x = 16
  } else {
    position.value.x = window.innerWidth - 72
  }
}

// Actions
const authStore = useAuthStore()

const isDark = ref(false)

onMounted(() => {
  const theme = useTheme()
  isDark.value = theme.global.current.value.dark
  watch(() => theme.global.current.value.dark, v => { isDark.value = v })
})

function toggleTheme() {
  const theme = useTheme()
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  isDark.value = !isDark.value
}

function goProfile() {
  if (authStore.consoleRole === 'user') {
    navigateTo('/user/profile')
  } else {
    navigateTo('/admin/system/user/view')
  }
  isExpanded.value = false
}

function goSettings() {
  // TODO: navigate to settings page
  isExpanded.value = false
}

async function logout() {
  await authStore.logout()
  navigateTo('/login')
  isExpanded.value = false
}

function toggleMenu() {
  if (!hasMoved.value) {
    isExpanded.value = !isExpanded.value
  }
}

onMounted(() => {
  // Initial position: bottom right
  position.value = {
    x: window.innerWidth - 72,
    y: window.innerHeight - 120,
  }

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('touchend', stopDrag)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
})
</script>

<template>
  <div
    ref="fabRef"
    class="fab-container"
    :class="{ 'is-expanded': isExpanded }"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @mousedown="startDrag"
    @touchstart="startDrag"
    @click="toggleMenu"
  >
    <!-- Main Button -->
    <VBtn
      icon
      size="large"
      color="primary"
      class="fab-main"
      :class="{ 'fab-open': isExpanded }"
      elevation="6"
    >
      <VIcon :icon="isExpanded ? 'bx-x' : 'bx-dots-vertical-rounded'" />
    </VBtn>

    <!-- Sub Buttons -->
    <TransitionGroup name="fab-item">
      <div v-if="isExpanded" key="theme" class="fab-action" style="--i: 3" @click.stop="toggleTheme">
        <VBtn icon size="small" color="surface-variant" elevation="4">
          <VIcon :icon="isDark ? 'bx-sun' : 'bx-moon'" />
        </VBtn>
        <span class="fab-label">Theme</span>
      </div>

      <div v-if="isExpanded" key="profile" class="fab-action" style="--i: 2" @click.stop="goProfile">
        <VBtn icon size="small" color="surface-variant" elevation="4">
          <VIcon icon="bx-user" />
        </VBtn>
        <span class="fab-label">Profile</span>
      </div>

      <div v-if="isExpanded" key="settings" class="fab-action" style="--i: 1" @click.stop="goSettings">
        <VBtn icon size="small" color="surface-variant" elevation="4">
          <VIcon icon="bx-cog" />
        </VBtn>
        <span class="fab-label">Settings</span>
      </div>

      <div v-if="isExpanded" key="logout" class="fab-action" style="--i: 0" @click.stop="logout">
        <VBtn icon size="small" color="error" elevation="4">
          <VIcon icon="bx-log-out" />
        </VBtn>
        <span class="fab-label">Logout</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.fab-container {
  position: fixed;
  z-index: 9999;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.fab-container.is-expanded {
  cursor: default;
}

.fab-container:active:not(.is-expanded) {
  cursor: grabbing;
}

.fab-main {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  position: relative;
}

.fab-open {
  transform: rotate(90deg);
}

.fab-action {
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transform: translateY(0) scale(0);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: calc(var(--i) * 0.05s);
}

.is-expanded .fab-action {
  transform: translateY(calc((var(--i) + 1) * -56px)) scale(1);
  opacity: 1;
  pointer-events: auto;
}

.fab-label {
  position: absolute;
  right: 48px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Transition animations */
.fab-item-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-item-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-item-enter-from {
  opacity: 0;
  transform: translateY(0) scale(0);
}

.fab-item-leave-to {
  opacity: 0;
  transform: translateY(0) scale(0);
}
</style>
