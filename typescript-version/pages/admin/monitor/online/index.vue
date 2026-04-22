<script setup lang="ts">
// TODO: 待对接后端 API - Online users page
// 后端暂无 online session API，保留现有 UI 布局
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Online Users</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end">
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="secondary">Refresh</VBtn>
      </VCol>
    </VRow>

    <VAlert variant="tonal" color="warning" density="comfortable" class="mb-4">
      <template #prepend><VIcon icon="bx-info-circle" /></template>
      Online users API is not yet available. This page will be connected once the backend endpoint is ready.
    </VAlert>

    <VCard>
      <VCardText>
        <AppTextField placeholder="Search username or IP" prepend-inner-icon="bx-search" density="compact" hide-details />
      </VCardText>
      <VDataTable
        :headers="[
          { title: 'Session ID', key: 'sessionId' },
          { title: 'Username', key: 'username' },
          { title: 'IP Address', key: 'ip' },
          { title: 'Login Time', key: 'loginTime', sortable: true },
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
