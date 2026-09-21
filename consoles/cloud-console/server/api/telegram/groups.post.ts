import { tgGroups } from '../../data/telegram'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.name || !body.chatId) {
    throw createError({ statusCode: 400, message: 'name and chatId are required' })
  }
  const group = {
    id: 'grp-' + Date.now(),
    chatId: body.chatId,
    name: body.name,
    linkedProject: body.linkedProject || '',
    notifyEvents: body.notifyEvents || [],
    enabled: body.enabled !== undefined ? body.enabled : true,
  }
  tgGroups.push(group)
  return { success: true, message: `Group '${body.name}' created`, item: group }
})
