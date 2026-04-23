<script setup lang="ts">
import { useTheme } from 'vuetify'

const vuetifyTheme = useTheme()
const dashboardStore = useDashboardStore()

onMounted(() => dashboardStore.fetchStats())

const roleData = computed(() => {
  const s = dashboardStore.stats?.roleDistribution
  if (s) {
    // Map格式 {role: count} → 数组格式 [{label, count, pct}]
    const entries = typeof s === 'object' && !Array.isArray(s) ? Object.entries(s) : s.map((r: any) => [r.role || r.label, r.count || 0])
    const total = entries.reduce((sum: number, e: any) => sum + (typeof e[1] === 'number' ? e[1] : 0), 0)
    return entries.map((e: any) => ({
      label: e[0],
      count: typeof e[1] === 'number' ? e[1] : 0,
      pct: total > 0 ? Math.round((e[1] / total) * 100) : 0,
    }))
  }
  return [
    { label: 'sys_admin', count: 0, pct: 0 },
    { label: 'admin', count: 0, pct: 0 },
    { label: 'devops', count: 0, pct: 0 },
    { label: 'leader', count: 0, pct: 0 },
    { label: 'user', count: 0, pct: 0 },
  ]
})

const series = computed(() => roleData.value.map(r => r.pct))

const chartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors

  return {
    chart: {
      sparkline: { enabled: true },
      animations: { enabled: false },
    },
    stroke: { width: 6, colors: [currentTheme.surface] },
    legend: { show: false },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    labels: roleData.value.map(r => r.label),
    colors: [currentTheme.primary, currentTheme.success, currentTheme.warning, currentTheme.info, currentTheme.secondary],
  }
})
</script>

<template>
  <VCard title="用户角色分布">
    <VCardText>
      <div class="d-flex align-center gap-4">
        <div style="width: 130px; height: 130px;">
          <VueApexCharts type="donut" :options="chartOptions" :series="series" />
        </div>
        <div class="flex-grow-1">
          <div v-for="(role, i) in roleData" :key="role.label" class="d-flex align-center mb-2">
            <div class="rounded-circle me-2" :style="{ width: '10px', height: '10px', backgroundColor: chartOptions.colors[i] }" />
            <span class="text-body-2 flex-grow-1">{{ role.label }}</span>
            <span class="text-body-2 font-weight-medium">{{ role.count }} ({{ role.pct }}%)</span>
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>
