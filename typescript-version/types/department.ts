export interface Department {
  id: number
  name: string
  description?: string
  managerId?: number
  userCount: number
  createdAt: string
  updatedAt: string
  users?: any[]
  recentUsers?: any[]
}

export interface CreateDepartmentRequest {
  name: string
  description?: string
  managerId?: number
}

export interface UpdateDepartmentRequest {
  name?: string
  description?: string
  managerId?: number
}
