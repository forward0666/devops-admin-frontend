import axios from 'axios'
import type { ApiResponse } from '~/types/api'

// 环境变量配置
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT,
})

// 请求拦截器：自动加 Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      if (!config.headers)
        config.headers = {}
      config.headers.Authorization = `Bearer ${token}`
    }

    // Gateway 服务间认证
    if (!config.headers)
      config.headers = {}
    config.headers['X-Encrypted-Data'] = import.meta.env.VITE_GATEWAY_SECRET || ''

    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 → 清 Token + 跳转登录
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth')

      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login'))
        window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

/**
 * 通用请求封装
 */
async function request<T = any>(config: {
  method: 'get' | 'post' | 'put' | 'delete'
  url: string
  params?: any
  data?: any
  headers?: any
}): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>(config)
  const { code, message, data } = response.data

  if (code === 200)
    return data

  throw new Error(message || '请求失败')
}

// ============ Auth ============
export const authService = {
  async login(username: string, password: string, verificationCode: string, verificationCodeKey: string) {
    return request<any>({
      method: 'post',
      url: '/manage/login',
      data: { username, password, verificationCode, verificationCodeKey },
    })
  },

  async logout() {
    return request<void>({
      method: 'post',
      url: '/manage/logout',
    })
  },

  async validateToken(token: string) {
    return request<{ valid: boolean }>({
      method: 'post',
      url: '/manage/validate-token',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  async getVerificationCode() {
    const response = await apiClient.post<{ success: boolean, message: string, codeId: string, imageBase64: string }>('/auth/verificationCode')
    return response.data
  },
}

// ============ User ============
export const userService = {
  list() {
    return request<any[]>({ method: 'get', url: '/manage/user' })
  },
  getById(id: number) {
    return request<any>({ method: 'get', url: `/manage/user/${id}` })
  },
  create(data: any) {
    return request<any>({ method: 'post', url: '/manage/user', data })
  },
  update(id: number, data: any) {
    return request<any>({ method: 'put', url: `/manage/user/${id}`, data })
  },
  delete(id: number) {
    return request<void>({ method: 'delete', url: `/manage/user/${id}` })
  },
  changePassword(id: number, data: { oldPassword: string, newPassword: string }) {
    return request<void>({ method: 'put', url: `/manage/user/${id}/password`, data })
  },
  resetPassword(id: number, data: { newPassword: string }) {
    return request<void>({ method: 'post', url: `/manage/user/${id}/reset-password`, data })
  },
  verifyEmail(id: number) {
    return request<void>({ method: 'post', url: `/manage/user/${id}/verify-email` })
  },
  verifyPhone(id: number) {
    return request<void>({ method: 'post', url: `/manage/user/${id}/verify-phone` })
  },
  getByDepartment(departmentId: number) {
    return request<any[]>({ method: 'get', url: `/manage/user/department/${departmentId}` })
  },
  search(query: string) {
    return request<any[]>({ method: 'get', url: `/manage/user/search`, params: { q: query } })
  },
}

// ============ Role ============
export const roleService = {
  list() {
    return request<any[]>({ method: 'get', url: '/manage/role' })
  },
  getById(id: number) {
    return request<any>({ method: 'get', url: `/manage/role/${id}` })
  },
  create(data: any) {
    return request<any>({ method: 'post', url: '/manage/role', data })
  },
  update(id: number, data: any) {
    return request<any>({ method: 'put', url: `/manage/role/${id}`, data })
  },
  delete(id: number) {
    return request<void>({ method: 'delete', url: `/manage/role/${id}` })
  },
}

// ============ Department ============
export const departmentService = {
  list() {
    return request<any[]>({ method: 'get', url: '/manage/department' })
  },
  getById(id: number) {
    return request<any>({ method: 'get', url: `/manage/department/${id}` })
  },
  getUsers(id: number) {
    return request<any[]>({ method: 'get', url: `/manage/department/${id}/users` })
  },
  create(data: any) {
    return request<any>({ method: 'post', url: '/manage/department', data })
  },
  update(id: number, data: any) {
    return request<any>({ method: 'put', url: `/manage/department/${id}`, data })
  },
  delete(id: number) {
    return request<void>({ method: 'delete', url: `/manage/department/${id}` })
  },
  search(query: string) {
    return request<any[]>({ method: 'get', url: '/manage/department/search', params: { q: query } })
  },
}

// ============ Position ============
export const positionService = {
  list() {
    return request<any[]>({ method: 'get', url: '/manage/position' })
  },
  getById(id: number) {
    return request<any>({ method: 'get', url: `/manage/position/${id}` })
  },
  getByDepartment(departmentId: number) {
    return request<any[]>({ method: 'get', url: `/manage/position/department/${departmentId}` })
  },
  create(data: any) {
    return request<any>({ method: 'post', url: '/manage/position', data })
  },
  update(id: number, data: any) {
    return request<any>({ method: 'put', url: `/manage/position/${id}`, data })
  },
  delete(id: number) {
    return request<void>({ method: 'delete', url: `/manage/position/${id}` })
  },
}

// ============ Settings ============
export const settingsService = {
  getSystem() {
    return request<any>({ method: 'get', url: '/manage/settings/' })
  },
  updateSystem(data: any) {
    return request<void>({ method: 'put', url: '/manage/settings/system', data })
  },
  getSecurity() {
    return request<any>({ method: 'get', url: '/manage/settings/security' })
  },
  updateSecurity(data: any) {
    return request<void>({ method: 'put', url: '/manage/settings/security', data })
  },
  getPasswordPolicy() {
    return request<any>({ method: 'get', url: '/manage/settings/security/password-policy' })
  },
  updatePasswordPolicy(data: any) {
    return request<void>({ method: 'put', url: '/manage/settings/security/password-policy', data })
  },
  getLoginSettings() {
    return request<any>({ method: 'get', url: '/manage/settings/security/login' })
  },
  updateLoginSettings(data: any) {
    return request<void>({ method: 'put', url: '/manage/settings/security/login', data })
  },
  getIpControl() {
    return request<any>({ method: 'get', url: '/manage/settings/security/ip-control' })
  },
  updateIpControl(data: any) {
    return request<void>({ method: 'put', url: '/manage/settings/security/ip-control', data })
  },
  addIpWhitelist(data: any) {
    return request<void>({ method: 'post', url: '/manage/settings/security/ip-control/whitelist/add', data })
  },
  removeIpWhitelist(data: any) {
    return request<void>({ method: 'delete', url: '/manage/settings/security/ip-control/whitelist/remove', data })
  },
  clearCache() {
    return request<void>({ method: 'post', url: '/manage/settings/cache/clear' })
  },
  clearAllCache() {
    return request<void>({ method: 'post', url: '/manage/settings/cache/clear-all' })
  },
}

// ============ Dashboard ============
export const dashboardService = {
  getRecentActivities() {
    return request<any[]>({ method: 'get', url: '/manage/dashboard/recentActivities' })
  },
  getStats() {
    return request<any>({ method: 'get', url: '/manage/dashboard/stats' })
  },
}

// ============ Operation Log ============
export const operationLogService = {
  list(params?: any) {
    return request<any>({ method: 'get', url: '/manage/operationLog', params })
  },
}

// ============ Project ============
export const projectService = {
  list() {
    return request<any[]>({ method: 'get', url: '/manage/project' })
  },
  getById(id: number) {
    return request<any>({ method: 'get', url: `/manage/project/${id}` })
  },
  create(data: any) {
    return request<any>({ method: 'post', url: '/manage/project', data })
  },
  update(id: number, data: any) {
    return request<any>({ method: 'put', url: `/manage/project/${id}`, data })
  },
  delete(id: number) {
    return request<void>({ method: 'delete', url: `/manage/project/${id}` })
  },
}

export const projectMemberService = {
  list(projectId: number) {
    return request<any[]>({ method: 'get', url: '/manage/projectMember', params: { projectId } })
  },
  create(data: any) {
    return request<any>({ method: 'post', url: '/manage/projectMember', data })
  },
  update(id: number, data: any) {
    return request<any>({ method: 'put', url: `/manage/projectMember/${id}`, data })
  },
  delete(id: number) {
    return request<void>({ method: 'delete', url: `/manage/projectMember/${id}` })
  },
}

export const userConsoleProjectService = {
  list() {
    return request<any[]>({ method: 'get', url: '/user/project' })
  },
  getById(id: number) {
    return request<any>({ method: 'get', url: `/user/project/${id}` })
  },
  update(id: number, data: any) {
    return request<any>({ method: 'put', url: `/user/project/${id}`, data })
  },
}

export const userConsoleMemberService = {
  list(projectId: number) {
    return request<any[]>({ method: 'get', url: '/user/projectMember', params: { projectId } })
  },
  create(data: any) {
    return request<any>({ method: 'post', url: '/user/projectMember', data })
  },
  delete(id: number) {
    return request<void>({ method: 'delete', url: `/user/projectMember/${id}` })
  },
}

export const userConsoleProfileService = {
  getProfile() {
    return request<any>({ method: 'get', url: '/user/user/profile' })
  },
  updateProfile(data: any) {
    return request<any>({ method: 'put', url: '/user/user/profile', data })
  },
  changePassword(data: any) {
    return request<void>({ method: 'put', url: '/user/user/password', data })
  },
}

export default apiClient
