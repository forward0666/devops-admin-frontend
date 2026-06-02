<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCfAccount } from '~/composables/useCfAccount'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const { accounts, loading, fetchAccounts, maskKey, CF_GATEWAY } = useCfAccount()

const dialog = ref(false)
const editingId = ref<string | null>(null)
const showKeys = ref<Record<string, boolean>>({})
const snackbar = ref({ show: false, text: '', color: 'success' })
const saving = ref(false)

const form = ref({
  name: '',
  apiKey: '',
  description: '',
})

onMounted(() => fetchAccounts())

function toggleKey(id: string) {
  showKeys.value[id] = !showKeys.value[id]
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', apiKey: '', description: '' }
  dialog.value = true
}

function openEdit(account: any) {
  editingId.value = account.id
  form.value = { name: account.name, apiKey: '', description: account.description || '' }
  dialog.value = true
}

async function save() {
  if (!form.value.name.trim()) {
    snackbar.value = { show: true, text: 'Name is required', color: 'error' }
    return
  }
  if (!editingId.value && !form.value.apiKey.trim()) {
    snackbar.value = { show: true, text: 'API Key is required', color: 'error' }
    return
  }
  saving.value = true
  try {
    const body: any = {
      name: form.value.name,
      description: form.value.description,
    }
    if (form.value.apiKey.trim()) body.apiKey = form.value.apiKey.trim()

    if (editingId.value) {
      await apiClient.put(`${CF_GATEWAY}/accounts/${editingId.value}`, body)
      snackbar.value = { show: true, text: 'Account updated', color: 'success' }
    } else {
      await apiClient.post(`${CF_GATEWAY}/accounts`, body)
      snackbar.value = { show: true, text: 'Account created', color: 'success' }
    }
    dialog.value = false
    await fetchAccounts()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Failed to save', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete this account?')) return
  try {
    await apiClient.delete(`${CF_GATEWAY}/accounts/${id}`)
    snackbar.value = { show: true, text: 'Account deleted', color: 'success' }
    await fetchAccounts()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.message || 'Failed to delete', color: 'error' }
  }
}
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Cloudflare Account</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage API keys for different features</p>
        </div>
        <VBtn color="primary" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Account
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Account Table -->
    <VCard>
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="accounts.length > 0">
        <thead>
          <tr>
            <th style="width: 180px">Name</th>
            <th style="width: 550px">API Key</th>
            <th>Description</th>
            <th style="width: 160px">Created</th>
            <th style="width: 100px">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in accounts" :key="account.id">
            <td class="font-weight-medium">{{ account.name }}</td>
            <td style="width: 550px; max-width: 550px; overflow: hidden;">
              <div style="display: flex; align-items: center; overflow: hidden;">
                <code class="text-caption" style="font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
                  {{ showKeys[account.id] ? account.api_key : maskKey(account.api_key) }}
                </code>
                <VBtn icon size="x-small" variant="text" style="flex-shrink: 0;" @click="toggleKey(account.id)">
                  <VIcon :icon="showKeys[account.id] ? 'bx-hide' : 'bx-show'" size="16" />
                </VBtn>
              </div>
            </td>
            <td class="text-medium-emphasis">{{ account.description || '-' }}</td>
            <td class="text-caption text-medium-emphasis">{{ new Date(account.created_at).toLocaleDateString() }}</td>
            <td>
              <VBtn icon size="x-small" variant="text" color="primary" @click="openEdit(account)">
                <VIcon icon="bx-edit" size="16" />
              </VBtn>
              <VBtn icon size="x-small" variant="text" color="error" @click="handleDelete(account.id)">
                <VIcon icon="bx-trash" size="16" />
              </VBtn>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loading" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-cloud" size="48" class="mb-2" />
        <p>No accounts yet. Add your first Cloudflare API key to get started.</p>
      </VCardText>
    </VCard>

    <!-- Dialog -->
    <VDialog v-model="dialog" max-width="500">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Account' : 'Add Account' }}</VCardTitle>
        <VCardText>
          <VTextField v-model="form.name" label="Account Name" density="compact" class="mb-3" hint="e.g. Production, Staging, Personal" persistent-hint />
          <VTextField v-model="form.apiKey" label="API Token" density="compact" class="mb-3" :type="showKeys['_form'] ? 'text' : 'password'" :placeholder="editingId ? 'Leave empty to keep current' : ''" :persistent-hint="!!editingId" :hint="editingId ? 'Leave empty to keep existing key' : ''">
            <template #append>
              <VBtn icon size="x-small" variant="text" @click="showKeys['_form'] = !showKeys['_form']">
                <VIcon :icon="showKeys['_form'] ? 'bx-hide' : 'bx-show'" size="16" />
              </VBtn>
            </template>
          </VTextField>
          <VTextarea v-model="form.description" label="Description" density="compact" rows="2" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" :disabled="!form.name.trim() || (!editingId && !form.apiKey.trim())" @click="save">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
