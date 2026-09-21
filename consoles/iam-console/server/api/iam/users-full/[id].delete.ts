export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  try {
    return await $fetch(`http://gateway.devops-admin.svc.cluster.local:8081/api/iam/users-full/${id}`, {
      method: 'DELETE'
    })
  } catch (e) {
    console.error('Proxy error:', e)
    return { success: false }
  }
})
