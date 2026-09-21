// ============ Settings: General ============
export interface GeneralSettings {
  siteName: string
  siteDescription: string
  siteLogo: string
  language: string
  timezone: string
  dateFormat: string
}

export const generalSettings: GeneralSettings = {
  siteName: 'Cloud Console',
  siteDescription: '企业级云资源管理平台',
  siteLogo: '/logo.svg',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
}

// ============ Settings: Security ============
export interface SecuritySettings {
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumber: boolean
  passwordRequireSpecial: boolean
  passwordMaxAge: number
  sessionTimeout: number
  maxLoginAttempts: number
  lockoutDuration: number
  twoFactorEnabled: boolean
  twoFactorMethod: 'totp' | 'sms' | 'email'
  allowedIpRanges: string[]
  enforceHTTPS: boolean
}

export const securitySettings: SecuritySettings = {
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: true,
  passwordMaxAge: 90,
  sessionTimeout: 3600,
  maxLoginAttempts: 5,
  lockoutDuration: 300,
  twoFactorEnabled: false,
  twoFactorMethod: 'totp',
  allowedIpRanges: ['10.0.0.0/8', '172.16.0.0/12'],
  enforceHTTPS: true,
}

// ============ Settings: Notifications ============
export interface NotificationChannel {
  id: string
  type: 'email' | 'telegram' | 'webhook'
  name: string
  enabled: boolean
  config: Record<string, any>
}

export interface NotificationSettings {
  channels: NotificationChannel[]
  globalEnabled: boolean
  alertSeverity: string[]
  quietHoursStart: string
  quietHoursEnd: string
}

export const notificationSettings: NotificationSettings = {
  globalEnabled: true,
  alertSeverity: ['critical', 'warning'],
  quietHoursStart: '23:00',
  quietHoursEnd: '07:00',
  channels: [
    {
      id: 'notif-001',
      type: 'email',
      name: '管理员邮箱',
      enabled: true,
      config: {
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'alerts@cloudconsole.io',
        smtpFrom: 'alerts@cloudconsole.io',
        useTLS: true,
      },
    },
    {
      id: 'notif-002',
      type: 'telegram',
      name: '告警 Telegram Bot',
      enabled: true,
      config: {
        botToken: '123456:ABC-DEF...',
        defaultChatId: '-10020004',
        parseMode: 'HTML',
      },
    },
    {
      id: 'notif-003',
      type: 'webhook',
      name: 'Slack Webhook',
      enabled: false,
      config: {
        url: 'https://hooks.slack.com/services/T00/B00/xxx',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    {
      id: 'notif-004',
      type: 'webhook',
      name: 'DingTalk Webhook',
      enabled: true,
      config: {
        url: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
        method: 'POST',
        secret: 'SEC...',
      },
    },
  ],
}

// ============ Settings: Backup ============
export interface BackupPolicy {
  id: string
  name: string
  target: string
  schedule: string
  retention: number
  enabled: boolean
  lastRun: string
  nextRun: string
}

export interface BackupHistory {
  id: string
  policyId: string
  policyName: string
  status: 'success' | 'failed' | 'running'
  size: string
  duration: string
  startedAt: string
  completedAt: string
}

export const backupPolicies: BackupPolicy[] = [
  { id: 'bp-001', name: '数据库每日备份', target: 'PostgreSQL 主库', schedule: '每日 02:00', retention: 30, enabled: true, lastRun: '2026-09-08T02:00:00Z', nextRun: '2026-09-09T02:00:00Z' },
  { id: 'bp-002', name: '文件存储增量备份', target: 'MinIO 数据桶', schedule: '每日 03:00', retention: 14, enabled: true, lastRun: '2026-09-08T03:00:00Z', nextRun: '2026-09-09T03:00:00Z' },
  { id: 'bp-003', name: '配置文件快照', target: '系统配置目录', schedule: '每周日 04:00', retention: 90, enabled: true, lastRun: '2026-09-01T04:00:00Z', nextRun: '2026-09-08T04:00:00Z' },
  { id: 'bp-004', name: 'Redis RDB 备份', target: 'Redis 主节点', schedule: '每 6 小时', retention: 7, enabled: false, lastRun: '2026-09-06T18:00:00Z', nextRun: '-' },
]

export const backupHistory: BackupHistory[] = [
  { id: 'bh-001', policyId: 'bp-001', policyName: '数据库每日备份', status: 'success', size: '2.3 GB', duration: '4m 32s', startedAt: '2026-09-08T02:00:00Z', completedAt: '2026-09-08T02:04:32Z' },
  { id: 'bh-002', policyId: 'bp-002', policyName: '文件存储增量备份', status: 'success', size: '856 MB', duration: '2m 15s', startedAt: '2026-09-08T03:00:00Z', completedAt: '2026-09-08T03:02:15Z' },
  { id: 'bh-003', policyId: 'bp-001', policyName: '数据库每日备份', status: 'success', size: '2.2 GB', duration: '4m 28s', startedAt: '2026-09-07T02:00:00Z', completedAt: '2026-09-07T02:04:28Z' },
  { id: 'bh-004', policyId: 'bp-002', policyName: '文件存储增量备份', status: 'failed', size: '-', duration: '0m 12s', startedAt: '2026-09-07T03:00:00Z', completedAt: '2026-09-07T03:00:12Z' },
  { id: 'bh-005', policyId: 'bp-003', policyName: '配置文件快照', status: 'success', size: '12 MB', duration: '0m 8s', startedAt: '2026-09-01T04:00:00Z', completedAt: '2026-09-01T04:00:08Z' },
  { id: 'bh-006', policyId: 'bp-001', policyName: '数据库每日备份', status: 'success', size: '2.1 GB', duration: '4m 10s', startedAt: '2026-09-06T02:00:00Z', completedAt: '2026-09-06T02:04:10Z' },
  { id: 'bh-007', policyId: 'bp-004', policyName: 'Redis RDB 备份', status: 'success', size: '340 MB', duration: '1m 5s', startedAt: '2026-09-06T18:00:00Z', completedAt: '2026-09-06T18:01:05Z' },
  { id: 'bh-008', policyId: 'bp-001', policyName: '数据库每日备份', status: 'running', size: '-', duration: '-', startedAt: '2026-09-08T02:00:00Z', completedAt: '' },
]
