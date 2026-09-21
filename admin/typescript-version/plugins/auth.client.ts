export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  // 初始化认证状态（从 localStorage 恢复 token + user）
  authStore.initAuth()
})
