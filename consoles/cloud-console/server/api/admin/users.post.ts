import { adminUsers, nextId } from '../../data/admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const newUser = {
    id: nextId('adm-', adminUsers),
    username: body.username,
    email: body.email,
    role: body.role || 'viewer',
    status: body.status || 'active',
    department: body.department || '',
    lastLogin: '-',
    createdAt: new Date().toISOString(),
  }
  adminUsers.push(newUser)
  return { success: true, message: '用户创建成功', data: newUser }
})
