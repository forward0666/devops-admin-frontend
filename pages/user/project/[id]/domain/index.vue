<script lang="ts">definePageMeta({ middleware: ["user-project-guard"] })</script>
<script setup lang="ts">
import apiClient, { userConsoleDomainService, domainGroupService } from '~/services/api'

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const name = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value)?.name || 'Unknown Project')

const searchQuery = ref('')
const expandedRows = ref<number[]>([])
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const storageKey = computed(() => `domain-expanded-${projectId.value}`)

function loadExpandedState() {
  if (import.meta.client) {
    const saved = localStorage.getItem(storageKey.value)
    if (saved) {
      try {
        const ids = JSON.parse(saved)
        expandedRows.value = Array.isArray(ids) ? ids : Object.keys(ids).map(Number)
      } catch { /* ignore */ }
    }
  }
}

watch(() => expandedRows.value, (val) => {
  if (import.meta.client) {
    localStorage.setItem(storageKey.value, JSON.stringify(val))
  }
}, { deep: true })

onMounted(loadExpandedState)

const toggleExpand = (env: string) => {
  if (expandedRows.value.includes(env)) {
    const i = expandedRows.value.indexOf(env)
    expandedRows.value.splice(i, 1)
  } else {
    expandedRows.value.push(env)
  }
}

const isRowExpanded = (env: string) => expandedRows.value.includes(env)

const authStore = useAuthStore()

// Fetch current user's project role
const myProjectRole = ref('Member')

async function fetchMyRole() {
  try {
    const { userConsoleMemberService } = await import('~/services/api')
    const res: any = await userConsoleMemberService.list(projectId.value)
    const members = Array.isArray(res) ? res : res?.data || []
    const myMember = members.find((m: any) => Number(m.userId) === Number(authStore.user?.id))
    myProjectRole.value = myMember?.projectRole || 'Member'
  } catch { /* ignore */ }
}

const canViewSensitive = computed(() => {
  const role = authStore.role || ''
  const pr = myProjectRole.value
  // System admin/devops or project Administrator/DevOps/Leader can see all
  if (['sys_admin', 'admin', 'devops'].includes(role)) return true
  if (['Administrator', 'DevOps', 'Leader'].includes(pr)) return true
  return false
})
const canManage = computed(() => {
  const role = authStore.role || ''
  const pr = myProjectRole.value
  if (['sys_admin', 'admin', 'devops'].includes(role)) return true
  if (['Administrator', 'DevOps'].includes(pr)) return true
  return false
})

const envColor = (env: string) => ({ prod: 'success', uat: 'warning', test: 'info', dev: 'secondary' }[env] || 'grey')
const envIcon = (env: string) => ({ prod: 'bx-check-circle', uat: 'bx-test-tube', test: 'bx-test-tube', dev: 'bx-code' }[env] || 'bx-globe')

// Domains from API
const sortKey = ref<string>('domain')
const sortDir = ref<'asc' | 'desc'>('asc')

const domains = ref<any[]>([])

const envList = computed(() => {
  const envs = ['prod', 'uat', 'test', 'dev']
  return envs.map(env => {
    const children = domains.value.filter(d => d.env === env)
    return { env, children }
  })
})

function getVisibleChildren(env: any) {
  const pr = myProjectRole.value
  const filtered = env.children.filter((c: any) => {
    if (c.env === 'prod' && pr === 'Member' && c.type !== 'web') return false
    return true
  })
  return [...filtered].sort((a: any, b: any) => {
    const av = String(a[sortKey.value] || '').toLowerCase()
    const bv = String(b[sortKey.value] || '').toLowerCase()
    return sortDir.value === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })
}

// Filtered by search
const filteredEnvList = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return envList.value
  return envList.value.map(env => ({
    ...env,
    children: env.children.filter((c: any) =>
      (c.domain || '').toLowerCase().includes(query) ||
      (c.type || '').toLowerCase().includes(query) ||
      (c.remark || '').toLowerCase().includes(query)
    )
  })).filter(env => env.children.length > 0)
})

const typeColor = (type: string) => ({ web: 'primary', admin: 'warning', callback: 'info', api: 'success' }[type] || 'grey')

// Fetch domains
async function fetchDomains() {
  loading.value = true
  try {
    const res: any = await userConsoleDomainService.list(projectId.value)
    domains.value = Array.isArray(res) ? res : res?.data || []
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to load domains', color: 'error' }
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchMyRole(); fetchDomains() })

