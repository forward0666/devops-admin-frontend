export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const headers = getHeaders(event)
  const authHeader = headers['authorization']

  try {
    return await $fetch('http://gateway.devops-admin.svc.cluster.local:8081/api/iam/services', {
      method: 'POST',
      body,
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    })
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error('[services/catalog] Create error:', e?.message)
    throw createError({ statusCode: 502, statusMessage: 'Failed to create service' })
  }
})
