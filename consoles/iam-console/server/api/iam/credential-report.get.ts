export default defineEventHandler(async (event) => {
  try {
    return await $fetch('http://gateway.devops-admin.svc.cluster.local:8081/api/iam/credential-report')
  } catch (e) {
    console.error('[API] credential-report error:', e)
    return {}
  }
})
