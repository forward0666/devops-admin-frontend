import { tgBotMenu } from '../../../data/telegram'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const idx = tgBotMenu.findIndex(m => m.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: `Menu item '${id}' not found` })
  }
  const item = tgBotMenu[idx]
  if (body.command !== undefined) item.command = body.command
  if (body.description !== undefined) item.description = body.description
  if (body.enabled !== undefined) item.enabled = body.enabled
  return { success: true, message: `Menu item '${item.command}' updated`, item }
})
