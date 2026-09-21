import { cfCacheRules, nextCacheId } from '../../data/cloudflare'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // If action is "purge", return purge result
  if (body.action === 'purge') {
    return { success: true, message: `缓存清除请求已发送 (${body.zone || 'all zones'})`, clearedAt: new Date().toISOString() }
  }

  // Otherwise create a cache rule
  const rule = {
    id: nextCacheId(),
    zoneName: body.zoneName || 'example.com',
    rule: body.rule,
    target: body.target,
    status: body.status || 'active',
    ttl: body.ttl ?? 3600,
    createdAt: new Date().toISOString().split('T')[0],
  }
  cfCacheRules.push(rule)
  return { success: true, item: rule }
})
