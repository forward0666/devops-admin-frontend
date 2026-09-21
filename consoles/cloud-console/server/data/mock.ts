// ============ EC2 Instances ============
export interface EC2Instance {
  id: string
  name: string
  type: string
  state: 'running' | 'stopped' | 'terminated' | 'pending'
  publicIp: string
  privateIp: string
  launchTime: string
  region: string
  az: string
}

const ec2Names = [
  'web-server-01', 'web-server-02', 'api-gateway', 'worker-node-1',
  'worker-node-2', 'redis-cache', 'elasticsearch-01', 'jenkins-ci',
  'monitoring-stack', 'log-aggregator', 'auth-service', 'payment-service',
  'notification-hub', 'cdn-origin', 'batch-processor', 'ml-training',
  'data-pipeline', 'backup-agent', 'vpn-gateway', 'bastion-host',
  'kafka-broker-01', 'zookeeper-01', 'rabbitmq-01', 'nginx-lb',
  'postgres-primary', 'mysql-replica', 'mongo-shard-01', 'consul-server',
  'vault-server', 'terraform-runner', 'prometheus-01', 'grafana-01',
]
const instanceTypes = ['t3.micro', 't3.small', 't3.medium', 'm5.large', 'm5.xlarge', 'c5.2xlarge', 'r5.xlarge', 'g4dn.xlarge']
const states: EC2Instance['state'][] = ['running', 'running', 'running', 'stopped', 'running', 'terminated', 'pending', 'running']
const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']

export const ec2Instances: EC2Instance[] = Array.from({ length: 32 }, (_, i) => ({
  id: `i-${String(i + 1).padStart(8, '0')}`,
  name: ec2Names[i] || `instance-${i + 1}`,
  type: instanceTypes[i % instanceTypes.length],
  state: states[i % states.length],
  publicIp: i % 3 === 0 ? `54.${(i * 7) % 255}.${(i * 13) % 255}.${(i * 3 + 1) % 255}` : '',
  privateIp: `10.0.${(i * 5) % 255}.${(i * 3 + 1) % 255}`,
  launchTime: new Date(Date.now() - i * 86400000 * (i % 30 + 1)).toISOString(),
  region: regions[i % regions.length],
  az: regions[i % regions.length] + String.fromCharCode(97 + (i % 3)),
}))

// ============ S3 Buckets ============
export interface S3Bucket {
  name: string
  region: string
  creationDate: string
  objectCount: number
  sizeGB: number
  versioning: boolean
  encryption: boolean
}

export const s3Buckets: S3Bucket[] = [
  { name: 'app-assets-prod', region: 'us-east-1', creationDate: '2024-01-15', objectCount: 15420, sizeGB: 234.5, versioning: true, encryption: true },
  { name: 'user-uploads', region: 'us-east-1', creationDate: '2024-02-20', objectCount: 89231, sizeGB: 1024.3, versioning: true, encryption: true },
  { name: 'backup-daily', region: 'us-west-2', creationDate: '2024-03-01', objectCount: 365, sizeGB: 5120.0, versioning: false, encryption: true },
  { name: 'log-archive', region: 'us-west-2', creationDate: '2024-01-10', objectCount: 2456789, sizeGB: 890.2, versioning: false, encryption: true },
  { name: 'static-website', region: 'us-east-1', creationDate: '2024-04-05', objectCount: 456, sizeGB: 2.1, versioning: false, encryption: false },
  { name: 'data-lake-raw', region: 'eu-west-1', creationDate: '2024-02-28', objectCount: 567890, sizeGB: 15678.9, versioning: true, encryption: true },
  { name: 'ml-models-store', region: 'us-east-1', creationDate: '2024-05-12', objectCount: 89, sizeGB: 456.7, versioning: true, encryption: true },
  { name: 'cdn-assets', region: 'ap-southeast-1', creationDate: '2024-03-20', objectCount: 3456, sizeGB: 78.9, versioning: false, encryption: false },
  { name: 'compliance-docs', region: 'us-east-1', creationDate: '2024-06-01', objectCount: 1234, sizeGB: 12.3, versioning: true, encryption: true },
  { name: 'temp-processing', region: 'us-west-2', creationDate: '2024-07-15', objectCount: 567, sizeGB: 345.6, versioning: false, encryption: true },
]

