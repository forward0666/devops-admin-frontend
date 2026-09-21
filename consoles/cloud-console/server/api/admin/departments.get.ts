import { departments } from '../../data/mock'

export default defineEventHandler(() => {
  return { items: departments }
})
