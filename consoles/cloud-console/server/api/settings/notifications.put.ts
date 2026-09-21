import { notificationSettings } from '../../data/settings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  Object.assign(notificationSettings, body)
  return { success: true, message: '通知设置已保存', data: notificationSettings }
})
