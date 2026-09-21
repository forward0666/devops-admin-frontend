export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const serviceId = query.serviceId as string

  if (!serviceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'serviceId is required',
    })
  }

  try {
    // Get service info from registry
    const service = await $fetch<any>(
      `http://gateway.devops-admin.svc.cluster.local:8081/api/iam/services/${serviceId}`,
      {
        headers: {
          ...(getHeaders(event)['authorization'] && {
            Authorization: getHeaders(event)['authorization'] as string,
          }),
        },
      }
    )

    if (!service) {
      return { allowed: false, reason: 'Service not found' }
    }

    // If no permissions required, allow access
    const permissions = service.permissions
    if (!permissions || permissions === 'null' || permissions === '[]') {
      return { allowed: true, reason: 'No permission required' }
    }

    // Parse permissions
    let requiredPerms: string[] = []
    try {
      requiredPerms = typeof permissions === 'string' ? JSON.parse(permissions) : permissions
    } catch {
      return { allowed: true, reason: 'Invalid permissions config' }
    }

    if (requiredPerms.length === 0) {
      return { allowed: true, reason: 'No permission required' }
    }

    // Check user permissions via manage service
    const userId = query.userId as string || '1' // TODO: get from auth context
    try {
      const permCheck = await $fetch<any>(
        `http://gateway.devops-admin.svc.cluster.local:8081/api/iam/permission/user?userId=${userId}`,
        {
          headers: {
            ...(getHeaders(event)['authorization'] && {
              Authorization: getHeaders(event)['authorization'] as string,
            }),
          },
        }
      )

      const userPerms: string[] = permCheck?.data || []
      const hasPermission = requiredPerms.some(p => userPerms.includes(p))

      return {
        allowed: hasPermission,
        reason: hasPermission ? 'Permission granted' : 'Insufficient permissions',
      }
    } catch {
      return { allowed: true, reason: 'Permission check failed, allowing access' }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[services/access] Error:', error)
    return { allowed: true, reason: 'Access check error, allowing access' }
  }
})
