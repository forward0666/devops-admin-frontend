export default defineEventHandler(async (event) => {
  try {
    return await $fetch('http://gateway.devops-admin.svc.cluster.local:8081/api/iam/password-policy')
  } catch (e) {
    console.error('[API] password-policy error:', e)
    return {}
  }
})
