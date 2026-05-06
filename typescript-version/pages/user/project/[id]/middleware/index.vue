<script lang="ts">definePageMeta({ middleware: ["user-project-guard"] })</script>
<script setup lang="ts">
import { userConsoleMiddlewareService } from '~/services/api'

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const authStore = useAuthStore()

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

const canManage = computed(() => {
  const role = authStore.role || ''
  const pr = myProjectRole.value
  if (['sys_admin', 'admin', 'devops'].includes(role)) return true
  if (['Administrator', 'DevOps'].includes(pr)) return true
  return false
})
const name = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value)?.name || 'Unknown Project')

const expandedRows = ref<string[]>([])
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const storageKey = computed(() => `middleware-expanded-${projectId.value}`)

// Bulk edit
const selectedMiddlewares = ref<string[]>([])
const allSelected = computed(() => envList.value.every(e => e.children.length > 0 ? e.children.every(m => selectedMiddlewares.value.includes(m.id)) : true) && selectedMiddlewares.value.length > 0)
const toggleSelectAll = () => {
  if (allSelected.value) { selectedMiddlewares.value = [] }
  else { selectedMiddlewares.value = middlewares.value.map((m: any) => m.id) }
}
const toggleSelect = (id: string) => {
  const i = selectedMiddlewares.value.indexOf(id)
  if (i >= 0) selectedMiddlewares.value.splice(i, 1)
  else selectedMiddlewares.value.push(id)
}
const isBulkEditDialogVisible = ref(false)
const bulkForm = ref({ type: '', protocol: '', remark: '' })

