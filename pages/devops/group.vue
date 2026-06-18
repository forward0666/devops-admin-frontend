<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { userConsoleProjectService as projectService, userConsoleDomainService as domainService } from '~/services/api'

definePageMeta({ layout: 'default' })

const projects = ref<any[]>([])
const domains = ref<any[]>([])
const selectedProject = ref<number | null>(null)
const selectedType = ref<string | null>(null)
const loading = ref(false)

const projectOptions = computed(() => [
  { title: 'All', value: -1 },
  ...projects.value.map(p => ({ title: p.name, value: p.id })),
])

const typeOptions = computed(() => {
  const types = [...new Set(domains.value.map(d => d.type).filter(Boolean))]
  return types.map(t => ({ title: t.toUpperCase(), value: t }))
})

const filteredDomains = computed(() => {
  let list = domains.value
  if (selectedProject.value && selectedProject.value !== -1) {
    list = list.filter(d => d.projectId === selectedProject.value)
  }
  if (selectedType.value) {
    list = list.filter(d => d.type === selectedType.value)
  }
  return list
})

const groupedDomains = computed(() => {
  const map = new Map<string, any[]>()
  for (const d of filteredDomains.value) {
    const project = projects.value.find(p => p.id === d.projectId)
    const key = project?.name || `Project #${d.projectId}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(d)
  }
  return Array.from(map.entries()).map(([project, items]) => ({ project, items }))
})

async function fetchData() {
  loading.value = true
  try {
    const projectData = await projectService.list()
    projects.value = projectData || []

    const allDomains: any[] = []
    await Promise.all(
      projects.value.map(async (p: any) => {
        try {
          const data = await domainService.list(String(p.id))
          if (Array.isArray(data)) allDomains.push(...data)
        } catch { /* skip */ }
      })
    )
    domains.value = allDomains
  } catch (e) {
    console.error('Failed to fetch', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Filters -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VSelect v-model="selectedProject" :items="projectOptions" label="Project" density="compact" style="max-width: 200px" hide-details clearable />
        <VSelect v-model="selectedType" :items="typeOptions" label="Type" density="compact" style="max-width: 160px" hide-details clearable />
        <VChip size="small" color="info" variant="tonal">Domains: {{ filteredDomains.length }}</VChip>
        <VSpacer />
        <VBtn icon="bx-refresh" size="small" variant="tonal" color="primary" @click="fetchData" :loading="loading" />
      </VCardText>
    </VCard>

    <!-- Grouped Domains -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <div class="card-scroll">
        <div v-if="loading" class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
        </div>

        <div v-else-if="groupedDomains.length === 0" class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-folder-open" size="48" class="mb-2" />
          <p>No domains found.</p>
        </div>

        <div v-else v-for="group in groupedDomains" :key="group.project" class="mb-4">
          <div class="d-flex align-center gap-2 pa-4 pb-2">
            <VIcon icon="bx-folder" size="20" color="primary" />
            <span class="text-h6">{{ group.project }}</span>
            <VChip size="x-small" color="primary" variant="tonal">{{ group.items.length }}</VChip>
          </div>

          <VTable class="text-no-wrap sticky-table" hover density="compact" style="width: 100%;">
            <thead>
              <tr class="text-caption text-medium-emphasis">
                <th style="width: 250px;">Domain</th>
                <th style="width: 80px;">Type</th>
                <th style="width: 80px;">Env</th>
                <th style="width: 150px;">Zone ID</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in group.items" :key="d.id">
                <td><code class="text-body-2">{{ d.domain }}</code></td>
                <td>
                  <VChip size="x-small" :color="d.type === 'web' ? 'success' : 'warning'" variant="tonal">
                    {{ (d.type || '-').toUpperCase() }}
                  </VChip>
                </td>
                <td>
                  <VChip v-if="d.env" size="x-small" color="info" variant="tonal">{{ d.env.toUpperCase() }}</VChip>
                  <span v-else class="text-medium-emphasis">-</span>
                </td>
                <td><code class="text-caption">{{ d.zoneId || '-' }}</code></td>
                <td class="text-body-2 text-medium-emphasis">{{ d.remark || '-' }}</td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </div>
    </VCard>
  </div>
</template>

<style scoped>
.sticky-table {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.sticky-table :deep(.v-table__wrapper) table {
  table-layout: fixed !important;
  width: 100% !important;
}
.sticky-table :deep(th),
.sticky-table :deep(td) {
  padding: 2px 8px !important;
  font-size: 13px;
}
.sticky-table :deep(.v-table__wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.sticky-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
}
.sticky-table :deep(.v-table__wrapper) table th:nth-child(1),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(1) { width: 250px !important; min-width: 250px !important; max-width: 250px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(2),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(2) { width: 80px !important; min-width: 80px !important; max-width: 80px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(3),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(3) { width: 80px !important; min-width: 80px !important; max-width: 80px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(4),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(4) { width: 150px !important; min-width: 150px !important; max-width: 150px !important; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
