import { s3Buckets } from '../../data/mock'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10

  const total = s3Buckets.length
  const start = (page - 1) * pageSize
  const items = s3Buckets.slice(start, start + pageSize)

  return { items, total, page, pageSize }
})
