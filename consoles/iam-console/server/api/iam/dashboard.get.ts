export default defineEventHandler(async (event) => {
  try { return await $fetch('http://gateway.devops-admin.svc.cluster.local:8081/api/iam/dashboard') }
  catch (e) {
    console.error('Proxy error:', e)
    return {
      users: { total: 0, active: 0, inactive: 0, mfaEnabled: 0 },
      groups: { total: 0 }, roles: { total: 0 },
      policies: { total: 0, managed: 0, custom: 0 },
      securityChecklist: [], recentActivity: []
    }
  }
})
