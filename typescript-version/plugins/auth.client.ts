export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const saved = localStorage.getItem('auth-role')
  const savedLoginRole = localStorage.getItem('auth-login-role')
  if (saved) {
    authStore.role = saved as any
    if (savedLoginRole) authStore.loginRole = savedLoginRole as any
  }
  authStore.$patch({ _ready: true })
})
