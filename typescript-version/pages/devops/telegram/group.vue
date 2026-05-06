<script setup lang="ts">
import { telegramBotService } from '~/services/api'

definePageMeta({ layout: 'default' })

interface GroupItem {
  chatId: number
  chatName: string
  type: string
  status: number
  botName: string
  createdAt?: string
  project?: { id: number; name: string }
}

const BOT_HEADERS = { 'X-Encrypted-Data': import.meta.env.VITE_BOT_SECRET || '' }

const groups = ref<GroupItem[]>([])
const bots = ref<any[]>([])
const loading = ref(false)
const selectedBot = ref<string>('')
const snackbar = ref({ show: false, text: '', color: 'success' })

// Add dialog
const isAddDialogVisible = ref(false)
const newGroup = ref({ botName: '', chatId: '', chatName: '' })

// Bind project dialog
const isBindDialogVisible = ref(false)
const bindingItem = ref<GroupItem | null>(null)
const projects = ref<any[]>([])
const selectedProject = ref<number | null>(null)

// Delete dialog
const isDeleteDialogVisible = ref(false)
const deletingItem = ref<GroupItem | null>(null)

async function fetchBots() {
  try {
    const res: any = await telegramBotService.list(BOT_HEADERS)
    bots.value = Array.isArray(res) ? res : res?.bots || res?.data || []
    if (bots.value.length && !selectedBot.value) selectedBot.value = bots.value[0].botName
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load bots', color: 'error' }
  }
}

async function fetchGroups() {
  if (!selectedBot.value) return
  loading.value = true
  try {
    const res: any = await telegramBotService.getAuthorizedChats(selectedBot.value)
    const raw = res?.authorizedChats || res?.data?.authorizedChats || res?.data || []
    const allChats: any[] = Array.isArray(raw) ? raw : []
    groups.value = allChats.filter((c: any) => c.type === 'group' || c.type === 'supergroup')
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load groups', color: 'error' }
  } finally {
    loading.value = false
  }
}

watch(selectedBot, () => fetchGroups())

onMounted(() => { fetchBots() })

// Add group
async function addGroup() {
  if (!newGroup.value.botName || !newGroup.value.chatId) return
  try {
    const botConfig = bots.value.find((b: any) => b.botName === newGroup.value.botName)
    await telegramBotService.addAuthorizedChat(newGroup.value.botName, botConfig?.id || 0, Number(newGroup.value.chatId), newGroup.value.chatName, 'supergroup')
    isAddDialogVisible.value = false
    newGroup.value = { botName: '', chatId: '', chatName: '' }
    selectedBot.value = newGroup.value.botName || selectedBot.value
    await fetchGroups()
    snackbar.value = { show: true, text: 'Group added', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to add group', color: 'error' }
  }
}

// Fetch projects for binding
async function openBindDialog(item: GroupItem) {
  bindingItem.value = item
  selectedProject.value = null
  isBindDialogVisible.value = true
  try {
    const { apiClient } = await import('~/services/api')
    const res = await apiClient.get('/manage/project').then((r: any) => r.data?.data || r.data || [])
    projects.value = Array.isArray(res) ? res : []
  } catch { projects.value = [] }
}

async function bindProject() {
  if (!bindingItem.value || !selectedProject.value) return
  const proj = projects.value.find((p: any) => p.id === selectedProject.value)
  try {
    await telegramBotService.createGroupProject({
      botName: selectedBot.value,
      chatId: bindingItem.value.chatId,
      chatTitle: bindingItem.value.chatName,
      projectId: selectedProject.value,
      projectName: proj?.name || '',
    })
    isBindDialogVisible.value = false
    await fetchGroups()
    snackbar.value = { show: true, text: 'Project bound', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to bind project', color: 'error' }
  }
}

// Delete
async function confirmDelete() {
  if (!deletingItem.value) return
  try {
    // Find the authorization record id
    const allChats: any[] = groups.value.map(g => ({ ...g }))
    const chat = allChats.find((c: any) => c.chatId === deletingItem.value?.chatId)
    if (chat?.id) await telegramBotService.deleteAuthorization(chat.id)
    isDeleteDialogVisible.value = false
    await fetchGroups()
    snackbar.value = { show: true, text: 'Group removed', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to remove', color: 'error' }
  }
}
</script>

<template>
  <div>
    <VCard>
      <VCardText class="d-flex justify-end align-center flex-wrap gap-3">
        <VSelect
          v-model="selectedBot"
          :items="bots.map((b: any) => b.botName)"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 280px"
          placeholder="Select Bot"
        />
        <VBtn prepend-icon="bx-plus" color="primary" size="small" @click="isAddDialogVisible = true; newGroup.botName = selectedBot">Add Group</VBtn>
      </VCardText>
      <VDivider />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="groups.length" class="text-no-wrap" hover density="compact">
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th style="width: 100px;">Chat ID</th>
            <th>Chat Name</th>
            <th style="width: 100px;">Type</th>
            <th style="width: 120px;">Bound Project</th>
            <th style="width: 80px;">Status</th>
            <th style="width: 90px;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in groups" :key="item.chatId">
            <td><span class="text-body-2">{{ item.chatId }}</span></td>
            <td><span class="font-weight-medium">{{ item.chatName || '-' }}</span></td>
            <td><VChip variant="tonal" color="info" size="small" label>{{ item.type }}</VChip></td>
            <td><VChip v-if="item.project" variant="tonal" color="success" size="small" label>{{ item.project.name }}</VChip><span v-else class="text-medium-emphasis">-</span></td>
            <td><VChip variant="tonal" :color="item.status === 1 ? 'success' : 'error'" size="small" label>{{ item.status === 1 ? 'Active' : 'Disabled' }}</VChip></td>
            <td>
              <div class="d-flex gap-1">
                <IconBtn size="small" @click="openBindDialog(item)"><VIcon icon="bx-link" size="18" /></IconBtn>
                <IconBtn size="small" color="error" @click="deletingItem = item; isDeleteDialogVisible = true"><VIcon icon="bx-trash" size="18" /></IconBtn>
              </div>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-if="!loading && !groups.length" class="text-center text-medium-emphasis pa-6">
        No groups found
      </VCardText>
    </VCard>

    <!-- Add Group Dialog -->
    <VDialog v-model="isAddDialogVisible" max-width="450">
      <VCard>
        <VCardItem><VCardTitle>Add Group</VCardTitle></VCardItem>
        <VCardText>
          <VSelect v-model="newGroup.botName" label="Bot" :items="bots.map((b: any) => b.botName)" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newGroup.chatId" label="Chat ID" placeholder="-1001234567890" density="comfortable" class="mb-3" variant="outlined" type="number" />
          <VTextField v-model="newGroup.chatName" label="Chat Name" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="addGroup">Add</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Bind Project Dialog -->
    <VDialog v-model="isBindDialogVisible" max-width="450">
      <VCard>
        <VCardItem><VCardTitle>Bind Project</VCardTitle></VCardItem>
        <VCardText>
          <p class="text-body-2 text-medium-emphasis mb-3">Group: {{ bindingItem?.chatName }} ({{ bindingItem?.chatId }})</p>
          <VSelect
            v-model="selectedProject"
            label="Project"
            :items="projects.map((p: any) => ({ title: p.name, value: p.id }))"
            density="comfortable"
            variant="outlined"
          />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isBindDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!selectedProject" @click="bindProject">Bind</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardItem><VCardTitle>Remove Group</VCardTitle></VCardItem>
        <VCardText>Remove <strong>{{ deletingItem?.chatName }}</strong> ({{ deletingItem?.chatId }})?</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Remove</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
