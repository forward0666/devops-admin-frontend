<script setup lang="ts">
import { useTheme } from 'vuetify'
import { hexToRgb } from '@core/utils/colorConverter'

const vuetifyTheme = useTheme()

const roleData = [
  { label: '超级管理员', count: 12, pct: 45 },
  { label: '管理员', count: 58, pct: 25 },
  { label: '编辑', count: 156, pct: 15 },
  { label: '审核员', count: 203, pct: 10 },
  { label: '普通用户', count: 855, pct: 5 },
]

const series = roleData.map(r => r.pct)

const chartOptions = computed(() => {
  const currentTheme = vuetifyTheme.current.value.colors

  return {
    chart: {
      sparkline: { enabled: true },
      animations: { enabled: false },
    },
    stroke: {
      width: 6,
      colors: [currentTheme.surface],
    },
    legend: { show: false },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    labels: ['超级管理员', '管理员', '编辑', '审核员', '普通用户'],
    colors: [
      currentTheme.primary,
      currentTheme.success,
      currentTheme.warning,
      currentTheme.info,
      currentTheme.secondary,
    ],
  }
})
</script>

<template>
  <VCard title="用户角色分布">
    <VCardText>
      <div class="d-flex align-center gap-4">
        <div style="width: 130px; height: 130px;">
          <VueApexCharts
            type="donut"
            :options="chartOptions"
            :series="series"
          />
        </div>
        <div class="flex-grow-1">
          <div
            v-for="(role, i) in roleData"
            :key="role.label"
            class="d-flex align-center mb-2"
          >
            <div
              class="rounded-circle me-2"
              :style="{
                width: '10px',
                height: '10px',
                backgroundColor: chartOptions.colors[i],
              }"
            />
            <span class="text-body-2 flex-grow-1">{{ role.label }}</span>
            <span class="text-body-2 font-weight-medium">{{ role.count }} ({{ role.pct }}%)</span>
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>
