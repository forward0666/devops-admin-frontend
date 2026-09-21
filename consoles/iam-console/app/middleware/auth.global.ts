export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const isEmbedded = window.self !== window.top

  if (isEmbedded) {
    // Embedded: token arrives via postMessage from parent shell
    // Layout handles waiting/validation — don't block here
    return
  }

  // Direct access: require token in URL or localStorage
  const urlToken = to.query.token as string
  const storedToken = localStorage.getItem('app_token')
  const token = urlToken || storedToken

  if (!token) {
    // No token — redirect to /401 page (client-side only)
    return navigateTo('/401')
  }

  if (urlToken) {
    localStorage.setItem('app_token', urlToken)
  }
})
