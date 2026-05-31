<script setup lang="ts">
import DashboardStatsCards from '@/views/dashboard/DashboardStatsCards.vue'
import DashboardRoleDistribution from '@/views/dashboard/DashboardRoleDistribution.vue'
import DashboardRecentLogs from '@/views/dashboard/DashboardRecentLogs.vue'
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <DashboardStatsCards />
    <DashboardRoleDistribution />
    <DashboardRecentLogs />
  </div>
</template>
