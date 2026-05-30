<script setup lang="ts">
import DashboardStatsCards from '@/views/dashboard/DashboardStatsCards.vue'
import DashboardRoleDistribution from '@/views/dashboard/DashboardRoleDistribution.vue'
import DashboardRecentLogs from '@/views/dashboard/DashboardRecentLogs.vue'
</script>

<template>
  <div>
    <!-- 👉 Stats Cards -->
    <DashboardStatsCards />

    <VRow class="mt-1" style="row-gap: 4px;">
      <!-- 👉 Role Distribution -->
      <VCol
        cols="12"
        md="5"
      >
        <DashboardRoleDistribution />
      </VCol>

      <!-- 👉 Recent Logs -->
      <VCol
        cols="12"
        md="7"
      >
        <DashboardRecentLogs />
      </VCol>
    </VRow>
  </div>
</template>
