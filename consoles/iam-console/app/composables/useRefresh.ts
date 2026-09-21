import { ref } from 'vue'

export function useRefresh(fetchFn: () => Promise<void>) {
  const isRefreshing = ref(false)
  const lastRefreshed = ref<Date | null>(null)

  async function refresh() {
    isRefreshing.value = true
    try {
      await fetchFn()
      lastRefreshed.value = new Date()
    } finally {
      isRefreshing.value = false
    }
  }

  return { isRefreshing, lastRefreshed, refresh }
}
