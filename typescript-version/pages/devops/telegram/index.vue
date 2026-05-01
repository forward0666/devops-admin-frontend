<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { telegramBotService } from '~/services/api'

definePageMeta({ layout: 'default' })

interface BotItem {
  id: number
  botName: string
  botUsername: string
  status: number
  createdAt: string
}

const bots = ref<BotItem[]>([])
const loading = ref(false)
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedBot = ref<BotItem | null>(null)
const deleteBotName = ref('')

const newBot = ref({
  botName: '',
  botUsername: '',
  token: '',
  botType: 'IP_WHITE_LIST',
  secretToken: '',
})

const botTypes = [
  { title: 'General', value: 'GENERAL' },
  { title: 'IP White List', value: 'IP_WHITE_LIST' },
  { title: 'Customer Service', value: 'CUSTOMER_SERVICE' },
  { title: 'Tool', value: 'TOOL' },
]

const headers = [
  { title: 'Bot Name', key: 'botName', width: '200px' },
  { title: 'Username', key: 'botUsername', width: '200px' },
  { title: 'Type', key: 'botType', width: '150px' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Created', key: 'createdAt', width: '180px' },
  { title: 'Action', key: 'action', width: '150px', sortable: false },
]

const statusItems = [
  { title: 'Enabled', value: 1 },
  { title: 'Disabled', value: 0 },
]

async function loadBots() {
  loading.value = true
  try {
    const res = await telegramBotService.list()
    bots.value = Array.isArray(res?.bots) ? res.bots : []
  } catch (e: any) {
    console.error('Failed to load bots:', e)
    bots.value = []
  } finally {
    loading.value = false
  }
}

async function handleAddBot() {
  if (!newBot.value.botName || !newBot.value.botUsername || !newBot.value.token) return
  loading.value = true
  try {
    await telegramBotService.addBot(newBot.value)
    showAddDialog.value = false
    newBot.value = { botName: '', botUsername: '', token: '', botType: 'IP_WHITE_LIST', secretToken: '' }
    await loadBots()
  } catch (e: any) {
    console.error('Failed to add bot:', e)
  } finally {
    loading.value = false
  }
}

async function handleToggleStatus(bot: BotItem) {
  const newStatus = bot.status === 1 ? 0 : 1
  loading.value = true
  try {
    await telegramBotService.updateStatus(bot.botName, newStatus)
    bot.status = newStatus
  } catch (e: any) {
    console.error('Failed to update status:', e)
  } finally {
    loading.value = false
  }
}

function confirmDelete(bot: BotItem) {
  selectedBot.value = bot
  deleteBotName.value = ''
  showDeleteDialog.value = true
}

async function handleDeleteBot() {
  if (!selectedBot.value || deleteBotName.value !== selectedBot.value.botName) return
  loading.value = true
  try {
    await telegramBotService.deleteBot(selectedBot.value.botName)
    showDeleteDialog.value = false
    await loadBots()
  } catch (e: any) {
    console.error('Failed to delete bot:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadBots() })
</script>

<template>
  <div>
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center py-3">
        <div>
          <h4 class="text-h4 mb-1">Telegram Bot Manager</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage Telegram bots, webhooks and settings</p>
        </div>
        <VSpacer />
        <VBtn color="primary" @click="showAddDialog = true">
          <VIcon start icon="bx-plus" />Add Bot
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Bot List -->
    <VCard>
      <VDataTable
        :headers="headers"
        :items="bots"
        :loading="loading"
        item-key="id"
        density="comfortable"
        :items-per-page="10"
      >
        <template #item.status="{ item }">
          <VSwitch
            :model-value="item.status === 1"
            :label="item.status === 1 ? 'Enabled' : 'Disabled'"
            color="success"
            density="compact"
            hide-details
            @update:model-value="handleToggleStatus(item)"
          />
        </template>

        <template #item.createdAt="{ item }">
          <span class="text-medium-emphasis">
            {{ item.createdAt ? new Date(item.createdAt).toLocaleString() : '-' }}
          </span>
        </template>

        <template #item.action="{ item }">
          <VBtn
            icon
            variant="text"
            color="error"
            size="small"
            @click="confirmDelete(item)"
          >
            <VIcon icon="bx-trash" />
          </VBtn>
        </template>

        <template #no-data>
          <div class="text-center py-8 text-medium-emphasis">
            No bots registered. Click "Add Bot" to get started.
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Add Bot Dialog -->
    <VDialog v-model="showAddDialog" max-width="550">
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="bx-bot" class="me-2" />
          Register New Bot
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VForm @submit.prevent="handleAddBot">
            <VTextField
              v-model="newBot.botName"
              label="Bot Name"
              placeholder="My Bot"
              class="mb-4"
              :rules="[(v: string) => !!v || 'Required']"
            />
            <VTextField
              v-model="newBot.botUsername"
              label="Bot Username"
              placeholder="@my_bot"
              class="mb-4"
              :rules="[(v: string) => !!v || 'Required']"
            />
            <VTextField
              v-model="newBot.token"
              label="Bot Token"
              placeholder="123456:ABC-DEF..."
              class="mb-4"
              type="password"
              :rules="[(v: string) => !!v || 'Required']"
            />
            <VTextField
              v-model="newBot.secretToken"
              label="Secret Token (for webhook verification)"
              placeholder="Leave empty to auto-generate"
              class="mb-4"
              hint="Used to verify Telegram webhook requests"
            />
            <VSelect
              v-model="newBot.botType"
              :items="botTypes"
              item-title="title"
              item-value="value"
              label="Bot Type"
              class="mb-4"
            />
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showAddDialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!newBot.botName || !newBot.botUsername || !newBot.token" @click="handleAddBot">
            Register
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirm Dialog -->
    <VDialog v-model="showDeleteDialog" max-width="450">
      <VCard>
        <VCardTitle class="text-error">Delete Bot</VCardTitle>
        <VCardText>
          <p>Are you sure you want to delete <strong>{{ selectedBot?.botName }}</strong>?</p>
          <p class="text-body-2 text-medium-emphasis mt-2">Type the bot name to confirm:</p>
          <VTextField
            v-model="deleteBotName"
            :placeholder="selectedBot?.botName"
            density="compact"
            class="mt-2"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showDeleteDialog = false">Cancel</VBtn>
          <VBtn
            color="error"
            :disabled="deleteBotName !== selectedBot?.botName"
            @click="handleDeleteBot"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
