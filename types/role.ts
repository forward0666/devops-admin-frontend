export interface Role {
  id: number
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  userCount: number
  permissions?: string[]
  createdAt: string
  updatedAt: string
  createdBy?: number
  updatedBy?: number
}

export interface CreateRoleRequest {
  name: string
  code: string
  description?: string
}

export interface UpdateRoleRequest {
  name?: string
  code?: string
  description?: string
  status?: 'active' | 'inactive'
}
