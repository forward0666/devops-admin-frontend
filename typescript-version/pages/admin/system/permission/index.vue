<script setup lang="ts">
const roleStore = useRoleStore()
const permissionStore = usePermissionStore()
const menuStore = useMenuStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const selectedRoleId = ref<number | null>(null)

onMounted(async () => {
  await Promise.all([roleStore.fetchRoles(), menuStore.fetchMenus()])
})

watch(selectedRoleId, async (id) => {
  if (id) await permissionStore.fetchPermissionsByRole(id)
})

// Flatten menu tree
const flatMenus = computed(() => {
  const result: any[] = []
  const flatten = (items: any[], depth: number) => {
    items.forEach(item => {
      result.push({ ...item, depth })
      if (item.children?.length) flatten(item.children, depth + 1)
    })
  }
  flatten(menuStore.menus, 0)
  return result
})

// Build permission map from store
const permMap = computed(() => {
  const map: Record<string, string> = {}
  permissionStore.permissions.forEach((p: any) => {
    if (p.menuId && p.accessType) map[String(p.menuId)] = p.accessType
  })
  return map
})

function getPerm(menuId: number): string {
  return permMap.value[String(menuId)] || 'none'
}

function setPerm(menuId: number, value: string) {
  permMap.value[String(menuId)] = value
}

async function savePermissions() {
  if (!selectedRoleId.value) return
  try {
    const perms = flatMenus.value
      .filter(m => permMap.value[String(m.id)] && permMap.value[String(m.id)] !== 'none')
      .map(m => ({ menuId: m.id, accessType: permMap.value[String(m.id)] }))
    await permissionStore.updatePermissionsByRole(selectedRoleId.value, { permissions: perms })
    snackbar.value = { show: true, text: 'Permissions saved', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Save failed', color: 'error' }
  }
}
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Permissions Management</h4></VCol>
    </VRow>

    <VRow class="mb-4">
      <VCol cols="12" md="4">
        <VSelect
          v-model="selectedRoleId"
          :items="roleStore.roles"
          item-title="name"
          item-value="id"
          label="Select Role"
          variant="outlined"
          density="comfortable"
          :loading="roleStore.loading"
          placeholder="Choose a role..."
          prepend-inner-icon="bx-shield"
          clearable
        />
      </VCol>
    </VRow>

    <VCard v-if="selectedRoleId" :loading="permissionStore.loading">
      <VCardItem>
        <VCardTitle>Menu Permissions</VCardTitle>
        <VCardSubtitle>Configure access level for each menu item</VCardSubtitle>
      </VCardItem>
      <VDivider />
      <VCardText>
        <VAlert variant="tonal" color="info" density="compact" class="mb-4">
          <template #prepend><VIcon icon="bx-info-circle" size="18" /></template>
          Set access type per menu. <strong>View</strong> = read only, <strong>Edit</strong> = full access, <strong>None</strong> = no access.
        </VAlert>

        <div v-for="menu in flatMenus" :key="menu.id" class="d-flex align-center gap-x-3 mb-2" :style="{ paddingLeft: `${menu.depth * 24}px` }">
          <VIcon :icon="menu.icon || (menu.depth === 0 ? 'bx-folder' : 'bx-file')" size="18" class="text-medium-emphasis" />
          <span class="text-body-1 font-weight-medium" style="min-width: 200px;">{{ menu.name }}</span>
          <VRadioGroup
            :model-value="getPerm(menu.id)"
            density="compact" hide-details inline class="flex-grow-1"
            @update:model-value="setPerm(menu.id, $event)"
          >
            <VRadio value="none" color="error" label="None" />
            <VRadio value="view" color="info" label="View" />
            <VRadio value="edit" color="success" label="Edit" />
          </VRadioGroup>
        </div>
      </VCardText>
      <VDivider />
      <VCardActions class="justify-end pa-4">
        <VBtn color="primary" :loading="permissionStore.loading" @click="savePermissions">Save Permissions</VBtn>
      </VCardActions>
    </VCard>

    <VCard v-else-if="!roleStore.loading">
      <VCardText class="text-center py-12">
        <VIcon icon="bx-shield" size="64" color="grey-lighten-2" class="mb-4" />
        <h5 class="text-h5 text-medium-emphasis">Select a role to manage permissions</h5>
      </VCardText>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