// ============ RDS Instances ============
export interface RDSInstance {
  id: string
  name: string
  engine: string
  engineVersion: string
  class: string
  storage: number
  state: 'available' | 'stopped' | 'backing-up' | 'modifying'
  multiAZ: boolean
  endpoint: string
  port: number
}

export const rdsInstances: RDSInstance[] = [
  { id: 'db-001', name: 'prod-primary-db', engine: 'PostgreSQL', engineVersion: '15.4', class: 'db.r5.xlarge', storage: 500, state: 'available', multiAZ: true, endpoint: 'prod-primary-db.xxxx.us-east-1.rds.example.com', port: 5432 },
  { id: 'db-002', name: 'prod-replica-db', engine: 'PostgreSQL', engineVersion: '15.4', class: 'db.r5.large', storage: 500, state: 'available', multiAZ: false, endpoint: 'prod-replica-db.xxxx.us-east-1.rds.example.com', port: 5432 },
  { id: 'db-003', name: 'staging-db', engine: 'MySQL', engineVersion: '8.0', class: 'db.t3.medium', storage: 100, state: 'available', multiAZ: false, endpoint: 'staging-db.xxxx.us-east-1.rds.example.com', port: 3306 },
  { id: 'db-004', name: 'analytics-warehouse', engine: 'PostgreSQL', engineVersion: '15.4', class: 'db.r5.2xlarge', storage: 2000, state: 'available', multiAZ: true, endpoint: 'analytics-warehouse.xxxx.us-east-1.rds.example.com', port: 5432 },
  { id: 'db-005', name: 'user-sessions', engine: 'Redis', engineVersion: '7.0', class: 'db.r5.large', storage: 50, state: 'available', multiAZ: true, endpoint: 'user-sessions.xxxx.us-east-1.rds.example.com', port: 6379 },
  { id: 'db-006', name: 'legacy-mysql', engine: 'MySQL', engineVersion: '5.7', class: 'db.m5.large', storage: 200, state: 'stopped', multiAZ: false, endpoint: 'legacy-mysql.xxxx.us-east-1.rds.example.com', port: 3306 },
  { id: 'db-007', name: 'reporting-db', engine: 'PostgreSQL', engineVersion: '14', class: 'db.r5.large', storage: 300, state: 'backing-up', multiAZ: false, endpoint: 'reporting-db.xxxx.us-west-2.rds.example.com', port: 5432 },
  { id: 'db-008', name: 'test-db', engine: 'PostgreSQL', engineVersion: '15.4', class: 'db.t3.micro', storage: 20, state: 'available', multiAZ: false, endpoint: 'test-db.xxxx.us-east-1.rds.example.com', port: 5432 },
]

// ============ IAM Users ============
export interface IAMUser {
  id: string
  username: string
  email: string
  groups: string[]
  status: 'active' | 'inactive'
  mfaEnabled: boolean
  lastActivity: string
  createdAt: string
}

