import { ref, onMounted, onUnmounted } from 'vue'

export interface PostMessagePayload {
  type: string
  action?: string
  data?: any
  source?: string
  target?: string
}

export function useAppShell() {
  const currentService = ref<string | null>(null)
  const iframeRef = ref<HTMLIFrameElement | null>(null)
  const isIframeLoaded = ref(false)
  const lastMessage = ref<PostMessagePayload | null>(null)

  function postToIframe(message: PostMessagePayload) {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[AppShell] No iframe content window available')
      return
    }
    iframeRef.value.contentWindow.postMessage(
      { ...message, source: 'cloud-console-shell' },
      '*'
    )
  }

  function handleMessage(event: MessageEvent) {
    const payload = event.data as PostMessagePayload
    if (!payload || typeof payload !== 'object') return
    if (payload.source === 'cloud-console-shell') return

    lastMessage.value = payload

    switch (payload.type) {
      case 'NAVIGATE':
        if (payload.data?.path) {
          navigateTo(payload.data.path)
        }
        break
      case 'RESIZE':
        if (iframeRef.value && payload.data?.height) {
          iframeRef.value.style.height = `${payload.data.height}px`
        }
        break
      case 'READY':
        isIframeLoaded.value = true
        // Send init + auth token to iframe
        postToIframe({
          type: 'INIT',
          data: {
            serviceId: currentService.value,
            theme: 'light',
            token: localStorage.getItem('app_token') || null,
            user: JSON.parse(localStorage.getItem('app_user') || 'null'),
          },
        })
        break
      case 'app:logout':
        // Sub-service requested logout — clear auth and redirect
        localStorage.removeItem('app_token')
        localStorage.removeItem('app_user')
        localStorage.removeItem('cloud_console_auth')
        window.location.href = '/'
        break
      case 'TITLE_UPDATE':
        if (payload.data?.title) {
          document.title = `${payload.data.title} - Cloud Console`
        }
        break
      default:
        console.log('[AppShell] Unknown message type:', payload.type)
    }
  }

  function setIframeRef(el: HTMLIFrameElement | null) {
    iframeRef.value = el
  }

  function setService(serviceId: string) {
    currentService.value = serviceId
    isIframeLoaded.value = false
  }

  onMounted(() => {
    window.addEventListener('message', handleMessage)
  })

  onUnmounted(() => {
    window.removeEventListener('message', handleMessage)
  })

  return {
    currentService,
    iframeRef,
    isIframeLoaded,
    lastMessage,
    postToIframe,
    setIframeRef,
    setService,
  }
}
