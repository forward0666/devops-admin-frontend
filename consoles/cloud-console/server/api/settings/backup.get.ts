import { backupPolicies, backupHistory } from '../../data/settings'

export default defineEventHandler(() => {
  return { policies: backupPolicies, history: backupHistory }
})
