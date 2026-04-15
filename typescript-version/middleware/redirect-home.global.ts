// Redirect to correct home based on role
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Only apply on exact root or dashboard
  if (to.path === '/' || to.path === '') {
    return navigateTo(authStore.homeRoute)
  }
})
