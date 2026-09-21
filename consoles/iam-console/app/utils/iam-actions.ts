// ============ IAM Actions - Complete AWS-style Permission Model ============

export interface PermissionAction {
  key: string
  label: string
  icon: string
  color: string
  level: number
  requires: string[]
  description: string
}

export const permissionActions: PermissionAction[] = [
  { 
    key: 'List', 
    label: '列出', 
    icon: '📋', 
    color: 'text-gray-600 bg-gray-50',
    level: 1,
    requires: [],
    description: '列出资源列表，最基础的访问权限'
  },
  { 
    key: 'Get', 
    label: '获取', 
    icon: '🔑', 
    color: 'text-purple-600 bg-purple-50',
    level: 2,
    requires: ['List'],
    description: '获取单个资源的详细信息，需要先有 List 权限'
  },
  { 
    key: 'Describe', 
    label: '查看', 
    icon: '👁️', 
    color: 'text-blue-600 bg-blue-50',
    level: 3,
    requires: ['List', 'Get'],
    description: '查看资源的完整信息，需要先有 List 和 Get 权限'
  },
  { 
    key: 'Create', 
    label: '创建', 
    icon: '➕', 
    color: 'text-green-600 bg-green-50',
    level: 4,
    requires: ['List', 'Get', 'Describe'],
    description: '创建新资源，需要先有 List、Get 和 Describe 权限'
  },
  { 
    key: 'Update', 
    label: '更新', 
    icon: '✏️', 
    color: 'text-yellow-600 bg-yellow-50',
    level: 5,
    requires: ['List', 'Get', 'Describe', 'Create'],
    description: '更新现有资源，需要先有 List、Get、Describe 和 Create 权限'
  },
  { 
    key: 'Delete', 
    label: '删除', 
    icon: '🗑️', 
    color: 'text-red-600 bg-red-50',
    level: 6,
    requires: ['List', 'Get', 'Describe', 'Create', 'Update'],
    description: '删除资源，需要先有所有前置权限'
  },
  { 
    key: 'Permissions', 
    label: '权限管理', 
    icon: '🔐', 
    color: 'text-indigo-600 bg-indigo-50',
    level: 7,
    requires: ['List', 'Get', 'Describe'],
    description: '管理策略和权限绑定，需要先有基础访问权限'
  },
  { 
    key: 'Tagging', 
    label: '标签管理', 
    icon: '🏷️', 
    color: 'text-teal-600 bg-teal-50',
    level: 8,
    requires: ['List', 'Get', 'Describe'],
    description: '管理资源标签，需要先有基础访问权限'
  },
  { 
    key: 'Pass', 
    label: '传递', 
    icon: '🔄', 
    color: 'text-orange-600 bg-orange-50',
    level: 9,
    requires: ['List', 'Get', 'Describe'],
    description: '传递角色给服务，需要先有基础访问权限'
  },
]

// Service name mapping
export const serviceNames: Record<string, string> = {
  'iam': '身份权限',
  'cloudflare': 'Cloudflare',
  'telegram': 'Telegram',
  'projects': '项目管理',
  'services': '服务目录',
  'settings': '系统设置',
  'admin': '系统管理',
  'ec2': '云服务器',
  's3': '对象存储',
  'rds': '关系数据库',
  'lambda': '函数计算',
  'ecs': '容器服务',
  'cloudwatch': '监控告警',
  'vpc': '虚拟网络',
  'route53': 'DNS服务',
  'cloudfront': 'CDN分发',
}

// Get permission info by key
export function getPermission(key: string): PermissionAction | undefined {
  return permissionActions.find(p => p.key === key)
}

// Parse action string (format: "Service:Action" or just "Action")
export function parseAction(action: string): { 
  service: string; 
  action: string; 
  label: string; 
  icon: string; 
  color: string;
  level: number;
  requires: string[];
  description: string;
} {
  const parts = action.split(':')
  const serviceKey = parts.length > 1 ? parts[0] : ''
  const actionKey = parts.length > 1 ? parts[1] : parts[0]
  
  const permission = getPermission(actionKey)
  const service = serviceKey ? (serviceNames[serviceKey] || serviceKey) : '全局'
  
  return {
    service,
    action: actionKey,
    label: permission?.label || actionKey,
    icon: permission?.icon || '⚡',
    color: permission?.color || 'text-gray-600 bg-gray-50',
    level: permission?.level || 0,
    requires: permission?.requires || [],
    description: permission?.description || '',
  }
}

// Get all permissions for display
export function getAllPermissions(): PermissionAction[] {
  return permissionActions
}

// Get color for permission type
export function getPermissionColor(key: string): string {
  const permission = getPermission(key)
  return permission?.color || 'text-gray-600 bg-gray-50'
}

// Check if a permission requires another permission
export function requiresPermission(permission: string, required: string): boolean {
  const perm = getPermission(permission)
  if (!perm) return false
  return perm.requires.includes(required)
}

// Get permission hierarchy
export function getPermissionHierarchy(): { key: string; label: string; level: number; requires: string[] }[] {
  return permissionActions.map(p => ({
    key: p.key,
    label: p.label,
    level: p.level,
    requires: p.requires,
  }))
}
