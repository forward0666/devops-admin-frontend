<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from 'vuetify'

const isExpanded = ref(false)
const fabRef = ref<HTMLElement | null>(null)

// Position
const position = ref({ x: 24, y: 24 })

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

  // Snap to nearest edge horizontally
  const midX = window.innerWidth / 2
  if (position.value.x < midX) {
    position.value.x = 16
  } else {
    position.value.x = window.innerWidth - 72
  }
}

// Determine expand direction based on position
const expandDirection = computed(() => {
  const midX = window.innerWidth / 2
  const midY = window.innerHeight / 2
  const onLeft = position.value.x < midX
  const onTop = position.value.y < midY

  if (onTop && onLeft) return 'right-down'
  if (onTop && !onLeft) return 'left-down'
  if (!onTop && onLeft) return 'right-up'
  return 'left-up'
})

// Actions
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
  if (!hasMoved.value) {
    isExpanded.value = !isExpanded.value
  }
}

onMounted(() => {
  // Default position: top right
  position.value = {
    x: window.innerWidth - 72,
    y: 24,
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
      <div v-if="isExpanded" key="theme" class="fab-action" style="--i: 0" @click.stop="toggleTheme">
        <VBtn icon size="small" color="surface-variant" elevation="4">
          <VIcon :icon="isDark ? 'bx-sun' : 'bx-moon'" />
        </VBtn>
        <span class="fab-label" :class="expandDirection">Theme</span>
      </div>

      <div v-if="isExpanded" key="settings" class="fab-action" style="--i: 1" @click.stop="goSettings">
        <VBtn icon size="small" color="surface-variant" elevation="4">
          <VIcon icon="bx-cog" />
        </VBtn>
        <span class="fab-label" :class="expandDirection">Settings</span>
      </div>

      <div v-if="isExpanded" key="logout" class="fab-action" style="--i: 2" @click.stop="logout">
        <VBtn icon size="small" color="error" elevation="4">
          <VIcon icon="bx-log-out" />
        </VBtn>
        <span class="fab-label" :class="expandDirection">Logout</span>
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

/* Base action positioning */
.fab-action {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: calc(var(--i) * 0.05s);
}

/* Expand left-down (top-right corner default) */
.is-expanded .fab-action {
  transform: translateX(calc((var(--i) + 1) * -56px)) scale(1);
  opacity: 1;
  pointer-events: auto;
}

/* Expand right-down (top-left corner) */
.is-expanded.expand-right-down .fab-action {
  transform: translateX(calc((var(--i) + 1) * 56px)) translateY(0) scale(1);
}

/* Expand right-up (bottom-left corner) */
.is-expanded.expand-right-up .fab-action {
  transform: translateX(calc((var(--i) + 1) * 56px)) translateY(0) scale(1);
}

/* Expand left-up (bottom-right corner) */
.is-expanded.expand-left-up .fab-action {
  transform: translateX(calc((var(--i) + 1) * -56px)) translateY(0) scale(1);
}

/* Label positioning */
.fab-label {
  position: absolute;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  top: 50%;
  transform: translateY(-50%);
  right: 48px;
}

/* Labels on the left side show to the right */
.fab-label.right-down,
.fab-label.right-up {
  right: auto;
  left: 48px;
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
  transform: scale(0);
}

.fab-item-leave-to {
  opacity: 0;
  transform: scale(0);
}
</style>
