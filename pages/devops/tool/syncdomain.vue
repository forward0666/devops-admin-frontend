<script setup lang="ts">
import apiClient, { domainGroupService, projectService, userConsoleDomainService } from '~/services/api'

definePageMeta({ layout: 'default' })

const loading = ref(false)
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Groups
const groups = ref<any[]>([])
const selectedGroupId = ref('')
const groupMeta = ref<Record<string, { type: string; remark: string; groupId: string }>>({})
const groupZones = ref<any[]>([])

// Projects
const projects = ref<any[]>([])
const selectedProjectId = ref('')

// Fetch data
async function fetchData() {
  loading.value = true
  try {
    const [g, meta, projRes] = await Promise.all([
      domainGroupService.listGroups(),
      domainGroupService.listMeta(),
      projectService.list(),
    ])
    groups.value = g || []
    const m: Record<string, { type: string; remark: string; groupId: string }> = {}
    for (const item of (meta || [])) {
      if (item.zoneId) m[item.zoneId] = { type: item.type || '', remark: item.remark || '', groupId: item.groupId || '' }
    }
    groupMeta.value = m
    const projData = Array.isArray(projRes) ? projRes : projRes?.data || []
    projects.value = projData
    // Fetch zones per account
    try {
      const { data: accData } = await apiClient.get('/cloudflare/accounts')
      const accounts = accData?.data || []
      const results = await Promise.all(
        accounts.map((a: any) =>
          apiClient.get('/cloudflare/zones', { params: { account_id: a.id } })
            .then((r: any) => (r.data?.data || []).map((z: any) => ({ ...z, accountName: a.name })))
            .catch(() => [])
        )
      )
      const all: any[] = []
      results.forEach((r: any) => all.push(...r))
      groupZones.value = all
    } catch { groupZones.value = [] }
  } catch (e: any) {
    console.error('Failed to fetch', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

const groupDomains = computed(() => {
  if (!selectedGroupId.value) return []
  return groupZones.value.filter(z => groupMeta.value[z.zone_id]?.groupId === selectedGroupId.value).map(z => ({
    domain: z.name,
    env: 'prod',
    type: groupMeta.value[z.zone_id]?.type || 'web',
    remark: groupMeta.value[z.zone_id]?.remark || '',
    cdn: '',
  }))
})

const selectedProjectName = computed(() => projects.value.find(p => String(p.id) === selectedProjectId.value)?.name || '')

async function doSync() {
  if (!selectedGroupId.value || !selectedProjectId.value || !groupDomains.value.length) return
  syncing.value = true
  try {
    await userConsoleDomainService.importDomains({ projectId: selectedProjectId.value, domains: groupDomains.value })
    snackbar.value = { show: true, text: `Synced ${groupDomains.value.length} domains to ${selectedProjectName.value}`, color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Sync failed', color: 'error' }
  } finally {
    syncing.value = false
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VIcon icon="bx-sync" color="primary" />
        <span class="text-h6">Sync Domain</span>
        <VSpacer />
        <VBtn color="primary" size="small" prepend-icon="bx-sync" :disabled="!selectedGroupId || !selectedProjectId || !groupDomains.length" :loading="syncing" @click="doSync">
          Sync {{ groupDomains.length }} domains
        </VBtn>
      </VCardText>
    </VCard>

    <div v-if="loading" class="text-center py-8"><VProgressCircular indeterminate color="primary" /></div>

    <div v-else style="display: flex; gap: 16px; flex: 1; min-height: 0;">
      <!-- Left: Config -->
      <VCard style="width: 350px; min-width: 350px;">
        <VCardText>
          <VSelect
            v-model="selectedGroupId"
            :items="groups.map(g => ({ title: g.name, value: g.id }))"
            label="Source Group"
            density="compact"
            hide-details
            clearable
            class="mb-4"
          />
          <VSelect
            v-model="selectedProjectId"
            :items="projects.map(p => ({ title: p.name, value: String(p.id) }))"
            label="Target Project"
            density="compact"
            hide-details
            clearable
          />
        </VCardText>
      </VCard>

      <!-- Right: Domain Preview -->
      <VCard style="flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0;">
        <div v-if="!selectedGroupId" class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-list-ul" size="48" class="mb-2" /><p>Select a source group to preview domains</p>
        </div>
        <div v-else-if="groupDomains.length === 0" class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-info-circle" size="48" class="mb-2" /><p>No domains in this group</p>
        </div>
        <VTable v-else class="text-no-wrap sticky-table" hover density="compact" style="flex: 1; min-height: 0; width: 100%;">
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th style="width: 40px;">#</th>
              <th>Domain</th>
              <th style="width: 100px;">Env</th>
              <th style="width: 100px;">Type</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(d, idx) in groupDomains" :key="d.domain">
              <td class="text-caption">{{ idx + 1 }}</td>
              <td><code>{{ d.domain }}</code></td>
              <td><VChip size="x-small" color="success" variant="tonal">{{ d.env }}</VChip></td>
              <td><VChip size="x-small" color="info" variant="tonal">{{ d.type }}</VChip></td>
              <td class="text-caption text-medium-emphasis">{{ d.remark || '-' }}</td>
            </tr>
          </tbody>
        </VTable>
      </VCard>
    </div>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>

<style scoped>
.sticky-table { display: flex; flex-direction: column; width: 100%; }
.sticky-table :deep(.v-table__wrapper) { flex: 1; min-height: 0; overflow-y: auto; }
.sticky-table :deep(thead) { position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface)); }
</style>
