import { defineStore } from 'pinia'
import { dashboardService } from '~/services/api'

export const useDashboardStore = defineStore('dashboard', () => {
  const recentActivities = ref<any[]>([])
  const stats = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRecentActivities() {
    loading.value = true
    error.value = null
    try {
      recentActivities.value = await dashboardService.getRecentActivities()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    loading.value = true
    error.value = null
    try {
      stats.value = await dashboardService.getStats()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return { recentActivities, stats, loading, error, fetchRecentActivities, fetchStats }
})
