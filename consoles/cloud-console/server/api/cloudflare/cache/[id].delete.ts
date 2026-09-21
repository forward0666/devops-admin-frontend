import { cfCacheRules } from '../../../data/cloudflare'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const idx = cfCacheRules.findIndex(r => r.id === id)
  if (idx === -1) throw createError({ statusCode: 404, message: 'Cache rule not found' })

  cfCacheRules.splice(idx, 1)
  return { success: true }
})
