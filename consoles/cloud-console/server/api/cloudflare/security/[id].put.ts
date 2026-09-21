import { cfSecurityRules } from '../../../data/cloudflare'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const idx = cfSecurityRules.findIndex(r => r.id === id)
  if (idx === -1) throw createError({ statusCode: 404, message: 'Security rule not found' })

  cfSecurityRules[idx] = { ...cfSecurityRules[idx], ...body, id }
  return { success: true, item: cfSecurityRules[idx] }
})
