import { tgBlacklist } from '../../data/telegram'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.userId || !body.username) {
    throw createError({ statusCode: 400, message: 'userId and username are required' })
  }
  const existing = tgBlacklist.find(b => b.userId === body.userId)
  if (existing) {
    throw createError({ statusCode: 409, message: `User '${body.userId}' is already blacklisted` })
  }
  const entry = {
    id: 'bl-' + Date.now(),
    userId: body.userId,
    username: body.username,
    reason: body.reason || '',
    blockedAt: new Date().toISOString(),
    blockedBy: body.blockedBy || 'admin',
  }
  tgBlacklist.push(entry)
  return { success: true, message: `User '${body.username}' added to blacklist`, item: entry }
})
