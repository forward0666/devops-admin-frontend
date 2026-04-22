import { defineStore } from 'pinia'
import { menuService } from '~/services/api'

export const useMenuStore = defineStore('menus', () => {
  const menus = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMenus() {
    loading.value = true
    error.value = null
    try {
      menus.value = await menuService.list()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchMenuById(menuId: number) {
    loading.value = true
    error.value = null
    try {
      return await menuService.getById(menuId)
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchMenusByParentId(parentId: number) {
    loading.value = true
    error.value = null
    try {
      return await menuService.getByParentId(parentId)
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return []
    } finally {
      loading.value = false
    }
  }

  async function createMenu(data: any) {
    loading.value = true
    error.value = null
    try {
      const menu = await menuService.create(data)
      menus.value.push(menu)
      return menu
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateMenu(id: number, data: any) {
    loading.value = true
    error.value = null
    try {
      const updated = await menuService.update(id, data)
      const idx = menus.value.findIndex((m: any) => m.id === id)
      if (idx !== -1) menus.value[idx] = updated
      return updated
    } catch (e: any) {
      error.value = e.message || '请求失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteMenu(id: number) {
    loading.value = true
    error.value = null
    try {
      await menuService.delete(id)
      menus.value = menus.value.filter((m: any) => m.id !== id)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return { menus, loading, error, fetchMenus, fetchMenuById, fetchMenusByParentId, createMenu, updateMenu, deleteMenu }
})
