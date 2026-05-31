# 前端路由总览

## 路由结构（按目录/文件对应 Nuxt 自动路由）

### 公共
| 路由 | 页面文件 | 说明 |
|------|----------|------|
| `/login` | `pages/login.vue` | 登录页 |

### Admin（consoleRole: admin）
| 路由 | 页面文件 | 说明 |
|------|----------|------|
| `/admin/dashboard` | `pages/admin/dashboard.vue` | 管理后台首页 |
| `/admin/monitor/loginlog` | `pages/admin/monitor/loginlog/index.vue` | 登录日志 |
| `/admin/monitor/online` | `pages/admin/monitor/online/index.vue` | 在线用户 |
| `/admin/monitor/operationlog` | `pages/admin/monitor/operationlog/index.vue` | 操作日志 |
| `/admin/monitor/setting` | `pages/admin/monitor/setting/index.vue` | 系统设置 |
| `/admin/project/list` | `pages/admin/project/list/index.vue` | 项目列表 |
| `/admin/project/view` | `pages/admin/project/view/index.vue` | 项目详情 |
| `/admin/system/dept/list` | `pages/admin/system/dept/list/index.vue` | 部门列表 |
| `/admin/system/dept/view` | `pages/admin/system/dept/view/index.vue` | 部门详情 |
| `/admin/system/user/list` | `pages/admin/system/user/list.vue` | 用户列表 |
| `/admin/system/user/view` | `pages/admin/system/user/view.vue` | 用户详情 |
| `/admin/tools/config` | `pages/admin/tools/config/index.vue` | 工具配置 |

### DevOps（consoleRole: devops）
| 路由 | 页面文件 | 说明 |
|------|----------|------|
| `/devops/dashboard` | `pages/devops/dashboard/index.vue` | DevOps 首页 |
| `/devops/cloudflare` | `pages/devops/cloudflare/index.vue` | CF 概览 |
| `/devops/cloudflare/cache` | `pages/devops/cloudflare/cache.vue` | CF 缓存 |
| `/devops/cloudflare/dns` | `pages/devops/cloudflare/dns.vue` | CF DNS |
| `/devops/cloudflare/security` | `pages/devops/cloudflare/security.vue` | CF 安全 |
| `/devops/cloudflare/ssl` | `pages/devops/cloudflare/ssl.vue` | CF SSL |
| `/devops/cloudflare/zone` | `pages/devops/cloudflare/zone.vue` | CF Zone |
| `/devops/telegram` | `pages/devops/telegram/index.vue` | Telegram 概览 |
| `/devops/telegram/blacklist` | `pages/devops/telegram/blacklist.vue` | 黑名单 |
| `/devops/telegram/chats` | `pages/devops/telegram/chats.vue` | 聊天列表 |
| `/devops/telegram/group` | `pages/devops/telegram/group.vue` | 群组管理 |
| `/devops/telegram/menu` | `pages/devops/telegram/menu.vue` | Bot 菜单 |
| `/devops/telegram/status` | `pages/devops/telegram/status.vue` | Bot 状态 |
| `/devops/tencent` | `pages/devops/tencent/index.vue` | 腾讯云 |
| `/devops/tools/domain` | `pages/devops/tools/domain.vue` | 域名管理 |
| `/devops/tools/purgecache` | `pages/devops/tools/purgecache.vue` | 缓存清理 |
| `/devops/tools/security` | `pages/devops/tools/security.vue` | 安全规则 |
| `/devops/tools/whitelist` | `pages/devops/tools/whitelist.vue` | IP 白名单 |

### User（consoleRole: user）
| 路由 | 页面文件 | 说明 |
|------|----------|------|
| `/user/dashboard` | `pages/user/dashboard.vue` | 用户首页 |
| `/user/profile` | `pages/user/profile.vue` | 个人资料 |
| `/user/project/list` | `pages/user/project/list/index.vue` | 项目列表 |
| `/user/project/view` | `pages/user/project/view/index.vue` | 项目详情 |
| `/user/project/permission` | `pages/user/project/permission/index.vue` | 项目权限 |
| `/user/project/:id/info` | `pages/user/project/[id]/info/index.vue` | 项目信息 |
| `/user/project/:id/members` | `pages/user/project/[id]/members/index.vue` | 项目成员 |
| `/user/project/:id/domain` | `pages/user/project/[id]/domain/index.vue` | 项目域名 |
| `/user/project/:id/middleware` | `pages/user/project/[id]/middleware/index.vue` | 项目中间件 |

## 首页路由（homeRoute）
定义在 `stores/auth.ts`：
- `user` → `/user/dashboard`
- `devops` → `/devops/dashboard`
- `admin`（默认）→ `/admin/dashboard`

## 路由守卫
- `middleware/redirect-home.global.ts` — 已登录访问 `/login` 时跳转 homeRoute
- `middleware/role-guard.global.ts` — 按角色限制访问范围，未授权跳转 homeRoute
- `middleware/user-project-guard.ts` — `/user/project/:id/*` 子路由权限守卫

## 代码中导航引用位置
| 路由 | 引用位置 |
|------|----------|
| `/user/dashboard` | `role-guard.global.ts` |
| `/user/project/list` | `role-guard.global.ts` |
| `/user/project/:id/info` | `NavItems.vue` |
| `/user/project/:id/members` | `NavItems.vue` |
| `/user/project/:id/domain` | `NavItems.vue` |
| `/user/project/:id/middleware` | `NavItems.vue` |
| 各 homeRoute | `login.vue`, `redirect-home.global.ts`, `role-guard.global.ts` |

## 导航菜单定义
侧边栏导航项在 `layouts/components/NavItems.vue` 中按角色分组渲染。
