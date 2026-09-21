import { cfZones } from '../../../data/cloudflare'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const idx = cfZones.findIndex(z => z.id === id)
  if (idx === -1) throw createError({ statusCode: 404, message: 'Zone not found' })

  cfZones.splice(idx, 1)
  return { success: true }
})
