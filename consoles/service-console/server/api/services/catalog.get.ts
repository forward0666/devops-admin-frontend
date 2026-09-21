export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const headers = getHeaders(event)
  const authHeader = headers['authorization']

  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.search) params.set('search', String(query.search))
  if (query.category && query.category !== 'all') params.set('category', String(query.category))
  if (query.status && query.status !== 'all') params.set('status', String(query.status))
  const qs = params.toString()
  const url = `http://gateway.devops-admin.svc.cluster.local:8081/api/iam/services${qs ? '?' + qs : ''}`

  try {
    const data = await $fetch<{ items: any[]; total: number }>(url, {
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    })
    return data
  } catch (e: any) {
    if (e.statusCode) throw e
    console.error('[services/catalog] Gateway error:', e?.message)
    return { items: [], total: 0 }
  }
})
