import { cfZones } from '../../../data/cloudflare'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const idx = cfZones.findIndex(z => z.id === id)
  if (idx === -1) throw createError({ statusCode: 404, message: 'Zone not found' })

  cfZones[idx] = { ...cfZones[idx], ...body, id }
  return { success: true, item: cfZones[idx] }
})
