<script setup lang="ts">
const dashboardStore = useDashboardStore()

onMounted(() => dashboardStore.fetchRecentActivities())

const recentLogs = computed(() => {
  const items = dashboardStore.recentActivities || []
  return items.map((log: any) => ({
    user: log.username || log.userId || '-',
    action: log.action || log.module || '-',
    ip: log.ip || '-',
    time: log.createdAt || '-',
    status: log.status === 'error' ? 'error' : 'success',
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
  <VCard title="最近操作日志" :loading="dashboardStore.loading">
    <VCardText class="pa-0">
      <VTable v-if="recentLogs.length" class="text-no-wrap">
        <thead>
          <tr>
            <th class="text-left ps-5">操作人</th>
            <th class="text-left">操作</th>
            <th class="text-left d-none d-md-table-cell">IP</th>
            <th class="text-left">时间</th>
            <th class="text-center pe-5">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in recentLogs" :key="log.user + log.time">
            <td class="ps-5 font-weight-medium">{{ log.user }}</td>
            <td>{{ log.action }}</td>
            <td class="d-none d-md-table-cell text-medium-emphasis">{{ log.ip }}</td>
            <td class="text-medium-emphasis">{{ log.time }}</td>
            <td class="text-center pe-5">
              <VIcon size="20" :icon="statusIcon(log.status)" :color="statusColor(log.status)" />
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!dashboardStore.loading" class="text-center py-8 text-medium-emphasis">
        暂无操作日志
      </VCardText>
    </VCardText>
  </VCard>
</template>
