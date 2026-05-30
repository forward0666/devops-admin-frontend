<script setup lang="ts">
const dashboardStore = useDashboardStore()

onMounted(() => dashboardStore.fetchStats())

const rawStats = computed(() => dashboardStore.stats)

const stats = computed(() => {
  const s = rawStats.value
  return [
    { title: '用户总数', value: s?.totalUsers ?? '-', color: 'primary', icon: 'tabler-users' },
    { title: '活跃用户', value: s?.activeUsers ?? '-', color: 'success', icon: 'tabler-user-check' },
    { title: '禁用用户', value: s?.disabledUsers ?? '-', color: 'error', icon: 'tabler-user-x' },
    { title: '今日新增', value: s?.newUsersToday ?? '-', color: 'info', icon: 'tabler-user-plus' },
  ]
})
</script>

<template>
  <div class="d-flex gap-2">
    <VCard v-for="stat in stats" :key="stat.title" class="flex-1">
      <VCardText class="d-flex align-center py-3 px-4">
        <VAvatar size="36" rounded variant="tonal" :color="stat.color" class="me-3">
          <VIcon :icon="stat.icon" size="20" />
        </VAvatar>
        <div>
          <div class="text-body-2 text-medium-emphasis">{{ stat.title }}</div>
          <div class="text-h6 font-weight-bold">{{ stat.value }}</div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>
