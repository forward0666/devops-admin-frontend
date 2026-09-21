import { tgBotMenu } from '../../data/telegram'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.command || !body.description) {
    throw createError({ statusCode: 400, message: 'command and description are required' })
  }
  const existing = tgBotMenu.find(m => m.command === body.command)
  if (existing) {
    throw createError({ statusCode: 409, message: `Command '${body.command}' already exists` })
  }
  const item = {
    id: 'menu-' + Date.now(),
    command: body.command,
    description: body.description,
    enabled: body.enabled !== undefined ? body.enabled : true,
  }
  tgBotMenu.push(item)
  return { success: true, message: `Menu item '${body.command}' created`, item }
})
