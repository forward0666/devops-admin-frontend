<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient, { domainGroupService } from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'

const TYPE_OPTIONS = ['antiblock', 'admin', 'callback', 'api', 'web', 'entry', 'other']

const filterDomain = ref('')
const filterSource = ref('')
const filterType = ref('')
const filterRemark = ref('')

const zones = ref<any[]>([])
const loading = ref(false)
const selectedGroupId = ref<string>('all')

// --- Sort ---
const sortKey = ref<string>('name')
const sortDir = ref<'asc' | 'desc'>('asc')
function toggleSort(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key: string) {
  if (sortKey.value !== key) return 'bx-sort'
  return sortDir.value === 'asc' ? 'bx-sort-up' : 'bx-sort-down'
}

// --- Groups (from backend) ---
const groups = ref<any[]>([])
async function fetchGroups() {
  try {
    const res = await domainGroupService.listGroups()
    groups.value = res || []
  } catch { groups.value = [] }
}

// --- Zone Meta (from backend) ---
const zoneMeta = ref<Record<string, { type: string; remark: string; groupId: string }>>({})
async function fetchMeta() {
  try {
    const res = await domainGroupService.listMeta()
    const list = res || []
    const m: Record<string, any> = {}
    for (const item of list) {
      m[item.zoneId] = { type: item.type || '', remark: item.remark || '', groupId: item.groupId || '' }
    }
    zoneMeta.value = m
  } catch { zoneMeta.value = {} }
}

function getZoneType(z: any): string { return zoneMeta.value[z.zone_id]?.type || '' }
function getZoneRemark(z: any): string { return zoneMeta.value[z.zone_id]?.remark || '' }
function getZoneGroupId(z: any): string { return zoneMeta.value[z.zone_id]?.groupId || '' }

// --- Domain lists ---
const ungroupedZones = computed(() => zones.value.filter(z => !getZoneGroupId(z)))
const allZones = computed(() => zones.value)
const zonesInGroup = computed(() => {
  let list: any[]
  if (selectedGroupId.value === 'all') list = allZones.value
  else if (selectedGroupId.value === 'default') list = ungroupedZones.value
  else list = zones.value.filter(z => getZoneGroupId(z) === selectedGroupId.value)

  // Filter
  if (filterDomain.value) { const s = filterDomain.value.toLowerCase(); list = list.filter(z => z.name?.toLowerCase().includes(s)) }
  if (filterSource.value) { const s = filterSource.value.toLowerCase(); list = list.filter(z => getCloudflareSource(z.accountName).toLowerCase().includes(s)) }
  if (filterType.value) { const s = filterType.value.toLowerCase(); list = list.filter(z => getZoneType(z).toLowerCase().includes(s)) }
  if (filterRemark.value) { const s = filterRemark.value.toLowerCase(); list = list.filter(z => getZoneRemark(z).toLowerCase().includes(s)) }

  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    let va: string, vb: string
    if (key === 'name') { va = a.name || ''; vb = b.name || '' }
    else if (key === 'source') { va = getCloudflareSource(a.accountName); vb = getCloudflareSource(b.accountName) }
    else if (key === 'type') { va = getZoneType(a); vb = getZoneType(b) }
    else if (key === 'remark') { va = getZoneRemark(a); vb = getZoneRemark(b) }
    else { va = ''; vb = '' }
    return va.localeCompare(vb) * dir
  })
})

const groupCounts = computed(() => {
  const m: Record<string, number> = { all: zones.value.length, default: ungroupedZones.value.length }
  for (const g of groups.value) m[g.id] = zones.value.filter(z => getZoneGroupId(z) === g.id).length
  return m
})

// --- Multi-select ---
const selectedIds = ref<Set<string>>(new Set())
const allSelected = computed(() => zonesInGroup.value.length > 0 && zonesInGroup.value.every(z => selectedIds.value.has(z.zone_id)))
const someSelected = computed(() => selectedIds.value.size > 0 && !allSelected.value)
function toggleAll() {
  if (allSelected.value) selectedIds.value = new Set()
  else selectedIds.value = new Set(zonesInGroup.value.map(z => z.zone_id))
}
function toggleOne(zoneId: string) {
  const s = new Set(selectedIds.value)
  if (s.has(zoneId)) s.delete(zoneId); else s.add(zoneId)
  selectedIds.value = s
}

