export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  // Login page is always accessible
  if (to.path === '/login') return

  // Check for token
  const token = localStorage.getItem('app_token')
  if (!token) {
    return navigateTo('/login')
  }
})
