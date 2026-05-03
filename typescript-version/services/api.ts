import axios from 'axios'
import type { ApiResponse } from '~/types/api'

// 环境变量配置
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.86.9:8081'
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

    // Gateway 服务间认证（如果请求已自带 X-Encrypted-Data 则跳过全局的）
    if (!config.headers)
      config.headers = {}
    if (!config.headers['X-Encrypted-Data']) {
      config.headers['X-Encrypted-Data'] = import.meta.env.VITE_GATEWAY_SECRET || ''
    }

    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 → 清 Token + 跳转登录（仅限非 bot 路由）
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      // bot 路由的 401 不触发全局登出（使用独立的 BotAuth 密钥）
      if (!requestUrl.startsWith('/bot/')) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth')

        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login'))
          window.location.href = '/login'
      }
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

  if (code === 200 || code === 201)
    return data

  throw new Error(message || '请求失败')
}

// ============ Auth ============
export const authService = {
  async login(username: string, password: string, verificationCode: string, verificationCodeKey: string) {
    return request<any>({
      method: 'post',
      url: '/login/authLogIn',
      data: { username, password, verificationCode, verificationCodeKey },
    })
  },

  async logout() {
    return request<void>({
      method: 'post',
      url: '/login/authLogOut',
    })
  },

  async validateToken(token: string) {
    return request<{ valid: boolean }>({
      method: 'post',
      url: '/login/validate-token',
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
export const settingService = {
  getAll() {
    return request<any>({ method: 'get', url: '/manage/setting' })
  },
  update(data: any) {
    return request<any>({ method: 'put', url: '/manage/setting', data })
  },
  getCaptchaStatus() {
    return request<any>({ method: 'get', url: '/manage/setting/captcha' })
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
  update(id: number, data: any) {
    return request<any>({ method: 'put', url: `/user/projectMember/${id}`, data })
  },
}

export const userConsoleProfileService = {
  getProfile() {
    return request<any>({ method: 'get', url: '/user/profile' })
  },
  updateProfile(data: any) {
    return request<any>({ method: 'put', url: '/user/profile', data })
  },
  changePassword(data: any) {
    return request<void>({ method: 'put', url: '/user/password', data })
  },
}

export const userConsoleDomainService = {
  list(projectId: string) {
    return request<any>({ method: 'get', url: `/user/domain/list`, params: { projectId } })
  },
  create(data: any) {
    return request<any>({ method: 'post', url: '/user/domain', data })
  },
  update(id: string, data: any) {
    return request<any>({ method: 'put', url: `/user/domain/${id}`, data })
  },
  delete(id: string, projectId: string) {
    return request<void>({ method: 'delete', url: `/user/domain/${id}`, params: { projectId } })
  },
  importDomains(data: any) {
    return request<any>({ method: 'post', url: '/user/domain/import', data })
  },
}

export const userConsoleMiddlewareService = {
  list(projectId: string) {
    return request<any>({ method: 'get', url: `/user/middleware/list`, params: { projectId } })
  },
  create(data: any) {
    return request<any>({ method: 'post', url: '/user/middleware', data })
  },
  update(id: string, data: any) {
    return request<any>({ method: 'put', url: `/user/middleware/${id}`, data })
  },
  delete(id: string, projectId: string) {
    return request<void>({ method: 'delete', url: `/user/middleware/${id}`, params: { projectId } })
  },
  importMiddlewares(data: any) {
    return request<any>({ method: 'post', url: '/user/middleware/import', data })
  },
}

// ===== Telegram Bot Manager =====
const BOT_SECRET = 'Xz8wVc4yBt5eQd1aRn7hUk2jGs6fLmMp'
const BOT_HEADERS = { 'X-Encrypted-Data': BOT_SECRET }

export const telegramBotService = {
  list() {
    return request<any>({ method: 'get', url: '/bot/bots', headers: BOT_HEADERS })
  },
  getByName(name: string) {
    return request<any>({ method: 'get', url: `/bot/bots/${name}`, headers: BOT_HEADERS })
  },
  getStatus(name: string) {
    return request<any>({ method: 'get', url: `/bot/bots/${name}/status`, headers: BOT_HEADERS })
  },
  updateStatus(name: string, status: number) {
    return request<any>({ method: 'put', url: `/bot/bots/${name}/status`, params: { status }, headers: BOT_HEADERS })
  },
  update(name: string, data: { botType?: string; status?: number; token?: string }) {
    return request<any>({ method: 'put', url: `/bot/bots/${name}`, data, headers: BOT_HEADERS })
  },
  addBot(data: { botName: string; botUsername: string; token: string; botType: string; secretToken?: string }) {
    return request<any>({ method: 'post', url: '/bot/addBot', data, headers: BOT_HEADERS })
  },
  deleteBot(name: string) {
    return request<void>({ method: 'delete', url: `/bot/bots/${name}`, headers: BOT_HEADERS })
  },
  // Webhook
  getWebhookInfo(botName: string) {
    return request<any>({ method: 'get', url: '/bot/getWebhookInfo', params: { botName }, headers: BOT_HEADERS })
  },
  resetPendingUpdates(botName: string) {
    return request<any>({ method: 'post', url: '/bot/resetPendingUpdates', params: { botName }, headers: BOT_HEADERS })
  },
  setWebhook(botName: string, url: string, secretToken?: string) {
    return request<any>({ method: 'post', url: '/bot/setWebhook', data: { botName, url, secretToken }, headers: BOT_HEADERS })
  },
  // Authorized Chats
  getAuthorizedChats(botName: string) {
    return request<any>({ method: 'get', url: `/bot/chats/authorization/query/bot/${botName}/chats`, headers: BOT_HEADERS })
  },
  getAuthorizationStats(botName: string) {
    return request<any>({ method: 'get', url: `/bot/chats/authorization/query/bot/${botName}/stats`, headers: BOT_HEADERS })
  },
  addAuthorizedChat(botName: string, botConfigId: number, chatId: number, chatName?: string, type = 'private') {
    return request<any>({ method: 'post', url: '/bot/chats/authorization/add', params: { botName, botConfigId, chatId, chatName, type }, headers: BOT_HEADERS })
  },
  deleteAuthorization(id: number) {
    return request<void>({ method: 'delete', url: `/bot/chats/authorization/query/${id}`, headers: BOT_HEADERS })
  },
  // Blacklist
  getBlacklist(botName?: string) {
    return request<any>({ method: 'get', url: '/bot/blacklist/list', params: botName ? { botName } : {}, headers: BOT_HEADERS })
  },
  removeBlacklist(botName: string, userId: string) {
    return request<void>({ method: 'delete', url: '/bot/blacklist/remove', params: { botName, userId }, headers: BOT_HEADERS })
  },
  // Sessions
  getSession(userId: number) {
    return request<any>({ method: 'get', url: `/bot/sessions/user/${userId}`, headers: BOT_HEADERS })
  },
  clearSession(userId: number) {
    return request<void>({ method: 'delete', url: `/bot/sessions/user/${userId}`, headers: BOT_HEADERS })
  },
  sessionStats() {
    return request<any>({ method: 'get', url: '/bot/sessions/stats', headers: BOT_HEADERS })
  },
  // Group Cleanup
  cleanupStats() {
    return request<any>({ method: 'get', url: '/bot/groupMessageCleanUp/stats', headers: BOT_HEADERS })
  },
  // Service Status
  clearActiveRequests() {
    return apiClient.delete('/bot/serviceStatus/activeRequests', { headers: BOT_HEADERS }).then(r => r.data)
  },
  getServiceStatus() {
    return apiClient.get('/bot/serviceStatus', { headers: BOT_HEADERS }).then(r => r.data)
  },
  getPendingDeletions() {
    return apiClient.get('/bot/serviceStatus/pendingDeletions', { headers: BOT_HEADERS }).then(r => r.data)
  },
  // Menu
  getMenus(botName: string) {
    return request<any>({ method: 'get', url: `/bot/menu/bot/${botName}`, headers: BOT_HEADERS })
  },
  getMenu(id: number) {
    return request<any>({ method: 'get', url: `/bot/menu/${id}`, headers: BOT_HEADERS })
  },
  createMenu(data: any) {
    return request<any>({ method: 'post', url: '/bot/menu', data, headers: BOT_HEADERS })
  },
  updateMenu(id: number, data: any) {
    return request<any>({ method: 'put', url: `/bot/menu/${id}`, data, headers: BOT_HEADERS })
  },
  deleteMenu(id: number) {
    return request<void>({ method: 'delete', url: `/bot/menu/${id}`, headers: BOT_HEADERS })
  },
  // Group Project
  getGroupProjects(botName: string) {
    return request<any>({ method: 'get', url: `/bot/groupProject/bot/${botName}`, headers: BOT_HEADERS })
  },
  createGroupProject(data: { botName: string; chatId: number; chatTitle: string; projectId: number; projectName: string }) {
    return request<any>({ method: 'post', url: '/bot/groupProject', data, headers: BOT_HEADERS })
  },
  deleteGroupProject(id: number) {
    return request<void>({ method: 'delete', url: `/bot/groupProject/${id}`, headers: BOT_HEADERS })
  },
  deleteWebhook(botName: string) {
    return request<any>({ method: 'delete', url: '/bot/deleteWebhook', params: { botName }, headers: BOT_HEADERS })
  },
  updateGroupProject(id: number, data: { chatTitle: string; projectId: number; projectName: string }) {
    return request<any>({ method: 'put', url: `/bot/groupProject/${id}`, data, headers: BOT_HEADERS })
  },
}

export default apiClient
