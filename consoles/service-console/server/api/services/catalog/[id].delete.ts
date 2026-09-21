export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const headers = getHeaders(event)
  const authHeader = headers['authorization']

  try {
    return await $fetch(`http://gateway.devops-admin.svc.cluster.local:8081/api/iam/services/${id}`, {
      method: 'DELETE',
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    })
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error(`[services/catalog/${id}] Delete error:`, e?.message)
    throw createError({ statusCode: 502, statusMessage: 'Failed to delete service' })
  }
})
