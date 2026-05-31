// Role-based route guard
import { useAuthStore, type UserRole } from '~/stores/auth'
import { LOGIN, ADMIN_GUARD_ROUTES, USER_GUARD_ROUTES } from '~/constants/routes'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Allow login/register pages for all
  if (to.path === LOGIN || to.path === '/register') return

  // User role: can only access user routes + common pages
  if (authStore.isUser && (ADMIN_GUARD_ROUTES as readonly string[]).some(r => to.path.startsWith(r))) {
    return navigateTo(authStore.homeRoute)
  }

  // Admin role: redirect away from user-specific pages
  if (authStore.isAdmin && to.path.startsWith('/user/')) {
    // Allow admin to view user pages via switch button, don't block
    return
  }
})
