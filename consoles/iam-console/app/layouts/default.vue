<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useAppShell } from '~/composables/useAppShell'

const { user, isAuthenticated, login, logout } = useAuth()
const { isEmbedded, notifyRouteChange, authValid, shellReady, resetAuth } = useAppShell()

const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)
const showUserMenu = ref(false)

// Sidebar group open state
const sidebarGroupOpen = ref<Record<string, boolean>>({
  'Access management': true,
  'Access reports': true,
  'Account settings': true,
  'Multi-account access': true,
})

// Access Analyzer sub-group state
const accessAnalyzerOpen = ref(true)

function toggleSidebarGroup(label: string) {
  sidebarGroupOpen.value[label] = !sidebarGroupOpen.value[label]
}

// IAM sidebar definition (standalone — no service selector needed)
const iamSidebar = {
  label: 'IAM',
  path: '/iam',
  items: [
    { path: '/iam', label: 'Dashboard' },
  ],
  groups: [
    {
      label: 'Access Management',
      defaultOpen: true,
      items: [
        { path: '/iam/roles', label: 'Roles' },
        { path: '/iam/policies', label: 'Policies' },
        { path: '/iam/users', label: 'IAM users' },
        { path: '/iam/groups', label: 'IAM user groups' },
        { path: '/iam/identity-providers', label: 'Identity providers' },
      ],
    },
    {
      label: 'Account settings',
      items: [
        { path: '/iam/account-settings', label: 'Root access management' },
      ],
    },
    {
      label: 'Access reports',
      items: [
        { path: '/iam/policy-simulator', label: 'Policy simulator' },
        { path: '/iam/credential-report', label: 'Credential report' },
      ],
      subgroups: [
        {
          label: 'Access Analyzer',
          defaultOpen: true,
          items: [
            { path: '/iam/access-analyzer', label: 'Resource analysis' },
            { path: '/iam/access-analyzer/unused-access', label: 'Unused access' },
            { path: '/iam/access-analyzer/settings', label: 'Analyzer settings' },
          ],
        },
      ],
    },
    {
      label: 'Multi-account access',
      items: [
        { path: '/iam/multi-account', label: 'Account access manager' },
        { path: '/iam/multi-account/organization', label: 'Organization activity' },
        { path: '/iam/multi-account/scp', label: 'Service control policies' },
        { path: '/iam/multi-account/rcp', label: 'Resource control policies' },
      ],
    },
  ],
}

const currentBreadcrumb = computed(() => {
  const route = useRoute()
  const crumbs = [{ label: 'IAM', path: '/iam' }]
  const current = iamSidebar.items.find(
    (i) => i.path === route.path && i.path !== '/iam'
  )
  if (current) {
    crumbs.push({ label: current.label, path: current.path })
  }
  if (!current) {
    for (const group of iamSidebar.groups) {
      const found = group.items.find((i) => i.path === route.path)
      if (found) {
        crumbs.push({ label: found.label, path: found.path })
        break
      }
      if (group.subgroups) {
        for (const sg of group.subgroups) {
          const sf = sg.items.find((i) => i.path === route.path)
          if (sf) {
            crumbs.push({ label: sf.label, path: sf.path })
            break
          }
        }
      }
    }
  }
  return crumbs
})

function handleLogout() {
  if (import.meta.client) {
    localStorage.clear()
    if (window.self !== window.top) {
      // Embedded: tell parent shell to handle logout
      window.parent.postMessage({ type: 'app:logout', source: 'iam-console' }, '*')
    } else {
      // Direct access: just reload to show 401
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
    <!-- ═══════════════ MAIN CONTENT AREA ═══════════════ -->
    <div class="flex flex-col flex-1">
      <!-- Breadcrumb bar (full width, above sidebar+content) -->
      <div
        class="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2 text-sm shrink-0"
      >
        <NuxtLink
          to="/iam"
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
        <!-- IAM sidebar -->
        <aside
          :class="[
            'bg-white border-r border-gray-200 shrink-0 overflow-y-auto transition-all duration-200 hidden lg:block',
            sidebarCollapsed ? 'w-12' : 'w-60',
          ]"
        >
          <!-- Sidebar header -->
          <div
            class="h-12 flex items-center justify-between px-3 border-b border-gray-100"
          >
            <h2
              v-if="!sidebarCollapsed"
              class="text-sm font-bold text-gray-900 truncate"
            >
              {{ iamSidebar.label }}
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

          <!-- Sidebar nav -->
          <nav class="py-2">
            <!-- Flat items (Dashboard) -->
            <NuxtLink
              v-for="item in iamSidebar.items"
              :key="item.path"
              :to="item.path"
              :class="[
                'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                useRoute().path === item.path
                  ? 'bg-blue-50 text-blue-700 font-medium border-l-[3px] border-blue-600'
                  : 'text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 border-l-[3px] border-transparent',
              ]"
            >
              <span v-if="!sidebarCollapsed">{{ item.label }}</span>
            </NuxtLink>

            <!-- Grouped items (collapsible) -->
            <template v-if="!sidebarCollapsed">
              <div
                v-for="group in iamSidebar.groups"
                :key="group.label"
                class="mt-1"
              >
                <!-- Group header -->
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

                <!-- Group items container -->
                <div
                  :class="[
                    'overflow-hidden transition-all duration-200 ease-in-out',
                    sidebarGroupOpen[group.label]
                      ? 'max-h-[600px]'
                      : 'max-h-0',
                  ]"
                >
                  <!-- Subgroups (e.g. Access Analyzer) -->
                  <template v-if="group.subgroups">
                    <template
                      v-for="sg in group.subgroups"
                      :key="sg.label"
                    >
                      <button
                        @click="
                          accessAnalyzerOpen = !accessAnalyzerOpen
                        "
                        class="w-full flex items-center justify-between pl-8 pr-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-blue-50/50 transition-colors"
                      >
                        <span>{{ sg.label }}</span>
                        <svg
                          :class="[
                            'w-3 h-3 text-gray-400 transition-transform duration-200',
                            accessAnalyzerOpen
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
                          accessAnalyzerOpen
                            ? 'max-h-[300px]'
                            : 'max-h-0',
                        ]"
                      >
                        <NuxtLink
                          v-for="item in sg.items"
                          :key="item.path"
                          :to="item.path"
                          :class="[
                            'flex items-center gap-3 pl-12 pr-3 py-2 text-sm transition-colors',
                            useRoute().path === item.path
                              ? 'text-[#ec7211] font-normal border-l-[3px] border-[#ec7211] bg-[#fafafa]'
                              : 'text-[#545b64] hover:text-[#ec7211] border-l-[3px] border-transparent hover:bg-[#fafafa]',
                          ]"
                        >
                          <span>{{ item.label }}</span>
                        </NuxtLink>
                      </div>
                    </template>
                    <!-- Standalone items in the group -->
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
                  </template>

                  <!-- Regular group items (no subgroups) -->
                  <template v-else>
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
                  </template>
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
