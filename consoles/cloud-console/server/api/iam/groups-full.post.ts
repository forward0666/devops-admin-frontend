export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    return await $fetch('http://gateway.devops-admin.svc.cluster.local:8081/api/iam/groups-full', { method: 'POST', body })
  } catch (e) {
    console.error('Proxy error:', e)
    return { success: false }
  }
})
