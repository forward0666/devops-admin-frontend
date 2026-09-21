import { backupPolicies } from '../../data/settings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const policy = backupPolicies.find(p => p.id === body.id)
  if (policy) {
    Object.assign(policy, body)
    return { success: true, message: '备份策略已更新', data: policy }
  }
  return { success: false, message: '备份策略不存在' }
})
