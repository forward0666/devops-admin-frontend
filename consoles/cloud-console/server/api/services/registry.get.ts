export default defineEventHandler(async (event) => {
  try {
    const response = await $fetch<{ items: any[]; total: number }>(
      'http://gateway.devops-admin.svc.cluster.local:8081/api/iam/services',
      {
        headers: {
          ...(getHeaders(event)['authorization'] && {
            Authorization: getHeaders(event)['authorization'] as string,
          }),
          ...(getHeaders(event)['cookie'] && {
            Cookie: getHeaders(event)['cookie'] as string,
          }),
        },
      }
    )

    const services = (response.items || []).map(s => ({
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

    return services
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[services/registry] Gateway error:', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to connect to service registry',
    })
  }
})
