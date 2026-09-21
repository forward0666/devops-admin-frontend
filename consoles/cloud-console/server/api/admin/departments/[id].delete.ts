import { departments } from '../../../data/admin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const idx = departments.findIndex(d => d.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: '部门不存在' })
  }
  // Check for children
  const hasChildren = departments.some(d => d.parentId === id)
  if (hasChildren) {
    throw createError({ statusCode: 400, message: '请先删除或迁移子部门' })
  }
  const deleted = departments.splice(idx, 1)[0]
  return { success: true, message: `部门 ${deleted.name} 已删除` }
})
