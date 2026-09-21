export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const headers = getHeaders(event)
  const authHeader = headers['authorization']

  try {
    return await $fetch(`http://gateway.devops-admin.svc.cluster.local:8081/api/iam/services/${id}`, {
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    })
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error(`[services/catalog/${id}] Gateway error:`, e?.message)
    throw createError({ statusCode: 404, statusMessage: 'Service not found' })
  }
})