export const iamUsers: IAMUser[] = [
  { id: 'usr-001', username: 'admin', email: 'admin@cloudconsole.io', groups: ['Admins', 'DevOps'], status: 'active', mfaEnabled: true, lastActivity: '2026-09-07T01:00:00Z', createdAt: '2024-01-01' },
  { id: 'usr-002', username: 'developer-1', email: 'dev1@cloudconsole.io', groups: ['Developers'], status: 'active', mfaEnabled: true, lastActivity: '2026-09-06T18:00:00Z', createdAt: '2024-02-15' },
  { id: 'usr-003', username: 'developer-2', email: 'dev2@cloudconsole.io', groups: ['Developers'], status: 'active', mfaEnabled: false, lastActivity: '2026-09-05T12:00:00Z', createdAt: '2024-03-01' },
  { id: 'usr-004', username: 'devops-lead', email: 'devops@cloudconsole.io', groups: ['DevOps', 'Admins'], status: 'active', mfaEnabled: true, lastActivity: '2026-09-07T00:30:00Z', createdAt: '2024-01-10' },
  { id: 'usr-005', username: 'data-engineer', email: 'data@cloudconsole.io', groups: ['DataTeam'], status: 'active', mfaEnabled: true, lastActivity: '2026-09-06T10:00:00Z', createdAt: '2024-04-20' },
  { id: 'usr-006', username: 'contractor-1', email: 'contractor@external.com', groups: ['ReadOnly'], status: 'inactive', mfaEnabled: false, lastActivity: '2026-08-15T09:00:00Z', createdAt: '2024-06-01' },
  { id: 'usr-007', username: 'qa-tester', email: 'qa@cloudconsole.io', groups: ['Developers', 'QA'], status: 'active', mfaEnabled: false, lastActivity: '2026-09-06T15:00:00Z', createdAt: '2024-05-10' },
  { id: 'usr-008', username: 'security-auditor', email: 'security@cloudconsole.io', groups: ['Security', 'ReadOnly'], status: 'active', mfaEnabled: true, lastActivity: '2026-09-06T22:00:00Z', createdAt: '2024-01-20' },
]


// ============ Cloudflare (re-export from cloudflare.ts) ============
export { cfZones, cfDNSRecords, cfSecurityRules } from './cloudflare'
export type { CFZone, CFDNSRecord, CFSecurityRule } from './cloudflare'

// ============ Projects ============
export interface Project {
  id: string
  name: string
  description: string
  memberCount: number
  status: 'active' | 'archived' | 'suspended'
  domains: string[]
  members: { username: string; role: string }[]
  middlewares: string[]
  createdAt: string
  owner: string
}

export const projects: Project[] = [
  {
    id: 'proj-001', name: 'cloud-infrastructure', description: '核心云基础设施管理平台', memberCount: 8,
    status: 'active', domains: ['infra.example.com', 'ci.example.com'],
    members: [{ username: 'admin', role: 'owner' }, { username: 'devops-lead', role: 'admin' }, { username: 'developer-1', role: 'member' }],
    middlewares: ['Nginx', 'Redis', 'PostgreSQL', 'RabbitMQ'], createdAt: '2024-01-15', owner: 'admin'
  },
  {
    id: 'proj-002', name: 'main-platform', description: '主业务平台 - 用户端 + 管理端', memberCount: 15,
    status: 'active', domains: ['app.example.com', 'admin.example.com', 'api.example.com'],
    members: [{ username: 'developer-1', role: 'owner' }, { username: 'developer-2', role: 'admin' }, { username: 'qa-tester', role: 'member' }],
    middlewares: ['Nginx', 'Redis', 'MySQL', 'Elasticsearch', 'Kafka'], createdAt: '2024-02-01', owner: 'developer-1'
  },
  {
    id: 'proj-003', name: 'monitoring-stack', description: 'Prometheus + Grafana 监控告警栈', memberCount: 4,
    status: 'active', domains: ['grafana.example.com', 'prometheus.internal'],
    members: [{ username: 'devops-lead', role: 'owner' }, { username: 'data-engineer', role: 'member' }],
    middlewares: ['Prometheus', 'Grafana', 'Loki', 'Alertmanager'], createdAt: '2024-03-10', owner: 'devops-lead'
  },
  {
    id: 'proj-004', name: 'data-pipeline', description: 'ETL 数据处理管道', memberCount: 3,
    status: 'active', domains: ['pipeline.internal'],
    members: [{ username: 'data-engineer', role: 'owner' }],
    middlewares: ['Apache Spark', 'Airflow', 'MinIO', 'PostgreSQL'], createdAt: '2024-04-20', owner: 'data-engineer'
  },
  {
    id: 'proj-005', name: 'internal-tools', description: '内部工具集合（Wiki、CI/CD等）', memberCount: 6,
    status: 'active', domains: ['wiki.internal', 'ci.internal'],
    members: [{ username: 'admin', role: 'owner' }, { username: 'developer-2', role: 'admin' }],
    middlewares: ['Gitea', 'Drone CI', 'MinIO'], createdAt: '2024-05-01', owner: 'admin'
  },
  {
    id: 'proj-006', name: 'legacy-system', description: '旧版系统（已归档）', memberCount: 2,
    status: 'archived', domains: ['legacy.example.com'],
    members: [{ username: 'developer-1', role: 'owner' }],
    middlewares: ['Apache', 'MySQL 5.7', 'PHP'], createdAt: '2023-06-01', owner: 'developer-1'
  },
  {
    id: 'proj-007', name: 'ml-training', description: '机器学习模型训练平台', memberCount: 5,
    status: 'active', domains: ['ml.internal', 'jupyter.internal'],
    members: [{ username: 'data-engineer', role: 'owner' }, { username: 'developer-2', role: 'member' }],
    middlewares: ['Jupyter', 'TensorFlow', 'MLflow', 'MinIO'], createdAt: '2024-07-15', owner: 'data-engineer'
  },
]

