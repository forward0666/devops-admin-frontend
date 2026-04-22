// useAuthStore - 认证与角色管理
import { defineStore } from 'pinia'
import { authService } from '~/services/api'

export type UserRole = 'viewer' | 'editor' | 'admin' | 'devops_admin' | 'sys_admin'

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
  // 兼容旧的角色切换逻辑（后续会移除）
  loginRole: UserRole
  currentRole: UserRole
  _ready: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    token: null,
    loginRole: 'sys_admin',
    currentRole: 'sys_admin',
    _ready: false,
  }),

  getters: {
    isAdmin: (state) => state._ready && (state.loginRole === 'sys_admin' || state.loginRole === 'admin'),
    isUser: (state) => state._ready && state.currentRole === 'user',
    isReady: (state) => state._ready,
    homeRoute: (state) => {
      if (state.currentRole === 'user') return '/user/dashboard'
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
            role: (response.user.role as UserRole) || 'viewer',
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

          // 设置角色
          this.loginRole = this.user.role
          this.currentRole = this.user.role
          this.isAuthenticated = true
          this._ready = true

          // 持久化 Token（三键存储）
          if (process.client) {
            localStorage.setItem('auth_token', this.token)
            localStorage.setItem('auth_user', JSON.stringify(this.user))
            localStorage.setItem('auth', JSON.stringify({ token: this.token, user: this.user }))

            // 兼容旧的角色存储
            localStorage.setItem('auth-role', this.currentRole)
            localStorage.setItem('auth-login-role', this.loginRole)
            localStorage.setItem('auth-username', this.userName)

            const cookie = useCookie('auth-login-role', { maxAge: 31536000, path: '/' })
            cookie.value = this.loginRole
          }

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
        this.loginRole = 'sys_admin'
        this.currentRole = 'sys_admin'
        this.isAuthenticated = true
        this._ready = true

        if (process.client) {
          localStorage.setItem('auth_token', this.token)
          localStorage.setItem('auth_user', JSON.stringify(this.user))
          localStorage.setItem('auth', JSON.stringify({ token: this.token, user: this.user }))
          localStorage.setItem('auth-role', this.currentRole)
          localStorage.setItem('auth-login-role', this.loginRole)
          localStorage.setItem('auth-username', 'Admin')

          const cookie = useCookie('auth-login-role', { maxAge: 31536000, path: '/' })
          cookie.value = this.loginRole
        }

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
        this.isAuthenticated = false
        this._ready = false

        if (process.client) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth')
          localStorage.removeItem('auth-role')
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

      // 优先从 auth_token 恢复（新格式）
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('auth_user')

      if (token && userStr) {
        try {
          this.token = token
          this.user = JSON.parse(userStr)
          this.loginRole = this.user?.role || 'sys_admin'
          this.currentRole = this.loginRole
          this.isAuthenticated = !!token
          this._ready = true

          // 兼容旧格式
          localStorage.setItem('auth-role', this.currentRole)
          localStorage.setItem('auth-login-role', this.loginRole)
          localStorage.setItem('auth-username', this.userName)

          return
        }
        catch (e) {
          console.error('[Auth Store] Failed to parse auth data:', e)
        }
      }

      // 旧格式兼容（纯角色切换模式，无真实登录）
      const oldRole = localStorage.getItem('auth-login-role') as UserRole | null
      if (oldRole) {
        this.loginRole = oldRole
        this.currentRole = oldRole
        this._ready = true
      }
    },

    /**
     * 角色切换（兼容旧逻辑，后续会移除）
     */
    setRole(role: UserRole) {
      this.currentRole = role
      localStorage.setItem('auth-role', role)
    },

    setLoginRole(role: UserRole) {
      this.loginRole = role
      this.currentRole = role
      localStorage.setItem('auth-role', role)
      localStorage.setItem('auth-login-role', role)
      const cookie = useCookie('auth-login-role', { maxAge: 31536000, path: '/' })
      cookie.value = role
    },
  },
})
