<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import apiClient from '~/services/api'

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
const loading = ref(false) // Moved loading here for clarity and to ensure availability

async function fetchDomains() {
  loading.value = true // Now loading is declared before being used
  try {
    const { data: projectRes } = await apiClient.get('/user/project')
    projects.value = projectRes.data || []
    const all: Domain[] = []
    for (const p of projects.value) {
      try {
        const res = await apiClient.get('/user/domain/list', {
          params: selectedProject.value !== null ? { projectId: selectedProject.value } : undefined
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
  projects.value.map(p => ({ title: p.name, value: p.id }))
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

function toggleProject(id: number) {
  expandedProjects.value = { ...expandedProjects.value, [id]: !expandedProjects.value[id] }
}

const page = ref(1)
const pageSize = ref(20)

const totalPages = computed(() => Math.max(1, Math.ceil(Object.keys(filteredGroups.value).length / pageSize.value)))
const pagedGroupKeys = computed(() => {
  const keys = Object.keys(filteredGroups.value).map(Number)
  const start = (page.value - 1) * pageSize.value
  return keys.slice(start, start + pageSize.value)
})

const filteredGroups = computed(() => {
  const s = search.value?.toLowerCase() || ''
  const result: Record<number, { name: string; domains: Domain[] }> = {}
  for (const d of filteredDomains.value) {
    if (!result[d.projectId]) result[d.projectId] = { name: d.projectName, domains: [] }
    result[d.projectId].domains.push(d)
  }
  return result
})

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
          <VChip size="small" color="primary" variant="tonal">Projects: {{ stats.projects }}</VChip>
          <VChip size="small" color="info" variant="tonal">Domains: {{ stats.total }}</VChip>
        </div>
        <VSpacer />

      </VCardText>
    </VCard>

    <!-- Burn-up Chart -->
    <VCard class="mb-4">
      <VCardTitle class="pt-4 px-6">Domain Count by Project and Environment</VCardTitle>
      <VCardSubtitle class="px-6">Stacked area view of domain distribution</VCardSubtitle>
      <VCardText>
        <!-- Placeholder for Burn-up Chart if needed, but removed as per user's request on previous turn -->
        <!-- <VueApexCharts type="area" height="300" :options="burnUpOptions" :series="burnUpSeries" /> -->
        <div class="text-center text-medium-emphasis py-8">Burn-up chart removed as per instructions.</div>
      </VCardText>
    </VCard>

    <!-- Bottom row -->
    <VRow>
      <VCol cols="12" md="6">
        <VCard>
          <VCardTitle class="pt-4 px-6">Status Distribution</VCardTitle>
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

<style scoped>
.sticky-table {
  :deep(.v-table__wrapper) {
    overflow-y: visible;
  }
}
</style>
