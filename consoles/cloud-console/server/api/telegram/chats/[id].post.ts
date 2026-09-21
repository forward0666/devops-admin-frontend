import { tgChats } from '../../../data/telegram'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.message) {
    throw createError({ statusCode: 400, message: 'message is required' })
  }
  const id = getRouterParam(event, 'id')
  const chat = tgChats.find(c => c.chatId === id)
  if (!chat) {
    throw createError({ statusCode: 404, message: `Chat '${id}' not found` })
  }
  chat.lastActivity = new Date().toISOString()
  return { success: true, message: `Message sent to ${chat.name}`, chatId: id }
})
