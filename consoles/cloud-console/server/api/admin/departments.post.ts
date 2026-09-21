import { departments, nextId } from '../../data/admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const newDept = {
    id: nextId('dept-', departments),
    name: body.name,
    parentId: body.parentId || null,
    memberCount: 0,
    leader: body.leader || '',
  }
  departments.push(newDept)
  return { success: true, message: '部门创建成功', data: newDept }
})
