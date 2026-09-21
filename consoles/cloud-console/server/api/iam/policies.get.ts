import { iamPolicies } from '../../data/mock'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const type = query.type as string

  let filtered = iamPolicies
  if (type) {
    filtered = iamPolicies.filter(p => p.type === type)
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return { items, total, page, pageSize }
})
