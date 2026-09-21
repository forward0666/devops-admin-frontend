import { iamRoles } from '../../../data/mock'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const role = iamRoles.find(r => r.id === id)
  if (!role) {
    throw createError({ statusCode: 404, statusMessage: 'Role not found' })
  }
  return role
})
