import { ref, onMounted, onUnmounted } from 'vue'

interface AppShellMessage {
  type: string
  payload?: any
  data?: any
  source?: string
}

interface AppShellOptions {
  allowedOrigin?: string
}

const isEmbedded = ref(false)
const shellReady = ref(false)
const authToken = ref<string | null>(null)
const shellUser = ref<any>(null)
const authValid = ref<boolean | null>(null) // null=unknown, true=valid, false=invalid

export function useAppShell(options: AppShellOptions = {}) {
  const origin = options.allowedOrigin ?? '*'

  function postToShell(msg: AppShellMessage) {
    if (import.meta.server) return
    window.parent.postMessage(msg, origin)
  }

  function handleMessage(event: MessageEvent) {
    if (origin !== '*' && event.origin !== origin) return

    const data = event.data as AppShellMessage
    if (!data?.type) return

    switch (data.type) {
      case 'INIT':
        if (data.data?.token) {
          authToken.value = data.data.token
          localStorage.setItem('app_token', data.data.token)
          authValid.value = true
        } else {
          authValid.value = false
        }
        if (data.data?.user) {
          shellUser.value = data.data.user
          localStorage.setItem('app_user', JSON.stringify(data.data.user))
        }
        shellReady.value = true
        break

      case 'shell:navigate':
        if (data.payload?.path) {
          navigateTo(data.payload.path)
        }
        break

      case 'shell:auth':
        if (data.payload?.token) {
          authToken.value = data.payload.token
          localStorage.setItem('app_token', data.payload.token)
          authValid.value = true
        }
        break

      case 'shell:ping':
        postToShell({ type: 'shell:pong' })
        break
    }
  }

  function notifyRouteChange(path: string) {
    postToShell({ type: 'route:change', payload: { path } })
  }

  function notifyReady() {
    postToShell({ type: 'READY', data: { app: 'service-console' } })
  }

  function notifyError(error: string) {
    postToShell({ type: 'app:error', payload: { app: 'service-console', error } })
  }

  function getToken(): string | null {
    return authToken.value || localStorage.getItem('app_token')
  }

  function resetAuth() {
    authToken.value = null
    shellUser.value = null
    authValid.value = false
    localStorage.removeItem('app_token')
    localStorage.removeItem('app_user')
  }

  onMounted(() => {
    if (import.meta.client) {
      isEmbedded.value = window.self !== window.top

      if (isEmbedded.value) {
        window.addEventListener('message', handleMessage)
        const stored = localStorage.getItem('app_token')
        if (stored) {
          authToken.value = stored
          authValid.value = true
        }
        notifyReady()
      } else {
        const urlParams = new URLSearchParams(window.location.search)
        const urlToken = urlParams.get('token')
        if (urlToken) {
          authToken.value = urlToken
          localStorage.setItem('app_token', urlToken)
          authValid.value = true
        } else {
          const stored = localStorage.getItem('app_token')
          if (stored) {
            authToken.value = stored
            authValid.value = true
          } else {
            authValid.value = false
          }
        }
      }
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('message', handleMessage)
    }
  })

  return {
    isEmbedded,
    shellReady,
    authToken,
    shellUser,
    authValid,
    postToShell,
    notifyRouteChange,
    notifyReady,
    notifyError,
    getToken,
    resetAuth,
  }
}
