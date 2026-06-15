const IT_TOOLS_URL = process.env.IT_TOOLS_URL || 'http://localhost:5050'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/user/tool/ittool/')) return

  const targetPath = path.replace('/user/tool/ittool/', '/')
  const targetUrl = IT_TOOLS_URL + targetPath

  try {
    const res = await fetch(targetUrl)

    const contentType = res.headers.get('content-type')
    if (contentType) setResponseHeader(event, 'content-type', contentType)

    const cacheControl = res.headers.get('cache-control')
    if (cacheControl) setResponseHeader(event, 'cache-control', cacheControl)

    setResponseStatus(event, res.status)
    return res.body
  } catch (e: any) {
    console.error('[it-tools proxy] error:', e.message)
    throw createError({ statusCode: 502, message: 'Proxy error' })
  }
})
