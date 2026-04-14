<script setup lang="ts">
const search = ref('')
const isImportDialogVisible = ref(false)
const isPreviewDialogVisible = ref(false)

const headers = [
  { title: 'Table Name', key: 'tableName', sortable: true },
  { title: 'Description', key: 'description' },
  { title: 'Engine', key: 'engine' },
  { title: 'Rows', key: 'rows', sortable: true },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const tables = ref([
  { tableName: 'sys_user', description: 'System user table', engine: 'InnoDB', rows: 156, created: '2024-01-01' },
  { tableName: 'sys_role', description: 'System role table', engine: 'InnoDB', rows: 12, created: '2024-01-01' },
  { tableName: 'sys_menu', description: 'System menu table', engine: 'InnoDB', rows: 89, created: '2024-01-01' },
  { tableName: 'sys_dept', description: 'System department table', engine: 'InnoDB', rows: 34, created: '2024-01-01' },
  { tableName: 'sys_dict_type', description: 'Dictionary type table', engine: 'InnoDB', rows: 25, created: '2024-01-01' },
  { tableName: 'sys_dict_data', description: 'Dictionary data table', engine: 'InnoDB', rows: 128, created: '2024-01-01' },
  { tableName: 'sys_config', description: 'System config table', engine: 'InnoDB', rows: 18, created: '2024-01-01' },
  { tableName: 'sys_log', description: 'Operation log table', engine: 'InnoDB', rows: 5623, created: '2024-01-01' },
])

const selectedTables = ref<string[]>([])
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Code Generator</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-import" variant="tonal" color="primary" @click="isImportDialogVisible = true">Import</VBtn>
        <VBtn prepend-icon="bx-download" color="primary" :disabled="selectedTables.length === 0">Generate ({{ selectedTables.length }})</VBtn>
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="secondary">Refresh</VBtn>
      </VCol>
    </VRow>

    <VCard>
      <VCardText>
        <AppTextField v-model="search" placeholder="Search table name" prepend-inner-icon="bx-search" density="compact" hide-details />
      </VCardText>
      <VDataTable
        v-model:selected="selectedTables"
        :headers="headers"
        :items="tables"
        :search="search"
        :items-per-page="10"
        show-select
        class="text-no-wrap"
      >
        <template #item.tableName="{ item }">
          <code class="text-body-1 text-primary">{{ item.tableName }}</code>
        </template>
        <template #item.rows="{ item }">
          <VChip variant="tonal" color="info" size="small" label>{{ item.rows.toLocaleString() }}</VChip>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn size="small" color="primary" @click="isPreviewDialogVisible = true">
              <VIcon icon="bx-show" size="18" />
            </IconBtn>
            <IconBtn size="small" color="info">
              <VIcon icon="bx-edit" size="18" />
            </IconBtn>
            <IconBtn size="small" color="secondary">
              <VIcon icon="bx-sync" size="18" />
            </IconBtn>
            <IconBtn size="small" color="success">
              <VIcon icon="bx-download" size="18" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Import Dialog -->
    <VDialog v-model="isImportDialogVisible" max-width="500">
      <VCard title="Import Tables">
        <VCardText>
          <p class="text-body-1 mb-4">Enter database table names to import (comma separated):</p>
          <AppTextarea label="Table Names" placeholder="e.g. sys_user, sys_role, sys_menu" rows="4" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isImportDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary">Import</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Preview Dialog -->
    <VDialog v-model="isPreviewDialogVisible" max-width="800">
      <VCard title="Code Preview">
        <VCardText>
          <VTabs>
            <VTab value="entity">Entity</VTab>
            <VTab value="mapper">Mapper</VTab>
            <VTab value="service">Service</VTab>
            <VTab value="controller">Controller</VTab>
            <VTab value="vue">Vue Page</VTab>
          </VTabs>
          <VWindow class="mt-4">
            <VWindowItem v-for="tab in ['entity', 'mapper', 'service', 'controller', 'vue']" :key="tab" :value="tab">
              <VCard variant="outlined" class="pa-4" style="max-height: 400px; overflow: auto;">
                <pre class="text-body-2" style="white-space: pre-wrap;"><code>// Generated code for {{ tab }}
// Table: sys_user
// Author: admin
// Date: {{ new Date().toISOString().split('T')[0] }}

package com.jhdevops.system;

public class SysUser {
    private Long id;
    private String username;
    private String nickname;
    private String email;
    private String phone;
    private Integer status;
    private Date createTime;
    // ... getters and setters
}</code></pre>
              </VCard>
            </VWindowItem>
          </VWindow>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isPreviewDialogVisible = false">Close</VBtn>
          <VBtn color="primary" prepend-icon="bx-download">Download</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
