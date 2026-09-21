import { cfDNSRecords } from '../../../data/cloudflare'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const idx = cfDNSRecords.findIndex(r => r.id === id)
  if (idx === -1) throw createError({ statusCode: 404, message: 'DNS record not found' })

  cfDNSRecords[idx] = { ...cfDNSRecords[idx], ...body, id }
  return { success: true, item: cfDNSRecords[idx] }
})
