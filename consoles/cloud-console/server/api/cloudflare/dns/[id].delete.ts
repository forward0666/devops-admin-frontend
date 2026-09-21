import { cfDNSRecords } from '../../../data/cloudflare'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const idx = cfDNSRecords.findIndex(r => r.id === id)
  if (idx === -1) throw createError({ statusCode: 404, message: 'DNS record not found' })

  cfDNSRecords.splice(idx, 1)
  return { success: true }
})
