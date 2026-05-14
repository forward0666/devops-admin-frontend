<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'
import VueApexCharts from 'vue3-apexcharts'

definePageMeta({ layout: 'default' })

const projects = ref<any[]>([])
const cacheRules = ref<any[]>([])
const selectedProject = ref<number | null>(null)
const selectedEnv = ref<string | null>(null)
const loading = ref(false)

// Restore filters from URL query
const route = useRoute()
if (route.query.project) selectedProject.value = Number(route.query.project)
if (route.query.env) selectedEnv.value = route.query.env as string

// Sync filters to URL query
watch([selectedProject, selectedEnv], ([p, e]) => {
  const query: Record<string, string> = {}
  if (p !== null) query.project = String(p)
  if (e !== null) query.env = e
  navigateTo({ query }, { replace: true })
})

const envColors: Record<string, string> = { prod: '#ef4444', staging: '#f59e0b', dev: '#3b82f6', test: '#8b5cf6' }
const envOrder = ['prod', 'staging', 'dev', 'test']

const projectOptions = computed(() =>
  projects.value.map(p => ({ title: p.name, value: p.id })),
)

const envOptions = computed(() => {
  const envs = [...new Set(cacheRules.value.map(d => d.env).filter(Boolean))]
  return envs.map(e => ({ title: e.toUpperCase(), value: e }))
})

const filteredRules = computed(() => {
  let result = cacheRules.value
  if (selectedProject.value) result = result.filter(d => d.projectId === selectedProject.value)
  if (selectedEnv.value) result = result.filter(d => d.env === selectedEnv.value)
  return result
})

const stats = computed(() => {
  const envs: Record<string, number> = {}
  const projectStats: Record<string, number> = {}
  for (const r of filteredRules.value) {
    const env = r.env || 'unknown'
    envs[env] = (envs[env] || 0) + 1
    projectStats[r.projectName] = (projectStats[r.projectName] || 0) + 1
  }
  return { total: filteredRules.value.length, envs, projects: projectStats }
})

// --- Cache status time-series area chart ---
const mockDays = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const chartSeries = computed(() => {
  const total = filteredRules.value.length || 20
  return [
    { name: 'Miss', data: mockDays.map(() => Math.round(total * Math.random() * 0.15)) },
    { name: 'Hit', data: mockDays.map((_, i) => Math.round(total * (0.6 + i * 0.02 + Math.random() * 0.1))) },
    { name: 'Bypass', data: mockDays.map(() => Math.round(total * (0.1 + Math.random() * 0.08))) },
  ]
})

const chartOptions = computed(() => ({
  chart: {
    type: 'area', stacked: false, toolbar: { show: false }, fontFamily: 'inherit',
    background: '#1a1a2e', foreColor: '#94a3b8',
  },
  stroke: { width: 2, curve: 'smooth' },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 100] } },
  xaxis: {
    categories: mockDays,
    labels: { style: { fontSize: '11px', colors: '#94a3b8' } },
    axisBorder: { show: false }, axisTicks: { show: false },
  },
  yaxis: { labels: { style: { fontSize: '12px', colors: '#94a3b8' } } },
  colors: ['#ef4444', '#22c55e', '#f59e0b'],
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

async function fetchCacheRules() {
  loading.value = true
  try {
    const { data: projectRes } = await apiClient.get('/user/project')
    projects.value = projectRes.data || []
    const all: any[] = []
    for (const p of projects.value) {
      try {
        const res = await apiClient.get('/user/domain/list', {
          params: selectedProject.value !== null ? { projectId: selectedProject.value } : undefined,
        })
        ;(res.data.data || []).forEach((d: any) => all.push({ ...d, projectId: p.id, projectName: p.name }))
      } catch { /* skip */ }
    }
    cacheRules.value = all
  } catch (e) {
    console.error('Failed to fetch', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchCacheRules)
watch(selectedProject, fetchCacheRules)
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
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

    <VCard class="mb-4">
      <VCardTitle class="pt-4 px-6">Cache Hit Rate Trend</VCardTitle>
      <VCardSubtitle class="px-6">12-month cache performance overview</VCardSubtitle>
      <VCardText>
        <VueApexCharts type="area" height="300" :options="chartOptions" :series="chartSeries" />
      </VCardText>
    </VCard>

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
          <VCardText class="text-center py-8 text-medium-emphasis">
            <VIcon icon="bx-bolt" size="48" class="mb-2" />
            <p class="text-body-1">Cache Analytics</p>
            <p class="text-caption">Coming soon</p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
