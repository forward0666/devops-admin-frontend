import { cfDNSRecords } from '../../data/cloudflare'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const zone = query.zone as string | undefined
  const type = query.type as string | undefined

  let filtered = cfDNSRecords
  if (zone) filtered = filtered.filter(r => r.zoneName === zone)
  if (type) filtered = filtered.filter(r => r.type === type)

  const total = filtered.length
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return { items, total, page, pageSize }
})