// Add
const isAddDialogVisible = ref(false)
const addFormRef = ref<any>(null)
const newDomain = ref({ domain: '', env: '', type: '', remark: '', cdn: '' })

// Multi-select
const selectedDomains = ref<string[]>([])

const expandedVisibleDomains = computed(() => {
  const list: any[] = []
  for (const env of filteredEnvList.value) {
    if (isRowExpanded(env.env)) list.push(...getVisibleChildren(env))
  }
  return list
})

const allExpandedDomainsSelected = computed(() => expandedVisibleDomains.value.length > 0 && expandedVisibleDomains.value.every((d: any) => selectedDomains.value.includes(d.id)))
const someExpandedDomainsSelected = computed(() => expandedVisibleDomains.value.some((d: any) => selectedDomains.value.includes(d.id)) && !allExpandedDomainsSelected.value)

function toggleSelect(id: string) {
 const i = selectedDomains.value.indexOf(id)
 if (i >= 0) selectedDomains.value.splice(i, 1)
 else selectedDomains.value.push(id)
}

function toggleSelectAll(val: boolean) {
 if (val) {
   for (const d of expandedVisibleDomains.value) {
     if (!selectedDomains.value.includes(d.id)) selectedDomains.value.push(d.id)
   }
 } else {
   selectedDomains.value = []
 }
}

// Bulk edit
const isBulkEditDialogVisible = ref(false)
const bulkForm = ref({ type: '', remark: '', cdn: '' })
const bulkSaving = ref(false)

function resetBulkForm() { bulkForm.value = { type: '', remark: '', cdn: '' } }
watch(isBulkEditDialogVisible, (v) => { if (v) resetBulkForm() })

async function bulkUpdate() {
  if (!selectedDomains.value.length) return
  bulkSaving.value = true
  try {
    const body: any = { projectId: Number(projectId.value), ids: selectedDomains.value }
    if (bulkForm.value.type.trim()) body.type = bulkForm.value.type.trim()
    if (bulkForm.value.remark.trim()) body.remark = bulkForm.value.remark.trim()
    if (bulkForm.value.cdn.trim()) body.cdn = bulkForm.value.cdn.trim()
    if (!body.type && !body.remark && !body.cdn) {
      snackbar.value = { show: true, text: '请至少填写一个字段', color: 'warning' }
      bulkSaving.value = false
      return
    }
    await userConsoleDomainService.bulkUpdate(body)
    snackbar.value = { show: true, text: `已更新 ${selectedDomains.value.length} 条记录`, color: 'success' }
    selectedDomains.value = []
    isBulkEditDialogVisible.value = false
    await fetchDomains()
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || '更新失败', color: 'error' }
  } finally {
    bulkSaving.value = false
  }
}

// Bulk delete
const isBulkDeleteDialogVisible = ref(false)
const bulkDeleting = ref(false)

async function bulkDelete() {
  if (!selectedDomains.value.length) return
  bulkDeleting.value = true
  try {
    await userConsoleDomainService.bulkDelete({ projectId: projectId.value, ids: selectedDomains.value })
    snackbar.value = { show: true, text: `已删除 ${selectedDomains.value.length} 条记录`, color: 'success' }
    selectedDomains.value = []
    isBulkDeleteDialogVisible.value = false
    await fetchDomains()
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || '删除失败', color: 'error' }
  } finally {
    bulkDeleting.value = false
  }
}

async function addDomain() {
  addFormRef.value?.validate().then(async ({ valid }: any) => {
    if (!valid) return
    try {
      await userConsoleDomainService.create({ ...newDomain.value, projectId: projectId.value })
      newDomain.value = { domain: '', env: '', type: '', remark: '', cdn: '' }
      isAddDialogVisible.value = false
      await fetchDomains()
      snackbar.value = { show: true, text: 'Domain added', color: 'success' }
    } catch (e: any) {
      snackbar.value = { show: true, text: e.message || 'Failed to add domain', color: 'error' }
    }
  })
}

// Edit
const isEditDialogVisible = ref(false)
const editingItem = ref<any>(null)

function openEditDialog(item: any) {
  editingItem.value = { ...item }
  isEditDialogVisible.value = true
}

