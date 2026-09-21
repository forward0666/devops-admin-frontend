import { tgBotMenu } from '../../../data/telegram'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const idx = tgBotMenu.findIndex(m => m.id === id)
  if (idx === -1) {
    throw createError({ statusCode: 404, message: `Menu item '${id}' not found` })
  }
  const [removed] = tgBotMenu.splice(idx, 1)
  return { success: true, message: `Menu item '${removed.command}' deleted` }
})
