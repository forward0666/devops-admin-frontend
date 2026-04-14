<script setup lang="ts">
const search = ref('')

const modules = ref([
  {
    name: 'System Management',
    icon: 'bx-cog',
    permissions: [
      { name: 'User List', view: true, add: true, edit: true, delete: true },
      { name: 'User View', view: true, add: false, edit: false, delete: false },
      { name: 'Role Management', view: true, add: true, edit: true, delete: true },
      { name: 'Permission Management', view: true, add: true, edit: true, delete: true },
      { name: 'Menu Management', view: true, add: true, edit: true, delete: true },
      { name: 'Department', view: true, add: true, edit: true, delete: true },
      { name: 'Dictionary', view: true, add: true, edit: true, delete: false },
    ],
  },
  {
    name: 'System Monitor',
    icon: 'bx-desktop',
    permissions: [
      { name: 'Online Users', view: true, add: false, edit: false, delete: true },
      { name: 'Operation Log', view: true, add: false, edit: false, delete: true },
      { name: 'Login Log', view: true, add: false, edit: false, delete: true },
    ],
  },
  {
    name: 'System Tools',
    icon: 'bx-wrench',
    permissions: [
      { name: 'Code Generator', view: true, add: true, edit: true, delete: true },
      { name: 'System API', view: true, add: false, edit: false, delete: false },
      { name: 'System Config', view: true, add: true, edit: true, delete: false },
    ],
  },
])
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Permission Management</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-check-double" color="primary">Save All</VBtn>
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="secondary">Refresh</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <AppTextField v-model="search" placeholder="Search permission" prepend-inner-icon="bx-search" density="compact" hide-details class="mb-4" />
      </VCardText>

      <VCard v-for="mod in modules" :key="mod.name" class="mb-4 mx-4" flat>
        <VCardItem>
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon :icon="mod.icon" size="22" />
            {{ mod.name }}
          </VCardTitle>
        </VCardItem>
        <VDataTable
          :items="mod.permissions"
          :items-per-page="-1"
          :headers="[
            { title: 'Permission', key: 'name' },
            { title: 'View', key: 'view' },
            { title: 'Add', key: 'add' },
            { title: 'Edit', key: 'edit' },
            { title: 'Delete', key: 'delete' },
          ]"
          hide-default-footer
          density="compact"
          class="text-no-wrap"
        >
          <template #item.view="{ item }">
            <VSwitch v-model="item.view" density="compact" hide-details color="primary" />
          </template>
          <template #item.add="{ item }">
            <VSwitch v-model="item.add" density="compact" hide-details color="primary" />
          </template>
          <template #item.edit="{ item }">
            <VSwitch v-model="item.edit" density="compact" hide-details color="primary" />
          </template>
          <template #item.delete="{ item }">
            <VSwitch v-model="item.delete" density="compact" hide-details color="primary" />
          </template>
        </VDataTable>
        <VDivider />
      </VCard>
    </VCard>
  </div>
</template>
