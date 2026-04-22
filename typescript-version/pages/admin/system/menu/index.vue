<script setup lang="ts">
const menuStore = useMenuStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const search = ref('')
const isDialogVisible = ref(false)
const dialogTitle = ref('Add Menu')
const editingId = ref<number | null>(null)

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Menu Name', key: 'name', sortable: true },
  { title: 'Icon', key: 'icon' },
  { title: 'Sort', key: 'sort', sortable: true },
  { title: 'Path', key: 'path' },
  { title: 'Type', key: 'type' },
  { title: 'Status', key: 'active' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const form = ref({ name: '', icon: '', sort: 1, path: '', type: 'menu', status: true, parentId: null as number | null, permission: '' })

onMounted(() => menuStore.fetchMenus())

// Flatten tree for table display
const flatMenus = computed(() => {
  const result: any[] = []
  const flatten = (items: any[], depth: number) => {
    items.forEach(item => {
      result.push({ ...item, depth, _hasChildren: !!item.children?.length })
      if (item.children?.length) flatten(item.children, depth + 1)
    })
  }
  flatten(menuStore.menus, 0)
  return result
})

function openAddDialog(parentId?: number) {
  editingId.value = null
  dialogTitle.value = 'Add Menu'
  form.value = { name: '', icon: '', sort: 1, path: '', type: 'menu', status: true, parentId: parentId || null, permission: '' }
  isDialogVisible.value = true
}

function openEditDialog(item: any) {
  editingId.value = item.id
  dialogTitle.value = 'Edit Menu'
  form.value = {
    name: item.name,
    icon: item.icon || '',
    sort: item.sort || 0,
    path: item.path || '',
    type: item.type || 'menu',
    status: item.active !== false,
    parentId: item.parentId,
    permission: item.permission || '',
  }
  isDialogVisible.value = true
}

async function submitForm() {
  try {
    const data = { ...form.value, status: form.value.status }
    if (editingId.value) {
      await menuStore.updateMenu(editingId.value, data)
      snackbar.value = { show: true, text: 'Menu updated', color: 'success' }
    } else {
      await menuStore.createMenu(data)
      snackbar.value = { show: true, text: 'Menu created', color: 'success' }
    }
    isDialogVisible.value = false
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Operation failed', color: 'error' }
  }
}

async function deleteMenu(id: number) {
  try {
    await menuStore.deleteMenu(id)
    snackbar.value = { show: true, text: 'Menu deleted', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Delete failed', color: 'error' }
  }
}

const parentOptions = computed(() => {
  const items: { title: string; value: number | null }[] = [{ title: 'None (Top Level)', value: null }]
  const collect = (menus: any[]) => {
    menus.forEach((m: any) => {
      items.push({ title: m.name, value: m.id })
      if (m.children?.length) collect(m.children)
    })
  }
  collect(menuStore.menus)
  return items
})
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Menu Management</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" @click="openAddDialog()">Add</VBtn>
      </VCol>
    </VRow>

    <VCard :loading="menuStore.loading">
      <VCardText>
        <AppTextField v-model="search" placeholder="Search menu" prepend-inner-icon="bx-search" density="compact" hide-details />
      </VCardText>
      <VDataTable :headers="headers" :items="flatMenus" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.name="{ item }">
          <div class="d-flex align-center" :style="{ paddingLeft: `${(item.depth || 0) * 24}px` }">
            <VIcon v-if="item._hasChildren" :icon="item.depth === 0 ? 'bx-folder-open' : 'bx-folder'" size="18" class="me-2 text-medium-emphasis" />
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
        <template #item.icon="{ item }">
          <VIcon v-if="item.icon" :icon="item.icon" size="20" />
          <span v-else class="text-body-2 text-medium-emphasis">—</span>
        </template>
        <template #item.type="{ item }">
          <VChip variant="tonal" :color="item.type === 'directory' ? 'info' : item.type === 'button' ? 'warning' : 'primary'" size="small" label class="text-capitalize">{{ item.type }}</VChip>
        </template>
        <template #item.active="{ item }">
          <VChip variant="tonal" :color="item.active !== false ? 'success' : 'error'" size="small" label>{{ item.active !== false ? 'Active' : 'Inactive' }}</VChip>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn size="small" @click="openAddDialog(item.id)"><VIcon icon="bx-plus" size="18" /></IconBtn>
            <IconBtn size="small" @click="openEditDialog(item)"><VIcon icon="bx-edit" size="18" /></IconBtn>
            <IconBtn size="small" color="error" @click="deleteMenu(item.id)"><VIcon icon="bx-trash" size="18" /></IconBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <VDialog v-model="isDialogVisible" max-width="550">
      <VCard :title="dialogTitle">
        <VCardText>
          <VForm>
            <AppSelect v-model="form.parentId" label="Parent Menu" :items="parentOptions" item-title="title" item-value="value" class="mb-3" />
            <AppSelect v-model="form.type" label="Type" :items="['directory', 'menu', 'button']" class="mb-3" />
            <AppTextField v-model="form.name" label="Menu Name" class="mb-3" />
            <AppTextField v-model="form.icon" label="Icon" placeholder="e.g. bx-home-smile" class="mb-3" />
            <AppTextField v-model="form.path" label="Route Path" placeholder="e.g. /system/user" class="mb-3" />
            <AppTextField v-model="form.permission" label="Permission Key" placeholder="e.g. system:user:list" class="mb-3" />
            <AppTextField v-model.number="form.sort" label="Sort Order" type="number" class="mb-3" />
            <AppSelect v-model="form.status" label="Status" :items="[{ title: 'Active', value: true }, { title: 'Inactive', value: false }]" item-title="title" item-value="value" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="menuStore.loading" @click="submitForm">Submit</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
