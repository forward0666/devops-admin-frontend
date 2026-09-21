import { cfZones, nextZoneId } from '../../data/cloudflare'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const zone = {
    id: nextZoneId(),
    name: body.name,
    status: 'pending',
    plan: body.plan || 'Free',
    nameServers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
    createdAt: new Date().toISOString().split('T')[0],
  }
  cfZones.push(zone)
  return { success: true, item: zone }
})
