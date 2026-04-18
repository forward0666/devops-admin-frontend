<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const name = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value)?.name || 'Unknown Project')

const searchQuery = ref('')
const isExpandAll = ref<boolean | null>(null)
const expandedRows = ref<number[]>([])

const storageKey = computed(() => `domain-expanded-${projectId.value}`)

function loadExpandedState() {
  if (import.meta.client) {
    const saved = localStorage.getItem(storageKey.value)
    if (saved) {
      try {
        const ids = JSON.parse(saved)
        expandedRows.value = JSON.parse(saved)
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

const toggleExpand = (item: any) => {
  if (expandedRows.value.includes(item.id)) { const i = expandedRows.value.indexOf(item.id); expandedRows.value.splice(i, 1) }
  else expandedRows.value.push(item.id)
}

const isRowExpanded = (item: any) => {
  if (isExpandAll.value === true) return true
  if (isExpandAll.value === false) return false
  return expandedRows.value.includes(item.id)
}

const authStore = useAuthStore()
const canViewSensitive = computed(() => authStore.isReady && ['admin', 'devops', 'leader'].includes(authStore.loginRole || ''))
const canManage = computed(() => authStore.isReady && ['sys_admin', 'admin', 'devops'].includes(authStore.loginRole || ''))

const envColor = (env: string) => ({ prod: 'success', uat: 'warning', test: 'info', dev: 'secondary' }[env] || 'grey')
const envIcon = (env: string) => ({ prod: 'bx-check-circle', uat: 'bx-test-tube', test: 'bx-test-tube', dev: 'bx-code' }[env] || 'bx-globe')

const domains = ref([
  { id: 1, env: 'prod', type: 'environment', children: [
    { id: 11, domain: 'prod.dashboard.jhdevops.com', env: 'prod', type: 'web', remark: 'Production entry' },
    { id: 12, domain: 'prod.admin.jhdevops.com', env: 'prod', type: 'admin', remark: 'Admin panel' },
    { id: 13, domain: 'prod.callback.jhdevops.com', env: 'prod', type: 'callback', remark: 'Production callback' },
    { id: 14, domain: 'prod.api.jhdevops.com', env: 'prod', type: 'api', remark: 'Production API' },
  ]},
  { id: 2, env: 'uat', type: 'environment', children: [
    { id: 21, domain: 'uat.dashboard.jhdevops.com', env: 'uat', type: 'web', remark: 'UAT testing' },
    { id: 22, domain: 'uat.admin.jhdevops.com', env: 'uat', type: 'admin', remark: 'Admin UAT' },
    { id: 23, domain: 'uat.callback.jhdevops.com', env: 'uat', type: 'callback', remark: 'Callback UAT' },
    { id: 24, domain: 'uat.api.jhdevops.com', env: 'uat', type: 'api', remark: 'UAT API' },
  ]},
  { id: 3, env: 'test', type: 'environment', children: [
    { id: 31, domain: 'test.dashboard.jhdevops.com', env: 'test', type: 'web', remark: 'Test environment' },
    { id: 32, domain: 'test.admin.jhdevops.com', env: 'test', type: 'admin', remark: 'Admin Test' },
    { id: 33, domain: 'test.callback.jhdevops.com', env: 'test', type: 'callback', remark: 'Callback Test' },
    { id: 34, domain: 'test.api.jhdevops.com', env: 'test', type: 'api', remark: 'Test API' },
  ]},
  { id: 4, env: 'dev', type: 'environment', children: [
    { id: 41, domain: 'dev.dashboard.jhdevops.com', env: 'dev', type: 'web', remark: 'Development' },
    { id: 42, domain: 'dev.admin.jhdevops.com', env: 'dev', type: 'admin', remark: 'Admin Dev' },
    { id: 43, domain: 'dev.callback.jhdevops.com', env: 'dev', type: 'callback', remark: 'Callback Dev' },
    { id: 44, domain: 'dev.api.jhdevops.com', env: 'dev', type: 'api', remark: 'Dev API' },
  ]},
])

const flatDomains = computed(() => {
  const result: any[] = []
  const flatten = (items: any[], depth: number, parentExpanded: boolean) => {
    items.forEach(item => {
      if (!parentExpanded) return
      const expanded = isExpandAll.value === true || isRowExpanded(item)
      result.push({ ...item, depth })
      if (item.children?.length) {
        const visibleChildren = item.children.filter((c: any) => {
          if (c.env === 'prod' && (c.type === 'callback' || c.type === 'api' || c.type === 'admin') && !canViewSensitive.value) return false
          return true
        })
        flatten(visibleChildren, depth + 1, expanded)
      }
    })
  }
  flatten(domains.value, 0, true)
  return result
})

const filteredDomains = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return flatDomains.value.filter(d => !query || (d.domain || d.env || '').toLowerCase().includes(query) || (d.remark || '').toLowerCase().includes(query))
})

const headers = [
  { title: 'Domain / Environment', key: 'name' },
  { title: 'Type', key: 'type' },
  { title: 'Remark', key: 'remark' },
  { title: 'Action', key: 'actions', sortable: false },
]

const typeColor = (type: string) => ({ web: 'primary', admin: 'warning', callback: 'info', api: 'success' }[type] || 'grey')

function getVisibleChildren(env: any) {
  return env.children.filter((c: any) => {
    if (c.env === 'prod' && (c.type === 'callback' || c.type === 'api' || c.type === 'admin') && !canViewSensitive.value) return false
    return true
  })
}

const isAddDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const isDeleteDialogVisible = ref(false)
const addFormRef = ref<any>(null)
const editingItem = ref<any>(null)
const deletingItem = ref<any>(null)
const newDomain = ref({ domain: '', env: '', type: '', remark: '' })

function addDomain() {
  addFormRef.value?.validate().then(({ valid }: any) => {
    if (!valid) return
    const newId = Date.now()
    const newItem = { id: newId, domain: newDomain.value.domain, env: newDomain.value.env, type: newDomain.value.type, remark: newDomain.value.remark }
    const parent = domains.value.find(d => d.env === newDomain.value.env)
    if (parent) parent.children.push(newItem)
    newDomain.value = { domain: '', env: '', type: '', remark: '' }
    isAddDialogVisible.value = false
  })
}

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

function confirmImport() {
  if (!importFile.value) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.domain && row.env) {
            const parent = domains.value.find(d => d.env === row.env)
            if (parent) {
              parent.children.push({
                id: Date.now() + Math.random(),
                domain: row.domain,
                env: row.env,
                type: row.type || 'web',
                remark: row.remark || '',
              })
            }
          }
        })
      }
    } catch {
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(importFile.value)
  importFile.value = null
  isImportDialogVisible.value = false
}

