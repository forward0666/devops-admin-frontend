import { cfCacheRules } from '../../../data/cloudflare'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const idx = cfCacheRules.findIndex(r => r.id === id)
  if (idx === -1) throw createError({ statusCode: 404, message: 'Cache rule not found' })

  cfCacheRules[idx] = { ...cfCacheRules[idx], ...body, id }
  return { success: true, item: cfCacheRules[idx] }
})
