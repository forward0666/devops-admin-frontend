import { tgBotStatus } from '../../data/telegram'

export default defineEventHandler(() => {
  // Simulate bot restart
  tgBotStatus.online = true
  tgBotStatus.uptime = '0d 0h 1m'
  tgBotStatus.lastError = ''
  tgBotStatus.lastErrorTime = ''
  return { success: true, message: 'Bot restarted successfully' }
})
