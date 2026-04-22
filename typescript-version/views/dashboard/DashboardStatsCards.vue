<script setup lang="ts">
const dashboardStore = useDashboardStore()

onMounted(() => dashboardStore.fetchStats())

const rawStats = computed(() => dashboardStore.stats)

const stats = computed(() => {
  const s = rawStats.value
  return [
    {
      title: '用户总数',
      value: s?.totalUsers != null ? String(s.totalUsers) : '-',
      icon: 'tabler-users',
      color: 'primary',
      subtitle: '',
    },
    {
      title: '活跃用户',
      value: s?.activeUsers != null ? String(s.activeUsers) : '-',
      icon: 'tabler-user-check',
      color: 'success',
      subtitle: '',
    },
    {
      title: '禁用用户',
      value: s?.disabledUsers != null ? String(s.disabledUsers) : '-',
      icon: 'tabler-user-x',
      color: 'error',
      subtitle: '',
    },
    {
      title: '今日新增',
      value: s?.newUsersToday != null ? String(s.newUsersToday) : '-',
      icon: 'tabler-user-plus',
      color: 'info',
      subtitle: '',
    },
  ]
})
</script>

<template>
  <VRow>
    <VCol
      v-for="stat in stats"
      :key="stat.title"
      cols="12"
      sm="6"
      md="3"
    >
      <VCard>
        <VCardText class="d-flex align-center">
          <VAvatar
            size="48"
            rounded
            variant="tonal"
            :color="stat.color"
            class="me-4"
          >
            <VIcon
              :icon="stat.icon"
              size="26"
            />
          </VAvatar>
          <div class="flex-grow-1">
            <div class="text-subtitle-2 text-medium-emphasis">
              {{ stat.title }}
            </div>
            <div class="text-h5 font-weight-bold">
              {{ stat.value }}
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
