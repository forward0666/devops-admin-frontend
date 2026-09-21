import { securitySettings } from '../../data/settings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  Object.assign(securitySettings, body)
  return { success: true, message: '安全设置已保存', data: securitySettings }
})
