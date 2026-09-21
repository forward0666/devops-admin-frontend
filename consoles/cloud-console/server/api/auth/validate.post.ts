export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const token = body?.token

  if (!token) {
    return { success: false, message: 'Token is required' }
  }

  // Call security service to validate token
  try {
    const resp = await $fetch<any>(
      'http://security.devops-admin.svc.cluster.local:8082/security/validate',
      {
        method: 'POST',
        body: { token },
        timeout: 5000,
      }
    )

    return {
      success: resp?.success ?? false,
      data: resp?.data,
      message: resp?.message,
    }
  } catch (error: any) {
    // 400 from security = invalid token
    if (error?.response?.status === 400) {
      try {
        const errBody = await error.response.json()
        return {
          success: false,
          message: errBody?.message || 'Token is invalid or expired',
        }
      } catch {
        return { success: false, message: 'Token is invalid' }
      }
    }

    console.error('[auth/validate] Error:', error?.message)
    return {
      success: false,
      message: 'Token validation service unavailable',
    }
  }
})
