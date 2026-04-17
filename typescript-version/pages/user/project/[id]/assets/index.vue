<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const name = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value)?.name || 'Unknown Project')

const searchQuery = ref('')
const itemsPerPage = ref(10)
const isAddDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const editingItem = ref<any>(null)
const isDeleteDialogVisible = ref(false)
const addFormRef = ref<any>(null)
const deletingItem = ref<any>(null)

const newDomain = ref({ domain: '', env: '', type: '', remark: '' })

const domains = ref([
  { id: 1, domain: 'prod.dashboard.jhdevops.com', env: 'prod', type: 'web', remark: 'Production entry' },
  { id: 2, domain: 'uat.dashboard.jhdevops.com', env: 'uat', type: 'web', remark: 'UAT testing' },
  { id: 3, domain: 'test.dashboard.jhdevops.com', env: 'test', type: 'web', remark: 'Test environment' },
  { id: 4, domain: 'dev.dashboard.jhdevops.com', env: 'dev', type: 'web', remark: 'Development' },
  { id: 5, domain: 'prod.admin.jhdevops.com', env: 'prod', type: 'admin', remark: 'Admin panel' },
  { id: 6, domain: 'uat.admin.jhdevops.com', env: 'uat', type: 'admin', remark: 'Admin UAT' },
  { id: 7, domain: 'prod.callback.jhdevops.com', env: 'prod', type: 'callback', remark: 'Production callback' },
  { id: 8, domain: 'uat.callback.jhdevops.com', env: 'uat', type: 'callback', remark: 'Callback UAT' },
  { id: 9, domain: 'prod.api.jhdevops.com', env: 'prod', type: 'api', remark: 'Production API' },
  { id: 10, domain: 'uat.api.jhdevops.com', env: 'uat', type: 'api', remark: 'UAT API' },
])

const filteredDomains = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return domains.value.filter(d => !query || d.domain.toLowerCase().includes(query) || d.env.toLowerCase().includes(query) || d.remark.toLowerCase().includes(query))
})

const authStore = useAuthStore()

const canViewSensitive = computed(() => {
  const role = authStore.loginRole
  return ['admin', 'devops', 'leader'].includes(role || '')
})

const visibleDomains = computed(() => {
  if (!authStore.isReady) return filteredDomains.value
  return filteredDomains.value.filter(d => {
    if (d.env === 'prod' && (d.type === 'callback' || d.type === 'api') && !canViewSensitive.value) return false
    return true
  })
})

const envColor = (env: string) => ({ prod: 'success', uat: 'warning', test: 'info', dev: 'secondary' }[env] || 'grey')
const envLabel = (env: string) => ({ prod: 'Production', uat: 'UAT', test: 'Test', dev: 'Development' }[env] || env)

const headers = [
  { title: 'Domain', key: 'domain', sortable: true },
  { title: 'Environment', key: 'env', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Remark', key: 'remark', sortable: true },
  { title: 'Action', key: 'actions', sortable: false },
]

function addDomain() {
  addFormRef.value?.validate().then(({ valid }: any) => {
    if (!valid) return
    const newId = Math.max(...domains.value.map(d => d.id), 0) + 1
    domains.value.push({ ...newDomain.value, id: newId })
    newDomain.value = { domain: '', env: '', type: '', remark: '' }
    isAddDialogVisible.value = false
  })
}

function confirmDelete() {
  if (deletingItem.value) {
    domains.value = domains.value.filter(d => d.id !== deletingItem.value.id)
  }
  isDeleteDialogVisible.value = false
}

function openEditDialog(item: any) {
  editingItem.value = { ...item }
  isEditDialogVisible.value = true
}

function saveEdit() {
  if (editingItem.value) {
    const idx = domains.value.findIndex(d => d.id === editingItem.value.id)
    if (idx !== -1) domains.value[idx] = { ...editingItem.value }
    isEditDialogVisible.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div><h4 class="text-h4">{{ name }} - Domain</h4></div>
      <VBtn prepend-icon="bx-plus" color="primary" size="small" @click="isAddDialogVisible = true">Add Domain</VBtn>
    </div>

    <VCard>
      <VCardText>
        <VTextField v-model="searchQuery" placeholder="Search" prepend-inner-icon="bx-search" density="compact" hide-details variant="outlined" style="max-inline-size: 280px;" />
      </VCardText>
      <VDivider />
      <VDataTable :headers="headers" :items="visibleDomains" :items-per-page="itemsPerPage" class="text-no-wrap">
        <template #item.domain="{ item }">
          <div class="d-flex align-center gap-x-3">
            <VAvatar variant="tonal" color="primary" rounded size="34"><VIcon icon="bx-globe" size="18" /></VAvatar>
            <span class="font-weight-medium">{{ item.domain }}</span>
          </div>
        </template>
        <template #item.env="{ item }">
          <VChip variant="tonal" :color="envColor(item.env)" size="small" label>{{ envLabel(item.env) }}</VChip>
        </template>
        <template #item.type="{ item }">
          <VChip variant="tonal" color="primary" size="small" label>{{ item.type }}</VChip>
        </template>
        <template #item.remark="{ item }">
          <span class="text-body-1">{{ item.remark || '-' }}</span>
        </template>
        <template #item.actions="{ item }">
          <IconBtn @click="openEditDialog(item)"><VIcon icon="bx-edit" /></IconBtn>
          <IconBtn color="error" @click="deletingItem = item; isDeleteDialogVisible = true"><VIcon icon="bx-trash" /></IconBtn>
        </template>
      </VDataTable>
    </VCard>

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
            <VSelect v-model="editingItem.env" label="Environment" :items="['prod', 'uat', 'test', 'dev']" density="comfortable" class="mb-3" variant="outlined" />
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
