import { tgBlacklist } from '../../data/telegram'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10

  const total = tgBlacklist.length
  const start = (page - 1) * pageSize
  const items = tgBlacklist.slice(start, start + pageSize)

  return { items, total, page, pageSize }
})
