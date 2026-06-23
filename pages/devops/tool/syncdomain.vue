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

// DNS records
const dnsRecords = ref<any[]>([])
const dnsLoading = ref(false)
const expandedDomains = ref<Record<string, boolean>>({})

// Sync options
const syncEnv = ref('')
const syncType = ref('')
const envOptions = ['', 'prod', 'uat', 'test', 'dev']
const typeOptions = ['', 'web', 'admin', 'callback', 'api']

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

const groupZoneList = computed(() => {
  if (!selectedGroupId.value) return []
  return groupZones.value.filter(z => groupMeta.value[z.zone_id]?.groupId === selectedGroupId.value)
})

async function fetchDnsRecords() {
  if (!selectedGroupId.value) { dnsRecords.value = []; return }
  const zones = groupZoneList.value
  if (!zones.length) { dnsRecords.value = []; return }
  dnsLoading.value = true
  try {
    const { data } = await apiClient.get('/cloudflare/dns')
    const allRecords = data?.data || []
    const zoneNames = new Set(zones.map((z: any) => z.name))
    dnsRecords.value = allRecords.filter((r: any) => {
      const name = (r.name || '').toLowerCase()
      for (const zn of zoneNames) {
        if (name === zn.toLowerCase() || name.endsWith('.' + zn.toLowerCase())) return true
      }
      return false
    })
  } catch { dnsRecords.value = [] }
  finally { dnsLoading.value = false }
}

watch(selectedGroupId, () => {
  expandedDomains.value = {}
  syncEnv.value = ''
  syncType.value = ''
  fetchDnsRecords()
})

function dnsByZone(zoneName: string) {
  return dnsRecords.value.filter((r: any) => {
    const name = (r.name || '').toLowerCase()
    return name === zoneName.toLowerCase() || name.endsWith('.' + zoneName.toLowerCase())
  })
}

const syncDomains = computed(() => {
  if (!selectedGroupId.value) return []
  return groupZoneList.value.map(z => {
    const meta = groupMeta.value[z.zone_id]
    return {
      domain: z.name,
      env: syncEnv.value || 'prod',
      type: syncType.value || meta?.type || 'web',
      remark: '',
      cdn: '',
    }
  })
})

const selectedProjectName = computed(() => projects.value.find(p => String(p.id) === selectedProjectId.value)?.name || '')

async function doSync() {
  if (!selectedGroupId.value || !selectedProjectId.value || !syncDomains.value.length) return
  syncing.value = true
  try {
    await userConsoleDomainService.importDomains({ projectId: selectedProjectId.value, domains: syncDomains.value })
    snackbar.value = { show: true, text: `Synced ${syncDomains.value.length} domains to ${selectedProjectName.value}`, color: 'success' }
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
        <VBtn color="primary" size="small" prepend-icon="bx-sync" :disabled="!selectedGroupId || !selectedProjectId || !syncDomains.length" :loading="syncing" @click="doSync">
          Sync {{ syncDomains.length }} domains
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
            class="mb-4"
          />
          <VDivider class="my-3" />
          <p class="text-caption text-medium-emphasis mb-2">Sync Options (optional)</p>
          <VSelect v-model="syncEnv" :items="envOptions" label="Environment" density="compact" hide-details clearable class="mb-3" />
          <VSelect v-model="syncType" :items="typeOptions" label="Type" density="compact" hide-details clearable />
        </VCardText>
      </VCard>

      <!-- Right: Domain Preview -->
      <VCard style="flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0;">
        <div v-if="!selectedGroupId" class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-list-ul" size="48" class="mb-2" /><p>Select a source group to preview domains</p>
        </div>
        <div v-else-if="syncDomains.length === 0" class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-info-circle" size="48" class="mb-2" /><p>No domains in this group</p>
        </div>
        <div v-else style="flex: 1; overflow-y: auto; padding: 12px;">
          <div v-for="zone in groupZoneList" :key="zone.zone_id" class="mb-3">
            <div class="d-flex align-center gap-2 cursor-pointer" @click="expandedDomains[zone.name] = !expandedDomains[zone.name]">
              <VIcon :icon="expandedDomains[zone.name] ? 'bx-chevron-down' : 'bx-chevron-right'" size="16" />
              <VIcon icon="bx-globe" size="14" color="medium-emphasis" />
              <code class="text-body-2 font-weight-bold">{{ zone.name }}</code>
              <VChip size="x-small" color="info" variant="tonal">{{ dnsByZone(zone.name).length }} records</VChip>
            </div>
            <div v-if="expandedDomains[zone.name]" class="ms-6 mt-1">
              <div v-if="dnsLoading" class="text-caption text-medium-emphasis py-1">Loading DNS records...</div>
              <div v-else-if="dnsByZone(zone.name).length === 0" class="text-caption text-medium-emphasis py-1">No DNS records cached</div>
              <div v-else>
                <div v-for="r in dnsByZone(zone.name)" :key="r.id || r.name" class="d-flex align-center gap-3 py-1" style="font-size: 12px;">
                  <VChip size="x-small" variant="tonal" color="secondary" style="min-width: 45px; justify-content: center;">{{ r.type }}</VChip>
                  <code style="min-width: 200px;">{{ r.name }}</code>
                  <span class="text-medium-emphasis text-truncate">{{ r.content }}</span>
                  <span v-if="r.ttl" class="text-caption text-medium-emphasis">TTL:{{ r.ttl }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </VCard>
    </div>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
