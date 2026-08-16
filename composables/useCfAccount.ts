import apiClient from '~/services/api'

const CF_GATEWAY = '/cloudflare'

export function useCfAccount() {
  const accounts = ref<any[]>([])
  const loading = ref(false)
  const tokenCache = ref<Record<string, string>>({})

  async function fetchAccounts() {
    loading.value = true
    try {
      const { data } = await apiClient.get(`${CF_GATEWAY}/accounts`)
      accounts.value = (data.data || []).map((a: any) => ({
        ...a,
        tags: typeof a.tags === 'string' ? a.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : Array.isArray(a.tags) ? a.tags : [],
      }))
    } catch (e) {
      console.error('Failed to fetch accounts', e)
    } finally {
      loading.value = false
    }
  }

  async function getToken(accountId: string): Promise<string> {
    if (tokenCache.value[accountId]) return tokenCache.value[accountId]
    const { data } = await apiClient.get(`${CF_GATEWAY}/accounts/${accountId}/token`)
    const token = data.data?.token
    if (token) tokenCache.value[accountId] = token
    return token
  }

  function maskKey(key: string) {
    if (!key || key.length <= 8) return '••••••••'
    return key.slice(0, 4) + '••••••••' + key.slice(-4)
  }

  return { accounts, loading, fetchAccounts, getToken, maskKey, CF_GATEWAY }
}
