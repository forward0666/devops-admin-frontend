import { cfDNSRecords, nextDnsId } from '../../data/cloudflare'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const record = {
    id: nextDnsId(),
    zoneName: body.zoneName || 'example.com',
    name: body.name,
    type: body.type || 'A',
    content: body.content,
    ttl: body.ttl ?? 1,
    proxied: body.proxied ?? false,
  }
  cfDNSRecords.push(record)
  return { success: true, item: record }
})
