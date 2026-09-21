export default defineEventHandler(async (event) => {
  const headers = getHeaders(event)
  const authHeader = headers['authorization']

  // Get all enabled services from registry
  let services: any[] = []
  try {
    const resp = await $fetch<{ items: any[] }>(
      'http://gateway.devops-admin.svc.cluster.local:8081/api/iam/services/enabled',
      {
        headers: { ...(authHeader && { Authorization: authHeader }) },
      }
    )
    services = resp?.items || []
  } catch (e: any) {
    console.error('[services/enabled] Gateway error:', e?.message)
    return []
  }

  // Get user ID from token
  let userId: string | null = null
  if (authHeader) {
    try {
      // Decode JWT payload (base64url)
      const token = authHeader.replace('Bearer ', '')
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
        userId = String(payload.userId || payload.sub || '')
      }
    } catch {}
  }

  // No token → no services
  if (!userId) {
    return []
  }

  // Get user permissions from manage service
  let userActions: string[] = []
  try {
    const permResp = await $fetch<any>(
      `http://gateway.devops-admin.svc.cluster.local:8081/api/iam/permission/effective?userId=${userId}`,
      {
        headers: { ...(authHeader && { Authorization: authHeader }) },
      }
    )
    userActions = permResp?.data?.allowedActions || []
  } catch {
    // If permission check fails, show no services
    return []
  }

  // Super admin shortcut: if user has iam:* or * action, show all
  const isSuperAdmin = userActions.includes('*') || userActions.includes('iam:*')

  // Filter services by permissions
  const filtered = services.filter(s => {
    // No permissions required → show to all authenticated users
    if (!s.permissions || s.permissions === 'null' || s.permissions === '[]') {
      return true
    }

    if (isSuperAdmin) return true

    // Parse required permissions
    let required: string[] = []
    try {
      required = typeof s.permissions === 'string' ? JSON.parse(s.permissions) : s.permissions
    } catch {
      return true
    }

    if (!required.length) return true

    // User needs at least one of the required permissions
    return required.some(p => userActions.includes(p))
  })

  return filtered.map(s => ({
    id: s.serviceId,
    name: s.serviceId,
    displayName: s.displayName,
    description: s.description || '',
    icon: s.icon || '📦',
    category: s.category || 'General',
    url: s.url,
    status: s.status || 'published',
    version: s.version || '1.0.0',
    owner: s.owner || '',
    tags: typeof s.tags === 'string' ? JSON.parse(s.tags) : (s.tags || []),
    sortOrder: s.sortOrder || 0,
  }))
})