async function confirmBulkEdit() {
  try {
    const fields: any = {}
    if (bulkForm.value.type) fields.type = bulkForm.value.type
    if (bulkForm.value.protocol) fields.protocol = bulkForm.value.protocol
    if (bulkForm.value.remark) fields.remark = bulkForm.value.remark
    if (!Object.keys(fields).length) return
    await userConsoleMiddlewareService.bulkUpdate({ projectId: projectId.value, ids: selectedMiddlewares.value, ...fields })
    isBulkEditDialogVisible.value = false
    selectedMiddlewares.value = []
    bulkForm.value = { type: '', protocol: '', remark: '' }
    await fetchMiddlewares()
    snackbar.value = { show: true, text: 'Bulk updated', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed', color: 'error' }
  }
}

function loadExpandedState() {
  if (import.meta.client) {
    const saved = localStorage.getItem(storageKey.value)
    if (saved) {
      try { expandedRows.value = JSON.parse(saved) } catch { /* ignore */ }
    }
  }
}

watch(() => expandedRows.value, (val) => {
  if (import.meta.client) localStorage.setItem(storageKey.value, JSON.stringify(val))
}, { deep: true })

onMounted(loadExpandedState)

const toggleExpand = (env: string) => {
  if (expandedRows.value.includes(env)) {
    const i = expandedRows.value.indexOf(env); expandedRows.value.splice(i, 1)
  } else {
    expandedRows.value.push(env)
  }
}

const isRowExpanded = (env: string) => expandedRows.value.includes(env)

const envColor = (env: string) => ({ prod: 'success', uat: 'warning', test: 'info', dev: 'secondary' }[env] || 'grey')
const envIcon = (env: string) => ({ prod: 'bx-check-circle', uat: 'bx-test-tube', test: 'bx-test-tube', dev: 'bx-code' }[env] || 'bx-globe')

// Middlewares from API
const middlewares = ref<any[]>([])

const envList = computed(() => {
  const envs = ['prod', 'uat', 'test', 'dev']
  return envs.map(env => ({ env, children: middlewares.value.filter(m => m.env === env) }))
})

const emptyAddr = (v: string) => v || '-'

// Fetch
async function fetchMiddlewares() {
  loading.value = true
  try {
    const res: any = await userConsoleMiddlewareService.list(projectId.value)
    middlewares.value = Array.isArray(res) ? res : res?.data || []
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to load middlewares', color: 'error' }
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchMyRole(); fetchMiddlewares() })

// Add
const isAddDialogVisible = ref(false)
const addFormRef = ref<any>(null)
const newMiddleware = ref({ name: '', env: '', type: '', protocol: '', externalAddr: '', internalAddr: '', svcAddr: '', remark: '' })

async function addMiddleware() {
  addFormRef.value?.validate().then(async ({ valid }: any) => {
    if (!valid) return
    try {
      await userConsoleMiddlewareService.create({ ...newMiddleware.value, projectId: projectId.value })
      newMiddleware.value = { name: '', env: '', type: '', protocol: '', externalAddr: '', internalAddr: '', svcAddr: '', remark: '' }
      isAddDialogVisible.value = false
      await fetchMiddlewares()
      snackbar.value = { show: true, text: 'Middleware added', color: 'success' }
    } catch (e: any) {
      snackbar.value = { show: true, text: e.message || 'Failed to add middleware', color: 'error' }
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
    await userConsoleMiddlewareService.update(editingItem.value.id, {
      projectId: projectId.value,
      name: editingItem.value.name,
      type: editingItem.value.type,
      protocol: editingItem.value.protocol,
      externalAddr: editingItem.value.externalAddr,
      internalAddr: editingItem.value.internalAddr,
      svcAddr: editingItem.value.svcAddr,
      remark: editingItem.value.remark,
    })
    isEditDialogVisible.value = false
    await fetchMiddlewares()
    snackbar.value = { show: true, text: 'Middleware updated', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to update middleware', color: 'error' }
  }
}

// Delete
const isDeleteDialogVisible = ref(false)
const deletingItem = ref<any>(null)

async function confirmDelete() {
  if (!deletingItem.value) return
  try {
    await userConsoleMiddlewareService.delete(deletingItem.value.id, projectId.value)
    isDeleteDialogVisible.value = false
    await fetchMiddlewares()
    snackbar.value = { show: true, text: 'Middleware removed', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to delete middleware', color: 'error' }
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
      await userConsoleMiddlewareService.importMiddlewares({ projectId: projectId.value, middlewares: data })
      importFile.value = null
      isImportDialogVisible.value = false
      await fetchMiddlewares()
      snackbar.value = { show: true, text: `Imported ${data.length} middlewares`, color: 'success' }
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: 'Invalid JSON file', color: 'error' }
  }
}

// Export
function exportMiddlewares() {
  const data = middlewares.value.map(m => ({
    name: m.name, env: m.env, protocol: m.protocol,
    externalAddr: m.externalAddr || '', internalAddr: m.internalAddr || '',
    svcAddr: m.svcAddr || '', remark: m.remark,
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `middlewares-${name.value.replace(/\s+/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <VCard>
      <VCardText class="d-flex justify-end align-center flex-wrap gap-3">
        <div class="d-flex align-center gap-3">
          <VBtn prepend-icon="bx-plus" color="primary" size="small" :disabled="!canManage" @click="isAddDialogVisible = true">Add Middleware</VBtn>
          <VBtn prepend-icon="bx-download" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="isImportDialogVisible = true">Import</VBtn>
          <VBtn prepend-icon="bx-upload" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="exportMiddlewares">Export</VBtn>
          <VBtn prepend-icon="bx-edit" variant="tonal" color="warning" size="small" :disabled="!canManage || !selectedMiddlewares.length" @click="isBulkEditDialogVisible = true">Edit ({{ selectedMiddlewares.length }})</VBtn>
        </div>
      </VCardText>
      <VDivider />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="middlewares.length" class="text-no-wrap" hover density="compact" style="table-layout: fixed; width: 100%;">
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th style="padding-left: 50px; width: 40px;"><VCheckbox :model-value="allSelected" hide-details density="compact" @click="toggleSelectAll" /></th>
            <th>Name</th>
            <th style="width: 500px;">Address</th>
            <th style="width: 90px;">Protocol</th>
            <th style="width: 90px;">Type</th>
            <th style="width: 140px;">Remark</th>
            <th style="width: 90px;">Action</th>
          </tr>
        </thead>
        <tbody>
        <template v-for="env in envList" :key="env.env">
          <tr class="cursor-pointer" @click="toggleExpand(env.env)" style="background: rgb(var(--v-theme-on-surface), 0.04);">
            <td style="padding-left: 50px;" colspan="7">
              <div class="d-flex align-center">
                <VIcon :icon="isRowExpanded(env.env) ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
                <VIcon :icon="envIcon(env.env)" :color="envColor(env.env)" size="20" class="me-2" />
                <span class="font-weight-bold text-body-1">{{ env.env.toUpperCase() }}</span>
                <VChip variant="tonal" :color="envColor(env.env)" size="x-small" label class="ms-2">{{ env.children.length }}</VChip>
              </div>
            </td>
          </tr>
          <template v-if="isRowExpanded(env.env)">
            <tr v-for="mw in env.children" :key="mw.id" class="table-row-hover">
              <td style="padding-left: 50px;"><VCheckbox :model-value="selectedMiddlewares.includes(mw.id)" hide-details density="compact" @click.stop="toggleSelect(mw.id)" /></td>
              <td style="padding-left: 50px;">
                <div class="d-flex align-center gap-x-2">
                  <VIcon icon="bx-cube" color="primary" size="18" />
                  <span class="font-weight-medium">{{ mw.name }}</span>
                </div>
              </td>
              <td style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <div class="d-flex flex-column text-body-2" style="line-height: 1.6;">
                  <span><span class="text-medium-emphasis font-weight-medium">ext:</span> {{ emptyAddr(mw.externalAddr) }}</span>
                  <span><span class="text-medium-emphasis font-weight-medium">int:</span> {{ emptyAddr(mw.internalAddr) }}</span>
                  <span><span class="text-medium-emphasis font-weight-medium">svc:</span> {{ emptyAddr(mw.svcAddr) }}</span>
                </div>
              </td>
              <td><VChip variant="tonal" color="primary" size="small" label>{{ mw.protocol || '-' }}</VChip></td>
              <td><VChip variant="tonal" :color="mw.type === 'cloud' ? 'info' : 'success'" size="small" label>{{ mw.type || '-' }}</VChip></td>
              <td><span class="text-body-1">{{ mw.remark || '-' }}</span></td>
              <td>
                <div class="d-flex gap-1">
                  <IconBtn size="small" :disabled="!canManage" @click="openEditDialog(mw)"><VIcon icon="bx-edit" size="18" /></IconBtn>
                  <IconBtn size="small" color="error" :disabled="!canManage" @click="deletingItem = mw; isDeleteDialogVisible = true"><VIcon icon="bx-trash" size="18" /></IconBtn>
                </div>
              </td>
            </tr>
            <tr v-if="!env.children.length">
              <td colspan="7" class="text-center text-medium-emphasis pa-4">-</td>
            </tr>
          </template>
        </template>
        </tbody>
      </VTable>
      <VCardText v-if="!loading && !middlewares.length" />
    </VCard>

    <!-- Import Dialog -->
    <VDialog v-model="isImportDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Import Middlewares</VCardTitle>
          <VBtn icon variant="text" @click="isImportDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
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
            <code class="text-caption">[{"name": "nginx", "env": "prod", "externalAddr": "", "internalAddr": "10.0.1.10", "svcAddr": "nginx.prod.svc", "protocol": "HTTP", "remark": ""}]</code>
          </div>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isImportDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!importFile" :loading="loading" @click="confirmImport">Import</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Add Middleware Dialog -->
    <VDialog v-model="isAddDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Add Middleware</VCardTitle>
          <VBtn icon variant="text" @click="isAddDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VForm ref="addFormRef">
            <VTextField v-model="newMiddleware.name" label="Name" placeholder="nginx-proxy" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Name is required']" />
            <VSelect v-model="newMiddleware.env" label="Environment" :items="['prod', 'uat', 'test', 'dev']" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Environment is required']" />
            <VSelect v-model="newMiddleware.type" label="Type" :items="['self-host', 'cloud']" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Type is required']" />
            <VTextField v-model="newMiddleware.protocol" label="Protocol" placeholder="HTTP/HTTPS" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newMiddleware.externalAddr" label="External Address" placeholder="proxy.jhdevops.com" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newMiddleware.internalAddr" label="Internal Address" placeholder="10.0.1.10" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newMiddleware.svcAddr" label="Service Address" placeholder="nginx.prod.svc.cluster.local" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newMiddleware.remark" label="Remark" density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="loading" @click="addMiddleware">Add</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Middleware Dialog -->
    <VDialog v-model="isEditDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Edit Middleware</VCardTitle>
          <VBtn icon variant="text" @click="isEditDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VForm ref="editFormRef">
            <VTextField v-model="editingItem.name" label="Name" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Name is required']" />
            <VSelect v-model="editingItem.type" label="Type" :items="['self-host', 'cloud']" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.protocol" label="Protocol" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.externalAddr" label="External Address" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.internalAddr" label="Internal Address" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.svcAddr" label="Service Address" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.remark" label="Remark" density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="loading" @click="saveEdit">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bulk Edit Dialog -->
    <VDialog v-model="isBulkEditDialogVisible" max-width="450">
      <VCard>
        <VCardItem>
          <VCardTitle>Bulk Edit Middlewares ({{ selectedMiddlewares.length }})</VCardTitle>
          <VBtn icon variant="text" @click="isBulkEditDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VSelect v-model="bulkForm.type" label="Type" :items="['self-host', 'cloud']" density="comfortable" class="mb-3" variant="outlined" clearable />
          <VTextField v-model="bulkForm.protocol" label="Protocol" placeholder="HTTP/HTTPS" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="bulkForm.remark" label="Remark" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isBulkEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="loading" @click="confirmBulkEdit">Update</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardItem>
          <VCardTitle>Remove Middleware</VCardTitle>
        </VCardItem>
        <VCardText>Are you sure you want to remove <strong>{{ deletingItem?.name }}</strong>?</VCardText>
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
