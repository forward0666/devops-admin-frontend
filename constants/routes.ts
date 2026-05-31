/**
 * 前端路由常量 — 统一管理所有路径
 */

// ─── Public ────────────────────────────────────────────
export const LOGIN = '/login'

// ─── Admin Console ────────────────────────────────────
export const ADMIN = {
  DASHBOARD: '/admin/dashboard',
  SYSTEM_USER_LIST: '/admin/system/user/list',
  SYSTEM_USER_VIEW: '/admin/system/user/view',
  SYSTEM_DEPT_LIST: '/admin/system/dept/list',
  SYSTEM_DEPT_VIEW: '/admin/system/dept/view',
  PROJECT_LIST: '/admin/project/list',
  PROJECT_VIEW: '/admin/project/view',
  MONITOR_ONLINE: '/admin/monitor/online',
  MONITOR_LOGIN_LOG: '/admin/monitor/loginlog',
  MONITOR_OPERATION_LOG: '/admin/monitor/operationlog',
  MONITOR_SETTING: '/admin/monitor/setting',
  TOOLS_CONFIG: '/admin/tools/config',
} as const

// ─── DevOps Console ──────────────────────────────────
export const DEVOPS = {
  DASHBOARD: '/devops/dashboard',
  CF_INDEX: '/devops/cloudflare',
  CF_CACHE: '/devops/cloudflare/cache',
  CF_DNS: '/devops/cloudflare/dns',
  CF_SECURITY: '/devops/cloudflare/security',
  CF_SSL: '/devops/cloudflare/ssl',
  CF_ZONE: '/devops/cloudflare/zone',
  TG_INDEX: '/devops/telegram',
  TG_BLACKLIST: '/devops/telegram/blacklist',
  TG_CHATS: '/devops/telegram/chats',
  TG_GROUP: '/devops/telegram/group',
  // TG_GROUP_PROJECT: REMOVED - unused,
  TG_MENU: '/devops/telegram/menu',
  TG_STATUS: '/devops/telegram/status',
  TENCENT: '/devops/tencent',
  TOOLS_DOMAIN: '/devops/tools/domain',
  TOOLS_PURGE_CACHE: '/devops/tools/purgecache',
  TOOLS_SECURITY: '/devops/tools/security',
  TOOLS_WHITELIST: '/devops/tools/whitelist',
} as const

// ─── User Console ─────────────────────────────────────
export const USER = {
  DASHBOARD: '/user/dashboard',
  PROFILE: '/user/profile',
  PROJECT_LIST: '/user/project/list',
  PROJECT_VIEW: '/user/project/view',
  PROJECT_PERMISSION: '/user/project/permission',
} as const

/** 动态子路由：/user/project/:id/* */
export const USER_PROJECT = (projectId: number | string, page: 'info' | 'members' | 'domain' | 'middleware') =>
  `/user/project/${projectId}/${page}`

// ─── 首页路由映射 ─────────────────────────────────────
import type { ConsoleRole } from '~/stores/auth'

export const HOME_ROUTE_MAP: Record<ConsoleRole, string> = {
  admin: ADMIN.DASHBOARD,
  devops: DEVOPS.DASHBOARD,
  user: USER.DASHBOARD,
}

// ─── 角色路由守卫用 ──────────────────────────────────
export const ADMIN_GUARD_ROUTES = [
  ADMIN.SYSTEM_USER_LIST,
  ADMIN.SYSTEM_USER_VIEW,
  ADMIN.SYSTEM_DEPT_LIST,    // 匹配 /admin/system/dept 前缀
  '/admin/system/menu',
  ADMIN.MONITOR_ONLINE,
  ADMIN.MONITOR_OPERATION_LOG,
  ADMIN.MONITOR_LOGIN_LOG,
  '/admin/tools/api',
  ADMIN.TOOLS_CONFIG,
] as const

export const USER_GUARD_ROUTES = [
  USER.DASHBOARD,
  USER.PROFILE,
  '/user/settings',
] as const
