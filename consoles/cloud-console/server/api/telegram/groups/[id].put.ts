import { tgGroups } from '../../../data/telegram'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const idx = tgGroups.findIndex(g => g.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: `Group '${id}' not found` })
  }
  const group = tgGroups[idx]
  if (body.name !== undefined) group.name = body.name
  if (body.chatId !== undefined) group.chatId = body.chatId
  if (body.linkedProject !== undefined) group.linkedProject = body.linkedProject
  if (body.notifyEvents !== undefined) group.notifyEvents = body.notifyEvents
  if (body.enabled !== undefined) group.enabled = body.enabled
  return { success: true, message: `Group '${group.name}' updated`, item: group }
})
