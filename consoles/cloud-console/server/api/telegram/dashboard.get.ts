import { tgDashboardStats, tgChats, tgGroups, tgBotMenu } from '../../data/telegram'

export default defineEventHandler(() => {
  return {
    bots: tgDashboardStats.bots,
    chats: tgChats.length,
    messages24h: tgDashboardStats.messages24h,
    commands24h: tgDashboardStats.commands24h,
    groups: tgGroups.length,
    menuItems: tgBotMenu.length,
    activeGroups: tgGroups.filter(g => g.enabled).length,
    enabledCommands: tgBotMenu.filter(m => m.enabled).length,
  }
})
