// useAuthStore - 认证与角色管理
import { defineStore } from 'pinia'
import { authService } from '~/services/api'

export type UserRole = 'user' | 'devops' | 'admin' | 'sys_admin'
export type ConsoleRole = 'admin' | 'user' | 'devops'

interface AuthUser {
  id: number
  username: string
  role: UserRole
  department?: string
  departmentId?: number
  email?: string
  phone?: string
  fullName?: string
  avatarUrl?: string
  position?: string
  employeeId?: string
  active?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
}

interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  token: string | null
  // 用户真实角色（从后端获取）
  role: UserRole
  // 当前界面视图（admin/user，可切换）
  consoleRole: ConsoleRole
  _ready: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    token: null,
    role: 'user',
    consoleRole: 'admin',
    _ready: false,
  }),

  getters: {
    /** 是否有 admin 界面访问权限 */
    isAdmin: (state): boolean => state._ready && ['sys_admin', 'admin', 'devops'].includes(state.role),
    /** 当前是否在 user 界面 */
    isUser: (state): boolean => state._ready && state.consoleRole === 'user',
    /** 当前是否在 admin 界面 */
    isConsoleAdmin: (state): boolean => state._ready && (state.consoleRole === 'admin' || state.consoleRole === 'devops'),
    isReady: (state) => state._ready,
    homeRoute: (state) => {
      if (state.consoleRole === 'user') return '/user/dashboard'
      if (state.consoleRole === 'devops') return '/devops/dashboard'
      return '/admin/dashboard'
    },
    userName: (state) => state.user?.fullName || state.user?.username || '',
  },

  actions: {
    /**
     * 真实 API 登录
     */
    async login(username: string, password: string, verificationCode: string, verificationCodeKey: string): Promise<boolean> {
      try {
        const response = await authService.login(username, password, verificationCode, verificationCodeKey)

        if (response && response.token && response.user) {
          this.token = response.token
          this.user = {
            id: response.user.id || 1,
            username: response.user.username,
            role: (response.user.role as UserRole) || 'user',
            department: response.user.department,
            departmentId: response.user.departmentId,
            email: response.user.email,
            phone: response.user.phone,
            fullName: response.user.fullName,
            avatarUrl: response.user.avatarUrl,
            position: response.user.position,
            employeeId: response.user.employeeId,
            active: response.user.active,
            emailVerified: response.user.emailVerified,
            phoneVerified: response.user.phoneVerified,
          }

          // 设置用户角色
          this.role = this.user.role
          // admin 权限用户默认 admin 界面，纯 user 默认 user 界面
          this.consoleRole = this.isAdmin ? 'admin' : 'user'
          this.isAuthenticated = true
          this._ready = true

          this._persist()

          return true
        }
        return false
      }
      catch (error) {
        console.error('[Auth Store] Login failed:', error)
        this.logout()
        return false
      }
    },

    /**
     * Mock 登录（后端不可用时的备用方案）
     */
    async mockLogin(username: string, password: string): Promise<boolean> {
      if (username === 'admin' && password === 'admin123') {
        this.token = `sys_admin-token-1`
        this.user = {
          id: 1,
          username: 'admin',
          role: 'sys_admin',
          fullName: 'Admin',
          department: 'IT',
        }
        this.role = 'sys_admin'
        this.consoleRole = 'admin'
        this.isAuthenticated = true
        this._ready = true
        this._persist()
        return true
      }
      return false
    },

    /**
     * 登出
     */
    async logout() {
      try {
        await authService.logout()
      }
      catch (_e) {
        // 忽略登出 API 错误
      }
      finally {
        this.user = null
        this.token = null
        this.role = 'user'
        this.consoleRole = 'admin'
        this.isAuthenticated = false
        this._ready = false

        if (process.client) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth')
          localStorage.removeItem('auth-role')
          localStorage.removeItem('auth-console-role')
          localStorage.removeItem('auth-login-role')
          localStorage.removeItem('auth-username')

          const cookie = useCookie('auth-login-role', { maxAge: 31536000, path: '/' })
          cookie.value = null
        }
      }
    },

    /**
     * 初始化认证状态（从 localStorage 恢复）
     */
    initAuth() {
      if (!process.client)
        return

      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('auth_user')

      if (token && userStr) {
        try {
          this.token = token
          this.user = JSON.parse(userStr)
          this.role = this.user?.role || 'user'

          // 恢复界面视图
          const savedConsole = localStorage.getItem('auth-console-role') as ConsoleRole | null
          this.consoleRole = savedConsole || (this.isAdmin ? 'admin' : 'user')

          this.isAuthenticated = !!token
          this._ready = true

          return
        }
        catch (e) {
          console.error('[Auth Store] Failed to parse auth data:', e)
        }
      }

      // 旧格式兼容
      const oldRole = localStorage.getItem('auth-login-role') as UserRole | null
      if (oldRole) {
        this.role = oldRole
        this.consoleRole = ['sys_admin', 'admin', 'devops'].includes(oldRole) ? 'admin' : 'user'
        this._ready = true
      }
    },

    /**
     * 切换界面视图
     */
    setConsoleRole(consoleRole: ConsoleRole) {
      this.consoleRole = consoleRole
      if (process.client) {
        localStorage.setItem('auth-console-role', consoleRole)
      }
    },

    _persist() {
      if (!process.client) return
      localStorage.setItem('auth_token', this.token || '')
      localStorage.setItem('auth_user', JSON.stringify(this.user))
      localStorage.setItem('auth', JSON.stringify({ token: this.token, user: this.user }))
      localStorage.setItem('auth-role', this.role)
      localStorage.setItem('auth-console-role', this.consoleRole)
      localStorage.setItem('auth-username', this.userName)

      const cookie = useCookie('auth-login-role', { maxAge: 31536000, path: '/' })
      cookie.value = this.role
    },
  },
})
