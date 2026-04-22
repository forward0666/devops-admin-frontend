import { defineStore } from 'pinia'
import { settingsService } from '~/services/api'

export const useSettingsStore = defineStore('settings', () => {
  const systemConfig = ref<any>(null)
  const securityConfig = ref<any>(null)
  const passwordPolicy = ref<any>(null)
  const loginSettings = ref<any>(null)
  const ipControl = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSystemConfig() {
    loading.value = true
    error.value = null
    try {
      systemConfig.value = await settingsService.getSystem()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function updateSystemConfig(data: any) {
    loading.value = true
    error.value = null
    try {
      await settingsService.updateSystem(data)
      systemConfig.value = { ...systemConfig.value, ...data }
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchSecurity() {
    loading.value = true
    error.value = null
    try {
      securityConfig.value = await settingsService.getSecurity()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function updateSecurity(data: any) {
    loading.value = true
    error.value = null
    try {
      await settingsService.updateSecurity(data)
      securityConfig.value = { ...securityConfig.value, ...data }
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchPasswordPolicy() {
    loading.value = true
    error.value = null
    try {
      passwordPolicy.value = await settingsService.getPasswordPolicy()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function updatePasswordPolicy(data: any) {
    loading.value = true
    error.value = null
    try {
      await settingsService.updatePasswordPolicy(data)
      passwordPolicy.value = { ...passwordPolicy.value, ...data }
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchLoginSettings() {
    loading.value = true
    error.value = null
    try {
      loginSettings.value = await settingsService.getLoginSettings()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function updateLoginSettings(data: any) {
    loading.value = true
    error.value = null
    try {
      await settingsService.updateLoginSettings(data)
      loginSettings.value = { ...loginSettings.value, ...data }
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchIpControl() {
    loading.value = true
    error.value = null
    try {
      ipControl.value = await settingsService.getIpControl()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function updateIpControl(data: any) {
    loading.value = true
    error.value = null
    try {
      await settingsService.updateIpControl(data)
      ipControl.value = { ...ipControl.value, ...data }
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function addIpWhitelist(data: any) {
    loading.value = true
    error.value = null
    try {
      await settingsService.addIpWhitelist(data)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function removeIpWhitelist(data: any) {
    loading.value = true
    error.value = null
    try {
      await settingsService.removeIpWhitelist(data)
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function clearCache() {
    loading.value = true
    error.value = null
    try {
      await settingsService.clearCache()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  async function clearAllCache() {
    loading.value = true
    error.value = null
    try {
      await settingsService.clearAllCache()
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      loading.value = false
    }
  }

  return {
    systemConfig, securityConfig, passwordPolicy, loginSettings, ipControl,
    loading, error,
    fetchSystemConfig, updateSystemConfig,
    fetchSecurity, updateSecurity,
    fetchPasswordPolicy, updatePasswordPolicy,
    fetchLoginSettings, updateLoginSettings,
    fetchIpControl, updateIpControl,
    addIpWhitelist, removeIpWhitelist,
    clearCache, clearAllCache,
  }
})
