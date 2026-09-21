import { departments } from '../../../data/admin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const dept = departments.find(d => d.id === id)
  if (!dept) {
    throw createError({ statusCode: 404, message: '部门不存在' })
  }
  Object.assign(dept, body)
  return { success: true, message: '部门更新成功', data: dept }
})
