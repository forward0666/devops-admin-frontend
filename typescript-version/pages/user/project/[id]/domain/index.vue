<script lang="ts">definePageMeta({ middleware: ["user-project-guard"] })</script>
<script setup lang="ts">
import { userConsoleDomainService } from '~/services/api'

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
const importFile = ref<File | null>(null)
const isDragging = ref(false)

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
}

// Export
function exportDomains() {
  const data = domains.value.map(d => ({ domain: d.domain, env: d.env, type: d.type, remark: d.remark }))
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
  <div>
    <VCard>
      <VCardText class="d-flex justify-space-between align-center flex-wrap gap-3">
        <h4 class="text-h4">Domain</h4>
        <div class="d-flex align-center gap-3">
          <VBtn prepend-icon="bx-plus" color="primary" size="small" :disabled="!canManage" @click="isAddDialogVisible = true">Add Domain</VBtn>
          <VBtn prepend-icon="bx-download" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="isImportDialogVisible = true">Import</VBtn>
          <VBtn prepend-icon="bx-upload" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="exportDomains">Export</VBtn>
        </div>
      </VCardText>
      <VDivider />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <template v-for="env in filteredEnvList" :key="env.env">
        <div class="d-flex align-center cursor-pointer px-3 py-1" @click="toggleExpand(env.env)">
          <VIcon :icon="isRowExpanded(env.env) ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
          <VIcon :icon="envIcon(env.env)" :color="envColor(env.env)" size="20" class="me-2" />
          <span class="font-weight-bold text-body-1">{{ env.env.toUpperCase() }}</span>
          <VChip variant="tonal" :color="envColor(env.env)" size="x-small" label class="ms-2">{{ getVisibleChildren(env).length }}</VChip>
        </div>
        <VTable v-show="isRowExpanded(env.env)" class="text-no-wrap" hover density="compact" style="table-layout: fixed; width: 100%;">
          <thead>
            <tr class="text-caption text-medium-emphasis">
              <th style="padding-left: 50px; width: auto; min-width: 200px;">
                <span class="cursor-pointer d-inline-flex align-center gap-1" @click="sortKey = 'domain'; sortDir = sortDir === 'asc' ? 'desc' : 'asc'">Domain <VIcon size="16" :icon="sortKey === 'domain' ? (sortDir === 'asc' ? 'bx-sort-up' : 'bx-sort-down') : 'bx-sort-alt-2'" class="text-disabled" /></span>
              </th>
              <th style="width: 90px;">Type</th>
              <th style="width: 140px;">Remark</th>
              <th style="width: 160px;">CDN</th>
              <th style="width: 90px;">Action</th>
            </tr>
          </thead>
          <tbody>
          <tr v-for="domain in getVisibleChildren(env)" :key="domain.id" class="table-row-hover">
            <td style="padding-left: 50px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
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
            <td colspan="5" class="text-center text-medium-emphasis pa-4">No domains</td>
          </tr>
          </tbody>
        </VTable>
      </template>
      <VCardText v-if="!loading && !domains.length" class="text-center text-medium-emphasis pa-6">
        No domains configured
      </VCardText>
    </VCard>

    <!-- Import Dialog -->
    <VDialog v-model="isImportDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Import Domains</VCardTitle>
        </VCardItem>
        <VCardText>
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
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isImportDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!importFile" :loading="loading" @click="confirmImport">Import</VBtn>
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
            <VSelect v-model="newDomain.type" label="Type" :items="['web', 'admin', 'callback', 'api']" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newDomain.remark" label="Remark" density="comfortable" variant="outlined" />
            <VTextField v-model="newDomain.cdn" label="CDN" density="comfortable" variant="outlined" />
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
        <VCardItem>
          <VCardTitle>Edit Domain</VCardTitle>
          <VBtn icon variant="text" @click="isEditDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VForm ref="editFormRef">
            <VTextField v-model="editingItem.domain" label="Domain" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Domain is required']" />
            <VSelect v-model="editingItem.type" label="Type" :items="['web', 'admin', 'callback', 'api']" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.remark" label="Remark" density="comfortable" variant="outlined" />
            <VTextField v-model="editingItem.cdn" label="CDN" density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="loading" @click="saveEdit">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardItem>
          <VCardTitle>Remove Domain</VCardTitle>
          <VBtn icon variant="text" @click="isDeleteDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
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
