import { cfSSLConfig } from '../../data/cloudflare'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (body.mode) cfSSLConfig.mode = body.mode
  if (body.minTlsVersion) cfSSLConfig.minTlsVersion = body.minTlsVersion
  if (body.automaticHttpsRewrites !== undefined) cfSSLConfig.automaticHttpsRewrites = body.automaticHttpsRewrites
  if (body.alwaysUseHttps !== undefined) cfSSLConfig.alwaysUseHttps = body.alwaysUseHttps
  return { success: true, ...cfSSLConfig, message: `SSL 配置已更新` }
})
