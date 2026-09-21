export interface ServiceEntry {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  category: string
  url: string
  status: 'published' | 'in-development' | 'experimental' | 'deprecated'
  version: string
  owner: string
  tags: string[]
  sortOrder?: number
}

const services = ref<ServiceEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const loaded = ref(false)

export function useServices() {
  async function fetchServices() {
    if (loaded.value && services.value.length > 0) return services.value
    loading.value = true
    error.value = null
    try {
      // Pass token for server-side permission filtering
      const token = import.meta.client ? localStorage.getItem('app_token') : null
      const data = await $fetch<ServiceEntry[]>('/api/services/enabled', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      services.value = data
      loaded.value = true
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to load services'
      console.error('[useServices]', e)
      return []
    } finally {
      loading.value = false
    }
  }

  function getServiceById(id: string): ServiceEntry | undefined {
    return services.value.find(s => s.id === id)
  }

  function searchServices(query: string): ServiceEntry[] {
    const q = query.toLowerCase()
    return services.value.filter(s =>
      s.displayName.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.includes(q))
    )
  }

  function getServicesByCategory(category: string): ServiceEntry[] {
    return services.value.filter(s => s.category === category)
  }

  function refresh() {
    loaded.value = false
    services.value = []
    return fetchServices()
  }

  return {
    services: readonly(services),
    loading: readonly(loading),
    error: readonly(error),
    fetchServices,
    getServiceById,
    searchServices,
    getServicesByCategory,
    refresh,
  }
}