// ============ Admin Users ============
export interface AdminUser {
  id: string
  username: string
  email: string
  role: 'superadmin' | 'admin' | 'editor' | 'viewer'
  status: 'active' | 'disabled' | 'locked'
  department: string
  lastLogin: string
  createdAt: string
}

export const adminUsers: AdminUser[] = [
  { id: 'adm-001', username: 'admin', email: 'admin@cloudconsole.io', role: 'superadmin', status: 'active', department: '技术部', lastLogin: '2026-09-07T09:00:00Z', createdAt: '2024-01-01' },
  { id: 'adm-002', username: 'devops-lead', email: 'devops@cloudconsole.io', role: 'admin', status: 'active', department: '运维部', lastLogin: '2026-09-07T08:30:00Z', createdAt: '2024-01-10' },
  { id: 'adm-003', username: 'developer-1', email: 'dev1@cloudconsole.io', role: 'editor', status: 'active', department: '研发部', lastLogin: '2026-09-06T18:00:00Z', createdAt: '2024-02-15' },
  { id: 'adm-004', username: 'developer-2', email: 'dev2@cloudconsole.io', role: 'editor', status: 'active', department: '研发部', lastLogin: '2026-09-05T12:00:00Z', createdAt: '2024-03-01' },
  { id: 'adm-005', username: 'data-engineer', email: 'data@cloudconsole.io', role: 'editor', status: 'active', department: '数据部', lastLogin: '2026-09-06T10:00:00Z', createdAt: '2024-04-20' },
  { id: 'adm-006', username: 'qa-tester', email: 'qa@cloudconsole.io', role: 'viewer', status: 'active', department: '测试部', lastLogin: '2026-09-06T15:00:00Z', createdAt: '2024-05-10' },
  { id: 'adm-007', username: 'security-auditor', email: 'security@cloudconsole.io', role: 'viewer', status: 'active', department: '安全部', lastLogin: '2026-09-06T22:00:00Z', createdAt: '2024-01-20' },
  { id: 'adm-008', username: 'contractor-1', email: 'contractor@external.com', role: 'viewer', status: 'disabled', department: '外部', lastLogin: '2026-08-15T09:00:00Z', createdAt: '2024-06-01' },
  { id: 'adm-009', username: 'intern-dev', email: 'intern@cloudconsole.io', role: 'viewer', status: 'locked', department: '研发部', lastLogin: '2026-07-01T10:00:00Z', createdAt: '2025-06-01' },
]

// ============ Departments ============
export interface Department {
  id: string
  name: string
  parentId: string | null
  memberCount: number
  leader: string
}

export const departments: Department[] = [
  { id: 'dept-001', name: '技术部', parentId: null, memberCount: 20, leader: 'admin' },
  { id: 'dept-002', name: '研发部', parentId: 'dept-001', memberCount: 10, leader: 'developer-1' },
  { id: 'dept-003', name: '运维部', parentId: 'dept-001', memberCount: 5, leader: 'devops-lead' },
  { id: 'dept-004', name: '数据部', parentId: 'dept-001', memberCount: 5, leader: 'data-engineer' },
  { id: 'dept-005', name: '测试部', parentId: null, memberCount: 6, leader: 'qa-tester' },
  { id: 'dept-006', name: '安全部', parentId: null, memberCount: 3, leader: 'security-auditor' },
  { id: 'dept-007', name: '产品部', parentId: null, memberCount: 4, leader: 'product-lead' },
]

