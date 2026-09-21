import { adminUsers } from '../../../data/admin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const user = adminUsers.find(u => u.id === id)
  if (!user) {
    throw createError({ statusCode: 404, message: '用户不存在' })
  }
  Object.assign(user, body)
  return { success: true, message: '用户更新成功', data: user }
})
