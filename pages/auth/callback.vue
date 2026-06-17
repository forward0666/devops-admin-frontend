<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { handleCallback } = useKeycloak()
const authStore = useAuthStore()
const { authService } = await import('~/services/api')
const loading = ref(true)
const errorMsg = ref('')

onMounted(async () => {
  try {
    const success = await handleCallback()
    if (success && authStore.token) {
      // Keycloak token 已拿到，调后端 /login/authSSO 换 devops-admin token
      try {
        const res = await authService.ssoLogin(authStore.token)
        if (res && res.token) {
          // 替换为 devops-admin 的 token
          authStore.setSSOToken(res.token, {
            id: res.id,
            username: res.username,
            email: res.email,
            fullName: res.fullName,
            role: res.role,
          })
          navigateTo(authStore.homeRoute)
        }
        else {
          errorMsg.value = 'SSO 登录失败：后端未返回 token'
        }
      }
      catch (e: any) {
        errorMsg.value = 'SSO 登录失败：' + (e.message || '未知错误')
      }
    }
    else {
      errorMsg.value = 'SSO 认证失败，请重试'
    }
  }
  catch (e: any) {
    errorMsg.value = e.message || 'SSO 认证失败'
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <VCard
      class="auth-card"
      max-width="400"
      pa-6
    >
      <VCardText class="text-center">
        <VProgressCircular
          v-if="loading"
          indeterminate
          color="primary"
          size="48"
          class="mb-4"
        />
        <h4 class="text-h4 mb-2">
          {{ loading ? '正在认证...' : '认证完成' }}
        </h4>
        <p class="text-body-1 text-medium-emphasis">
          {{ loading ? '正在处理 SSO 回调，请稍候...' : '' }}
        </p>
        <VAlert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          {{ errorMsg }}
        </VAlert>
        <VBtn
          v-if="errorMsg"
          class="mt-4"
          to="/login"
        >
          返回登录
        </VBtn>
      </VCardText>
    </VCard>
  </div>
</template>
