export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login' || to.path === '/register') return

  const loginRole = useCookie('auth-login-role').value
  const adminRoles = ['sys_admin', 'admin', 'devops', 'leader']

  if (to.path === '/' || to.path === '') {
    const home = adminRoles.includes(loginRole || '') ? '/admin/dashboard' : '/user/dashboard'
    return navigateTo(home)
  }

  if (!adminRoles.includes(loginRole || '') && to.path.startsWith('/admin')) {
    return navigateTo('/user/dashboard')
  }
})
