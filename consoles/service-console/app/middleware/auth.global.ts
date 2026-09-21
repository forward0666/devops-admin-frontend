export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const isEmbedded = window.self !== window.top

  if (isEmbedded) {
    return
  }

  const urlToken = to.query.token as string
  const storedToken = localStorage.getItem('app_token')
  const token = urlToken || storedToken

  if (!token) {
    return navigateTo('/401')
  }

  if (urlToken) {
    localStorage.setItem('app_token', urlToken)
  }
})
