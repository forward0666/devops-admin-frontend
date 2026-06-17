// Keycloak SSO 集成
import Keycloak from 'keycloak-js'

let keycloak: Keycloak | null = null

function getKeycloakConfig() {
  const rc = useRuntimeConfig()
  const url = rc.public.keycloakUrl as string
  const realm = rc.public.keycloakRealm as string
  const clientId = rc.public.keycloakClientId as string
  if (!url || !realm || !clientId) {
    console.warn('[Keycloak] Missing runtime config, using defaults')
  }
  return {
    url: url || 'https://keycloak.sdjk35.com',
    realm: realm || 'master',
    clientId: clientId || 'devops-admin',
  }
}

export function useKeycloak() {
  const authStore = useAuthStore()

  function getOrCreate(): Keycloak {
    if (!keycloak) {
      keycloak = new Keycloak(getKeycloakConfig())
    }
    return keycloak
  }

  /** 跳转 Keycloak 登录页 */
  async function loginWithKeycloak() {
    const kc = getOrCreate()
    try {
      await kc.init({
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        responseMode: 'query',
        redirectUri: `${window.location.origin}/auth/callback`,
      })
    }
    catch (err) {
      console.error('Keycloak login failed:', err)
      throw err
    }
  }

  /** 处理回调（从 Keycloak 跳回来后调用） */
  async function handleCallback(): Promise<boolean> {
    const kc = getOrCreate()
    try {
      console.log('[Keycloak] Callback URL:', window.location.href)
      const authenticated = await kc.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        responseMode: 'query',
        redirectUri: `${window.location.origin}/auth/callback`,
      })
      console.log('[Keycloak] Authenticated:', authenticated, 'Token:', !!kc.token)

      if (authenticated && kc.token) {
        const tokenParsed = kc.tokenParsed as any

        authStore.setSSOToken(kc.token, {
          id: tokenParsed.sub,
          username: tokenParsed.preferred_username || tokenParsed.email,
          email: tokenParsed.email,
          fullName: tokenParsed.name,
          role: mapKeycloakRole(tokenParsed),
        })

        setupTokenRefresh()
        return true
      }
      return false
    }
    catch (err) {
      console.error('Keycloak init failed:', err)
      return false
    }
  }

  function mapKeycloakRole(tokenParsed: any): string {
    const roles = tokenParsed?.realm_access?.roles || []
    if (roles.includes('sys_admin')) return 'sys_admin'
    if (roles.includes('admin')) return 'admin'
    if (roles.includes('devops')) return 'devops'
    return 'user'
  }

  function setupTokenRefresh() {
    const kc = getOrCreate()
    setInterval(async () => {
      try {
        const refreshed = await kc.updateToken(30)
        if (refreshed && kc.token) {
          authStore.token = kc.token
        }
      }
      catch {
        console.warn('Token refresh failed')
      }
    }, 30000)
  }

  async function logoutKeycloak() {
    const kc = getOrCreate()
    await kc.logout({
      redirectUri: `${window.location.origin}/login`,
    })
  }

  return {
    loginWithKeycloak,
    handleCallback,
    logoutKeycloak,
  }
}
