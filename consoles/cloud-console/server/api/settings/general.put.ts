import { generalSettings } from '../../data/settings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  Object.assign(generalSettings, body)
  return { success: true, message: '通用设置已保存', data: generalSettings }
})
