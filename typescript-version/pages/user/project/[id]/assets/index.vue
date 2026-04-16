<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const name = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value)?.name || 'Unknown Project')

const searchQuery = ref('')
const itemsPerPage = ref(10)
const isAddDialogVisible = ref(false)
const isDeleteDialogVisible = ref(false)
const deletingDomain = ref<any>(null)

const newDomain = ref({ domain: '', usage: '', remark: '' })

const domains = ref([
  { id: 1, domain: 'dashboard.jhdevops.com', usage: 'Production', remark: 'Main dashboard entry' },
  { id: 2, domain: 'api.jhdevops.com', usage: 'API', remark: 'Backend API gateway' },
  { id: 3, domain: 'staging.jhdevops.com', usage: 'Staging', remark: 'Staging environment' },
  { id: 4, domain: 'cdn.jhdevops.com', usage: 'CDN', remark: 'Static assets delivery' },
])

const filteredDomains = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return domains.value.filter(d => !query || d.domain.toLowerCase().includes(query) || d.usage.toLowerCase().includes(query) || d.remark.toLowerCase().includes(query))
})

const headers = [
  { title: 'Domain', key: 'domain', sortable: true },
  { title: 'Usage', key: 'usage', sortable: true },
  { title: 'Remark', key: 'remark', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

function addDomain() {
  if (!newDomain.value.domain) return
  const newId = Math.max(...domains.value.map(d => d.id), 0) + 1
  domains.value.push({ ...newDomain.value, id: newId })
  newDomain.value = { domain: '', usage: '', remark: '' }
  isAddDialogVisible.value = false
}

function confirmDelete() {
  if (deletingDomain.value) {
    domains.value = domains.value.filter(d => d.id !== deletingDomain.value.id)
  }
  isDeleteDialogVisible.value = false
}
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h4 class="text-h4">{{ name }} - Asset</h4>
      </div>
      <VBtn prepend-icon="bx-plus" color="primary" @click="isAddDialogVisible = true">Add Domain</VBtn>
    </div>

    <VCard>
      <VDataTable :headers="headers" :items="domains" :items-per-page="itemsPerPage" class="text-no-wrap">
        <template #item.domain="{ item }">
          <div class="d-flex align-center gap-x-3">
            <VAvatar variant="tonal" color="primary" rounded size="34">
              <VIcon icon="bx-globe" size="18" />
            </VAvatar>
            <span class="font-weight-medium">{{ item.domain }}</span>
          </div>
        </template>
        <template #item.usage="{ item }">
          <VChip variant="tonal" :color="item.usage === 'Production' ? 'success' : item.usage === 'API' ? 'info' : item.usage === 'Staging' ? 'warning' : 'secondary'" size="small" label>{{ item.usage }}</VChip>
        </template>
        <template #item.remark="{ item }">
          <span class="text-body-1">{{ item.remark }}</span>
        </template>
        <template #item.actions="{ item }">
          <IconBtn @click="deletingDomain = item; isDeleteDialogVisible = true"><VIcon icon="bx-trash" /></IconBtn>
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
          <VTextField v-model="newDomain.domain" label="Domain" placeholder="example.com" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="newDomain.usage" label="Usage" :items="['Production', 'API', 'Staging', 'CDN', 'Other']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newDomain.remark" label="Remark" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="addDomain">Add</VBtn>
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
        <VCardText>Are you sure you want to remove <strong>{{ deletingDomain?.domain }}</strong>?</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Remove</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
