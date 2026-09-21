export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.search) params.set('search', String(query.search))
  const qs = params.toString()
  try { return await $fetch(`http://gateway.devops-admin.svc.cluster.local:8081/api/iam/policies-full${qs ? '?' + qs : ''}`) }
  catch (e) { console.error('Proxy error:', e); return { items: [], total: 0, page: 1, pageSize: 20 } }
})
