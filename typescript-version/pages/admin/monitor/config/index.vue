<script setup lang="ts">
const search = ref('')
</script>

<template>
  <div>
    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-4">
        <VTextField v-model="search" placeholder="Keyword Search" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" prepend-inner-icon="bx-search" />
      </VCardText>
      <VDivider />
      <VDataTable
        :headers="[
          { title: 'Config Key', key: 'key' },
          { title: 'Config Value', key: 'value' },
          { title: 'Description', key: 'description' },
          { title: 'Updated At', key: 'updatedAt', sortable: true },
          { title: 'Actions', key: 'actions', sortable: false },
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