// ============ Operation Logs ============
export interface OperationLog {
  id: string
  username: string
  action: string
  resource: string
  ip: string
  timestamp: string
  status: 'success' | 'failed'
}

export const operationLogs: OperationLog[] = [
  { id: 'log-001', username: 'admin', action: '创建项目', resource: 'proj-007 ml-training', ip: '10.0.1.1', timestamp: '2026-09-07T09:30:00Z', status: 'success' },
  { id: 'log-002', username: 'devops-lead', action: '部署服务', resource: 'main-platform v2.3.1', ip: '10.0.1.2', timestamp: '2026-09-07T09:15:00Z', status: 'success' },
  { id: 'log-003', username: 'developer-1', action: '修改 DNS 记录', resource: 'api.example.com A', ip: '10.0.1.10', timestamp: '2026-09-07T08:45:00Z', status: 'success' },
  { id: 'log-004', username: 'admin', action: '禁用用户', resource: 'contractor-1', ip: '10.0.1.1', timestamp: '2026-09-07T08:00:00Z', status: 'success' },
  { id: 'log-005', username: 'developer-2', action: '回滚部署', resource: 'cloud-infrastructure v1.8.0', ip: '10.0.1.11', timestamp: '2026-09-06T22:30:00Z', status: 'success' },
  { id: 'log-006', username: 'devops-lead', action: '清除缓存', resource: 'example.com zone', ip: '10.0.1.2', timestamp: '2026-09-06T20:00:00Z', status: 'success' },
  { id: 'log-007', username: 'qa-tester', action: '登录失败', resource: '系统登录', ip: '10.0.1.50', timestamp: '2026-09-06T18:00:00Z', status: 'failed' },
  { id: 'log-008', username: 'admin', action: '修改系统设置', resource: '注册开关: 关闭', ip: '10.0.1.1', timestamp: '2026-09-06T16:00:00Z', status: 'success' },
  { id: 'log-009', username: 'data-engineer', action: '创建数据管道', resource: 'pipeline-etl-v3', ip: '10.0.1.30', timestamp: '2026-09-06T14:00:00Z', status: 'success' },
  { id: 'log-010', username: 'developer-1', action: '添加域名', resource: 'ml.internal → ml-training', ip: '10.0.1.10', timestamp: '2026-09-06T12:00:00Z', status: 'success' },
  { id: 'log-011', username: 'security-auditor', action: '导出审计报告', resource: '9月审计报告', ip: '10.0.1.60', timestamp: '2026-09-06T10:00:00Z', status: 'success' },
  { id: 'log-012', username: 'intern-dev', action: '登录失败', resource: '系统登录', ip: '10.0.1.99', timestamp: '2026-09-05T09:00:00Z', status: 'failed' },
]

// ============ System Settings ============
export interface SystemSettings {
  siteName: string
  siteLogo: string
  registrationEnabled: boolean
  defaultRole: string
  sessionTimeout: number
  maxUploadSize: number
  maintenanceMode: boolean
  maintenanceMessage: string
  smtpHost: string
  smtpPort: number
  smtpFrom: string
}

export const systemSettings: SystemSettings = {
  siteName: 'Cloud Console',
  siteLogo: '/logo.svg',
  registrationEnabled: false,
  defaultRole: 'viewer',
  sessionTimeout: 3600,
  maxUploadSize: 50,
  maintenanceMode: false,
  maintenanceMessage: '系统维护中，请稍后再试。',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpFrom: 'noreply@cloudconsole.io',
}

// ============ IAM Groups ============
export interface IAMGroup {
  id: string
  name: string
  description: string
  members: string[]
  attachedPolicies: string[]
  createdAt: string
}

