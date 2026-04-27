<script setup lang="ts">
const search = ref('')
</script>

<template>
  <div>
    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-4">
        <VTextField v-model="search" placeholder="Keyword Search" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" prepend-inner-icon="bx-search" />
        <VSpacer />
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="primary" size="small">Refresh</VBtn>
      </VCardText>
      <VDivider />
      <VDataTable
        :headers="[
          { title: 'Session ID', key: 'sessionId' },
          { title: 'Username', key: 'username' },
          { title: 'IP Address', key: 'ip' },
          { title: 'Login Time', key: 'loginTime', sortable: true },
          { title: 'Action', key: 'actions', sortable: false },
        ]"
        :items="[]"
        :items-per-page="10"
        class="text-no-wrap"
      >
        <template #bottom>
          <div class="text-center py-8 text-medium-emphasis">No data — API pending</div>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
