<script setup lang="ts">
const search = ref('')
const items = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize.value)))
const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return items.value.slice(start, start + pageSize.value)
})
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">    <VCard class="mb-4">
      <VCardText class="d-flex flex-wrap align-center gap-4">
        <VTextField v-model="search" placeholder="Keyword Search" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" prepend-inner-icon="bx-search" />
        <VSpacer />
        <VBtn icon="bx-chevron-left" size="small" variant="text" :disabled="page <= 1" @click="page--" class="ms-2" />
        <span class="text-body-2 mx-1">{{ page }}/{{ totalPages }}</span>
        <VBtn icon="bx-chevron-right" size="small" variant="text" :disabled="page >= totalPages" @click="page++" />
        <VSelect v-model="pageSize" :items="[10, 20, 50, 100]" density="compact" style="max-width: 90px" hide-details @update:model-value="page = 1" />
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="primary" size="small">Refresh</VBtn>
      </VCardText>
    </VCard>

    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VTable hover density="compact" class="text-no-wrap sticky-table">
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Username</th>
            <th>IP Address</th>
            <th>Login Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pagedItems.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis py-8">No data — API pending</td>
          </tr>
          <tr v-for="item in pagedItems" :key="item.sessionId">
            <td>{{ item.sessionId }}</td>
            <td>{{ item.username }}</td>
            <td>{{ item.ip }}</td>
            <td>{{ item.loginTime }}</td>
            <td><IconBtn><VIcon icon="bx-log-out" /></IconBtn></td>
          </tr>
        </tbody>
      </VTable>
    </VCard>
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
