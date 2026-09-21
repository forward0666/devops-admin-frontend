import { cfSecurityRules } from '../../data/cloudflare'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10

  const total = cfSecurityRules.length
  const start = (page - 1) * pageSize
  const items = cfSecurityRules.slice(start, start + pageSize)

  return { items, total, page, pageSize }
})
