// Block user role from accessing admin pages
export default defineNuxtRouteMiddleware((to) => {
  // Allow public pages
  if (to.path === '/login' || to.path === '/register') return

  // Redirect root
  if (to.path === '/' || to.path === '') {
    const saved = import.meta.client ? localStorage.getItem('auth-role') : null
    const home = saved === 'user' ? '/user/dashboard' : '/admin/dashboard'
    return navigateTo(home)
  }

  // Admin-only routes
  const adminRoutes = ['/admin/system/', '/admin/monitor/', '/admin/tools/', '/admin/dashboard']
  const saved = import.meta.client ? localStorage.getItem('auth-role') : null

  if (saved === 'user' && adminRoutes.some(r => to.path.startsWith(r))) {
    return navigateTo('/user/dashboard')
  }

  // If login role is user, block all admin routes
  const loginRole = import.meta.client ? localStorage.getItem('auth-login-role') : null
  if (loginRole === 'user' && adminRoutes.some(r => to.path.startsWith(r))) {
    return navigateTo('/user/dashboard')
  }
})
