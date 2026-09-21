import { defineStore } from 'pinia'
import { positionService } from '~/services/api'

export const usePositionStore = defineStore('positions', () => {
  const positions = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPositions() {
    loading.value = true
    error.value = null
    try {
      positions.value = await positionService.list()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchPositionById(id: number) {
    loading.value = true
    error.value = null
    try {
      return await positionService.getById(id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchPositionsByDepartment(departmentId: number) {
    loading.value = true
    error.value = null
    try {
      positions.value = await positionService.getByDepartment(departmentId)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function createPosition(data: any) {
    loading.value = true
    error.value = null
    try {
      const position = await positionService.create(data)
      positions.value.push(position)
      return position
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updatePosition(id: number, data: any) {
    loading.value = true
    error.value = null
    try {
      const updated = await positionService.update(id, data)
      const idx = positions.value.findIndex((p: any) => p.id === id)
      if (idx !== -1) positions.value[idx] = updated
      return updated
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deletePosition(id: number) {
    loading.value = true
    error.value = null
    try {
      await positionService.delete(id)
      positions.value = positions.value.filter((p: any) => p.id !== id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return {
    positions, loading, error,
    fetchPositions, fetchPositionById, fetchPositionsByDepartment,
    createPosition, updatePosition, deletePosition,
  }
})
