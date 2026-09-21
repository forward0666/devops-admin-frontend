import { tgBotStatus, tgBotLogs } from '../../data/telegram'

export default defineEventHandler(() => {
  return { ...tgBotStatus, logs: tgBotLogs.slice(0, 20) }
})
