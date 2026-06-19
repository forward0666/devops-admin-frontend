<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'

interface DomainGroup { id: string; name: string }

const GROUPS_KEY = 'cf-domain-groups'
const ASSIGN_KEY = 'cf-domain-assignments'

const zones = ref<any[]>([])
const loading = ref(false)
const selectedGroupId = ref<string>('all')

// --- Groups ---
const groups = ref<DomainGroup[]>([])

function loadGroups() {
  try { groups.value = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]') } catch { groups.value = [] }
}
function saveGroups() { localStorage.setItem(GROUPS_KEY, JSON.stringify(groups.value)) }
function loadAssignments(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(ASSIGN_KEY) || '{}') } catch { return {} }
}
function saveAssignments(map: Record<string, string>) { localStorage.setItem(ASSIGN_KEY, JSON.stringify(map)) }
const assignments = ref<Record<string, string>>({})

// --- Domain lists ---
const ungroupedZones = computed(() => zones.value.filter(z => !assignments.value[z.zone_id]))
const allZones = computed(() => zones.value)
const zonesInGroup = computed(() => {
  if (selectedGroupId.value === 'all') return allZones.value
  if (selectedGroupId.value === 'default') return ungroupedZones.value
  return zones.value.filter(z => assignments.value[z.zone_id] === selectedGroupId.value)
})

const groupCounts = computed(() => {
  const m: Record<string, number> = { all: zones.value.length, default: ungroupedZones.value.length }
  for (const g of groups.value) {
    m[g.id] = zones.value.filter(z => assignments.value[z.zone_id] === g.id).length
  }
  return m
})

// --- Add Group ---
const addDialog = ref(false)
const newGroupName = ref('')
function addGroup() {
  if (!newGroupName.value.trim()) return
  groups.value.push({ id: `g_${Date.now()}`, name: newGroupName.value.trim() })
  saveGroups(); newGroupName.value = ''; addDialog.value = false
}

// --- Rename Group ---
const renameDialog = ref(false)
const renameTarget = ref<DomainGroup | null>(null)
const renameName = ref('')
function openRename(g: DomainGroup) { renameTarget.value = g; renameName.value = g.name; renameDialog.value = true }
function doRename() {
  if (!renameTarget.value || !renameName.value.trim()) return
  renameTarget.value.name = renameName.value.trim(); saveGroups(); renameDialog.value = false
}

// --- Delete Group ---
function deleteGroup(g: DomainGroup) {
  if (!confirm(`Delete "${g.name}"? Domains will move to Default.`)) return
  const map = { ...assignments.value }
  for (const [did, gid] of Object.entries(map)) { if (gid === g.id) delete map[did] }
  assignments.value = map; saveAssignments(map)
  groups.value = groups.value.filter(x => x.id !== g.id); saveGroups()
  if (selectedGroupId.value === g.id) selectedGroupId.value = 'all'
}