export const iamGroups: IAMGroup[] = [
  { id: 'grp-iam-001', name: 'Admins', description: 'Full administrative access to all resources', members: ['usr-001', 'usr-004'], attachedPolicies: ['AdministratorAccess', 'IAMFullAccess'], createdAt: '2024-01-01' },
  { id: 'grp-iam-002', name: 'Developers', description: 'Access to development resources and limited production', members: ['usr-002', 'usr-003', 'usr-007'], attachedPolicies: ['EC2FullAccess', 'S3ReadOnlyAccess', 'CloudWatchReadOnlyAccess'], createdAt: '2024-01-15' },
  { id: 'grp-iam-003', name: 'DevOps', description: 'Infrastructure management and deployment access', members: ['usr-001', 'usr-004'], attachedPolicies: ['EC2FullAccess', 'S3FullAccess', 'CloudFormationFullAccess', 'IAMReadOnlyAccess'], createdAt: '2024-01-10' },
  { id: 'grp-iam-004', name: 'DataTeam', description: 'Data engineering and analytics access', members: ['usr-005'], attachedPolicies: ['S3FullAccess', 'RDSFullAccess', 'RedshiftReadOnlyAccess'], createdAt: '2024-02-01' },
  { id: 'grp-iam-005', name: 'ReadOnly', description: 'Read-only access to all resources for auditing', members: ['usr-006', 'usr-008'], attachedPolicies: ['ReadOnlyAccess'], createdAt: '2024-01-05' },
  { id: 'grp-iam-006', name: 'QA', description: 'Testing environment access', members: ['usr-007'], attachedPolicies: ['EC2ReadOnlyAccess', 'S3ReadOnlyAccess'], createdAt: '2024-03-01' },
  { id: 'grp-iam-007', name: 'Security', description: 'Security auditing and compliance access', members: ['usr-008'], attachedPolicies: ['SecurityAudit', 'IAMReadOnlyAccess', 'CloudTrailReadOnlyAccess'], createdAt: '2024-01-20' },
]

// ============ IAM Roles ============
export interface IAMRole {
  id: string
  name: string
  description: string
  trustPolicy: object
  maxSessionDuration: number
  attachedPolicies: string[]
  createdAt: string
}

export const iamRoles: IAMRole[] = [
  {
    id: 'role-001', name: 'EC2-Service-Role', description: 'Allows EC2 instances to call cloud services',
    trustPolicy: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Service: 'ec2.example.com' }, Action: 'sts:AssumeRole' }] },
    maxSessionDuration: 3600, attachedPolicies: ['EC2FullAccess', 'S3ReadOnlyAccess'], createdAt: '2024-01-15'
  },
  {
    id: 'role-002', name: 'Lambda-Execution-Role', description: 'Execution role for Lambda functions',
    trustPolicy: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.example.com' }, Action: 'sts:AssumeRole' }] },
    maxSessionDuration: 3600, attachedPolicies: ['LambdaFullAccess', 'DynamoDBFullAccess'], createdAt: '2024-02-01'
  },
  {
    id: 'role-003', name: 'CrossAccount-Admin', description: 'Cross-account admin access for organization management',
    trustPolicy: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Account: 'arn:iam:123456789012:root' }, Action: 'sts:AssumeRole', Condition: { StringEquals: { 'sts:ExternalId': 'CrossAccountAdmin2024' } } }] },
    maxSessionDuration: 7200, attachedPolicies: ['AdministratorAccess'], createdAt: '2024-01-10'
  },
  {
    id: 'role-004', name: 'CI-CD-Pipeline-Role', description: 'Role assumed by CI/CD pipelines for deployments',
    trustPolicy: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Account: 'arn:iam:123456789012:role/CodeBuild-Role' }, Action: 'sts:AssumeRole' }] },
    maxSessionDuration: 3600, attachedPolicies: ['EC2FullAccess', 'S3FullAccess', 'CloudFormationFullAccess', 'ECSFullAccess'], createdAt: '2024-03-15'
  },
  {
    id: 'role-005', name: 'ReadOnly-Audit-Role', description: 'Read-only role for security auditing',
    trustPolicy: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Account: 'arn:iam:987654321098:root' }, Action: 'sts:AssumeRole', Condition: { Bool: { 'sts:MultiFactorAuthPresent': 'true' } } }] },
    maxSessionDuration: 3600, attachedPolicies: ['ReadOnlyAccess', 'SecurityAudit'], createdAt: '2024-02-20'
  },
]

