export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    const data = await $fetch('http://gateway.devops-admin.svc.cluster.local:8081/api/iam/users-full', {
      method: 'POST',
      body
    })
    return data
  } catch (e) {
    console.error('Proxy error:', e)
    return { success: false }
  }
})
