export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  try {
    return await $fetch(`http://gateway.devops-admin.svc.cluster.local:8081/api/iam/groups/${id}`)
  } catch (e) {
    console.error('[API] group by id error:', e)
    return null
  }
})
