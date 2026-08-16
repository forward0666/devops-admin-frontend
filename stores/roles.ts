import { defineStore } from 'pinia'
import { roleService } from '~/services/api'

export const useRoleStore = defineStore('roles', () => {
  const roles = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRoles() {
    loading.value = true
    error.value = null
    try {
      roles.value = await roleService.list()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchRoleById(id: number) {
    loading.value = true
    error.value = null
    try {
      return await roleService.getById(id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createRole(data: any) {
    loading.value = true
    error.value = null
    try {
      const role = await roleService.create(data)
      roles.value.push(role)
      return role
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateRole(id: number, data: any) {
    loading.value = true
    error.value = null
    try {
      const updated = await roleService.update(id, data)
      const idx = roles.value.findIndex((r: any) => r.id === id)
      if (idx !== -1) roles.value[idx] = updated
      return updated
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteRole(id: number) {
    loading.value = true
    error.value = null
    try {
      await roleService.delete(id)
      roles.value = roles.value.filter((r: any) => r.id !== id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return { roles, loading, error, fetchRoles, fetchRoleById, createRole, updateRole, deleteRole }
})
