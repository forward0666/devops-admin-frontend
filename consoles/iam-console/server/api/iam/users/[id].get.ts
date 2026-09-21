export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  try {
    return await $fetch(`http://gateway.devops-admin.svc.cluster.local:8081/api/iam/users/${id}`)
  } catch (e) {
    console.error('[API] user by id error:', e)
    return null
  }
})
