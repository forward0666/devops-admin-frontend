export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body || {}

  if (!username || !password) {
    return { success: false, message: 'Username and password are required' }
  }

  try {
    // Call login service via gateway
    const resp = await $fetch<any>(
      'http://gateway.devops-admin.svc.cluster.local:8081/login/authLogIn',
      {
        method: 'POST',
        body: { username, password },
        timeout: 10000,
      }
    )

    if (resp?.code === 200 && resp?.data) {
      return {
        success: true,
        token: resp.data.token,
        user: { username: resp.data.username || username },
      }
    }

    return {
      success: false,
      message: resp?.message || 'Invalid credentials',
    }
  } catch (error: any) {
    if (error?.response?.status === 401) {
      return { success: false, message: 'Invalid username or password' }
    }
    console.error('[auth/login] Error:', error?.message)
    return { success: false, message: 'Login service unavailable' }
  }
})
