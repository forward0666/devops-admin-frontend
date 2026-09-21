import { ec2Instances } from '../../data/mock'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const instance = ec2Instances.find(i => i.id === id)

  if (!instance) {
    throw createError({ statusCode: 404, message: 'Instance not found' })
  }

  if (body.action === 'start' && instance.state === 'stopped') {
    instance.state = 'running'
  } else if (body.action === 'stop' && instance.state === 'running') {
    instance.state = 'stopped'
  }

  return { success: true, instance }
})
