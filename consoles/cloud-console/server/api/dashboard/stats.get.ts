import { ec2Instances, s3Buckets, rdsInstances, iamUsers } from '../../data/mock'

export default defineEventHandler(() => {
  const runningEC2 = ec2Instances.filter(i => i.state === 'running').length
  const totalS3Size = s3Buckets.reduce((acc, b) => acc + b.sizeGB, 0)
  const runningRDS = rdsInstances.filter(i => i.state === 'available').length
  const activeUsers = iamUsers.filter(u => u.status === 'active').length

  return {
    ec2: { total: ec2Instances.length, running: runningEC2, stopped: ec2Instances.filter(i => i.state === 'stopped').length },
    s3: { buckets: s3Buckets.length, totalSizeGB: Math.round(totalS3Size * 10) / 10 },
    rds: { total: rdsInstances.length, available: runningRDS },
    iam: { total: iamUsers.length, active: activeUsers },
    alerts: [
      { level: 'warning', message: 'EC2 instance i-00000005 is approaching CPU limit', time: '5 min ago' },
      { level: 'info', message: 'RDS backup completed for prod-primary-db', time: '15 min ago' },
      { level: 'error', message: 'S3 bucket log-archive has exceeded 80% storage threshold', time: '1 hour ago' },
      { level: 'info', message: 'IAM user contractor-1 account deactivated (inactivity)', time: '3 hours ago' },
    ],
    costs: {
      currentMonth: 4523.67,
      lastMonth: 3892.15,
      forecast: 5100.00,
    },
  }
})
