<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'
import VueApexCharts from 'vue3-apexcharts'

definePageMeta({ layout: 'default' })

interface Domain {
  id: string
  projectId: number
  projectName: string
  domain: string
  env: string
  type: string
  remark: string
  cdn: string
}

const projects = ref<any[]>([])
const domains = ref<Domain[]>([])
const selectedProject = ref<number | null>(null)
const selectedEnv = ref<string | null>(null)
const loading = ref(false)

async function fetchDomains() {
  loading.value = true
  try {
    const { data: projectRes } = await apiClient.get('/user/project')
    projects.value = projectRes.data || []
    const all: Domain[] = []
    for (const p of projects.value) {
      try {
        const res = await apiClient.get('/user/domain/list', {
          params: selectedProject.value !== null ? { projectId: selectedProject.value } : undefined,
        })
        ;(res.data.data || []).forEach((d: any) => all.push({ ...d, projectId: p.id, projectName: p.name }))
      } catch { /* skip */ }
    }
    domains.value = all
  } catch (e) {
    console.error('Failed to fetch domains', e)
  } finally {
    loading.value = false
  }
}

const envColors: Record<string, string> = { prod: '#ef4444', staging: '#f59e0b', dev: '#3b82f6', test: '#8b5cf6' }
const envOrder = ['prod', 'staging', 'dev', 'test']

const projectOptions = computed(() =>
  projects.value.map(p => ({ title: p.name, value: p.id })),
)

const envOptions = computed(() => {
  const envs = [...new Set(domains.value.map(d => d.env).filter(Boolean))]
  return envs.map(e => ({ title: e.toUpperCase(), value: e }))
})

const filteredDomains = computed(() => {
  let result = domains.value
  if (selectedProject.value) result = result.filter(d => d.projectId === selectedProject.value)
  if (selectedEnv.value) result = result.filter(d => d.env === selectedEnv.value)
  return result
})

const stats = computed(() => {
  const envs: Record<string, number> = {}
  const types: Record<string, number> = {}
  const projectStats: Record<string, number> = {}
  for (const d of filteredDomains.value) {
    const env = d.env || 'unknown'
    const type = d.type || 'unknown'
    envs[env] = (envs[env] || 0) + 1
    types[type] = (types[type] || 0) + 1
    projectStats[d.projectName] = (projectStats[d.projectName] || 0) + 1
  }
  return { total: filteredDomains.value.length, envs, types, projects: projectStats }
})

// --- Domain availability time-series area chart (planner burn-up style) ---
const mockDays = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const burnUpSeries = computed(() => {
  const total = filteredDomains.value.length || 20
  return [
    { name: 'Down', data: mockDays.map(() => Math.round(total * Math.random() * 0.08 + 1)) },
    { name: 'Degraded', data: mockDays.map(() => Math.round(total * (0.05 + Math.random() * 0.1))) },
    { name: 'Available', data: mockDays.map((_, i) => Math.round(total * (0.8 + i * 0.02 + Math.random() * 0.05))) },
  ]
})

const burnUpOptions = computed(() => ({
  chart: {
    type: 'area',
    stacked: false,
    toolbar: { show: false },
    fontFamily: 'inherit',
    background: '#1a1a2e',
    foreColor: '#94a3b8',
  },
  stroke: { width: 2, curve: 'smooth' },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 100] },
  },
  xaxis: {
    categories: mockDays,
    labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { fontSize: '12px', colors: '#94a3b8' } },
  },
  colors: ['#ef4444', '#f59e0b', '#22c55e'],
  legend: { position: 'bottom' as const, labels: { colors: '#94a3b8' } },
  tooltip: { shared: true, intersect: false, theme: 'dark' },
  grid: { borderColor: '#2d2d44', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  markers: { size: 0 },
}))

// --- Donut: env distribution ---
const statusSeries = computed(() => envOrder.map(e => stats.value.envs[e] || 0))
const statusOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: envOrder.map(e => e.toUpperCase()),
  colors: envOrder.map(e => envColors[e] || '#6b7280'),
  legend: { position: 'bottom' as const },
  dataLabels: { enabled: true },
  plotOptions: { pie: { donut: { size: '60%' } } },
}))

// --- Bar: type distribution ---
const typeSeries = computed(() => {
  const types = stats.value.types
  return [{ name: 'Count', data: Object.entries(types).map(([name, count]) => ({ x: name, y: count })) }]
})
const typeOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
  plotOptions: { bar: { borderRadius: 3, horizontal: true, barHeight: '70%' } },
  xaxis: { labels: { style: { fontSize: '12px' } } },
  yaxis: { labels: { style: { fontSize: '12px' } } },
  colors: ['#6366f1'],
  dataLabels: { enabled: true },
  grid: { borderColor: '#f1f1f1' },
}))

onMounted(fetchDomains)
watch(selectedProject, fetchDomains)
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Filter bar -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="selectedProject" :items="projectOptions" label="Project" density="compact" style="max-width: 200px" hide-details clearable />
        <VSelect v-model="selectedEnv" :items="envOptions" label="Environment" density="compact" style="max-width: 160px" hide-details clearable />
        <div class="d-flex align-center flex-wrap gap-4">
          <VChip size="small" color="primary" variant="tonal">Projects: {{ Object.keys(stats.projects).length }}</VChip>
          <VChip size="small" color="info" variant="tonal">Domains: {{ stats.total }}</VChip>
        </div>
      </VCardText>
    </VCard>

    <!-- Burn-up stacked bar chart -->
    <VCard class="mb-4">
      <VCardTitle class="pt-4 px-6">Domain Count by Project and Environment</VCardTitle>
      <VCardSubtitle class="px-6">30-day domain availability trend</VCardSubtitle>
      <VCardText>
        <VueApexCharts type="bar" height="300" :options="burnUpOptions" :series="burnUpSeries" />
      </VCardText>
    </VCard>

    <!-- Bottom row -->
    <VRow>
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle class="pt-4 px-6">Environment Distribution</VCardTitle>
          <VCardSubtitle class="px-6">Domain count by environment</VCardSubtitle>
          <VCardText class="d-flex justify-center">
            <VueApexCharts type="donut" height="280" :options="statusOptions" :series="statusSeries" />
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle class="pt-4 px-6">Type Distribution</VCardTitle>
          <VCardSubtitle class="px-6">Domain count by type</VCardSubtitle>
          <VCardText>
            <VueApexCharts type="bar" height="280" :options="typeOptions" :series="typeSeries" />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
