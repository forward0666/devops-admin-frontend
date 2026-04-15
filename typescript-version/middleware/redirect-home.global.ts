// Redirect to correct home based on role
export default defineNuxtRouteMiddleware((to) => {
  // Only on exact root
  if (to.path === '/' || to.path === '') {
    const saved = import.meta.client ? localStorage.getItem('auth-role') : null
    const home = saved === 'user' ? '/user/dashboard' : '/dashboard'
    return navigateTo(home)
  }
})
