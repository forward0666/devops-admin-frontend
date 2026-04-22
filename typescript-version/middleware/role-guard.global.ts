// Role-based route guard
import { useAuthStore, type UserRole } from '~/stores/auth'

// Admin-only routes (sys_admin, admin)
const adminRoutes = [
  '/admin/system/user/list',
  '/admin/system/user/view',
  '/admin/system/dept',
  '/admin/system/menu',
  '/admin/monitor/online',
  '/admin/monitor/log',
  '/admin/monitor/login-log',
  '/admin/tools/api',
  '/admin/tools/config',
]

// User routes (user role)
const userRoutes = [
  '/user/dashboard',
  '/user/profile',
  '/user/settings',
]

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Allow login/register pages for all
  if (to.path === '/login' || to.path === '/register') return

  // User role: can only access user routes + common pages
  if (authStore.isUser && adminRoutes.some(r => to.path.startsWith(r))) {
    return navigateTo(authStore.homeRoute)
  }

  // Admin role: redirect away from user-specific pages
  if (authStore.isAdmin && to.path.startsWith('/user/')) {
    // Allow admin to view user pages via switch button, don't block
    return
  }
})
