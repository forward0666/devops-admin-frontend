<script setup lang="ts">
import { useAppShell } from '~/composables/useAppShell'

const { services, fetchServices, getServiceById, loading } = useServices()
const route = useRoute()
const serviceId = route.params.serviceId as string
const subPath = route.params.path || ''

const service = computed(() => getServiceById(serviceId))

const accessGranted = ref<boolean | null>(null)

onMounted(async () => {
  await fetchServices()
  if (service.value) {
    try {
      const access = await $fetch<{ allowed: boolean; reason?: string }>('/api/services/access', {
        query: { serviceId },
      })
      accessGranted.value = access.allowed
    } catch {
      accessGranted.value = true
    }
  } else {
    accessGranted.value = false
  }
})

const { iframeRef, isIframeLoaded, postToIframe, setIframeRef, setService } = useAppShell()

const iframeSrc = computed(() => {
  const base = service.value?.url || ''
  return subPath ? `${base}/${subPath}` : base
})

watch(service, (s) => {
  if (s) setService(serviceId)
}, { immediate: true })

function onIframeLoad() {
  isIframeLoaded.value = true
}

definePageMeta({
  layout: 'app-shell',
})
</script>

<template>
  <!-- Loading -->
  <div v-if="loading || accessGranted === null" class="flex-1 flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p class="text-sm text-gray-500">Loading service...</p>
    </div>
  </div>

  <!-- Service Not Found -->
  <div v-else-if="!service" class="flex-1 flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="text-gray-400 text-5xl mb-4">❌</div>
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Service not found</h2>
      <p class="text-gray-500">The service "{{ serviceId }}" does not exist or is not enabled.</p>
      <NuxtLink to="/" class="mt-4 inline-block px-4 py-2 bg-[#ec7211] text-white rounded hover:bg-[#d6650e]">Back to services</NuxtLink>
    </div>
  </div>

  <!-- Access Denied -->
  <div v-else-if="!accessGranted" class="flex-1 flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="text-red-400 text-5xl mb-4">🔒</div>
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Access Denied</h2>
      <p class="text-gray-500">You don't have permission to access {{ service.displayName }}.</p>
      <NuxtLink to="/" class="mt-4 inline-block px-4 py-2 bg-[#ec7211] text-white rounded hover:bg-[#d6650e]">Back to services</NuxtLink>
    </div>
  </div>

  <!-- Service Iframe (no header bar — sub-service owns its own chrome) -->
  <div v-else class="flex flex-col h-full">
    <!-- Loading Indicator -->
    <div v-if="!isIframeLoaded" class="flex-1 flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p class="text-sm text-gray-500">Loading {{ service.displayName }}...</p>
      </div>
    </div>

    <!-- Iframe Container -->
    <iframe
      ref="setIframeRef"
      :src="iframeSrc"
      :class="['w-full flex-1 border-0', !isIframeLoaded && 'hidden']"
      @load="onIframeLoad"
      :title="service.displayName"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
    />
  </div>
</template>
