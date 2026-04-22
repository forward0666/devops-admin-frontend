import { defineStore } from 'pinia'
import { operationLogService } from '~/services/api'

export const useOperationLogStore = defineStore('operationLogs', () => {
  const logs = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchLogs(params?: any) {
    loading.value = true
    error.value = null
    try {
      logs.value = await operationLogService.list(params)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return { logs, loading, error, fetchLogs }
})
