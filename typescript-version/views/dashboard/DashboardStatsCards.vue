<script setup lang="ts">
const dashboardStore = useDashboardStore()

onMounted(() => dashboardStore.fetchStats())

const rawStats = computed(() => dashboardStore.stats)

const stats = computed(() => {
  const s = rawStats.value
  return [
    { title: '用户总数', value: s?.totalUsers ?? '-', color: 'primary' },
    { title: '活跃用户', value: s?.activeUsers ?? '-', color: 'success' },
    { title: '禁用用户', value: s?.disabledUsers ?? '-', color: 'error' },
    { title: '今日新增', value: s?.newUsersToday ?? '-', color: 'info' },
  ]
})
</script>

<template>
  <div class="d-flex gap-4">
    <div v-for="stat in stats" :key="stat.title" class="d-flex align-center gap-2">
      <VChip :color="stat.color" variant="tonal" size="small" label>{{ stat.value }}</VChip>
      <span class="text-body-2 text-medium-emphasis">{{ stat.title }}</span>
    </div>
  </div>
</template>
