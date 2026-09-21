<script setup lang="ts">
definePageMeta({ layout: false })

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const rememberMe = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Please enter username and password'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const resp = await $fetch<any>('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })

    if (resp.success && resp.token) {
      localStorage.setItem('app_token', resp.token)
      if (resp.user) {
        localStorage.setItem('app_user', JSON.stringify(resp.user))
      }
      navigateTo('/')
    } else {
      error.value = resp.message || 'Login failed'
    }
  } catch (e: any) {
    error.value = e?.data?.message || 'Login service unavailable'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#232f3e] flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-[#ec7211] rounded-lg flex items-center justify-center mx-auto mb-4">
          <span class="text-white font-bold text-2xl">C</span>
        </div>
        <h1 class="text-white text-xl font-semibold">Cloud Console</h1>
        <p class="text-gray-400 text-sm mt-1">Sign in to continue</p>
      </div>

      <!-- Login Form -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <form @submit.prevent="handleLogin">
          <!-- Error -->
          <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {{ error }}
          </div>

          <!-- Username -->
          <div class="mb-4">
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="Enter your username"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ec7211] focus:border-transparent"
            />
          </div>

          <!-- Password -->
          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#ec7211] focus:border-transparent"
            />
          </div>

          <!-- Remember Me -->
          <div class="flex items-center justify-between mb-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="rememberMe" type="checkbox" class="w-4 h-4 text-[#ec7211] border-gray-300 rounded focus:ring-[#ec7211]" />
              <span class="text-sm text-gray-600">Remember me</span>
            </label>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 bg-[#ec7211] text-white rounded-md text-sm font-medium hover:bg-[#d6650e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec7211] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Signing in...
            </span>
            <span v-else>Sign In</span>
          </button>
        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-gray-500 text-xs mt-6">
        Cloud Console &copy; 2026
      </p>
    </div>
  </div>
</template>
