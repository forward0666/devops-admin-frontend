import { tgChats } from '../../../data/telegram'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const idx = tgChats.findIndex(c => c.chatId === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: `Chat '${id}' not found` })
  }
  const [removed] = tgChats.splice(idx, 1)
  return { success: true, message: `Chat '${removed.name}' deleted` }
})
