export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const saved = localStorage.getItem('auth-role')
  if (saved) {
    authStore.setRole(saved as any)
  }
  authStore.$patch({ _ready: true })
})
