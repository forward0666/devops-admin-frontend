import { defineStore } from 'pinia'
import { userService } from '~/services/api'

export const useUserStore = defineStore('users', () => {
  const users = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      users.value = await userService.list()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchUserById(id: number) {
    loading.value = true
    error.value = null
    try {
      return await userService.getById(id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createUser(data: any) {
    loading.value = true
    error.value = null
    try {
      const user = await userService.create(data)
      users.value.push(user)
      return user
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id: number, data: any) {
    loading.value = true
    error.value = null
    try {
      const updated = await userService.update(id, data)
      const idx = users.value.findIndex((u: any) => u.id === id)
      if (idx !== -1) users.value[idx] = updated
      return updated
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id: number) {
    loading.value = true
    error.value = null
    try {
      await userService.delete(id)
      users.value = users.value.filter((u: any) => u.id !== id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function changePassword(id: number, data: { oldPassword: string, newPassword: string }) {
    loading.value = true
    error.value = null
    try {
      await userService.changePassword(id, data)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(id: number, data: { newPassword: string }) {
    loading.value = true
    error.value = null
    try {
      await userService.resetPassword(id, data)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function verifyEmail(id: number) {
    loading.value = true
    error.value = null
    try {
      await userService.verifyEmail(id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function verifyPhone(id: number) {
    loading.value = true
    error.value = null
    try {
      await userService.verifyPhone(id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function searchUsers(query: string) {
    loading.value = true
    error.value = null
    try {
      users.value = await userService.search(query)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchUsersByDepartment(departmentId: number) {
    loading.value = true
    error.value = null
    try {
      users.value = await userService.getByDepartment(departmentId)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return {
    users, loading, error,
    fetchUsers, fetchUserById, createUser, updateUser, deleteUser,
    changePassword, resetPassword, verifyEmail, verifyPhone,
    searchUsers, fetchUsersByDepartment,
  }
})
