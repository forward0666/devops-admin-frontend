<script setup lang="ts">
import { useTheme } from 'vuetify'

const vuetifyTheme = useTheme()
const dashboardStore = useDashboardStore()

onMounted(() => dashboardStore.fetchStats())

const roleData = computed(() => {
  const s = dashboardStore.stats?.roleDistribution
  if (s && Array.isArray(s)) {
    return s.map((r: any) => ({ label: r.role || r.label, count: r.count || 0, pct: r.percentage || r.pct || 0 }))
  }
  // Fallback empty
  return [
    { label: '超级管理员', count: 0, pct: 0 },
    { label: '管理员', count: 0, pct: 0 },
    { label: '编辑', count: 0, pct: 0 },
    { label: '审核员', count: 0, pct: 0 },
    { label: '普通用户', count: 0, pct: 0 },
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
