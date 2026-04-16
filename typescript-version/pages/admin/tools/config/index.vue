<script setup lang="ts">
const search = ref('')
const isDialogVisible = ref(false)

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Config Name', key: 'name', sortable: true },
  { title: 'Config Key', key: 'key' },
  { title: 'Config Value', key: 'value' },
  { title: 'Type', key: 'type' },
  { title: 'Remark', key: 'remark' },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const configs = ref([
  { id: 1, name: 'Account Register', key: 'sys.account.registerUser', value: 'false', type: 'Y/N', remark: 'Whether to allow user self-registration', created: '2024-01-01' },
  { id: 2, name: 'User Initial Password', key: 'sys.user.initPassword', value: '123456', type: 'String', remark: 'Default password for new users', created: '2024-01-01' },
  { id: 3, name: 'Main Frame Skin', key: 'sys.index.skinName', value: 'skin-blue', type: 'String', remark: 'Skin theme name', created: '2024-01-01' },
  { id: 4, name: 'Side Menu Style', key: 'sys.index.sideTheme', value: 'theme-dark', type: 'String', remark: 'Side navigation theme', created: '2024-01-01' },
  { id: 5, name: 'Captcha Enabled', key: 'sys.account.captchaEnabled', value: 'true', type: 'Y/N', remark: 'Whether to enable captcha on login', created: '2024-01-01' },
  { id: 6, name: 'Login Session Timeout', key: 'sys.session.timeout', value: '30', type: 'Number', remark: 'Session timeout in minutes', created: '2024-01-01' },
  { id: 7, name: 'Max Retry Count', key: 'sys.login.maxRetryCount', value: '5', type: 'Number', remark: 'Max password retry before lock', created: '2024-01-01' },
  { id: 8, name: 'Lock Duration', key: 'sys.login.lockDuration', value: '10', type: 'Number', remark: 'Account lock duration in minutes', created: '2024-01-01' },
])

const form = ref({ name: '', key: '', value: '', type: 'String', remark: '' })
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">System Config</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-plus" color="primary" @click="isDialogVisible = true">Add</VBtn>
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="secondary">Refresh Cache</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <VRow align="center">
          <VCol cols="12" sm="6" md="4">
            <AppTextField v-model="search" placeholder="Search config name or key" prepend-inner-icon="bx-search" density="compact" hide-details />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppSelect placeholder="Type" :items="['String', 'Number', 'Y/N', 'Boolean']" density="compact" hide-details clearable />
          </VCol>
        </VRow>
      </VCardText>
      <VDataTable :headers="headers" :items="configs" :search="search" :items-per-page="10" class="text-no-wrap">
        <template #item.value="{ item }">
          <code class="text-body-2 text-primary">{{ item.value }}</code>
        </template>
        <template #item.key="{ item }">
          <code class="text-body-2 text-medium-emphasis">{{ item.key }}</code>
        </template>
        <template #item.type="{ item }">
          <VChip variant="tonal" color="info" size="small" label>{{ item.type }}</VChip>
        </template>
        <template #item.actions>
          <div class="d-flex gap-1">
            <IconBtn size="small" @click="isDialogVisible = true"><VIcon icon="bx-edit" size="18" /></IconBtn>
            <IconBtn size="small" color="error"><VIcon icon="bx-trash" size="18" /></IconBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <VDialog v-model="isDialogVisible" max-width="550">
      <VCard title="System Config">
        <VCardText>
          <VForm>
            <AppTextField v-model="form.name" label="Config Name" class="mb-3" />
            <AppTextField v-model="form.key" label="Config Key" placeholder="e.g. sys.user.initPassword" class="mb-3" />
            <AppTextField v-model="form.value" label="Config Value" class="mb-3" />
            <AppSelect v-model="form.type" label="Type" :items="['String', 'Number', 'Y/N', 'Boolean']" class="mb-3" />
            <AppTextarea v-model="form.remark" label="Remark" />
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