// --- Move Domain ---
const moveDialog = ref(false)
const moveTarget = ref<any>(null)
const moveTargetGroup = ref<string>('')
function openMove(zone: any) {
  moveTarget.value = zone; moveTargetGroup.value = assignments.value[zone.zone_id] || ''; moveDialog.value = true
}
function doMove() {
  if (!moveTarget.value) return
  const map = { ...assignments.value }
  if (moveTargetGroup.value) map[moveTarget.value.zone_id] = moveTargetGroup.value
  else delete map[moveTarget.value.zone_id]
  assignments.value = map; saveAssignments(map); moveDialog.value = false
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

onMounted(() => {
  loadGroups(); assignments.value = loadAssignments(); fetchZones()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Top Bar -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VIcon icon="bx-group" color="primary" />
        <span class="text-h6">Domain Groups</span>
        <VChip size="small" color="info" variant="tonal">Zones: {{ zones.length }}</VChip>
        <VSpacer />
        <VBtn color="primary" size="small" prepend-icon="bx-plus" @click="addDialog = true">Add Group</VBtn>
        <VBtn icon="bx-refresh" size="small" variant="tonal" color="primary" @click="fetchZones" :loading="loading" />
      </VCardText>
    </VCard>

    <!-- Main Content -->
    <div style="display: flex; flex: 1; min-height: 0; gap: 12px;">
      <!-- Left: Group List -->
      <VCard style="width: 220px; min-width: 220px; display: flex; flex-direction: column;">
        <VList density="compact" nav class="group-list">
          <!-- All -->
          <VListItem :active="selectedGroupId === 'all'" @click="selectedGroupId = 'all'" prepend-icon="bx-globe">
            <VListItemTitle>All</VListItemTitle>
            <template #append>
              <VChip size="x-small" color="default" variant="tonal">{{ groupCounts.all }}</VChip>
            </template>
          </VListItem>

          <!-- Default (ungrouped) -->
          <VListItem :active="selectedGroupId === 'default'" @click="selectedGroupId = 'default'" prepend-icon="bx-folder">
            <VListItemTitle>Default</VListItemTitle>
            <template #append>
              <VChip size="x-small" color="default" variant="tonal">{{ groupCounts.default }}</VChip>
            </template>
          </VListItem>

          <VDivider class="my-1" />

          <!-- Custom Groups -->
          <VListItem
            v-for="g in groups"
            :key="g.id"
            :active="selectedGroupId === g.id"
            @click="selectedGroupId = g.id"
            prepend-icon="bx-folder-open"
          >
            <VListItemTitle>{{ g.name }}</VListItemTitle>
            <template #append>
              <VChip size="x-small" color="primary" variant="tonal" class="me-1">{{ groupCounts[g.id] || 0 }}</VChip>
              <VMenu location="end">
                <template #activator="{ props }">
                  <VBtn icon="bx-dots-vertical-rounded" size="x-small" variant="text" v-bind="props" @click.stop />
                </template>
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
          <div v-if="loading" class="text-center py-8">
            <VProgressCircular indeterminate color="primary" />
          </div>

          <div v-else-if="zonesInGroup.length === 0" class="text-center py-8 text-medium-emphasis">
            <VIcon icon="bx-folder-open" size="48" class="mb-2" />
            <p>No zones in this group.</p>
          </div>

          <VTable v-else class="text-no-wrap sticky-table" hover density="compact" style="width: 100%;">
            <thead>
              <tr class="text-caption text-medium-emphasis">
                <th style="width: 300px;">Domain</th>
                <th style="width: 120px;">Source</th>
                <th style="width: 80px;">Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="z in zonesInGroup" :key="z.zone_id">
                <td><code class="text-body-2">{{ z.name }}</code></td>
                <td class="text-body-2">{{ z.accountName || '-' }}</td>
                <td class="text-body-2">{{ z.type || '-' }}</td>
                <td>
                  <VBtn size="x-small" variant="tonal" color="primary" @click="openMove(z)">Move</VBtn>
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCard>
    </div>

    <!-- Add Group Dialog -->
    <VDialog v-model="addDialog" max-width="400">
      <VCard>
        <VCardTitle>Add Group</VCardTitle>
        <VCardText>
          <VTextField v-model="newGroupName" label="Group Name" density="compact" hide-details autofocus @keyup.enter="addGroup" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="addDialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!newGroupName.trim()" @click="addGroup">Create</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Rename Group Dialog -->
    <VDialog v-model="renameDialog" max-width="400">
      <VCard>
        <VCardTitle>Rename Group</VCardTitle>
        <VCardText>
          <VTextField v-model="renameName" label="Group Name" density="compact" hide-details autofocus @keyup.enter="doRename" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="renameDialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!renameName.trim()" @click="doRename">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Move Domain Dialog -->
    <VDialog v-model="moveDialog" max-width="400">
      <VCard>
        <VCardTitle>Move Zone</VCardTitle>
        <VCardText>
          <p class="text-body-2 mb-3"><code>{{ moveTarget?.name }}</code></p>
          <VSelect
            v-model="moveTargetGroup"
            :items="[
              { title: 'Default (Ungrouped)', value: '' },
              ...groups.map(g => ({ title: g.name, value: g.id })),
            ]"
            label="Move to Group"
            density="compact"
            hide-details
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="moveDialog = false">Cancel</VBtn>
          <VBtn color="primary" @click="doMove">Move</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.group-list {
  flex: 1;
  overflow-y: auto;
}
.group-list :deep(.v-list-item--active) {
  background: rgba(var(--v-theme-primary), 0.1);
}
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
.sticky-table :deep(.v-table__wrapper) table td:nth-child(1) { width: 300px !important; min-width: 300px !important; max-width: 300px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(2),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(2) { width: 120px !important; min-width: 120px !important; max-width: 120px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(3),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(3) { width: 80px !important; min-width: 80px !important; max-width: 80px !important; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
