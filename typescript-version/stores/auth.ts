// useAuthStore - 角色和路由管理
import { defineStore } from 'pinia'

export type UserRole = 'sys_admin' | 'admin' | 'user'

interface UserState {
  role: UserRole
  loginRole: UserRole
  userName: string
  _ready: boolean
}

export const useAuthStore = defineStore('auth', {
  serializable: false,
  state: (): UserState => ({
    role: 'sys_admin',
    loginRole: 'sys_admin',
    userName: 'Admin',
    _ready: false,
  }),

  getters: {
    isAdmin: (state) => state._ready && (state.loginRole === 'sys_admin' || state.loginRole === 'admin'),
    isUser: (state) => state._ready && state.role === 'user',
    isReady: (state) => state._ready,
    homeRoute: (state) => {
      if (state.role === 'user') return '/user/dashboard'
      return '/dashboard'
    },
  },

  actions: {
    setRole(role: UserRole) {
      this.role = role
      localStorage.setItem('auth-role', role)
    },
    setLoginRole(role: UserRole) {
      this.loginRole = role
      this.role = role
      localStorage.setItem('auth-role', role)
      localStorage.setItem('auth-login-role', role)
    },
    setUserName(name: string) {
      this.userName = name
    },
  },
})
