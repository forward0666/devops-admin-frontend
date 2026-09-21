import { tgBlacklist } from '../../../data/telegram'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const idx = tgBlacklist.findIndex(b => b.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: `Blacklist entry '${id}' not found` })
  }
  const [removed] = tgBlacklist.splice(idx, 1)
  return { success: true, message: `User '${removed.username}' removed from blacklist` }
})
