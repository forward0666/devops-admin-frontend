export interface Position {
  id: number
  name: string
  code: string
  departmentId?: number
  departmentName?: string
  level?: number
  description?: string
  status: 'active' | 'inactive'
  userCount?: number
  createdAt: string
  updatedAt: string
  createdBy?: number
  updatedBy?: number
}

export interface CreatePositionRequest {
  name: string
  code: string
  departmentId?: number
  level?: number
  description?: string
}

export interface UpdatePositionRequest {
  name?: string
  code?: string
  departmentId?: number
  level?: number
  description?: string
  status?: 'active' | 'inactive'
}
