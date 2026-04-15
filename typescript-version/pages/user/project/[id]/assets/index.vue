<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectNames: Record<string, string> = {
  '1': 'Dashboard Design',
  '2': 'BGC eCommerce App',
  '3': 'Falcon Logo Design',
  '4': 'Foodista Mobile App',
}

const name = computed(() => projectNames[projectId.value] || 'Unknown Project')

const assets = ref([
  { name: 'Design System', type: 'Figma', size: '24 MB', updated: '2024-01-15', icon: 'bx-palette', color: 'error' },
  { name: 'API Documentation', type: 'Markdown', size: '8 MB', updated: '2024-01-14', icon: 'bx-file', color: 'info' },
  { name: 'Source Code', type: 'Git Repository', size: '156 MB', updated: '2024-01-13', icon: 'bx-code-block', color: 'success' },
  { name: 'Test Reports', type: 'PDF', size: '12 MB', updated: '2024-01-12', icon: 'bx-file-pdf', color: 'warning' },
  { name: 'Database Schema', type: 'SQL', size: '3 MB', updated: '2024-01-11', icon: 'bx-data', color: 'primary' },
])
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">{{ name }} - Project Assets</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end">
        <VBtn prepend-icon="bx-upload" variant="tonal" color="secondary">Upload</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VDataTable :headers="[{ title: 'Name', key: 'name' }, { title: 'Type', key: 'type' }, { title: 'Size', key: 'size' }, { title: 'Updated', key: 'updated' }, { title: 'Actions', key: 'actions', sortable: false }]" :items="assets" :items-per-page="10" class="text-no-wrap">
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-x-3">
            <VAvatar variant="tonal" :color="item.color" rounded size="36">
              <VIcon :icon="item.icon" size="20" />
            </VAvatar>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
        <template #item.actions>
          <IconBtn size="small"><VIcon icon="bx-download" size="18" /></IconBtn>
          <IconBtn size="small"><VIcon icon="bx-trash" size="18" color="error" /></IconBtn>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
