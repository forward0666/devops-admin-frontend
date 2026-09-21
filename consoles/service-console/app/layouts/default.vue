<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useAppShell } from '~/composables/useAppShell'

const { user, isAuthenticated, login, logout } = useAuth()
const { isEmbedded, notifyRouteChange, authValid, shellReady, resetAuth } = useAppShell()

const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)
const showUserMenu = ref(false)

const sidebarGroupOpen = ref<Record<string, boolean>>({
  'Service Catalog': true,
  'Settings': true,
})

function toggleSidebarGroup(label: string) {
  sidebarGroupOpen.value[label] = !sidebarGroupOpen.value[label]
}

const serviceSidebar = {
  label: 'Services',
  path: '/services',
  items: [
    { path: '/services', label: 'Dashboard' },
  ],
  groups: [
    {
      label: 'Service Catalog',
      defaultOpen: true,
      items: [
        { path: '/services', label: 'All Services' },
      ],
    },
  ],
}

const currentBreadcrumb = computed(() => {
  const route = useRoute()
  const crumbs = [{ label: 'Services', path: '/services' }]
  for (const group of serviceSidebar.groups) {
    const found = group.items.find((i) => i.path === route.path)
    if (found && found.path !== '/services') {
      crumbs.push({ label: found.label, path: found.path })
    }
  }
  return crumbs
})

function handleLogout() {
  if (import.meta.client) {
    localStorage.clear()
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'app:logout', source: 'service-console' }, '*')
    } else {
      window.location.reload()
    }
  }
}

function closeDropdowns() {
  showUserMenu.value = false
}

watch(
  () => useRoute().path,
  (newPath) => {
    closeDropdowns()
    mobileMenuOpen.value = false
    notifyRouteChange(newPath)
  }
)

onMounted(async () => {
  if (!isAuthenticated.value) await login()
})
</script>

<template>
  <!-- Waiting for auth from parent shell -->
  <div v-if="isEmbedded && authValid === null && !shellReady" class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mb-3" />
    <p class="text-sm text-gray-500">Authenticating...</p>
  </div>

  <!-- Auth failed -->
  <div v-else-if="authValid === false" class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="text-center">
      <div class="text-red-400 text-5xl mb-4">🔒</div>
      <h2 class="text-lg font-semibold text-gray-900 mb-1">401 Unauthorized</h2>
      <p class="text-gray-500 text-sm">Valid token required to access this service.</p>
    </div>
  </div>

  <!-- Authenticated — show content -->
  <div
    v-else
    class="flex flex-col min-h-screen bg-gray-100"
    @click="closeDropdowns"
  >
    <div class="flex flex-col flex-1">
      <!-- Breadcrumb bar -->
      <div
        class="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2 text-sm shrink-0"
      >
        <NuxtLink
          to="/services"
          class="text-gray-400 hover:text-brand-orange transition-colors"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </NuxtLink>
        <template
          v-for="(crumb, idx) in currentBreadcrumb"
          :key="crumb.path"
        >
          <svg
            class="w-3 h-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <NuxtLink
            :to="crumb.path"
            :class="[
              idx === currentBreadcrumb.length - 1
                ? 'text-gray-900 font-medium'
                : 'text-gray-500 hover:text-brand-orange',
            ]"
          >
            {{ crumb.label }}
          </NuxtLink>
        </template>
      </div>

      <!-- Sidebar + Content row -->
      <div class="flex flex-1 min-h-0">
        <!-- Service sidebar -->
        <aside
          :class="[
            'bg-white border-r border-gray-200 shrink-0 overflow-y-auto transition-all duration-200 hidden lg:block',
            sidebarCollapsed ? 'w-12' : 'w-60',
          ]"
        >
          <div
            class="h-12 flex items-center justify-between px-3 border-b border-gray-100"
          >
            <h2
              v-if="!sidebarCollapsed"
              class="text-sm font-bold text-gray-900 truncate"
            >
              {{ serviceSidebar.label }}
            </h2>
            <button
              @click="sidebarCollapsed = !sidebarCollapsed"
              class="p-1 rounded hover:bg-gray-100 text-gray-400"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="
                    sidebarCollapsed
                      ? 'M9 5l7 7-7 7'
                      : 'M15 19l-7-7 7-7'
                  "
                />
              </svg>
            </button>
          </div>

          <nav class="py-2">
            <NuxtLink
              v-for="item in serviceSidebar.items"
              :key="item.path"
              :to="item.path"
              :class="[
                'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                useRoute().path === item.path
                  ? 'bg-orange-50 text-[#ec7211] font-medium border-l-[3px] border-[#ec7211]'
                  : 'text-gray-700 hover:bg-orange-50/50 hover:text-[#ec7211] border-l-[3px] border-transparent',
              ]"
            >
              <span v-if="!sidebarCollapsed">{{ item.label }}</span>
            </NuxtLink>

            <template v-if="!sidebarCollapsed">
              <div
                v-for="group in serviceSidebar.groups"
                :key="group.label"
                class="mt-1"
              >
                <button
                  @click="toggleSidebarGroup(group.label)"
                  class="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-100 transition-colors"
                  style="background-color: #f1f3f3; border-left: 3px solid transparent"
                >
                  <span>{{ group.label }}</span>
                  <svg
                    :class="[
                      'w-3.5 h-3.5 text-gray-400 transition-transform duration-200',
                      sidebarGroupOpen[group.label]
                        ? 'rotate-90'
                        : 'rotate-0',
                    ]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <div
                  :class="[
                    'overflow-hidden transition-all duration-200 ease-in-out',
                    sidebarGroupOpen[group.label]
                      ? 'max-h-[600px]'
                      : 'max-h-0',
                  ]"
                >
                  <NuxtLink
                    v-for="item in group.items"
                    :key="item.path"
                    :to="item.path"
                    :class="[
                      'flex items-center gap-3 pl-8 pr-3 py-2 text-sm transition-colors',
                      useRoute().path === item.path
                        ? 'text-[#ec7211] font-normal border-l-[3px] border-[#ec7211] bg-[#fafafa]'
                        : 'text-[#545b64] hover:text-[#ec7211] border-l-[3px] border-transparent hover:bg-[#fafafa]',
                    ]"
                  >
                    <span>{{ item.label }}</span>
                  </NuxtLink>
                </div>
              </div>
            </template>
          </nav>
        </aside>

        <!-- Main content -->
        <div class="flex-1 min-w-0 flex flex-col">
          <main class="flex-1 overflow-y-auto">
            <div class="p-6">
              <slot />
            </div>
          </main>
        </div>
      </div>
    </div>

    <!-- Mobile sidebar overlay -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="mobileMenuOpen = false"
    />
  </div>
</template>
