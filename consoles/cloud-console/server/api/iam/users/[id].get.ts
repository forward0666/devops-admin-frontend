import { iamUsersExtended } from '../../../data/mock'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const user = iamUsersExtended.find(u => u.id === id)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }
  return user
})