// ============ IAM Policies ============
export interface IAMPolicy {
  id: string
  name: string
  type: 'managed' | 'inline'
  description: string
  attachmentCount: number
  policyDocument: object
  createdAt: string
}

export const iamPolicies: IAMPolicy[] = [
  {
    id: 'pol-001', name: 'AdministratorAccess', type: 'managed',
    description: 'Provides full access to cloud services and resources',
    attachmentCount: 3, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }
  },
  {
    id: 'pol-002', name: 'ReadOnlyAccess', type: 'managed',
    description: 'Provides read-only access to cloud services and resources',
    attachmentCount: 4, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['*Describe*', '*List*', '*Get*', '*View*', 'logs:FilterLogEvents', 'cloudwatch:GetMetricData', 'cloudwatch:GetMetricStatistics'], Resource: '*' }] }
  },
  {
    id: 'pol-003', name: 'EC2FullAccess', type: 'managed',
    description: 'Provides full access to EC2',
    attachmentCount: 4, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['ec2:*', 'elasticloadbalancing:*', 'autoscaling:*', 'cloudwatch:GetMetricData', 'cloudwatch:ListMetrics'], Resource: '*' }] }
  },
  {
    id: 'pol-004', name: 'S3FullAccess', type: 'managed',
    description: 'Provides full access to all S3 buckets and objects',
    attachmentCount: 3, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 's3:*', Resource: ['arn:s3:::*', 'arn:s3:::*/*'] }] }
  },
  {
    id: 'pol-005', name: 'S3ReadOnlyAccess', type: 'managed',
    description: 'Provides read-only access to all S3 buckets',
    attachmentCount: 2, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:Get*', 's3:List*', 's3:Describe*'], Resource: '*' }] }
  },
  {
    id: 'pol-006', name: 'IAMFullAccess', type: 'managed',
    description: 'Allows full access to IAM users, groups, roles, and policies',
    attachmentCount: 1, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'iam:*', Resource: '*' }] }
  },
  {
    id: 'pol-007', name: 'IAMReadOnlyAccess', type: 'managed',
    description: 'Allows read-only access to IAM',
    attachmentCount: 2, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['iam:Get*', 'iam:List*', 'iam:Generate*'], Resource: '*' }] }
  },
  {
    id: 'pol-008', name: 'CloudWatchReadOnlyAccess', type: 'managed',
    description: 'Provides read-only access to CloudWatch',
    attachmentCount: 1, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['cloudwatch:GetMetricData', 'cloudwatch:ListMetrics', 'cloudwatch:GetDashboard', 'logs:DescribeLogGroups', 'logs:FilterLogEvents'], Resource: '*' }] }
  },
  {
    id: 'pol-009', name: 'CloudFormationFullAccess', type: 'managed',
    description: 'Provides full access to CloudFormation',
    attachmentCount: 2, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['cloudformation:*', 's3:GetObject', 's3:ListBucket'], Resource: '*' }] }
  },
  {
    id: 'pol-010', name: 'SecurityAudit', type: 'managed',
    description: 'Grants access to read security configuration metadata',
    attachmentCount: 2, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['iam:GenerateCredentialReport', 'iam:Get*', 'iam:List*', 'access-analyzer:*', 'cloudtrail:Get*', 'cloudtrail:Describe*', 'cloudtrail:List*', 'kms:Describe*', 'kms:Get*', 'kms:List*', 'trustedadvisor:*'], Resource: '*' }] }
  },
  {
    id: 'pol-011', name: 'LambdaFullAccess', type: 'managed',
    description: 'Provides full access to Lambda',
    attachmentCount: 1, createdAt: '2024-02-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['lambda:*', 'logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'], Resource: '*' }] }
  },
  {
    id: 'pol-012', name: 'DynamoDBFullAccess', type: 'managed',
    description: 'Provides full access to DynamoDB',
    attachmentCount: 1, createdAt: '2024-02-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: 'dynamodb:*', Resource: '*' }] }
  },
  {
    id: 'pol-013', name: 'RDSFullAccess', type: 'managed',
    description: 'Provides full access to RDS',
    attachmentCount: 1, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['rds:*', 'pi:*', 'cloudwatch:GetMetricData', 'cloudwatch:ListMetrics'], Resource: '*' }] }
  },
  {
    id: 'pol-014', name: 'RedshiftReadOnlyAccess', type: 'managed',
    description: 'Provides read-only access to Redshift',
    attachmentCount: 1, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['redshift:Describe*', 'redshift:ViewQueriesInConsole', 'redshift:GetReservedNodeExchangeOfferings'], Resource: '*' }] }
  },
  {
    id: 'pol-015', name: 'EC2ReadOnlyAccess', type: 'managed',
    description: 'Provides read-only access to EC2',
    attachmentCount: 1, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['ec2:Describe*', 'ec2:Get*', 'elasticloadbalancing:Describe*', 'autoscaling:Describe*'], Resource: '*' }] }
  },
  {
    id: 'pol-016', name: 'ECSFullAccess', type: 'managed',
    description: 'Provides full access to ECS',
    attachmentCount: 1, createdAt: '2024-03-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['ecs:*', 'ecr:*', 'logs:*', 'ec2:Describe*', 'elasticloadbalancing:Describe*'], Resource: '*' }] }
  },
  {
    id: 'pol-017', name: 'CloudTrailReadOnlyAccess', type: 'managed',
    description: 'Provides read-only access to CloudTrail',
    attachmentCount: 1, createdAt: '2024-01-01',
    policyDocument: { Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['cloudtrail:GetTrail', 'cloudtrail:GetTrailStatus', 'cloudtrail:DescribeTrails', 'cloudtrail:LookupEvents', 'cloudtrail:ListTags', 'cloudtrail:ListPublicKeys', 'cloudtrail:GetEventSelectors'], Resource: '*' }] }
  },
]

