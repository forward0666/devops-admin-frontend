export interface User {
  id: number
  username: string
  email?: string
  phone?: string
  tgUsername?: string
  fullName?: string
  avatarUrl?: string
  departmentId?: number
  position?: string
  employeeId?: string
  role: UserRole
  createdAt: string
  updatedAt: string
  createdBy?: number
  updatedBy?: number
  active: boolean
  emailVerified: boolean
  phoneVerified: boolean
  lastLoginAt?: string
  lastLoginIp?: string
  loginCount: number
  passwordChangedAt?: string
  department?: string
}

export type UserRole = 'user' | 'devops' | 'admin' | 'sys_admin'

export interface LoginRequest {
  username: string
  password: string
  verificationCode: string
  verificationCodeKey: string
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    role: UserRole
    department?: string
    departmentId?: number
    email?: string
    phone?: string
    tgUsername?: string
    fullName?: string
    avatarUrl?: string
    position?: string
    employeeId?: string
    active?: boolean
    emailVerified?: boolean
    phoneVerified?: boolean
  }
}

export interface CreateUserRequest {
  username: string
  password: string
  email?: string
  phone?: string
  tgUsername?: string
  fullName?: string
  avatarUrl?: string
  position?: string
  employeeId?: string
  role: UserRole
  departmentId?: number
}

export interface UpdateUserRequest {
  email?: string
  phone?: string
  tgUsername?: string
  fullName?: string
  avatarUrl?: string
  position?: string
  employeeId?: string
  role?: UserRole
  departmentId?: number
  active?: boolean
  updatedBy?: number
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}
