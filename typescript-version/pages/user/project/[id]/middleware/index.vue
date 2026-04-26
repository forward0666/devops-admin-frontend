<script lang="ts">definePageMeta({ middleware: ["user-project-guard"] })</script>
<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const authStore = useAuthStore()
const canManage = computed(() => ['sys_admin', 'admin', 'devops'].includes(authStore.role || ''))
const name = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value)?.name || 'Unknown Project')

const expandedRows = ref<number[]>([])

const storageKey = computed(() => `middleware-expanded-${projectId.value}`)

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

const toggleExpand = (item: any) => {
  if (expandedRows.value.includes(item.id)) { const i = expandedRows.value.indexOf(item.id); expandedRows.value.splice(i, 1) }
  else expandedRows.value.push(item.id)
}

const isRowExpanded = (item: any) => {
  return expandedRows.value.includes(item.id)
}

const envColor = (env: string) => ({ prod: 'success', uat: 'warning', test: 'info', dev: 'secondary' }[env] || 'grey')
const envIcon = (env: string) => ({ prod: 'bx-check-circle', uat: 'bx-test-tube', test: 'bx-test-tube', dev: 'bx-code' }[env] || 'bx-globe')

const middlewares = ref([
  { id: 1, env: 'prod', type: 'environment', children: [
    { id: 11, name: 'nginx-proxy', env: 'prod', address: { external: 'proxy.jhdevops.com', internal: '10.0.1.10', svc: 'nginx-proxy.prod.svc.cluster.local' }, protocol: 'HTTP/HTTPS', remark: 'Main reverse proxy' },
    { id: 12, name: 'redis-cache', env: 'prod', address: { external: '', internal: '10.0.1.20', svc: 'redis-cache.prod.svc.cluster.local' }, protocol: 'TCP', remark: 'Session cache' },
    { id: 13, name: 'rabbitmq', env: 'prod', address: { external: '', internal: '10.0.1.30', svc: 'rabbitmq.prod.svc.cluster.local' }, protocol: 'AMQP', remark: 'Async messaging' },
  ]},
  { id: 2, env: 'uat', type: 'environment', children: [
    { id: 21, name: 'nginx-proxy', env: 'uat', address: { external: 'proxy-uat.jhdevops.com', internal: '10.0.2.10', svc: 'nginx-proxy.uat.svc.cluster.local' }, protocol: 'HTTP/HTTPS', remark: 'UAT proxy' },
    { id: 22, name: 'redis-cache', env: 'uat', address: { external: '', internal: '10.0.2.20', svc: 'redis-cache.uat.svc.cluster.local' }, protocol: 'TCP', remark: 'UAT cache' },
  ]},
  { id: 3, env: 'test', type: 'environment', children: [
    { id: 31, name: 'nginx-proxy', env: 'test', address: { external: '', internal: '10.0.3.10', svc: 'nginx-proxy.test.svc.cluster.local' }, protocol: 'HTTP/HTTPS', remark: 'Test proxy' },
    { id: 32, name: 'redis-cache', env: 'test', address: { external: '', internal: '10.0.3.20', svc: 'redis-cache.test.svc.cluster.local' }, protocol: 'TCP', remark: 'Test cache' },
  ]},
  { id: 4, env: 'dev', type: 'environment', children: [
    { id: 41, name: 'nginx-proxy', env: 'dev', address: { external: '', internal: '10.0.4.10', svc: '' }, protocol: 'HTTP', remark: 'Dev proxy' },
    { id: 42, name: 'redis-cache', env: 'dev', address: { external: '', internal: '10.0.4.20', svc: '' }, protocol: 'TCP', remark: 'Dev cache' },
  ]},
])

const emptyAddr = (v: string) => v || '-'

const isAddDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const isDeleteDialogVisible = ref(false)
const addFormRef = ref<any>(null)
const editingItem = ref<any>(null)
const deletingItem = ref<any>(null)
const newMiddleware = ref({ name: '', env: '', protocol: '', external: '', internal: '', svc: '', remark: '' })

function addMiddleware() {
  addFormRef.value?.validate().then(({ valid }: any) => {
    if (!valid) return
    const newId = Date.now()
    const newItem = { id: newId, name: newMiddleware.value.name, env: newMiddleware.value.env, address: { external: newMiddleware.value.external, internal: newMiddleware.value.internal, svc: newMiddleware.value.svc }, protocol: newMiddleware.value.protocol, remark: newMiddleware.value.remark }
    const parent = middlewares.value.find(d => d.env === newMiddleware.value.env)
    if (parent) parent.children.push(newItem)
    newMiddleware.value = { name: '', env: '', protocol: '', external: '', internal: '', svc: '', remark: '' }
    isAddDialogVisible.value = false
  })
}

function openEditDialog(item: any) {
  editingItem.value = { ...item, external: item.address?.external || '', internal: item.address?.internal || '', svc: item.address?.svc || '' }
  isEditDialogVisible.value = true
}

function saveEdit() {
  if (editingItem.value) {
    middlewares.value.forEach(env => {
      const idx = env.children.findIndex((c: any) => c.id === editingItem.value.id)
      if (idx !== -1) {
        env.children[idx] = { ...editingItem.value, address: { external: editingItem.value.external, internal: editingItem.value.internal, svc: editingItem.value.svc } }
      }
    })
    isEditDialogVisible.value = false
  }
}