// ============ IAM Users Extended (added inlinePolicies) ============
export interface IAMUserExtended extends IAMUser {
  inlinePolicies: string[]
  accessKeys: { id: string; status: 'Active' | 'Inactive'; created: string; lastUsed: string }[]
}

export const iamUsersExtended: IAMUserExtended[] = [
  { ...iamUsers[0], inlinePolicies: ['DenyBilling'], accessKeys: [{ id: 'AKIAIO...MPLE', status: 'Active', created: '2024-01-01', lastUsed: '2026-09-07' }] },
  { ...iamUsers[1], inlinePolicies: [], accessKeys: [{ id: 'AKIAI4...MPLE', status: 'Active', created: '2024-02-15', lastUsed: '2026-09-06' }] },
  { ...iamUsers[2], inlinePolicies: [], accessKeys: [] },
  { ...iamUsers[3], inlinePolicies: ['DeployAllow'], accessKeys: [{ id: 'AKIAIO...MPLE', status: 'Active', created: '2024-01-10', lastUsed: '2026-09-07' }, { id: 'AKIAI4...MPLF', status: 'Inactive', created: '2023-06-01', lastUsed: '2024-01-09' }] },
  { ...iamUsers[4], inlinePolicies: [], accessKeys: [{ id: 'AKIAIO...MPLE', status: 'Active', created: '2024-04-20', lastUsed: '2026-09-06' }] },
  { ...iamUsers[5], inlinePolicies: [], accessKeys: [{ id: 'AKIAI4...MPLG', status: 'Inactive', created: '2024-06-01', lastUsed: '2026-08-15' }] },
  { ...iamUsers[6], inlinePolicies: [], accessKeys: [] },
  { ...iamUsers[7], inlinePolicies: ['SecurityDenyDelete'], accessKeys: [{ id: 'AKIAIO...MPLE', status: 'Active', created: '2024-01-20', lastUsed: '2026-09-06' }] },
]