import { iamGroups } from '../../data/mock'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10

  const total = iamGroups.length
  const start = (page - 1) * pageSize
  const items = iamGroups.slice(start, start + pageSize)

  return { items, total, page, pageSize }
})