function confirmDelete() {
  if (deletingItem.value) {
    middlewares.value.forEach(env => {
      env.children = env.children.filter((c: any) => c.id !== deletingItem.value.id)
    })
  }
  isDeleteDialogVisible.value = false
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
          if (row.name && row.env) {
            const parent = middlewares.value.find(d => d.env === row.env)
            if (parent) {
              parent.children.push({
                id: Date.now() + Math.random(),
                name: row.name,
                env: row.env,
                address: { external: row.external || '', internal: row.internal || '', svc: row.svc || '' },
                protocol: row.protocol || '',
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

function exportMiddlewares() {
  const data: any[] = []
  middlewares.value.forEach(env => {
    env.children.forEach(c => data.push({ name: c.name, env: c.env, external: c.address?.external || '', internal: c.address?.internal || '', svc: c.address?.svc || '', protocol: c.protocol, remark: c.remark }))
  })
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
      <VCardText class="d-flex justify-space-between align-center flex-wrap gap-3">
        <h4 class="text-h4">Middleware</h4>
        <div class="d-flex align-center gap-3">
          <VBtn prepend-icon="bx-plus" color="primary" size="small" :disabled="!canManage" @click="isAddDialogVisible = true">Add Middleware</VBtn>
          <VBtn prepend-icon="bx-upload" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="isImportDialogVisible = true">Import</VBtn>
          <VBtn prepend-icon="bx-download" variant="tonal" color="secondary" size="small" :disabled="!canManage" @click="exportMiddlewares">Export</VBtn>
        </div>
      </VCardText>
      <VDivider />
        <template v-for="env in middlewares" :key="env.id">
          <div class="d-flex align-center cursor-pointer pa-3" @click="toggleExpand(env)">
            <VIcon :icon="isRowExpanded(env) ? 'bx-chevron-down' : 'bx-chevron-right'" size="18" class="me-2 text-medium-emphasis" />
            <VIcon :icon="envIcon(env.env)" :color="envColor(env.env)" size="20" class="me-2" />
            <span class="font-weight-bold text-body-1">{{ env.env.toUpperCase() }}</span>
            <VChip variant="tonal" :color="envColor(env.env)" size="x-small" label class="ms-2">{{ env.children.length }}</VChip>
          </div>
          <VTable v-show="isRowExpanded(env)" class="text-no-wrap" hover>
            <thead>
              <tr class="text-caption text-medium-emphasis">
                <th style="padding-left: 50px;">Name</th>
                <th style="min-width: 260px;">Address</th>
                <th>Protocol</th>
                <th>Remark</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
            <tr v-for="mw in env.children" :key="mw.id" class="table-row-hover">
              <td style="padding-left: 50px;">
                <div class="d-flex align-center gap-x-2">
                  <VIcon icon="bx-cube" color="primary" size="18" />
                  <span class="font-weight-medium">{{ mw.name }}</span>
                </div>
              </td>
              <td>
                <div class="d-flex flex-column text-body-2" style="line-height: 1.6;">
                  <span><span class="text-medium-emphasis font-weight-medium">external:</span> {{ emptyAddr(mw.address?.external) }}</span>
                  <span><span class="text-medium-emphasis font-weight-medium">internal:</span> {{ emptyAddr(mw.address?.internal) }}</span>
                  <span><span class="text-medium-emphasis font-weight-medium">svc:</span> {{ emptyAddr(mw.address?.svc) }}</span>
                </div>
              </td>
              <td><VChip variant="tonal" color="primary" size="small" label>{{ mw.protocol || '-' }}</VChip></td>
              <td><span class="text-body-1">{{ mw.remark || '-' }}</span></td>
              <td>
                <div class="d-flex gap-1">
                  <IconBtn size="small" :disabled="!canManage" @click="openEditDialog(mw)"><VIcon icon="bx-edit" size="18" /></IconBtn>
                  <IconBtn size="small" color="error" :disabled="!canManage" @click="deletingItem = mw; isDeleteDialogVisible = true"><VIcon icon="bx-trash" size="18" /></IconBtn>
                </div>
              </td>
            </tr>
            <tr v-if="!env.children.length">
              <td colspan="5" class="text-center text-medium-emphasis pa-4">No middleware</td>
            </tr>
            </tbody>
          </VTable>
        </template>
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
            <code class="text-caption">[{"name": "nginx", "env": "prod", "external": "", "internal": "10.0.1.10", "svc": "nginx.prod.svc", "protocol": "HTTP", "remark": ""}]</code>
          </div>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isImportDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!importFile" @click="confirmImport">Import</VBtn>
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
            <VSelect v-model="newMiddleware.env" label="Environment" :items="['prod', 'uat', 'test', 'dev']" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newMiddleware.protocol" label="Protocol" placeholder="HTTP/HTTPS" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newMiddleware.external" label="External Address" placeholder="proxy.jhdevops.com" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newMiddleware.internal" label="Internal Address" placeholder="10.0.1.10" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newMiddleware.svc" label="Service Address" placeholder="nginx.prod.svc.cluster.local" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="newMiddleware.remark" label="Remark" density="comfortable" variant="outlined" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="addMiddleware">Add</VBtn>
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
          <VForm ref="addFormRef">
            <VTextField v-model="editingItem.name" label="Name" density="comfortable" class="mb-3" variant="outlined" :rules="[v => !!v || 'Name is required']" />
            <VTextField v-model="editingItem.protocol" label="Protocol" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.external" label="External Address" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.internal" label="Internal Address" density="comfortable" class="mb-3" variant="outlined" />
            <VTextField v-model="editingItem.svc" label="Service Address" density="comfortable" class="mb-3" variant="outlined" />
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
          <VCardTitle>Remove Middleware</VCardTitle>
          <VBtn icon variant="text" @click="isDeleteDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>Are you sure you want to remove <strong>{{ deletingItem?.name }}</strong>?</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Remove</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