async function saveEdit() {
  if (!editingItem.value) return
  try {
    await userConsoleDomainService.update(editingItem.value.id, {
      projectId: projectId.value,
      domain: editingItem.value.domain,
      type: editingItem.value.type,
      remark: editingItem.value.remark,
      cdn: editingItem.value.cdn,
    })
    isEditDialogVisible.value = false
    await fetchDomains()
    snackbar.value = { show: true, text: 'Domain updated', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to update domain', color: 'error' }
  }
}

// Delete
const isDeleteDialogVisible = ref(false)
const deletingItem = ref<any>(null)

async function confirmDelete() {
  if (!deletingItem.value) return
  try {
    await userConsoleDomainService.delete(deletingItem.value.id, projectId.value)
    isDeleteDialogVisible.value = false
    await fetchDomains()
    snackbar.value = { show: true, text: 'Domain removed', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to delete domain', color: 'error' }
  }
}

// Import
const isImportDialogVisible = ref(false)
const importMode = ref<'file' | 'group'>('file')
const importFile = ref<File | null>(null)
const isDragging = ref(false)
const importGroups = ref<any[]>([])
const importSelectedGroupId = ref('')
const importGroupMeta = ref<Record<string, { type: string; remark: string; groupId: string }>>({})
const importGroupZones = ref<any[]>([])

async function openImportDialog() {
  importMode.value = 'file'
  importFile.value = null
  importSelectedGroupId.value = ''
  isImportDialogVisible.value = true
  try {
    const [groups, meta, zones] = await Promise.all([
      domainGroupService.listGroups(),
      domainGroupService.listMeta(),
      apiClient.get('/cloudflare/zones').then((r: any) => r.data?.data || r.data || []).catch(() => []),
    ])
    importGroups.value = groups || []
    const m: Record<string, { type: string; remark: string; groupId: string }> = {}
    for (const item of (meta || [])) {
      if (item.zoneId) m[item.zoneId] = { type: item.type || '', remark: item.remark || '', groupId: item.groupId || '' }
    }
    importGroupMeta.value = m
    importGroupZones.value = zones || []
    console.log('[Import] Groups:', groups?.length, 'Meta:', Object.keys(m).length, 'Zones:', zones?.length)
    console.log('[Import] Sample meta:', Object.keys(m).slice(0, 3).map(k => `${k}=${m[k].groupId}`))
    console.log('[Import] Sample zone:', zones?.[0]?.zone_id, zones?.[0]?.name)
  } catch { /* ignore */ }
}

const importGroupDomains = computed(() => {
  if (!importSelectedGroupId.value) return []
  const matched = importGroupZones.value.filter(z => importGroupMeta.value[z.zone_id]?.groupId === importSelectedGroupId.value)
  console.log('[Import] Filter: groupId=', importSelectedGroupId.value, 'zones=', importGroupZones.value.length, 'matched=', matched.length, 'metaKeys=', Object.keys(importGroupMeta.value).length)
  if (matched.length === 0 && importGroupZones.value.length > 0) {
    const sample = importGroupZones.value[0]
    console.log('[Import] Sample zone_id:', sample.zone_id, 'meta for it:', importGroupMeta.value[sample.zone_id])
  }
  return matched.map(z => ({
    domain: z.name,
    env: 'prod',
    type: importGroupMeta.value[z.zone_id]?.type || 'web',
    remark: importGroupMeta.value[z.zone_id]?.remark || '',
    cdn: '',
  }))
})

function handleFileDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) importFile.value = file
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) importFile.value = input.files[0]
}

async function confirmImport() {
  if (importMode.value === 'file') {
    if (!importFile.value) return
    try {
      const text = await importFile.value.text()
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        await userConsoleDomainService.importDomains({ projectId: projectId.value, domains: data })
        importFile.value = null
        isImportDialogVisible.value = false
        await fetchDomains()
        snackbar.value = { show: true, text: `Imported ${data.length} domains`, color: 'success' }
        return
      }
      snackbar.value = { show: true, text: 'Invalid JSON format, expected array', color: 'error' }
    } catch (e: any) {
      snackbar.value = { show: true, text: e?.message || 'Import failed', color: 'error' }
    }
  } else {
    if (!importGroupDomains.value.length) return
    try {
      await userConsoleDomainService.importDomains({ projectId: projectId.value, domains: importGroupDomains.value })
      isImportDialogVisible.value = false
      await fetchDomains()
      snackbar.value = { show: true, text: `Imported ${importGroupDomains.value.length} domains from group`, color: 'success' }
    } catch (e: any) {
      snackbar.value = { show: true, text: e?.message || 'Import failed', color: 'error' }
    }
  }
}


