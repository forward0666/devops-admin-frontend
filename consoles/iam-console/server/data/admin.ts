// Admin data - re-exports from mock.ts and adds CRUD helpers
// This provides mutable in-memory data for demo purposes

import { adminUsers as _adminUsers, departments as _departments, operationLogs as _operationLogs, systemSettings as _systemSettings } from './mock'
import type { AdminUser, Department, OperationLog, SystemSettings } from './mock'

// Mutable copies for CRUD operations
export const adminUsers: AdminUser[] = [..._adminUsers]
export const departments: Department[] = [..._departments]
export const operationLogs: OperationLog[] = [..._operationLogs]
export const systemSettings: SystemSettings = { ..._systemSettings }

// Helper to generate IDs
export function nextId(prefix: string, items: { id: string }[]): string {
  const max = items.reduce((m, i) => {
    const n = parseInt(i.id.replace(prefix, ''), 10)
    return n > m ? n : m
  }, 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

export type { AdminUser, Department, OperationLog, SystemSettings }
