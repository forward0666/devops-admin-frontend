import { iamGroups } from '../../../data/mock'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const group = iamGroups.find(g => g.id === id)
  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  }
  return group
})
