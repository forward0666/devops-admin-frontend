import { cfSSLConfig } from '../../data/cloudflare'

export default defineEventHandler(() => {
  return cfSSLConfig
})
