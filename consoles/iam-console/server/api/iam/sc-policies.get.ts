export default defineEventHandler(async (event) => {
  try {
    return await $fetch('http://gateway.devops-admin.svc.cluster.local:8081/api/iam/sc-policies')
  } catch (e) {
    console.error('[API] sc-policies error:', e)
    return []
  }
})
