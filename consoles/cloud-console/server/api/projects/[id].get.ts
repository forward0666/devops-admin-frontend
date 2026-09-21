import { projects } from '../../data/mock'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const project = projects.find(p => p.id === id)
  if (!project) {
    throw createError({ statusCode: 404, message: 'Project not found' })
  }
  return project
})
