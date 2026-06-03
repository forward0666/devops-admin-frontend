import { LOGIN, ADMIN, USER, HOME_ROUTE_MAP } from '~/constants/routes'

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === LOGIN || to.path === '/register') return

  const loginRole = useCookie('auth-login-role').value
  const adminRoles = ['sys_admin', 'admin', 'devops']

  if (to.path === '/' || to.path === '') {
    const home = adminRoles.includes(loginRole || '') ? ADMIN.DASHBOARD : USER.DASHBOARD
    return navigateTo(home)
  }

  if (!adminRoles.includes(loginRole || '') && to.path.startsWith('/admin')) {
    return navigateTo(USER.DASHBOARD)
  }

  // Sync consoleRole with current route path
  const authStore = useAuthStore()
  if (authStore._ready) {
    if (to.path.startsWith('/admin') && authStore.consoleRole !== 'admin') {
      authStore.setConsoleRole('admin')
    } else if (to.path.startsWith('/devops') && authStore.consoleRole !== 'devops') {
      authStore.setConsoleRole('devops')
    } else if (to.path.startsWith('/user') && authStore.consoleRole !== 'user') {
      authStore.setConsoleRole('user')
    }
  }
})