// --- Add Group ---
const addDialog = ref(false)
const newGroupName = ref('')
async function addGroup() {
  if (!newGroupName.value.trim()) return
  try {
    await domainGroupService.createGroup(newGroupName.value.trim())
    await fetchGroups()
    newGroupName.value = ''; addDialog.value = false
  } catch (e: any) { alert(e?.response?.data?.detail || e.message) }
}

// --- Rename Group ---
const renameDialog = ref(false)
const renameTarget = ref<any>(null)
const renameName = ref('')
function openRename(g: any) { renameTarget.value = g; renameName.value = g.name; renameDialog.value = true }
async function doRename() {
  if (!renameTarget.value || !renameName.value.trim()) return
  try {
    await domainGroupService.updateGroup(renameTarget.value.id, renameName.value.trim())
    await fetchGroups(); renameDialog.value = false
  } catch (e: any) { alert(e?.response?.data?.detail || e.message) }
}

// --- Delete Group ---
async function deleteGroup(g: any) {
  if (!confirm(`Delete "${g.name}"? Domains will move to Default.`)) return
  try {
    await domainGroupService.deleteGroup(g.id)
    await fetchGroups(); await fetchMeta()
    if (selectedGroupId.value === g.id) selectedGroupId.value = 'all'
  } catch (e: any) { alert(e?.response?.data?.detail || e.message) }
}

// --- Move Domain ---
const moveDialog = ref(false)
const moveTarget = ref<any>(null)
const moveTargetGroup = ref<string>('')
function openMove(zone: any) {
  moveTarget.value = zone; moveTargetGroup.value = getZoneGroupId(zone); moveDialog.value = true
}
async function doMove() {
  if (!moveTarget.value) return
  try {
    await domainGroupService.upsertMeta({
      zoneId: moveTarget.value.zone_id,
      name: moveTarget.value.name,
      groupId: moveTargetGroup.value,
      source: getCloudflareSource(moveTarget.value.accountName),
    })
    await fetchMeta(); moveDialog.value = false
  } catch (e: any) { alert(e?.response?.data?.detail || e.message) }
}

// --- Edit (single + batch) ---
const editDialog = ref(false)
const editTargets = ref<any[]>([])
const editType = ref('')
const editRemark = ref('')

function openEdit(zone: any) {
  editTargets.value = [zone]
  editType.value = getZoneType(zone)
  editRemark.value = getZoneRemark(zone)
  editDialog.value = true
}
function openBatchEdit() {
  const targets = zones.value.filter(z => selectedIds.value.has(z.zone_id))
  if (targets.length === 0) return
  editTargets.value = targets
  editType.value = ''
  editRemark.value = ''
  editDialog.value = true
}
async function doEdit() {
  try {
    const items = editTargets.value.map(z => ({
      zoneId: z.zone_id,
      name: z.name,
      type: editType.value || undefined,
      remark: editRemark.value !== undefined ? editRemark.value : undefined,
      source: getCloudflareSource(z.accountName),
    }))
    await domainGroupService.batchUpsertMeta(items)
    await fetchMeta()
    editDialog.value = false; selectedIds.value = new Set()
  } catch (e: any) { alert(e?.response?.data?.detail || e.message) }
}

function getCloudflareSource(accountName: string): string {
  if (!accountName) return 'Other'
  const lower = accountName.toLowerCase()
  if (lower.includes('u8')) return 'Cloudflare-U8'
  if (lower.includes('ph') || lower.includes('philippine') || lower.includes('philiipine')) return 'Cloudflare-PH'
  if (lower === 'other') return 'Other'
  return `Cloudflare-${accountName}`
}

