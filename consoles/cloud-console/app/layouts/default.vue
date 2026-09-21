<script setup lang="ts">
const showServiceMenu = ref(false)
const showUserMenu = ref(false)
const username = ref('user')

const { services, fetchServices } = useServices()

onMounted(async () => {
  await fetchServices()
  // Load username from stored user info
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem('app_user')
      if (stored) {
        const user = JSON.parse(stored)
        username.value = user.username || user.sub || 'user'
      }
    } catch {}
  }
})

function handleLogout() {
  if (import.meta.client) {
    localStorage.clear()
    window.location.href = '/login'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50" @click="showServiceMenu = false; showUserMenu = false">
    <!-- Top Navigation Bar -->
    <header class="fixed top-0 left-0 right-0 z-50 h-14 bg-[#232f3e] flex items-center px-4 gap-0 shrink-0">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0 mr-4 hover:bg-white/10 px-2 py-1 rounded">
        <div class="w-8 h-8 bg-[#ec7211] rounded flex items-center justify-center font-bold text-sm text-white">C</div>
        <span class="text-white font-semibold text-sm hidden md:block">Cloud Console</span>
      </NuxtLink>

      <!-- Services Dropdown -->
      <div class="relative" @click.stop>
        <button
          @click="showServiceMenu = !showServiceMenu"
          class="flex items-center gap-1 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded text-sm transition-colors"
        >
          Services
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div v-if="showServiceMenu" class="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border py-1 z-50 max-h-80 overflow-y-auto">
          <NuxtLink
            v-for="s in services"
            :key="s.id"
            :to="`/app/${s.id}`"
            class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
            @click="showServiceMenu = false"
          >
            <span class="text-lg">{{ s.icon }}</span>
            <div>
              <div class="text-sm font-medium text-gray-900">{{ s.displayName }}</div>
              <div class="text-xs text-gray-500">{{ s.category }}</div>
            </div>
          </NuxtLink>
          <div class="border-t my-1" />
          <NuxtLink to="/services" class="block px-4 py-2 text-sm text-[#ec7211] hover:bg-gray-50" @click="showServiceMenu = false">
            All services →
          </NuxtLink>
        </div>
      </div>

      <div class="flex-1" />

      <!-- User Menu -->
      <div class="relative" @click.stop>
        <button
          @click="showUserMenu = !showUserMenu"
          class="flex items-center gap-2 px-2 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded text-sm transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span class="hidden sm:inline">{{ username }}</span>
        </button>
        <div v-if="showUserMenu" class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
          <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Account</button>
          <div class="border-t" />
          <button @click="handleLogout" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sign Out</button>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <div class="pt-14">
      <slot />
    </div>
  </div>
</template>
