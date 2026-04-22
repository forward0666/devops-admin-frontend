<script setup lang="ts">
import logo from '@images/logo.svg?raw'
import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?url'
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?url'

const authStore = useAuthStore()
const { authService } = await import('~/services/api')

const form = ref({
  username: '',
  password: '',
  verificationCode: '',
  remember: false,
})

const isPasswordVisible = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const captchaImage = ref('')
const captchaKey = ref('')

definePageMeta({ layout: 'blank' })

// 获取验证码
async function fetchCaptcha() {
  try {
    const res = await authService.getVerificationCode()
    captchaKey.value = res.codeId
    captchaImage.value = `data:image/png;base64,${res.image}`
  }
  catch (e: any) {
    console.error('获取验证码失败:', e)
  }
}

onMounted(() => {
  fetchCaptcha()
})

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''

  try {
    const success = await authStore.login(
      form.value.username,
      form.value.password,
      form.value.verificationCode,
      captchaKey.value,
    )

    if (success) {
      navigateTo(authStore.homeRoute)
    }
    else {
      errorMsg.value = '登录失败，请检查用户名和密码'
      fetchCaptcha()
    }
  }
  catch (e: any) {
    errorMsg.value = e.message || '登录失败，请稍后重试'
    fetchCaptcha()
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VImg
        :src="authV1TopShape"
        class="text-primary auth-v1-top-shape d-none d-sm-block"
      />

      <!-- 👉 Bottom shape -->
      <VImg
        :src="authV1BottomShape"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block"
      />

      <!-- 👉 Auth Card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <VCardItem class="justify-center">
          <NuxtLink
            to="/"
            class="app-logo"
          >
            <div
              class="d-flex"
              v-html="logo"
            />
          </NuxtLink>
        </VCardItem>

        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to JH DevOps! 👋🏻
          </h4>
          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>

        <VCardText>
          <!-- Error message -->
          <VAlert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMsg }}
          </VAlert>

          <VForm @submit.prevent="handleLogin">
            <VRow>
              <!-- username -->
              <VCol cols="12">
                <VTextField
                  v-model="form.username"
                  autofocus
                  label="Username"
                  placeholder="admin"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <VTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <!-- verification code -->
              <VCol cols="12">
                <div class="d-flex align-center gap-3">
                  <VTextField
                    v-model="form.verificationCode"
                    label="Verification Code"
                    placeholder="Enter code"
                    class="flex-grow-1"
                  />
                  <VBtn
                    variant="tonal"
                    size="large"
                    class="text-no-wrap"
                    :disabled="!captchaImage"
                    @click="fetchCaptcha"
                  >
                    <VImg
                      v-if="captchaImage"
                      :src="captchaImage"
                      width="120"
                      height="40"
                      contain
                    />
                    <span v-else>Get Code</span>
                  </VBtn>
                </div>
              </VCol>

              <!-- remember me checkbox -->
              <VCol cols="12">
                <div class="d-flex align-center justify-space-between flex-wrap my-2">
                  <VCheckbox
                    v-model="form.remember"
                    label="Remember me"
                  />

                  <a
                    class="text-primary"
                    href="javascript:void(0)"
                  >
                    Forgot Password?
                  </a>
                </div>
              </VCol>

              <!-- login button -->
              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="loading"
                >
                  Login
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider />
                <span class="mx-4 text-high-emphasis">or</span>
                <VDivider />
              </VCol>

              <!-- auth providers -->
              <VCol
                cols="12"
                class="text-center"
              >
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