// --- Add Domain ---
const addDomainDialog = ref(false)
const newDomainName = ref('')
async function addDomain() {
  const name = newDomainName.value.trim().toLowerCase()
  if (!name) return
  const fakeZoneId = `custom_${Date.now()}`
  // Add to zones list locally
  zones.value.push({ zone_id: fakeZoneId, name, status: 'active', type: 'custom', accountName: 'Other' })
  // Save meta to backend
  try {
    await domainGroupService.upsertMeta({ zoneId: fakeZoneId, name, type: 'other', source: 'Other' })
    await fetchMeta()
  } catch { /* ignore */ }
  newDomainName.value = ''; addDomainDialog.value = false
}

// --- Fetch zones from all accounts ---
async function fetchZones() {
  loading.value = true
  try {
    const { data: accData } = await apiClient.get(`${CF_GATEWAY}/accounts`)
    const accounts = accData?.data || []
    const results = await Promise.all(
      accounts.map((a: any) =>
        apiClient.get(`${CF_GATEWAY}/zones`, { params: { account_id: a.id } })
          .then(r => (r.data?.data || []).map((z: any) => ({ ...z, accountName: a.name })))
          .catch(() => [])
      )
    )
    const all: any[] = []
    results.forEach(r => all.push(...r))
    zones.value = all
  } catch (e) {
    console.error('Failed to fetch zones', e)
  } finally {
    loading.value = false
  }
}

async function init() {
  await Promise.all([fetchGroups(), fetchMeta(), fetchZones()])
}