function exportDomains() {
  const data: any[] = []
  domains.value.forEach(env => {
    env.children.forEach(c => data.push({ domain: c.domain, env: c.env, type: c.type, remark: c.remark }))
  })
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `domains-${name.value.replace(/\s+/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function openEditDialog(item: any) {
  editingItem.value = { ...item }
  isEditDialogVisible.value = true
}

function saveEdit() {
  if (editingItem.value) {
    domains.value.forEach(env => {
      const idx = env.children.findIndex((c: any) => c.id === editingItem.value.id)
      if (idx !== -1) env.children[idx] = { ...editingItem.value }
    })
    isEditDialogVisible.value = false
  }
}

function confirmDelete() {
  if (deletingItem.value) {
    domains.value.forEach(env => {
      env.children = env.children.filter((c: any) => c.id !== deletingItem.value.id)
    })
  }
  isDeleteDialogVisible.value = false
}
</script>

<template>
  <div>
    <VCard>
      <VCardText class="d-flex justify-space-between align-center flex-wrap gap-3">
        <h4 class="text-h4">Domain</h4>
        <div class="d-flex align-center gap-3">
          <VBtn prepend-icon="bx-expand-alt" variant="tonal" color="secondary" size="small" @click="isExpandAll = true">Expand</VBtn>
          <VBtn prepend-icon="bx-collapse-alt" variant="tonal" color="secondary" size="small" @click="isExpandAll = false; expandedRows.value = []">Collapse</VBtn>
          <VBtn prepend-icon="bx-plus" color="primary" size="small" :disabled="!canManage" @click="isAddDialogVisible = true">Add Domain</VBtn>
          <VBtn prepend-icon="bx-upload" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="isImportDialogVisible = true">Import</VBtn>
          <VBtn prepend-icon="bx-download" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="exportDomains">Export</VBtn>
        </div>
      </VCardText>
      <VDivider />
        <template v-for="env in domains" :key="env.id">
          <div class="d-flex align-center cursor-pointer pa-3" @click="toggleExpand(env)">
            <VIcon :icon="isRowExpanded(env) ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
            <VIcon :icon="envIcon(env.env)" :color="envColor(env.env)" size="20" class="me-2" />
            <span class="font-weight-bold text-body-1">{{ env.env.toUpperCase() }}</span>
            <VChip variant="tonal" :color="envColor(env.env)" size="x-small" label class="ms-2">{{ getVisibleChildren(env).length }}</VChip>
          </div>
          <VTable v-show="isExpandAll === true || isRowExpanded(env)" class="text-no-wrap" hover>
            <thead>
              <tr class="text-caption text-medium-emphasis">
                <th style="padding-left: 50px;">Domain</th>
                <th>Type</th>
                <th>Remark</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
            <tr v-for="domain in getVisibleChildren(env)" :key="domain.id" class="table-row-hover">
              <td style="padding-left: 50px;">
                <div class="d-flex align-center gap-x-2">
                  <VIcon icon="bx-globe" color="primary" size="18" />
                  <span class="font-weight-medium">{{ domain.domain }}</span>
                </div>
              </td>
              <td><VChip variant="tonal" :color="typeColor(domain.type)" size="small" label>{{ domain.type }}</VChip></td>
              <td><span class="text-body-1">{{ domain.remark || '-' }}</span></td>
              <td>
                <div class="d-flex gap-1">
                  <IconBtn size="small" :disabled="!canManage" @click="openEditDialog(domain)"><VIcon icon="bx-edit" size="18" /></IconBtn>
                  <IconBtn size="small" color="error" :disabled="!canManage" @click="deletingItem = domain; isDeleteDialogVisible = true"><VIcon icon="bx-trash" size="18" /></IconBtn>
                </div>
              </td>
            </tr>
            <tr v-if="!env.children.length">
              <td colspan="4" class="text-center text-medium-emphasis pa-4">No domains</td>
            </tr>
            </tbody>
          </VTable>
        </template>
    </VCard>

    <!-- Import Dialog -->
    <VDialog v-model="isImportDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Import Domains</VCardTitle>
          <VBtn icon variant="text" @click="isImportDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <div
            class="drop-zone pa-8 text-center border rounded-lg"
            :class="isDragging ? 'border-primary bg-primary-lighten-5' : 'border-dashed border-medium-emphasis'"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleFileDrop"
            @click="$refs.fileInput?.click()"
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
            <code class="text-caption">[{"domain": "prod.example.com", "env": "prod", "type": "web", "remark": ""}]</code>
          </div>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isImportDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!importFile" @click="confirmImport">Import</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Add Domain Dialog -->
    <VDialog v-model="isAddDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Add Domain</VCardTitle>
          <VBtn icon variant="text" @click="isAddDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VForm ref="addFormRef">
            <VTextField v-model="newDomain.domain" label="Domain" placeholder="prod.example.com" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Domain is required']" />
            <VSelect v-model="newDomain.env" label="Environment" :items="['prod', 'uat', 'test', 'dev']" density="comfortable" class="mb-3" variant="outlined" />
            <VSelect v-model="newDomain.type" label="Type" :items="['web', 'admin', 'callback', 'api']" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newDomain.remark" label="Remark" density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="addDomain">Add</VBtn>
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
          <VForm ref="addFormRef">
            <VTextField v-model="editingItem.domain" label="Domain" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Domain is required']" />
            <VSelect v-model="editingItem.type" label="Type" :items="['web', 'admin', 'callback', 'api']" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.remark" label="Remark" density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveEdit">Save</VBtn>
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
          <VBtn color="error" @click="confirmDelete">Remove</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
