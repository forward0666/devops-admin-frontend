// ============ Telegram Chats ============
export interface TGChat {
  chatId: string
  name: string
  type: 'private' | 'group' | 'supergroup' | 'channel'
  memberCount: number
  lastActivity: string
}

export const tgChats: TGChat[] = [
  { chatId: '10001', name: '张三', type: 'private', memberCount: 1, lastActivity: '2026-09-07T08:00:00Z' },
  { chatId: '10002', name: '李四', type: 'private', memberCount: 1, lastActivity: '2026-09-06T18:30:00Z' },
  { chatId: '-10020001', name: 'DevOps 工作群', type: 'supergroup', memberCount: 45, lastActivity: '2026-09-07T09:15:00Z' },
  { chatId: '-10020002', name: '项目通知频道', type: 'channel', memberCount: 128, lastActivity: '2026-09-07T07:00:00Z' },
  { chatId: '-10020003', name: '测试群组', type: 'group', memberCount: 12, lastActivity: '2026-09-05T14:00:00Z' },
  { chatId: '-10020004', name: '告警通知', type: 'channel', memberCount: 256, lastActivity: '2026-09-07T09:30:00Z' },
  { chatId: '10003', name: '王五', type: 'private', memberCount: 1, lastActivity: '2026-09-04T10:00:00Z' },
  { chatId: '-10020005', name: '技术分享群', type: 'supergroup', memberCount: 89, lastActivity: '2026-09-06T22:00:00Z' },
]

// ============ Telegram Groups ============
export interface TGGroup {
  id: string
  chatId: string
  name: string
  linkedProject: string
  notifyEvents: string[]
  enabled: boolean
}

export const tgGroups: TGGroup[] = [
  { id: 'grp-001', chatId: '-10020001', name: 'DevOps 工作群', linkedProject: 'cloud-infrastructure', notifyEvents: ['deploy', 'alert', 'scale'], enabled: true },
  { id: 'grp-002', chatId: '-10020004', name: '告警通知', linkedProject: 'monitoring-stack', notifyEvents: ['alert', 'downtime'], enabled: true },
  { id: 'grp-003', chatId: '-10020002', name: '项目通知频道', linkedProject: 'main-platform', notifyEvents: ['release', 'milestone'], enabled: true },
  { id: 'grp-004', chatId: '-10020005', name: '技术分享群', linkedProject: 'internal-tools', notifyEvents: ['blog', 'talk'], enabled: false },
]

// ============ Telegram Bot Menu ============
export interface TGBotMenuItem {
  id: string
  command: string
  description: string
  enabled: boolean
}

export const tgBotMenu: TGBotMenuItem[] = [
  { id: 'menu-001', command: '/start', description: '开始使用 Bot', enabled: true },
  { id: 'menu-002', command: '/help', description: '查看帮助信息', enabled: true },
  { id: 'menu-003', command: '/status', description: '查看系统状态', enabled: true },
  { id: 'menu-004', command: '/deploy', description: '触发部署流程', enabled: true },
  { id: 'menu-005', command: '/logs', description: '查看最近日志', enabled: true },
  { id: 'menu-006', command: '/alert', description: '查看活跃告警', enabled: true },
  { id: 'menu-007', command: '/scale', description: '扩缩容操作', enabled: false },
  { id: 'menu-008', command: '/rollback', description: '回滚部署', enabled: false },
]

// ============ Telegram Bot Status ============
export interface TGBotStatus {
  online: boolean
  uptime: string
  messagesSent24h: number
  messagesReceived24h: number
  activeUsers: number
  errorRate: number
  lastError: string
  lastErrorTime: string
}

export const tgBotStatus: TGBotStatus = {
  online: true,
  uptime: '15d 6h 42m',
  messagesSent24h: 342,
  messagesReceived24h: 189,
  activeUsers: 67,
  errorRate: 0.3,
  lastError: 'Rate limit exceeded',
  lastErrorTime: '2026-09-06T14:22:00Z',
}

// ============ Telegram Blacklist ============
export interface TGBlacklistEntry {
  id: string
  userId: string
  username: string
  reason: string
  blockedAt: string
  blockedBy: string
}

export const tgBlacklist: TGBlacklistEntry[] = [
  { id: 'bl-001', userId: '99001', username: 'spammer_01', reason: '发送垃圾消息', blockedAt: '2026-08-01T10:00:00Z', blockedBy: 'admin' },
  { id: 'bl-002', userId: '99002', username: 'abuser_02', reason: '滥用 Bot 命令', blockedAt: '2026-08-15T14:30:00Z', blockedBy: 'admin' },
  { id: 'bl-003', userId: '99003', username: 'bot_account', reason: '疑似自动化账号', blockedAt: '2026-09-01T09:00:00Z', blockedBy: 'devops-lead' },
]

// ============ Telegram Bot Logs ============
export interface TGBotLog {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: string
}

export const tgBotLogs: TGBotLog[] = [
  { id: 'log-001', timestamp: '2026-09-07T09:30:00Z', level: 'info', message: 'Bot started successfully, polling for updates...', source: 'bot-core' },
  { id: 'log-002', timestamp: '2026-09-07T09:31:00Z', level: 'info', message: 'Connected to Telegram API v7.8', source: 'telegram-api' },
  { id: 'log-003', timestamp: '2026-09-07T09:35:00Z', level: 'info', message: 'Received /start command from user 10001 (张三)', source: 'command-handler' },
  { id: 'log-004', timestamp: '2026-09-07T09:36:00Z', level: 'info', message: 'Processed /deploy command for cloud-infrastructure', source: 'command-handler' },
  { id: 'log-005', timestamp: '2026-09-07T09:38:00Z', level: 'warn', message: 'Rate limit warning: 45 messages in last minute', source: 'rate-limiter' },
  { id: 'log-006', timestamp: '2026-09-07T09:40:00Z', level: 'info', message: 'Deploy notification sent to group -10020001 (DevOps 工作群)', source: 'notification' },
  { id: 'log-007', timestamp: '2026-09-07T09:42:00Z', level: 'error', message: 'Failed to send message to -10020003: Forbidden: bot was kicked', source: 'notification' },
  { id: 'log-008', timestamp: '2026-09-07T09:45:00Z', level: 'info', message: 'Health check passed: all services operational', source: 'health-check' },
  { id: 'log-009', timestamp: '2026-09-07T09:50:00Z', level: 'debug', message: 'Webhook update received from Telegram: message_id=34521', source: 'webhook' },
  { id: 'log-010', timestamp: '2026-09-07T09:55:00Z', level: 'info', message: 'Scheduled backup completed: 4 groups, 8 chats, 1289 messages', source: 'scheduler' },
  { id: 'log-011', timestamp: '2026-09-07T10:00:00Z', level: 'warn', message: 'High memory usage detected: 85% of 512MB limit', source: 'monitor' },
  { id: 'log-012', timestamp: '2026-09-07T10:05:00Z', level: 'info', message: 'Garbage collection triggered, freed 128MB', source: 'runtime' },
]

// ============ Telegram Dashboard Stats ============
export interface TGDashboardStats {
  bots: number
  chats: number
  messages24h: number
  commands24h: number
}

export const tgDashboardStats: TGDashboardStats = {
  bots: 3,
  chats: 47,
  messages24h: 1289,
  commands24h: 234,
}
