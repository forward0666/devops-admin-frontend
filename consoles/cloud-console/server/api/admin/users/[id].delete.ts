import { adminUsers } from '../../../data/admin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const idx = adminUsers.findIndex(u => u.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }
  const deleted = adminUsers.splice(idx, 1)[0]
  return { success: true, message: `用户 ${deleted.username} 已删除` }
})
