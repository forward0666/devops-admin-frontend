export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login' || to.path === '/register') return

  const loginRole = useCookie('auth-login-role').value

  if (to.path === '/' || to.path === '') {
    const home = loginRole === 'user' ? '/user/dashboard' : '/admin/dashboard'
    return navigateTo(home)
  }

  if (loginRole === 'user' && to.path.startsWith('/admin')) {
    return navigateTo('/user/dashboard')
  }
})
