import { cfSecurityRules, nextRuleId } from '../../data/cloudflare'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const rule = {
    id: nextRuleId(),
    description: body.description,
    expression: body.expression,
    action: body.action || 'block',
    enabled: body.enabled ?? true,
    zoneName: body.zoneName || 'example.com',
    createdAt: new Date().toISOString().split('T')[0],
  }
  cfSecurityRules.push(rule)
  return { success: true, item: rule }
})
