export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  try {
    return await $fetch(`http://gateway.devops-admin.svc.cluster.local:8081/api/iam/policies/${id}`)
  } catch (e) {
    console.error('[API] policy by id error:', e)
    return null
  }
})
