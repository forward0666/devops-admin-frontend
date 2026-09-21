export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { success: true, message: '系统设置已保存', settings: body }
})
