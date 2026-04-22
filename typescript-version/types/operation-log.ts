export interface OperationLog {
  id: string
  userId?: number
  username?: string
  action?: string
  module?: string
  method?: string
  path?: string
  ip?: string
  userAgent?: string
  requestParams?: any
  responseCode?: number
  duration?: number
  createdAt: string
}
