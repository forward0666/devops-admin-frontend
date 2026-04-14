<script setup lang="ts">
const search = ref('')
const isDialogVisible = ref(false)
const isTypeDialogVisible = ref(false)
const activeTab = ref('dictList')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Dict Name', key: 'name', sortable: true },
  { title: 'Dict Type', key: 'type' },
  { title: 'Status', key: 'status' },
  { title: 'Remark', key: 'remark' },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const dicts = ref([
  { id: 1, name: 'User Gender', type: 'sys_user_sex', status: 'active', remark: 'User gender list', created: '2024-01-01' },
  { id: 2, name: 'Menu Type', type: 'sys_menu_type', status: 'active', remark: 'Menu type list', created: '2024-01-01' },
  { id: 3, name: 'System Status', type: 'sys_normal_disable', status: 'active', remark: 'System status list', created: '2024-01-01' },
  { id: 4, name: 'Operation Type', type: 'sys_oper_type', status: 'active', remark: 'Operation type list', created: '2024-01-01' },
  { id: 5, name: 'Notification Type', type: 'sys_notice_type', status: 'active', remark: 'Notification type', created: '2024-01-01' },
  { id: 6, name: 'Notification Status', type: 'sys_notice_status', status: 'active', remark: 'Notification status', created: '2024-01-01' },
])

const dictDataHeaders = [
  { title: 'ID', key: 'id' },
  { title: 'Label', key: 'label' },
  { title: 'Value', key: 'value' },
  { title: 'Sort', key: 'sort' },
  { title: 'Status', key: 'status' },
  { title: 'Remark', key: 'remark' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const currentDict = ref('sys_user_sex')
const dictData = ref([
  { id: 1, dictType: 'sys_user_sex', label: 'Male', value: '0', sort: 1, status: 'active', remark: '' },
  { id: 2, dictType: 'sys_user_sex', label: 'Female', value: '1', sort: 2, status: 'active', remark: '' },
  { id: 3, dictType: 'sys_user_sex', label: 'Unknown', value: '2', sort: 3, status: 'active', remark: '' },
])
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Dictionary Management</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" @click="isTypeDialogVisible = true">Add Type</VBtn>
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="secondary">Refresh</VBtn>
      </VCol>
    </VRow>

    <VTabs v-model="activeTab">
      <VTab value="dictList">Dictionary List</VTab>
      <VTab value="dictData">Dictionary Data</VTab>
    </VTabs>

    <VWindow v-model="activeTab" class="mt-4">
      <VWindowItem value="dictList">
        <VCard>
          <VCardText>
            <AppTextField v-model="search" placeholder="Search dictionary" prepend-inner-icon="bx-search" density="compact" hide-details />
          </VCardText>
          <VDataTable :headers="headers" :items="dicts" :search="search" :items-per-page="10" class="text-no-wrap">
            <template #item.status="{ item }">
              <VChip variant="tonal" :color="item.status === 'active' ? 'success' : 'error'" size="small" label>{{ item.status === 'active' ? 'Active' : 'Inactive' }}</VChip>
            </template>
            <template #item.actions>
              <div class="d-flex gap-1">
                <VBtn size="small" variant="tonal" color="primary" prepend-icon="bx-list-ul" @click="activeTab = 'dictData'">Data</VBtn>
                <IconBtn size="small"><VIcon icon="bx-edit" size="18" /></IconBtn>
                <IconBtn size="small" color="error"><VIcon icon="bx-trash" size="18" /></IconBtn>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VWindowItem>

      <VWindowItem value="dictData">
        <VCard>
          <VCardText>
            <VRow align="center">
              <VCol cols="12" sm="6" md="3">
                <AppSelect v-model="currentDict" :items="dicts.map(d => d.type)" label="Dict Type" density="compact" hide-details />
              </VCol>
              <VCol cols="12" sm="6" md="3">
                <AppTextField placeholder="Search" prepend-inner-icon="bx-search" density="compact" hide-details />
              </VCol>
              <VCol cols="12" md="6" class="d-flex justify-end">
                <VBtn prepend-icon="bx-plus" size="small" color="primary" @click="isDialogVisible = true">Add</VBtn>
              </VCol>
            </VRow>
          </VCardText>
          <VDataTable :headers="dictDataHeaders" :items="dictData" :items-per-page="10" class="text-no-wrap">
            <template #item.status="{ item }">
              <VChip variant="tonal" :color="item.status === 'active' ? 'success' : 'error'" size="small" label>{{ item.status === 'active' ? 'Active' : 'Inactive' }}</VChip>
            </template>
            <template #item.actions>
              <div class="d-flex gap-1">
                <IconBtn size="small"><VIcon icon="bx-edit" size="18" /></IconBtn>
                <IconBtn size="small" color="error"><VIcon icon="bx-trash" size="18" /></IconBtn>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VWindowItem>
    </VWindow>

    <!-- Add Dict Type Dialog -->
    <VDialog v-model="isTypeDialogVisible" max-width="500">
      <VCard title="Add Dictionary Type">
        <VCardText>
          <VForm>
            <AppTextField label="Dict Name" class="mb-3" />
            <AppTextField label="Dict Type" placeholder="e.g. sys_user_sex" class="mb-3" />
            <AppSelect label="Status" :items="['active', 'inactive']" class="mb-3" />
            <AppTextarea label="Remark" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isTypeDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary">Submit</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Add Dict Data Dialog -->
    <VDialog v-model="isDialogVisible" max-width="500">
      <VCard title="Add Dictionary Data">
        <VCardText>
          <VForm>
            <AppTextField label="Label" class="mb-3" />
            <AppTextField label="Value" class="mb-3" />
            <AppTextField label="Sort Order" type="number" class="mb-3" />
            <AppSelect label="Status" :items="['active', 'inactive']" class="mb-3" />
            <AppTextarea label="Remark" />
          </VForm>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary">Submit</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
