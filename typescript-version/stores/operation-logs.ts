import { defineStore } from 'pinia'
import { operationLogService } from '~/services/api'

interface PageResponse<T> {
  code: number
  message: string
  data: T
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export const useOperationLogStore = defineStore('operationLogs', () => {
  const logs = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchLogs(params?: any) {
    loading.value = true
    error.value = null
    try {
      const response = await operationLogService.list(params) as PageResponse<any[]>
      // 后端返回的分页结构：{ code: 200, message: '...', data: [日志数组], ... }
      logs.value = response.data || []
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return { logs, loading, error, fetchLogs }
})
