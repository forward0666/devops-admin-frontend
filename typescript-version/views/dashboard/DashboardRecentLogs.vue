<script setup lang="ts">
const recentLogs = [
  {
    user: 'forward',
    action: '登录系统',
    ip: '192.168.1.100',
    time: '10 分钟前',
    status: 'success',
  },
  {
    user: '张三',
    action: '修改用户权限',
    ip: '192.168.1.102',
    time: '25 分钟前',
    status: 'success',
  },
  {
    user: '李四',
    action: '删除部门',
    ip: '192.168.1.105',
    time: '1 小时前',
    status: 'warning',
  },
  {
    user: 'forward',
    action: '导出用户数据',
    ip: '192.168.1.100',
    time: '2 小时前',
    status: 'success',
  },
  {
    user: '王五',
    action: '登录失败（密码错误）',
    ip: '10.0.0.55',
    time: '3 小时前',
    status: 'error',
  },
  {
    user: '赵六',
    action: '新增用户',
    ip: '192.168.1.108',
    time: '5 小时前',
    status: 'success',
  },
]

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
  <VCard title="最近操作日志">
    <VCardText class="pa-0">
      <VTable class="text-no-wrap">
        <thead>
          <tr>
            <th class="text-left ps-5">
              操作人
            </th>
            <th class="text-left">
              操作
            </th>
            <th class="text-left d-none d-md-table-cell">
              IP
            </th>
            <th class="text-left">
              时间
            </th>
            <th class="text-center pe-5">
              状态
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in recentLogs"
            :key="log.user + log.time"
          >
            <td class="ps-5 font-weight-medium">
              {{ log.user }}
            </td>
            <td>{{ log.action }}</td>
            <td class="d-none d-md-table-cell text-medium-emphasis">
              {{ log.ip }}
            </td>
            <td class="text-medium-emphasis">
              {{ log.time }}
            </td>
            <td class="text-center pe-5">
              <VIcon
                size="20"
                :icon="statusIcon(log.status)"
                :color="statusColor(log.status)"
              />
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCardText>
  </VCard>
</template>
