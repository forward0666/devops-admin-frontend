export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  try { return await $fetch(`http://gateway.devops-admin.svc.cluster.local:8081/api/iam/roles-full/${id}`, { method: 'PUT', body }) }
  catch (e) { console.error('Proxy error:', e); return { success: false } }
})
