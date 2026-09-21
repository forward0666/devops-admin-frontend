export default defineEventHandler(async (event) => {
  try {
    return await $fetch('http://gateway.devops-admin.svc.cluster.local:8081/api/iam/unused-access')
  } catch (e) {
    console.error('[API] unused-access error:', e)
    return []
  }
})
