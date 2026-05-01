<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { telegramBotService } from '~/services/api'

definePageMeta({ layout: 'default' })

interface BotItem {
  id: number
  botName: string
  botUsername: string
  botType: string
  status: number
  createdAt: string
}

const bots = ref<BotItem[]>([])
const loading = ref(false)
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedBot = ref<BotItem | null>(null)
const deleteBotName = ref('')
const snackbar = ref({ show: false, text: '', color: 'success' })
const showEditDialog = ref(false)
const editBot = ref({ botName: '', botUsername: '', token: '', botType: '', status: 1 })
const editStatusItems = [
  { title: 'Enabled', value: 1 },
  { title: 'Disabled', value: 0 },
]

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
    snackbar.text = e?.message || 'Failed to load bot list'
    snackbar.color = 'error'
    snackbar.show = true
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
    snackbar.text = 'Bot registered successfully'
    snackbar.color = 'success'
    snackbar.show = true
  } catch (e: any) {
    snackbar.text = e?.message || 'Failed to register bot'
    snackbar.color = 'error'
    snackbar.show = true
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
    snackbar.text = `${bot.botName} ${newStatus === 1 ? 'enabled' : 'disabled'}`
    snackbar.color = 'success'
    snackbar.show = true
  } catch (e: any) {
    snackbar.text = e?.message || 'Failed to update status'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    loading.value = false
  }
}

function confirmDelete(bot: BotItem) {
  selectedBot.value = bot
  deleteBotName.value = ''
  showDeleteDialog.value = true
}

function openEditDialog(bot: BotItem) {
  selectedBot.value = bot
  editBot.value = { botName: bot.botName, botUsername: bot.botUsername, token: '', botType: bot.botType || 'GENERAL', status: bot.status }
  showEditDialog.value = true
}

async function handleEditBot() {
  if (!selectedBot.value) return
  loading.value = true
  try {
    await telegramBotService.update(selectedBot.value.botName, {
      botType: editBot.value.botType,
      status: editBot.value.status,
      ...(editBot.value.token ? { token: editBot.value.token } : {}),
    })
    showEditDialog.value = false
    await loadBots()
    snackbar.text = 'Bot updated'
    snackbar.color = 'success'
    snackbar.show = true
  } catch (e: any) {
    snackbar.text = e?.message || 'Failed to update bot'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    loading.value = false
  }
}

async function handleDeleteBot() {
  if (!selectedBot.value || deleteBotName.value !== selectedBot.value.botName) return
  loading.value = true
  try {
    await telegramBotService.deleteBot(selectedBot.value.botName)
    showDeleteDialog.value = false
    await loadBots()
    snackbar.text = `${selectedBot.value.botName} deleted`
    snackbar.color = 'success'
    snackbar.show = true
  } catch (e: any) {
    snackbar.text = e?.message || 'Failed to delete bot'
    snackbar.color = 'error'
    snackbar.show = true
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
          <VChip :color="item.status === 1 ? 'success' : 'error'" size="small" variant="flat">
            {{ item.status === 1 ? 'Enabled' : 'Disabled' }}
          </VChip>
        </template>

        <template #item.createdAt="{ item }">
          <span class="text-medium-emphasis">
            {{ item.createdAt ? new Date(item.createdAt).toLocaleString() : '-' }}
          </span>
        </template>

        <template #item.action="{ item }">
          <VTooltip text="Edit">
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                icon
                variant="text"
                color="primary"
                size="small"
                @click="openEditDialog(item)"
              >
                <VIcon icon="bx-edit" />
              </VBtn>
            </template>
          </VTooltip>
          <VTooltip text="Delete">
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                icon
                variant="text"
                color="error"
                size="small"
                @click="confirmDelete(item)"
              >
                <VIcon icon="bx-trash" />
              </VBtn>
            </template>
          </VTooltip>
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

    <!-- Edit Bot Dialog -->
    <VDialog v-model="showEditDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="bx-edit" class="me-2" />
          Edit Bot
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VTextField
            v-model="editBot.botName"
            label="Bot Name"
            class="mb-4"
            disabled
          />
          <VTextField
            v-model="editBot.botUsername"
            label="Bot Username"
            class="mb-4"
            disabled
          />
          <VTextField
            v-model="editBot.token"
            label="Bot Token"
            placeholder="Leave empty to keep current token"
            class="mb-4"
            type="password"
            hint="Only fill this to change the token"
          />
          <VSelect
            v-model="editBot.botType"
            :items="botTypes"
            item-title="title"
            item-value="value"
            label="Bot Type"
            class="mb-4"
          />
          <VSelect
            v-model="editBot.status"
            :items="editStatusItems"
            item-title="title"
            item-value="value"
            label="Status"
            class="mb-4"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showEditDialog = false">Cancel</VBtn>
          <VBtn color="primary" @click="handleEditBot">
            Save
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
    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top end">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