// Export
function exportDomains() {
  const data = domains.value.map(d => ({ domain: d.domain, env: d.env, type: d.type, remark: d.remark, cdn: d.cdn }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `domains-${name.value.replace(/\s+/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VTextField
          v-model="searchQuery"
          prepend-inner-icon="bx-search"
          placeholder="Search domains..."
          density="compact"
          hide-details
          clearable
          style="max-width: 240px"
        />
        <VChip size="small" color="primary" variant="tonal">Total: {{ domains.length }}</VChip>
        <VSpacer />
        <VBtn prepend-icon="bx-plus" color="primary" size="small" :disabled="!canManage" @click="isAddDialogVisible = true">Add Domain</VBtn>
        <VBtn prepend-icon="bx-download" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="openImportDialog">Import</VBtn>
        <VBtn prepend-icon="bx-upload" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="exportDomains">Export</VBtn>
        <VBtn prepend-icon="bx-edit" variant="tonal" color="warning" size="small" :disabled="!canManage || !selectedDomains.length" @click="isBulkEditDialogVisible = true">Edit ({{ selectedDomains.length }})</VBtn>
        <VBtn prepend-icon="bx-trash" variant="tonal" color="error" size="small" :disabled="!canManage || !selectedDomains.length" @click="isBulkDeleteDialogVisible = true">Delete ({{ selectedDomains.length }})</VBtn>
      </VCardText>
    </VCard>

    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="domains.length" class="text-no-wrap sticky-table" hover density="compact" style="flex: 1; min-height: 0; width: 100%;">
      <thead>
          <tr class="text-caption text-medium-emphasis">
            <th style="width: 40px; padding-left: 50px;"><VCheckbox density="compact" hide-details :model-value="allExpandedDomainsSelected" :indeterminate="someExpandedDomainsSelected" @update:model-value="toggleSelectAll" /></th>
            <th>
              <span class="cursor-pointer d-inline-flex align-center gap-1" @click="sortKey = 'domain'; sortDir = sortDir === 'asc' ? 'desc' : 'asc'">Domain <VIcon size="16" :icon="sortKey === 'domain' ? (sortDir === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></span>
            </th>
            <th style="width: 90px;">
              <span class="cursor-pointer d-inline-flex align-center gap-1" @click="sortKey = 'type'; sortDir = sortDir === 'asc' ? 'desc' : 'asc'">Type <VIcon size="16" :icon="sortKey === 'type' ? (sortDir === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></span>
            </th>
            <th style="width: 140px;">
              <span class="cursor-pointer d-inline-flex align-center gap-1" @click="sortKey = 'remark'; sortDir = sortDir === 'asc' ? 'desc' : 'asc'">Remark <VIcon size="16" :icon="sortKey === 'remark' ? (sortDir === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></span>
            </th>
            <th style="width: 160px;">
              <span class="cursor-pointer d-inline-flex align-center gap-1" @click="sortKey = 'cdn'; sortDir = sortDir === 'asc' ? 'desc' : 'asc'">CDN <VIcon size="16" :icon="sortKey === 'cdn' ? (sortDir === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></span>
            </th>
            <th style="width: 90px;">Action</th>
          </tr>
        </thead>
        <tbody>
        <template v-for="env in filteredEnvList" :key="env.env">
          <tr class="cursor-pointer" @click="toggleExpand(env.env)" style="background: rgb(var(--v-theme-on-surface), 0.04);">
            <td style="padding-left: 50px;" colspan="6">
              <div class="d-flex align-center">
                <VIcon :icon="isRowExpanded(env.env) ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
                <VIcon :icon="envIcon(env.env)" :color="envColor(env.env)" size="20" class="me-2" />
                <span class="font-weight-bold text-body-1">{{ env.env.toUpperCase() }}</span>
                <VChip variant="tonal" :color="envColor(env.env)" size="x-small" label class="ms-2">{{ getVisibleChildren(env).length }}</VChip>
              </div>
            </td>
          </tr>
          <template v-if="isRowExpanded(env.env)">
            <tr v-for="domain in getVisibleChildren(env)" :key="domain.id" class="table-row-hover">
              <td style="width: 40px; padding-left: 50px;"><VCheckbox density="compact" hide-details :model-value="selectedDomains.includes(domain.id)" @update:model-value="toggleSelect(domain.id)" /></td>
              <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <div class="d-flex align-center gap-x-2">
                  <VIcon icon="bx-globe" color="primary" size="18" />
                  <span class="font-weight-medium">{{ domain.domain }}</span>
                </div>
              </td>
              <td><VChip variant="tonal" :color="typeColor(domain.type)" size="small" label>{{ domain.type }}</VChip></td>
              <td><span class="text-body-1">{{ domain.remark || '-' }}</span></td>
              <td><span class="text-body-1">{{ domain.cdn || '-' }}</span></td>
              <td>
                <div class="d-flex gap-1">
                  <IconBtn size="small" :disabled="!canManage" @click="openEditDialog(domain)"><VIcon icon="bx-edit" size="18" /></IconBtn>
                  <IconBtn size="small" color="error" :disabled="!canManage" @click="deletingItem = domain; isDeleteDialogVisible = true"><VIcon icon="bx-trash" size="18" /></IconBtn>
                </div>
              </td>
            </tr>
            <tr v-if="!env.children.length">
              <td colspan="6" class="text-center text-medium-emphasis pa-4">No domains</td>
            </tr>
          </template>
        </template>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loading && !domains.length" class="text-center text-medium-emphasis pa-6">
        No domains configured
      </VCardText>
    </VCard>

    <!-- Import Dialog -->
    <VDialog v-model="isImportDialogVisible" max-width="550" content-class="import-dialog">
      <VCard>
        <VCardItem>
          <VCardTitle>Import Domains</VCardTitle>
        </VCardItem>
        <VCardText>
          <VTabs v-model="importMode" density="compact" class="mb-4">
            <VTab value="file" prepend-icon="bx-file">JSON File</VTab>
            <VTab value="group" prepend-icon="bx-group">Domain Group</VTab>
          </VTabs>
          <VWindow v-model="importMode">
            <!-- JSON File Mode -->
            <VWindowItem value="file">
              <div
                class="drop-zone pa-8 text-center border rounded-lg"
                :class="isDragging ? 'border-primary bg-primary-lighten-5' : 'border-dashed border-medium-emphasis'"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="handleFileDrop"
                @click="($refs.fileInput as any)?.click()"
              >
                <VIcon icon="bx-upload" size="40" color="medium-emphasis" class="mb-2" />
                <p class="text-body-1 mb-1">Drag & drop JSON file here</p>
                <p class="text-caption text-medium-emphasis">or click to browse</p>
                <input ref="fileInput" type="file" accept=".json" class="d-none" @change="handleFileSelect" />
              </div>
              <div v-if="importFile" class="d-flex align-center gap-2 mt-3">
                <VIcon icon="bx-file" size="20" color="primary" />
                <span class="text-body-2">{{ importFile.name }}</span>
                <VBtn icon variant="text" size="x-small" @click="importFile = null"><VIcon icon="bx-x" size="16" /></VBtn>
              </div>
              <div class="mt-4 pa-3 bg-grey-lighten-4 rounded">
                <p class="text-caption text-medium-emphasis mb-1">JSON format example:</p>
                <code class="text-caption">[{"domain": "prod.example.com", "env": "prod", "type": "web", "remark": "", "cdn": ""}]</code>
              </div>
            </VWindowItem>
            <!-- Domain Group Mode -->
                        <VWindowItem value="group" style="min-height: 120px; overflow: visible; padding-top: 8px;">
              <VSelect
                v-model="importSelectedGroupId"
                :items="importGroups.map(g => ({ title: g.name, value: g.id }))"
                label="Select Group"
                density="compact"
                hide-details
                clearable
                class="mb-3"
                :menu-props="{ contentClass: 'elevation-3' }"
              />
              <div v-if="importSelectedGroupId && importGroupDomains.length > 0" class="border rounded-lg pa-3" style="max-height: 300px; overflow-y: auto;">
                <p class="text-caption text-medium-emphasis mb-2">{{ importGroupDomains.length }} domains will be imported:</p>
                <div v-for="d in importGroupDomains" :key="d.domain" class="d-flex align-center gap-2 py-1">
                  <VIcon icon="bx-globe" size="14" color="medium-emphasis" />
                  <code class="text-body-2">{{ d.domain }}</code>
                  
                </div>
              </div>
              <div v-else-if="importSelectedGroupId" class="text-center py-4 text-medium-emphasis">
                <VIcon icon="bx-info-circle" size="24" class="mb-1" />
                <p class="text-body-2">No domains in this group</p>
              </div>
            </VWindowItem>
          </VWindow>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isImportDialogVisible = false">Cancel</VBtn>
          <VBtn
            v-if="importMode === 'file'"
            color="primary"
            :disabled="!importFile"
            :loading="loading"
            @click="confirmImport"
          >Import</VBtn>
          <VBtn
            v-else
            color="primary"
            :disabled="!importGroupDomains.length"
            :loading="loading"
            @click="confirmImport"
          >Import {{ importGroupDomains.length }} domains</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Add Domain Dialog -->
    <VDialog v-model="isAddDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Add Domain</VCardTitle>
        </VCardItem>
        <VCardText>
          <VForm ref="addFormRef">
            <VTextField v-model="newDomain.domain" label="Domain" placeholder="prod.example.com" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Domain is required']" />
            <VSelect v-model="newDomain.env" label="Environment" :items="['prod', 'uat', 'test', 'dev']" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Environment is required']" />
            <VSelect v-model="newDomain.type" label="Type" :items="['landingpage', 'antiblock', 'bucket', 'web', 'admin', 'callback', 'api']" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newDomain.remark" label="Remark" density="comfortable" variant="outlined" />
            <VSelect v-model="newDomain.cdn" :items="['cloudflare', 'tencent']" label="CDN" clearable density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="loading" @click="addDomain">Add</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Domain Dialog -->
    <VDialog v-model="isEditDialogVisible" max-width="500">
      <VCard>
        <VCardTitle>Edit Domain</VCardTitle>
        <VCardText>
          <VForm ref="editFormRef">
            <VTextField v-model="editingItem.domain" label="Domain" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Domain is required']" />
            <VSelect v-model="editingItem.type" label="Type" :items="['landingpage', 'antiblock', 'bucket', 'web', 'admin', 'callback', 'api']" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.remark" label="Remark" density="comfortable" variant="outlined" />
            <VSelect v-model="editingItem.cdn" :items="['cloudflare', 'tencent']" label="CDN" clearable density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="loading" @click="saveEdit">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bulk Edit Dialog -->
    <VDialog v-model="isBulkEditDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Edit ({{ selectedDomains.length }} selected)</VCardTitle>
        </VCardItem>
        <VCardText>
          <div class="text-body-2 text-medium-emphasis mb-4">Leave field empty to keep unchanged.</div>
          <VSelect v-model="bulkForm.type" :items="['landingpage', 'antiblock', 'bucket', 'web', 'admin', 'callback', 'api']" label="Type" clearable density="comfortable" variant="outlined" class="mb-3" />
          <VTextField v-model="bulkForm.remark" label="Remark" density="comfortable" variant="outlined" clearable class="mb-3" />
          <VSelect v-model="bulkForm.cdn" :items="['cloudflare', 'tencent']" label="CDN" clearable density="comfortable" variant="outlined" class="mb-3" />
        </VCardText>
        <VCardActions class="justify-end pa-4">
          <VBtn variant="tonal" @click="isBulkEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="bulkSaving" @click="bulkUpdate">Update</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bulk Delete Dialog -->
    <VDialog v-model="isBulkDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardTitle>批量删除</VCardTitle>
        <VCardText>确定要删除选中的 <strong>{{ selectedDomains.length }}</strong> 个域名吗？此操作不可撤销。</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isBulkDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" :loading="bulkDeleting" @click="bulkDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardTitle>Remove Domain</VCardTitle>
        <VCardText>Are you sure you want to remove <strong>{{ deletingItem?.domain }}</strong>?</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" :loading="loading" @click="confirmDelete">Remove</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
<style scoped>
.sticky-table {
  display: flex;
  flex-direction: column;
  width: 100%;
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
</style>

<style>
.import-dialog .v-overlay__content {
  overflow: visible !important;
}
.import-dialog .v-card {
  overflow: visible !important;
}
</style>
