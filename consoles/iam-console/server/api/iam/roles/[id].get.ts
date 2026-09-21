export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  try {
    return await $fetch(`http://gateway.devops-admin.svc.cluster.local:8081/api/iam/roles/${id}`)
  } catch (e) {
    console.error('[API] role by id error:', e)
    return null
  }
})
