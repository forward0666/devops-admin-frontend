<script setup lang="ts">
const { services, fetchServices, searchServices, loading, error: servicesError } = useServices()

onMounted(async () => {
  await fetchServices()
})

const searchQuery = ref('')
const selectedCategory = ref('all')

const categories = computed(() => {
  const cats = new Set(services.value.map(s => s.category))
  return ['all', ...Array.from(cats)]
})

const filteredServices = computed(() => {
  let result = services.value
  if (searchQuery.value) {
    result = searchServices(searchQuery.value)
  }
  if (selectedCategory.value !== 'all') {
    result = result.filter(s => s.category === selectedCategory.value)
  }
  return result
})

const statusColors: Record<string, string> = {
  'published': 'bg-green-100 text-green-800',
  'in-development': 'bg-blue-100 text-blue-800',
  'experimental': 'bg-orange-100 text-orange-800',
  'deprecated': 'bg-red-100 text-red-800',
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <div class="bg-[#232f3e] text-white px-6 py-10">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold mb-2">Cloud Console</h1>
        <p class="text-gray-300 text-lg">Select a service to get started</p>
        <div class="mt-6 max-w-xl">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search for services..."
              class="w-full pl-11 pr-4 py-3 bg-white/90 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#ec7211]"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="max-w-6xl mx-auto px-6 py-12 text-center">
      <div class="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p class="text-sm text-gray-500">Loading services...</p>
    </div>

    <!-- Error -->
    <div v-else-if="servicesError" class="max-w-6xl mx-auto px-6 py-12 text-center">
      <div class="text-red-400 text-5xl mb-4">⚠️</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-1">Failed to load services</h3>
      <p class="text-gray-500">{{ servicesError }}</p>
      <button @click="fetchServices()" class="mt-4 px-4 py-2 bg-[#ec7211] text-white rounded hover:bg-[#d6650e]">Retry</button>
    </div>

    <template v-else>
      <!-- Category Filter -->
      <div class="max-w-6xl mx-auto px-6 py-4">
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="selectedCategory = cat"
            :class="[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedCategory === cat
                ? 'bg-[#ec7211] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ cat === 'all' ? 'All Services' : cat }}
          </button>
        </div>
      </div>

      <!-- Service Grid -->
      <div class="max-w-6xl mx-auto px-6 pb-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="svc in filteredServices"
            :key="svc.id"
            :to="`/services/${svc.id}`"
            class="bg-white border border-gray-200 rounded-lg p-5 hover:border-[#ec7211] hover:shadow-lg transition-all group"
          >
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-2xl shrink-0 group-hover:bg-orange-100 transition-colors">
                {{ svc.icon }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-base font-semibold text-gray-900 group-hover:text-[#ec7211] transition-colors">{{ svc.displayName }}</h3>
                  <span :class="['px-1.5 py-0.5 rounded text-xs font-medium', statusColors[svc.status]]">
                    {{ svc.status }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 line-clamp-2">{{ svc.description }}</p>
                <div class="flex items-center gap-2 mt-3">
                  <span class="text-xs text-gray-400">{{ svc.category }}</span>
                  <span class="text-xs text-gray-400">·</span>
                  <span class="text-xs text-gray-400">v{{ svc.version }}</span>
                </div>
              </div>
              <svg class="w-5 h-5 text-gray-300 group-hover:text-[#ec7211] shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-if="filteredServices.length === 0" class="text-center py-12">
          <div class="text-gray-400 text-5xl mb-4">🔍</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">No services found</h3>
          <p class="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      </div>
    </template>
  </div>
</template>