onMounted(init)
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Top Bar -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VIcon icon="bx-group" color="primary" />
        <span class="text-h6">Domain Groups</span>
        <VChip size="small" color="info" variant="tonal">Zones: {{ zones.length }}</VChip>
        <VChip v-if="selectedIds.size > 0" size="small" color="primary" variant="tonal">Selected: {{ selectedIds.size }}</VChip>
        <VSpacer />
        <VBtn v-if="selectedIds.size > 0" color="warning" size="small" prepend-icon="bx-edit" @click="openBatchEdit">Batch Edit</VBtn>
        <VBtn color="success" size="small" prepend-icon="bx-plus" @click="addDomainDialog = true">Add Domain</VBtn>
        <VBtn color="primary" size="small" prepend-icon="bx-folder-plus" @click="addDialog = true">Add Group</VBtn>
        <VBtn icon="bx-refresh" size="small" variant="tonal" color="primary" @click="init" :loading="loading" />
      </VCardText>
    </VCard>

    <!-- Main Content -->
    <div style="display: flex; flex: 1; min-height: 0; gap: 12px;">
      <!-- Left: Group List -->
      <VCard style="width: 220px; min-width: 220px; display: flex; flex-direction: column;">
        <VList density="compact" nav class="group-list">
          <VListItem :active="selectedGroupId === 'all'" @click="selectedGroupId = 'all'" prepend-icon="bx-globe">
            <VListItemTitle>All</VListItemTitle>
            <template #append><VChip size="x-small" color="default" variant="tonal">{{ groupCounts.all }}</VChip></template>
          </VListItem>
          <VListItem :active="selectedGroupId === 'default'" @click="selectedGroupId = 'default'" prepend-icon="bx-folder">
            <VListItemTitle>Default</VListItemTitle>
            <template #append><VChip size="x-small" color="default" variant="tonal">{{ groupCounts.default }}</VChip></template>
          </VListItem>
          <VDivider class="my-1" />
          <VListItem v-for="g in groups" :key="g.id" :active="selectedGroupId === g.id" @click="selectedGroupId = g.id" prepend-icon="bx-folder-open">
            <VListItemTitle>{{ g.name }}</VListItemTitle>
            <template #append>
              <VChip size="x-small" color="primary" variant="tonal" class="me-1">{{ groupCounts[g.id] || 0 }}</VChip>
              <VMenu location="end">
                <template #activator="{ props }"><VBtn icon="bx-dots-vertical-rounded" size="x-small" variant="text" v-bind="props" @click.stop /></template>
                <VList density="compact">
                  <VListItem title="Rename" prepend-icon="bx-edit" @click="openRename(g)" />
                  <VListItem title="Delete" prepend-icon="bx-trash" @click="deleteGroup(g)" />
                </VList>
              </VMenu>
            </template>
          </VListItem>
        </VList>
      </VCard>

      <!-- Right: Zone Table -->
      <VCard style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
        <div class="card-scroll">
          <div v-if="loading" class="text-center py-8"><VProgressCircular indeterminate color="primary" /></div>
          <div v-else-if="zonesInGroup.length === 0" class="text-center py-8 text-medium-emphasis">
            <VIcon icon="bx-folder-open" size="48" class="mb-2" /><p>No zones in this group.</p>
          </div>

          <VTable v-else class="text-no-wrap sticky-table" hover density="compact" style="width: 100%;">
            <thead>
              <tr class="text-caption text-medium-emphasis">
                <th style="width: 40px;"><VCheckbox :model-value="allSelected" :indeterminate="someSelected" @click="toggleAll" density="compact" hide-details /></th>
                <th style="width: 200px; cursor: pointer;" @click="toggleSort('name')">Domain <VIcon :icon="sortIcon('name')" size="14" /></th>
                <th style="width: 170px; cursor: pointer;" @click="toggleSort('source')">Source <VIcon :icon="sortIcon('source')" size="14" /></th>
                <th style="width: 130px; cursor: pointer;" @click="toggleSort('type')">Type <VIcon :icon="sortIcon('type')" size="14" /></th>
                <th style="cursor: pointer;" @click="toggleSort('remark')">Remark <VIcon :icon="sortIcon('remark')" size="14" /></th>
                <th style="width: 120px;">Action</th>
              </tr>
              <tr>
                <th></th>
                <th><VTextField v-model="filterDomain" density="compact" hide-details placeholder="Filter..." clearable style="font-size: 12px" /></th>
                <th><VTextField v-model="filterSource" density="compact" hide-details placeholder="Filter..." clearable style="font-size: 12px" /></th>
                <th><VTextField v-model="filterType" density="compact" hide-details placeholder="Filter..." clearable style="font-size: 12px" /></th>
                <th><VTextField v-model="filterRemark" density="compact" hide-details placeholder="Filter..." clearable style="font-size: 12px" /></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="z in zonesInGroup" :key="z.zone_id" :class="{ 'row-selected': selectedIds.has(z.zone_id) }">
                <td><VCheckbox :model-value="selectedIds.has(z.zone_id)" @click="toggleOne(z.zone_id)" density="compact" hide-details /></td>
                <td><code class="text-body-2">{{ z.name }}</code></td>
                <td><VChip size="x-small" color="orange" variant="tonal">{{ getCloudflareSource(z.accountName) }}</VChip></td>
                <td class="text-body-2">{{ getZoneType(z) || '-' }}</td>
                <td class="text-body-2 text-medium-emphasis">{{ getZoneRemark(z) || '-' }}</td>
                <td>
                  <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEdit(z)">Edit</VBtn>
                  <VBtn size="x-small" variant="tonal" color="primary" @click="openMove(z)">Move</VBtn>
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCard>
    </div>

    <!-- Add Domain Dialog -->
    <VDialog v-model="addDomainDialog" max-width="500">
      <VCard>
        <VCardTitle>Add Domain</VCardTitle>
        <VCardText>
          <VTextField v-model="newDomainName" label="Domain" density="compact" hide-details placeholder="example.com" autofocus @keyup.enter="addDomain" />
          <p class="text-caption text-medium-emphasis mt-2">Type: other | Group: Default</p>
        </VCardText>
        <VCardActions><VSpacer /><VBtn variant="text" @click="addDomainDialog = false">Cancel</VBtn><VBtn color="success" :disabled="!newDomainName.trim()" @click="addDomain">Add</VBtn></VCardActions>
      </VCard>
    </VDialog>

    <!-- Add Group Dialog -->
    <VDialog v-model="addDialog" max-width="400">
      <VCard>
        <VCardTitle>Add Group</VCardTitle>
        <VCardText><VTextField v-model="newGroupName" label="Group Name" density="compact" hide-details autofocus @keyup.enter="addGroup" /></VCardText>
        <VCardActions><VSpacer /><VBtn variant="text" @click="addDialog = false">Cancel</VBtn><VBtn color="primary" :disabled="!newGroupName.trim()" @click="addGroup">Create</VBtn></VCardActions>
      </VCard>
    </VDialog>

    <!-- Rename Group Dialog -->
    <VDialog v-model="renameDialog" max-width="400">
      <VCard>
        <VCardTitle>Rename Group</VCardTitle>
        <VCardText><VTextField v-model="renameName" label="Group Name" density="compact" hide-details autofocus @keyup.enter="doRename" /></VCardText>
        <VCardActions><VSpacer /><VBtn variant="text" @click="renameDialog = false">Cancel</VBtn><VBtn color="primary" :disabled="!renameName.trim()" @click="doRename">Save</VBtn></VCardActions>
      </VCard>
    </VDialog>

    <!-- Move Domain Dialog -->
    <VDialog v-model="moveDialog" max-width="400">
      <VCard>
        <VCardTitle>Move Zone</VCardTitle>
        <VCardText>
          <p class="text-body-2 mb-3"><code>{{ moveTarget?.name }}</code></p>
          <VSelect v-model="moveTargetGroup" :items="[{ title: 'Default (Ungrouped)', value: '' }, ...groups.map((g: any) => ({ title: g.name, value: g.id }))]" label="Move to Group" density="compact" hide-details />
        </VCardText>
        <VCardActions><VSpacer /><VBtn variant="text" @click="moveDialog = false">Cancel</VBtn><VBtn color="primary" @click="doMove">Move</VBtn></VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Dialog (single + batch) -->
    <VDialog v-model="editDialog" max-width="500">
      <VCard>
        <VCardTitle>{{ editTargets.length > 1 ? `Batch Edit (${editTargets.length} zones)` : 'Edit Zone' }}</VCardTitle>
        <VCardText>
          <div v-if="editTargets.length === 1" class="mb-3"><code>{{ editTargets[0]?.name }}</code></div>
          <div v-else class="mb-3 text-caption text-medium-emphasis">{{ editTargets.map(z => z.name).join(', ') }}</div>
          <VSelect v-model="editType" :items="TYPE_OPTIONS" label="Type" density="compact" hide-details class="mb-3" clearable />
          <VTextField v-model="editRemark" label="Remark" density="compact" hide-details placeholder="备注信息" />
        </VCardText>
        <VCardActions><VSpacer /><VBtn variant="text" @click="editDialog = false">Cancel</VBtn><VBtn color="primary" @click="doEdit">Save</VBtn></VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.group-list { flex: 1; overflow-y: auto; }
