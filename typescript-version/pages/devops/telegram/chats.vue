<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { telegramBotService } from '~/services/api'

definePageMeta({ layout: 'default' })

interface ChatItem {
  id: number
  chatId: number
  chatName: string
  type: string
  status: number
  botConfigId: number
  botName?: string
  createdAt?: string
}

const chats = ref<ChatItem[]>([])
const bots = ref<any[]>([])
const loading = ref(false)
const selectedBot = ref<string>('')
const snackbar = ref({ show: false, text: '', color: 'success' })

const showAddDialog = ref(false)
const newChat = ref({ botName: '', chatId: '', chatName: '', type: 'private' })

const chatTypes = [
  { title: 'Private', value: 'private' },
  { title: 'Group', value: 'group' },
  { title: 'Supergroup', value: 'supergroup' },
  { title: 'Channel', value: 'channel' },
]

const headers = [
  { title: 'Bot', key: 'botName', width: '180px' },
  { title: 'Chat ID', key: 'chatId', width: '150px' },
  { title: 'Name', key: 'chatName', width: '200px' },
  { title: 'Type', key: 'type', width: '120px' },
  { title: 'Status', key: 'status', width: '100px' },
  { title: 'Created', key: 'createdAt', width: '220px' },
  { title: 'Action', key: 'action', width: '100px', sortable: false },
]

watch(selectedBot, () => loadChats())

async function loadBots() {
  try {
    const res = await telegramBotService.list()
    bots.value = Array.isArray(res?.bots) ? res.bots : []
  } catch {
    bots.value = []
  }
}

async function loadChats() {
  loading.value = true
  try {
    if (selectedBot.value) {
      const res = await telegramBotService.getAuthorizedChats(selectedBot.value)
      const chatList = res?.authorizedChats || []
      chats.value = chatList.map((c: any) => ({ ...c, botName: selectedBot.value }))
    } else {
      const allChats: ChatItem[] = []
      for (const bot of bots.value) {
        try {
          const res = await telegramBotService.getAuthorizedChats(bot.botName)
          const chatList = res?.authorizedChats || []
          chatList.forEach((c: any) => allChats.push({ ...c, botName: bot.botName }))
        } catch { /* skip */ }
      }
      chats.value = allChats
    }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load chats', color: 'error' }
  } finally {
    loading.value = false
  }
}

async function handleAddChat() {
  if (!newChat.value.botName || !newChat.value.chatId) return
  loading.value = true
  try {
    const bot = bots.value.find((b: any) => b.botName === newChat.value.botName)
    if (!bot) throw new Error('Bot not found')
    await telegramBotService.addAuthorizedChat(
      newChat.value.botName,
      bot.id,
      Number(newChat.value.chatId),
      newChat.value.chatName || undefined,
      newChat.value.type,
    )
    showAddDialog.value = false
    newChat.value = { botName: '', chatId: '', chatName: '', type: 'private' }
    await loadChats()
    snackbar.value = { show: true, text: 'Chat authorized successfully', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.message || e?.message || 'Failed to add chat', color: 'error' }
  } finally {
    loading.value = false
  }
}

async function removeChat(chat: ChatItem) {
  loading.value = true
  try {
    await telegramBotService.deleteAuthorization(chat.id)
    await loadChats()
    snackbar.value = { show: true, text: 'Authorization removed', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to remove', color: 'error' }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadBots()
  await loadChats()
})
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Authorized Chat</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage chat authorizations for Telegram bots</p>
        </div>
        <VBtn color="primary" @click="showAddDialog = true">
          <VIcon start icon="bx-plus" />Add Chat
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Filter -->
    <VCard class="mb-4">
      <VCardText>
        <VRow dense>
          <VCol cols="12" md="4">
            <VSelect
              v-model="selectedBot"
              :items="[{ title: 'All Bots', value: '' }, ...bots.map((b: any) => ({ title: b.botName, value: b.botName }))]"
              item-title="title"
              item-value="value"
              label="Filter by Bot"
              density="compact"
              clearable
              @update:model-value="loadChats()"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VBtn variant="outlined" block :loading="loading" @click="loadChats">
              <VIcon start icon="bx-refresh" />Refresh
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Chat List -->
    <VCard>
      <VDataTable
        :headers="headers"
        :items="chats"
        :loading="loading"
        item-key="id"
        density="comfortable"
        :items-per-page="15"
      >
        <template #item.status="{ item }">
          <VChip :color="item.status === 1 ? 'success' : 'error'" size="small" variant="flat">
            {{ item.status === 1 ? 'Active' : 'Inactive' }}
          </VChip>
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-medium-emphasis">
            {{ item.createdAt ? new Date(item.createdAt).toLocaleString() : '-' }}
          </span>
        </template>
        <template #item.action="{ item }">
          <VTooltip text="Remove">
            <template #activator="{ props }">
              <VBtn v-bind="props" icon variant="text" color="error" size="small" @click="removeChat(item)">
                <VIcon icon="bx-trash" />
              </VBtn>
            </template>
          </VTooltip>
        </template>
        <template #no-data>
          <div class="text-center py-8 text-medium-emphasis">No authorized chats found</div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Add Chat Dialog -->
    <VDialog v-model="showAddDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="bx-chat" class="me-2" />Add Authorized Chat
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VSelect
            v-model="newChat.botName"
            :items="bots.map((b: any) => b.botName)"
            label="Bot"
            class="mb-4"
            :rules="[(v: string) => !!v || 'Required']"
          />
          <VTextField
            v-model="newChat.chatId"
            label="Chat ID"
            placeholder="-1001234567890"
            class="mb-4"
            :rules="[(v: string) => !!v || 'Required']"
            hint="Use /start in bot or getUpdates API to find chat ID"
          />
          <VTextField
            v-model="newChat.chatName"
            label="Chat Name (optional)"
            placeholder="My Group"
            class="mb-4"
          />
          <VSelect
            v-model="newChat.type"
            :items="chatTypes"
            item-title="title"
            item-value="value"
            label="Chat Type"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showAddDialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!newChat.botName || !newChat.chatId" @click="handleAddChat">Add</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top end" style="z-index: 9999">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
