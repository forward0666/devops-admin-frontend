import { cfSecurityRules } from '../../../data/cloudflare'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const idx = cfSecurityRules.findIndex(r => r.id === id)
  if (idx === -1) throw createError({ statusCode: 404, message: 'Security rule not found' })

  cfSecurityRules.splice(idx, 1)
  return { success: true }
})
