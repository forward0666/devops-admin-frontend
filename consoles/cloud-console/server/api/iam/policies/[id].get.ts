import { iamPolicies } from '../../../data/mock'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const policy = iamPolicies.find(p => p.id === id)
  if (!policy) {
    throw createError({ statusCode: 404, statusMessage: 'Policy not found' })
  }
  return policy
})
