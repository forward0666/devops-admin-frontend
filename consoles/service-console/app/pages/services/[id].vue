<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const serviceId = route.params.id as string

const service = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const statusColors: Record<string, string> = {
  'published': 'bg-green-100 text-green-800',
  'in-development': 'bg-blue-100 text-blue-800',
  'experimental': 'bg-orange-100 text-orange-800',
  'deprecated': 'bg-red-100 text-red-800',
  'disabled': 'bg-gray-100 text-gray-600',
}

const authHeaders = () => {
  if (!import.meta.client) return {}
  const token = localStorage.getItem('app_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchService() {
  loading.value = true
  error.value = null
  try {
    const data = await $fetch<any>(`/api/services/catalog/${serviceId}`, {
      headers: authHeaders(),
    })
    service.value = data
  } catch (e: any) {
    error.value = e.message || 'Failed to load service'
    service.value = null
  } finally {
    loading.value = false
  }
}

function parseTags(tags: string | string[]): string[] {
  if (Array.isArray(tags)) return tags
  try { return JSON.parse(tags) } catch { return [] }
}

function parsePerms(perms: string | string[]): string[] {
  if (Array.isArray(perms)) return perms
  try { return JSON.parse(perms) } catch { return [] }
}

onMounted(() => {
  fetchService()
})
</script>

<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p class="text-sm text-gray-500">Loading service...</p>
    </div>
  </div>
  <div v-else-if="error || !service" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="text-gray-400 text-5xl mb-4">❌</div>
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Service not found</h2>
      <p class="text-gray-500">The service "{{ serviceId }}" does not exist or is not enabled.</p>
      <NuxtLink to="/services" class="mt-4 inline-block px-4 py-2 bg-[#ec7211] text-white rounded hover:bg-[#d6650e]">Back to services</NuxtLink>
    </div>
  </div>
  <div v-else>
    <!-- Header -->
    <div class="bg-[#232f3e] text-white px-6 py-8">
      <div class="max-w-6xl mx-auto">
        <NuxtLink to="/services" class="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-4 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to services
        </NuxtLink>
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center text-3xl">
            {{ service.icon || '📦' }}
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold">{{ service.displayName }}</h1>
              <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', statusColors[service.status] || 'bg-gray-100 text-gray-600']">
                {{ service.status }}
              </span>
            </div>
            <p class="text-gray-300 mt-1">{{ service.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Launch Card -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Open Service</h2>
            <p class="text-sm text-gray-600 mb-4">
              Launch {{ service.displayName }} in the integrated app shell. The service will load in an embedded view within the console.
            </p>
            <NuxtLink
              :to="service.url || `/app/${service.serviceId}`"
              class="inline-flex items-center gap-2 px-6 py-3 bg-[#ec7211] text-white rounded-lg hover:bg-[#d6650e] transition-colors font-medium"
            >
              Launch {{ service.displayName }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </NuxtLink>
          </div>

          <!-- Details -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
            <dl class="space-y-4">
              <div class="flex justify-between border-b border-gray-100 pb-3">
                <dt class="text-sm text-gray-500">Service ID</dt>
                <dd class="text-sm font-mono text-gray-900">{{ service.serviceId }}</dd>
              </div>
              <div class="flex justify-between border-b border-gray-100 pb-3">
                <dt class="text-sm text-gray-500">Category</dt>
                <dd class="text-sm text-gray-900">{{ service.category || '—' }}</dd>
              </div>
              <div class="flex justify-between border-b border-gray-100 pb-3">
                <dt class="text-sm text-gray-500">URL</dt>
                <dd class="text-sm text-gray-900 font-mono">{{ service.url || '—' }}</dd>
              </div>
              <div class="flex justify-between border-b border-gray-100 pb-3">
                <dt class="text-sm text-gray-500">Version</dt>
                <dd class="text-sm text-gray-900">v{{ service.version || '—' }}</dd>
              </div>
              <div class="flex justify-between border-b border-gray-100 pb-3">
                <dt class="text-sm text-gray-500">Owner</dt>
                <dd class="text-sm text-gray-900">{{ service.owner || '—' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Status</dt>
                <dd>
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', statusColors[service.status] || 'bg-gray-100 text-gray-600']">
                    {{ service.status }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <!-- Tags -->
          <div v-if="parseTags(service.tags).length > 0" class="bg-white border border-gray-200 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in parseTags(service.tags)"
                :key="tag"
                class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Permissions -->
          <div v-if="parsePerms(service.permissions).length > 0" class="bg-white border border-gray-200 rounded-lg p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Required Permissions</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="perm in parsePerms(service.permissions)"
                :key="perm"
                class="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-mono"
              >
                {{ perm }}
              </span>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Info -->
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h3 class="font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-orange-50 rounded flex items-center justify-center text-lg">{{ service.icon || '📦' }}</div>
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ service.displayName }}</div>
                  <div class="text-xs text-gray-500">{{ service.category || 'General' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
