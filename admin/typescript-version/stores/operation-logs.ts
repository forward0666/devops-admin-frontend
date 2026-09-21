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
      const response = await operationLogService.list(params)
      console.log('Operation log response:', response)
      
      // 处理不同的响应结构
      let logData = []
      if (Array.isArray(response)) {
        // 如果直接返回数组
        logData = response
      } else if (response && response.data && Array.isArray(response.data)) {
        // 如果返回 { data: [...] }
        logData = response.data
      } else if (response && response.content && Array.isArray(response.content)) {
        // 如果返回 { content: [...] }
        logData = response.content
      } else {
        // 其他情况，尝试直接取 data 或整个响应
        logData = response.data || response || []
      }
      
      console.log('Processed log data:', logData)
      logs.value = logData
    } catch (e: any) {
      console.error('Failed to fetch logs:', e)
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return { logs, loading, error, fetchLogs }
})
