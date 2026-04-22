import { defineStore } from 'pinia'
import { permissionService } from '~/services/api'

export const usePermissionStore = defineStore('permissions', () => {
  const permissions = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPermissions() {
    loading.value = true
    error.value = null
    try {
      permissions.value = await permissionService.list()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchPermissionsByRole(roleId: number) {
    loading.value = true
    error.value = null
    try {
      permissions.value = await permissionService.getByRole(roleId)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function updatePermissionsByRole(roleId: number, data: any) {
    loading.value = true
    error.value = null
    try {
      await permissionService.updateByRole(roleId, data)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function deletePermissionsByRole(roleId: number) {
    loading.value = true
    error.value = null
    try {
      await permissionService.deleteByRole(roleId)
      permissions.value = []
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return { permissions, loading, error, fetchPermissions, fetchPermissionsByRole, updatePermissionsByRole, deletePermissionsByRole }
})
