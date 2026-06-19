<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userConsoleProjectService as projectService, userConsoleDomainService as domainService } from '~/services/api'

definePageMeta({ layout: 'default' })

interface DomainGroup { id: string; name: string }

const GROUPS_KEY = 'cf-domain-groups'
const ASSIGN_KEY = 'cf-domain-assignments'

const projects = ref<any[]>([])
const domains = ref<any[]>([])
const loading = ref(false)
const selectedGroupId = ref<string>('default')

// --- Groups ---
const groups = ref<DomainGroup[]>([])
const groupMap = computed(() => {
  const m = new Map<string, DomainGroup>()
  for (const g of groups.value) m.set(g.id, g)
  return m
})

function loadGroups() {
  try {
    const raw = localStorage.getItem(GROUPS_KEY)
    groups.value = raw ? JSON.parse(raw) : []
  } catch { groups.value = [] }
}
function saveGroups() {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups.value))
}
function loadAssignments(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(ASSIGN_KEY) || '{}') } catch { return {} }
}
function saveAssignments(map: Record<string, string>) {
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(map))
}

const assignments = ref<Record<string, string>>({})

// --- Domain → Group mapping ---
const ungroupedDomains = computed(() =>
  domains.value.filter(d => !assignments.value[d.id])
)

const domainsInGroup = computed(() => {
  if (selectedGroupId.value === 'default') return ungroupedDomains.value
  return domains.value.filter(d => assignments.value[d.id] === selectedGroupId.value)
})

const groupCounts = computed(() => {
  const m: Record<string, number> = { default: ungroupedDomains.value.length }
  for (const g of groups.value) {
    m[g.id] = domains.value.filter(d => assignments.value[d.id] === g.id).length
  }
  return m
})

// --- Add Group ---
const addDialog = ref(false)
const newGroupName = ref('')
function addGroup() {
  if (!newGroupName.value.trim()) return
  const id = `g_${Date.now()}`
  groups.value.push({ id, name: newGroupName.value.trim() })
  saveGroups()
  newGroupName.value = ''
  addDialog.value = false
}

// --- Rename Group ---
const renameDialog = ref(false)
const renameTarget = ref<DomainGroup | null>(null)
const renameName = ref('')
function openRename(g: DomainGroup) {
  renameTarget.value = g
  renameName.value = g.name
  renameDialog.value = true
}
function doRename() {
  if (!renameTarget.value || !renameName.value.trim()) return
  renameTarget.value.name = renameName.value.trim()
  saveGroups()
  renameDialog.value = false
}

// --- Delete Group ---
function deleteGroup(g: DomainGroup) {
  if (!confirm(`Delete group "${g.name}"? Domains will move to Default.`)) return
  // Remove assignments for this group
  const map = { ...assignments.value }
  for (const [did, gid] of Object.entries(map)) {
    if (gid === g.id) delete map[did]
  }
  assignments.value = map
  saveAssignments(map)
  groups.value = groups.value.filter(x => x.id !== g.id)
  saveGroups()
  if (selectedGroupId.value === g.id) selectedGroupId.value = 'default'
}

// --- Move Domain ---
const moveDialog = ref(false)
const moveTarget = ref<any>(null)
const moveTargetGroup = ref<string>('')
function openMove(domain: any) {
  moveTarget.value = domain
  moveTargetGroup.value = assignments.value[domain.id] || ''
  moveDialog.value = true
}
function doMove() {
  if (!moveTarget.value) return
  const map = { ...assignments.value }
  if (moveTargetGroup.value) {
    map[moveTarget.value.id] = moveTargetGroup.value
  } else {
    delete map[moveTarget.value.id]  // back to default
  }
  assignments.value = map
  saveAssignments(map)
  moveDialog.value = false
}

// --- Fetch ---
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

onMounted(() => {
  loadGroups()
  assignments.value = loadAssignments()
  fetchData()
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Top Bar -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VIcon icon="bx-group" color="primary" />
        <span class="text-h6">Domain Groups</span>
        <VChip size="small" color="info" variant="tonal">Total: {{ domains.length }}</VChip>
        <VSpacer />
        <VBtn color="primary" size="small" prepend-icon="bx-plus" @click="addDialog = true">Add Group</VBtn>
        <VBtn icon="bx-refresh" size="small" variant="tonal" color="primary" @click="fetchData" :loading="loading" />
      </VCardText>
    </VCard>

    <!-- Main Content: Sidebar + Table -->
    <div style="display: flex; flex: 1; min-height: 0; gap: 12px;">
      <!-- Left: Group List -->
      <VCard style="width: 220px; min-width: 220px; display: flex; flex-direction: column;">
        <VList density="compact" nav class="group-list">
          <VListItem
            :active="selectedGroupId === 'default'"
            @click="selectedGroupId = 'default'"
            prepend-icon="bx-folder"
            title="Default"
          >
            <template #append>
              <VChip size="x-small" color="default" variant="tonal">{{ groupCounts.default }}</VChip>
            </template>
          </VListItem>

          <VDivider class="my-1" />

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

      <!-- Right: Domain Table -->
      <VCard style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
        <div class="card-scroll">
          <div v-if="loading" class="text-center py-8">
            <VProgressCircular indeterminate color="primary" />
          </div>

          <div v-else-if="domainsInGroup.length === 0" class="text-center py-8 text-medium-emphasis">
            <VIcon icon="bx-folder-open" size="48" class="mb-2" />
            <p>No domains in this group.</p>
          </div>

          <VTable v-else class="text-no-wrap sticky-table" hover density="compact" style="width: 100%;">
            <thead>
              <tr class="text-caption text-medium-emphasis">
                <th style="width: 250px;">Domain</th>
                <th style="width: 100px;">Project</th>
                <th style="width: 70px;">Type</th>
                <th style="width: 70px;">Env</th>
                <th style="width: 150px;">Zone ID</th>
                <th>Remark</th>
                <th style="width: 80px;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in domainsInGroup" :key="d.id">
                <td><code class="text-body-2">{{ d.domain }}</code></td>
                <td class="text-body-2">{{ projects.find(p => p.id === d.projectId)?.name || '-' }}</td>
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
                <td>
                  <VBtn size="x-small" variant="tonal" color="primary" @click="openMove(d)">Move</VBtn>
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
        <VCardTitle>Move Domain</VCardTitle>
        <VCardText>
          <p class="text-body-2 mb-3"><code>{{ moveTarget?.domain }}</code></p>
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
.sticky-table :deep(.v-table__wrapper) table td:nth-child(1) { width: 250px !important; min-width: 250px !important; max-width: 250px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(2),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(2) { width: 100px !important; min-width: 100px !important; max-width: 100px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(3),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(3) { width: 70px !important; min-width: 70px !important; max-width: 70px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(4),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(4) { width: 70px !important; min-width: 70px !important; max-width: 70px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(5),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(5) { width: 150px !important; min-width: 150px !important; max-width: 150px !important; }
.sticky-table :deep(.v-table__wrapper) table th:nth-child(7),
.sticky-table :deep(.v-table__wrapper) table td:nth-child(7) { width: 80px !important; min-width: 80px !important; max-width: 80px !important; }
.card-scroll { overflow-y: auto; max-height: calc(100vh - 200px); }
</style>
