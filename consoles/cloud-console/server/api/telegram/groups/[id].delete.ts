import { tgGroups } from '../../../data/telegram'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const idx = tgGroups.findIndex(g => g.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: `Group '${id}' not found` })
  }
  const [removed] = tgGroups.splice(idx, 1)
  return { success: true, message: `Group '${removed.name}' deleted` }
})
