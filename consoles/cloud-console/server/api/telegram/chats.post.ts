import { tgChats } from '../../data/telegram'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.chatId || !body.name) {
    throw createError({ statusCode: 400, message: 'chatId and name are required' })
  }
  const existing = tgChats.find(c => c.chatId === body.chatId)
  if (existing) {
    throw createError({ statusCode: 409, message: `Chat '${body.chatId}' already exists` })
  }
  const chat = {
    chatId: body.chatId,
    name: body.name,
    type: body.type || 'private' as const,
    memberCount: body.memberCount || 1,
    lastActivity: new Date().toISOString(),
  }
  tgChats.push(chat)
  return { success: true, message: `Chat '${body.name}' created`, item: chat }
})
