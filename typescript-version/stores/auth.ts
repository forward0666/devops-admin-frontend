// useAuthStore - 角色和路由管理
import { defineStore } from 'pinia'

export type UserRole = 'sys_admin' | 'admin' | 'user'

interface UserState {
  role: UserRole
  userName: string
  _ready: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): UserState => ({
    role: 'sys_admin',
    userName: 'Admin',
    _ready: false,
  }),

  getters: {
    isAdmin: (state) => state.role === 'sys_admin' || state.role === 'admin',
    isUser: (state) => state.role === 'user',
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
    setUserName(name: string) {
      this.userName = name
    },
  },
})
