<script setup lang="ts">
const dashboardStore = useDashboardStore()

onMounted(() => dashboardStore.fetchRecentActivities())

const recentLogs = computed(() => {
  const items = dashboardStore.recentActivities || []
  return items.map((log: any) => ({
    user: log.username || log.userId || '-',
    action: log.operationName || log.operationType || '-',
    ip: log.ipAddress || '-',
    time: log.timestamp || '-',
    status: log.status === 'error' || log.status === 'FAIL' ? 'error' : 'success',
  }))
})

const statusIcon = (status: string) => {
  if (status === 'success') return 'tabler-circle-check-filled'
  return status === 'warning' ? 'tabler-alert-triangle-filled' : 'tabler-circle-x-filled'
}

const statusColor = (status: string) => {
  if (status === 'success') return 'success'
  return status === 'warning' ? 'warning' : 'error'
}
</script>

<template>
  <div>
    <div class="text-body-2 font-weight-medium mb-2">最近操作日志</div>
    <VTable v-if="recentLogs.length" class="text-no-wrap" hover density="compact">
      <thead>
        <tr>
          <th class="text-left">操作人</th>
          <th class="text-left">操作</th>
          <th class="text-left d-none d-md-table-cell">IP</th>
          <th class="text-left">时间</th>
          <th class="text-center">状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in recentLogs" :key="log.user + log.time">
          <td class="font-weight-medium">{{ log.user }}</td>
          <td>{{ log.action }}</td>
          <td class="d-none d-md-table-cell text-medium-emphasis">{{ log.ip }}</td>
          <td class="text-medium-emphasis">{{ log.time }}</td>
          <td class="text-center">
            <VIcon size="18" :icon="statusIcon(log.status)" :color="statusColor(log.status)" />
          </td>
        </tr>
      </tbody>
    </VTable>
    <div v-else-if="!dashboardStore.loading" class="text-center py-6 text-medium-emphasis">
      暂无操作日志
    </div>
  </div>
</template>
