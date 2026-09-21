import { tgBotMenu } from '../../data/telegram'

export default defineEventHandler(() => {
  return { items: tgBotMenu }
})