.group-list :deep(.v-list-item--active) { background: rgba(var(--v-theme-primary), 0.1); }
.row-selected { background: rgba(var(--v-theme-primary), 0.06) !important; }
.sticky-table { display: flex; flex-direction: column; width: 100%; }
.sticky-table :deep(.v-table__wrapper) table { table-layout: fixed !important; width: 100% !important; }
.sticky-table :deep(th), .sticky-table :deep(td) { padding: 2px 8px !important; font-size: 13px; }
.sticky-table :deep(.v-table__wrapper) { flex: 1; min-height: 0; overflow-y: auto; }
.sticky-table :deep(thead) { position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface)); }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(1), .sticky-table :deep(.v-table__wrapper) table td:nth-child(1) { width: 40px !important; min-width: 40px !important; max-width: 40px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(2), .sticky-table :deep(.v-table__wrapper) table td:nth-child(2) { width: 200px !important; min-width: 200px !important; max-width: 200px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(3), .sticky-table :deep(.v-table__wrapper) table td:nth-child(3) { width: 170px !important; min-width: 170px !important; max-width: 170px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(4), .sticky-table :deep(.v-table__wrapper) table td:nth-child(4) { width: 130px !important; min-width: 130px !important; max-width: 130px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(6), .sticky-table :deep(.v-table__wrapper) table td:nth-child(6) { width: 120px !important; min-width: 120px !important; max-width: 120px !important; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
