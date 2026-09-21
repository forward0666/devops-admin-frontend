import { defineStore } from 'pinia'
import { departmentService } from '~/services/api'

export const useDepartmentStore = defineStore('departments', () => {
  const departments = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDepartments() {
    loading.value = true
    error.value = null
    try {
      departments.value = await departmentService.list()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchDepartmentById(id: number) {
    loading.value = true
    error.value = null
    try {
      return await departmentService.getById(id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createDepartment(data: any) {
    loading.value = true
    error.value = null
    try {
      const dept = await departmentService.create(data)
      departments.value.push(dept)
      return dept
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateDepartment(id: number, data: any) {
    loading.value = true
    error.value = null
    try {
      const updated = await departmentService.update(id, data)
      const idx = departments.value.findIndex((d: any) => d.id === id)
      if (idx !== -1) departments.value[idx] = updated
      return updated
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteDepartment(id: number) {
    loading.value = true
    error.value = null
    try {
      await departmentService.delete(id)
      departments.value = departments.value.filter((d: any) => d.id !== id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchDepartmentUsers(id: number) {
    loading.value = true
    error.value = null
    try {
      return await departmentService.getUsers(id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return []
    } finally {
      loading.value = false
    }
  }

  async function searchDepartments(query: string) {
    loading.value = true
    error.value = null
    try {
      departments.value = await departmentService.search(query)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return {
    departments, loading, error,
    fetchDepartments, fetchDepartmentById, createDepartment,
    updateDepartment, deleteDepartment, fetchDepartmentUsers, searchDepartments,
  }
})
