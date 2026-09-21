<script setup lang="ts">
const { services, fetchServices, getServiceById } = useServices()
const route = useRoute()
const showServiceMenu = ref(false)
const showUserMenu = ref(false)

onMounted(async () => {
  await fetchServices()
})

const currentServiceId = computed(() => {
  if (route.path.startsWith('/app/')) {
    return route.params.serviceId as string
  }
  return null
})

const currentService = computed(() =>
  currentServiceId.value ? getServiceById(currentServiceId.value) : null
)

watch(() => route.path, () => {
  showServiceMenu.value = false
  showUserMenu.value = false
})
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50" @click="showServiceMenu = false; showUserMenu = false">
    <!-- Top Navigation -->
    <header class="h-12 bg-[#232f3e] flex items-center px-4 gap-0 shrink-0 z-50">
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0 mr-4 hover:bg-white/10 px-2 py-1 rounded transition-colors">
        <div class="w-7 h-7 bg-[#ec7211] rounded flex items-center justify-center font-bold text-xs text-white">CC</div>
        <span class="text-white font-semibold text-sm hidden md:block">Console</span>
      </NuxtLink>

      <!-- Service Selector -->
      <div class="relative" @click.stop>
        <button
          @click="showServiceMenu = !showServiceMenu"
          :class="[
            'flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors',
            showServiceMenu ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span>{{ currentService?.displayName || 'Services' }}</span>
          <svg :class="['w-3 h-3 transition-transform', showServiceMenu && 'rotate-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-if="showServiceMenu" class="absolute left-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border py-1 z-50">
          <NuxtLink
            v-for="svc in services"
            :key="svc.id"
            :to="`/app/${svc.id}`"
            :class="[
              'flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
              svc.id === currentServiceId && 'bg-orange-50'
            ]"
          >
            <span class="text-xl">{{ svc.icon }}</span>
            <div>
              <div class="text-sm font-medium text-gray-900">{{ svc.displayName }}</div>
              <div class="text-xs text-gray-500">{{ svc.category }}</div>
            </div>
          </NuxtLink>
          <div class="border-t mt-1 pt-1">
            <NuxtLink to="/" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All Services
            </NuxtLink>
          </div>
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
          <span class="hidden sm:inline">admin</span>
        </button>
        <div v-if="showUserMenu" class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
          <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Account</button>
          <div class="border-t" />
          <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sign Out</button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 min-h-0">
      <slot />
    </main>
  </div>
</template>
