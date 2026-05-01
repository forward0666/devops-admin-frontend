<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { telegramBotService } from '~/services/api'

definePageMeta({ layout: 'default' })

const bots = ref<any[]>([])
const groupProjects = ref<any[]>([])
const loading = ref(false)
const selectedBot = ref('')
const snackbar = ref({ show: false, text: '', color: 'success' })

const dialog = ref(false)
const isEdit = ref(false)
const form = ref({ id: 0, botName: '', chatId: '', chatTitle: '', projectId: '', projectName: '' })

async function loadBots() {
  try {
    const res = await telegramBotService.list()
    bots.value = res?.bots || res || []
  } catch { /* ignore */ }
}

async function loadData() {
  if (!selectedBot.value) { groupProjects.value = []; return }
  loading.value = true
  try {
    const res = await telegramBotService.getGroupProjects(selectedBot.value)
    groupProjects.value = res?.groupProjects || []
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load', color: 'error' }
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  isEdit.value = false
  form.value = { id: 0, botName: selectedBot.value, chatId: '', chatTitle: '', projectId: '', projectName: '' }
  dialog.value = true
}

function openEditDialog(item: any) {
  isEdit.value = true
  form.value = {
    id: item.id,
    botName: item.botName,
    chatId: item.chatId,
    chatTitle: item.chatTitle,
    projectId: String(item.projectId),
    projectName: item.projectName,
  }
  dialog.value = true
}

async function submitForm() {
  if (!form.value.botName || !form.value.chatId || !form.value.projectId) return
  loading.value = true
  try {
    const payload = {
      chatTitle: form.value.chatTitle,
      projectId: Number(form.value.projectId),
      projectName: form.value.projectName,
    }
    if (isEdit.value) {
      await telegramBotService.updateGroupProject(form.value.id, payload)
    } else {
      await telegramBotService.createGroupProject({
        botName: form.value.botName,
        chatId: Number(form.value.chatId),
        ...payload,
      })
    }
    dialog.value = false
    snackbar.value = { show: true, text: isEdit.value ? 'Updated' : 'Created', color: 'success' }
    await loadData()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed', color: 'error' }
  } finally {
    loading.value = false
  }
}

async function deleteBinding(id: number) {
  if (!confirm('Delete this binding?')) return
  loading.value = true
  try {
    await telegramBotService.deleteGroupProject(id)
    snackbar.value = { show: true, text: 'Deleted', color: 'success' }
    await loadData()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to delete', color: 'error' }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadBots()
  if (bots.value.length > 0) {
    selectedBot.value = bots.value[0].botName
    await loadData()
  }
})
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center py-3">
        <div>
          <h4 class="text-h4 mb-1">Group Project Binding</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Bind Telegram groups to projects for asset info queries</p>
        </div>
      </VCardText>
    </VCard>

    <!-- Filter + Add -->
    <VCard class="mb-4">
      <VCardText>
        <VRow dense align="center">
          <VCol cols="12" md="5">
            <VSelect v-model="selectedBot" :items="bots" item-title="botName" item-value="botName" label="Select Bot" density="compact" @update:model-value="loadData" />
          </VCol>
          <VCol cols="12" md="2">
            <VBtn color="primary" block :disabled="!selectedBot" @click="openAddDialog">
              <VIcon start icon="bx-plus" />Add Binding
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard>
      <VDataTable
        :headers="[
          { title: 'Chat ID', key: 'chatId' },
          { title: 'Chat Title', key: 'chatTitle' },
          { title: 'Project ID', key: 'projectId' },
          { title: 'Project Name', key: 'projectName' },
          { title: 'Action', key: 'action', width: '120px', sortable: false },
        ]"
        :items="groupProjects"
        :loading="loading"
        density="comfortable"
        :items-per-page="20"
      >
        <template #item.action="{ item }">
          <VBtn icon variant="text" color="primary" size="small" @click="openEditDialog(item)">
            <VIcon icon="bx-edit" />
          </VBtn>
          <VBtn icon variant="text" color="error" size="small" @click="deleteBinding(item.id)">
            <VIcon icon="bx-trash" />
          </VBtn>
        </template>
        <template #no-data>
          <div class="text-center py-8 text-medium-emphasis">No group bindings</div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialog" max-width="500">
      <VCard>
        <VCardTitle>{{ isEdit ? 'Edit' : 'Add' }} Group-Project Binding</VCardTitle>
        <VCardText>
          <VSelect v-model="form.botName" :items="bots" item-title="botName" item-value="botName" label="Bot" density="compact" :disabled="isEdit" />
          <VTextField v-model="form.chatId" label="Chat ID" placeholder="-1001234567890" density="compact" type="number" class="mt-3" :disabled="isEdit" />
          <VTextField v-model="form.chatTitle" label="Chat Title" placeholder="Group name" density="compact" class="mt-3" />
          <VTextField v-model="form.projectId" label="Project ID" placeholder="1" density="compact" type="number" class="mt-3" />
          <VTextField v-model="form.projectName" label="Project Name" placeholder="Project display name" density="compact" class="mt-3" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!form.botName || !form.chatId || !form.projectId" :loading="loading" @click="submitForm">
            {{ isEdit ? 'Save' : 'Create' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top end">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
