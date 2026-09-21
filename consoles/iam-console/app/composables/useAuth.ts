import { ref, computed } from 'vue'

interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
  permissions: string[]
}

const user = ref<User | null>(null)
const isLoading = ref(false)
const AUTH_CACHE_KEY = 'cloud_console_auth'
const AUTH_CACHE_TTL = 3600000 // 1 hour

// Global logout event — useAppShell listens to this
const logoutEvent = ref(0)

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value)

  function loadFromCache(): boolean {
    if (import.meta.server) return false
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY)
      if (!cached) return false
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp > AUTH_CACHE_TTL) {
        localStorage.removeItem(AUTH_CACHE_KEY)
        return false
      }
      user.value = data
      return true
    } catch {
      return false
    }
  }

  function saveToCache(userData: User) {
    if (import.meta.server) return
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
      data: userData,
      timestamp: Date.now(),
    }))
  }

  async function login() {
    if (loadFromCache()) return
    isLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockUser: User = {
        id: 'usr-001',
        username: 'admin',
        email: 'admin@cloudconsole.io',
        role: 'Administrator',
        permissions: ['iam:*', 'settings:*'],
      }
      user.value = mockUser
      saveToCache(mockUser)
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
    if (import.meta.server) return

    // Clear all auth state
    localStorage.removeItem(AUTH_CACHE_KEY)
    localStorage.removeItem('app_token')
    localStorage.removeItem('app_user')

    // Trigger logout event (useAppShell listens)
    logoutEvent.value++

    // If embedded in iframe, notify parent shell
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'app:logout', source: 'iam-console' }, '*')
    } else {
      // Direct access — redirect to main console
      window.location.href = 'https://console.192.168.86.12.nip.io'
    }
  }

  function hasPermission(perm: string): boolean {
    if (!user.value) return false
    return user.value.permissions.some(p => p === perm || p.endsWith(':*'))
  }

  return { user, isAuthenticated, isLoading, login, logout, hasPermission, loadFromCache, logoutEvent }
}
