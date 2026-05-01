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

// Detail dialog
const showDetailDialog = ref(false)
const detailTab = ref('webhook')
const webhookInfo = ref<any>(null)
const authorizedChats = ref<any[]>([])
const authStats = ref<any>(null)
const detailLoading = ref(false)
const showSetWebhookDialog = ref(false)
const webhookForm = ref({ url: '', secretToken: '' })
const resetLoading = ref(false)

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
  { title: 'Action', key: 'action', width: '200px', sortable: false },
]

async function loadBots() {
  loading.value = true
  try {
    const res = await telegramBotService.list()
    bots.value = Array.isArray(res?.bots) ? res.bots : []
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load bot list', color: 'error' }
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
    snackbar.value = { show: true, text: 'Bot registered successfully', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to register bot', color: 'error' }
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
    snackbar.value = { show: true, text: 'Bot updated', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to update bot', color: 'error' }
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
    snackbar.value = { show: true, text: `${selectedBot.value.botName} deleted`, color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to delete bot', color: 'error' }
  } finally {
    loading.value = false
  }
}

async function openDetail(bot: BotItem) {
  selectedBot.value = bot
  detailTab.value = 'webhook'
  showDetailDialog.value = true
  await loadBotDetail()
}

async function loadBotDetail() {
  if (!selectedBot.value) return
  detailLoading.value = true
  try {
    const [wh, chats, stats] = await Promise.all([
      telegramBotService.getWebhookInfo(selectedBot.value.botName),
      telegramBotService.getAuthorizedChats(selectedBot.value.botName),
      telegramBotService.getAuthorizationStats(selectedBot.value.botName),
    ])
    webhookInfo.value = wh?.webhookInfo || wh
    authorizedChats.value = chats?.authorizedChats || []
    authStats.value = stats
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load details', color: 'error' }
  } finally {
    detailLoading.value = false
  }
}

async function removeChatAuth(id: number) {
  try {
    await telegramBotService.deleteAuthorization(id)
    authorizedChats.value = authorizedChats.value.filter((c: any) => c.id !== id)
    snackbar.value = { show: true, text: 'Authorization removed', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to remove', color: 'error' }
  }
}

async function handleResetUpdates() {
  if (!selectedBot.value) return
  resetLoading.value = true
  try {
    await telegramBotService.resetPendingUpdates(selectedBot.value.botName)
    await loadBotDetail()
    snackbar.value = { show: true, text: 'Pending updates cleared', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to reset', color: 'error' }
  } finally {
    resetLoading.value = false
  }
}

async function handleSetWebhook() {
  if (!selectedBot.value || !webhookForm.value.url) return
  detailLoading.value = true
  try {
    await telegramBotService.setWebhook(selectedBot.value.botName, webhookForm.value.url, webhookForm.value.secretToken || undefined)
    showSetWebhookDialog.value = false
    webhookForm.value = { url: '', secretToken: '' }
    await loadBotDetail()
    snackbar.value = { show: true, text: 'Webhook set successfully', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to set webhook', color: 'error' }
  } finally {
    detailLoading.value = false
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
          <VTooltip text="Details">
            <template #activator="{ props }">
              <VBtn v-bind="props" icon variant="text" color="info" size="small" @click="openDetail(item)">
                <VIcon icon="bx-info-circle" />
              </VBtn>
            </template>
          </VTooltip>
          <VTooltip text="Edit">
            <template #activator="{ props }">
              <VBtn v-bind="props" icon variant="text" color="primary" size="small" @click="openEditDialog(item)">
                <VIcon icon="bx-edit" />
              </VBtn>
            </template>
          </VTooltip>
          <VTooltip text="Delete">
            <template #activator="{ props }">
              <VBtn v-bind="props" icon variant="text" color="error" size="small" @click="confirmDelete(item)">
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
            <VTextField v-model="newBot.botName" label="Bot Name" placeholder="My Bot" class="mb-4" :rules="[(v: string) => !!v || 'Required']" />
            <VTextField v-model="newBot.botUsername" label="Bot Username" placeholder="@my_bot" class="mb-4" :rules="[(v: string) => !!v || 'Required']" />
            <VTextField v-model="newBot.token" label="Bot Token" placeholder="123456:ABC-DEF..." class="mb-4" type="password" :rules="[(v: string) => !!v || 'Required']" />
            <VTextField v-model="newBot.secretToken" label="Secret Token" placeholder="Leave empty to auto-generate" class="mb-4" hint="Used to verify Telegram webhook requests" />
            <VSelect v-model="newBot.botType" :items="botTypes" item-title="title" item-value="value" label="Bot Type" />
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showAddDialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!newBot.botName || !newBot.botUsername || !newBot.token" @click="handleAddBot">Register</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Bot Dialog -->
    <VDialog v-model="showEditDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="bx-edit" class="me-2" />Edit Bot
        </VCardTitle>
        <VDivider />
        <VCardText>
          <VTextField v-model="editBot.botName" label="Bot Name" class="mb-4" disabled />
          <VTextField v-model="editBot.botUsername" label="Bot Username" class="mb-4" disabled />
          <VTextField v-model="editBot.token" label="Bot Token" placeholder="Leave empty to keep current" class="mb-4" type="password" hint="Only fill to change token" />
          <VSelect v-model="editBot.botType" :items="botTypes" item-title="title" item-value="value" label="Bot Type" class="mb-4" />
          <VSelect v-model="editBot.status" :items="editStatusItems" item-title="title" item-value="value" label="Status" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showEditDialog = false">Cancel</VBtn>
          <VBtn color="primary" @click="handleEditBot">Save</VBtn>
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
          <VTextField v-model="deleteBotName" :placeholder="selectedBot?.botName" density="compact" class="mt-2" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showDeleteDialog = false">Cancel</VBtn>
          <VBtn color="error" :disabled="deleteBotName !== selectedBot?.botName" @click="handleDeleteBot">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Detail Dialog -->
    <VDialog v-model="showDetailDialog" max-width="700">
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="bx-info-circle" class="me-2" />
          {{ selectedBot?.botName }}
          <VChip :color="selectedBot?.status === 1 ? 'success' : 'error'" size="small" class="ms-2">
            {{ selectedBot?.status === 1 ? 'Enabled' : 'Disabled' }}
          </VChip>
        </VCardTitle>
        <VDivider />
        <VTabs v-model="detailTab" grow>
          <VTab value="webhook">Webhook</VTab>
          <VTab value="chats">Authorized Chats</VTab>
        </VTabs>
        <VDivider />
        <VCardText>
          <VWindow v-model="detailTab">
            <!-- Webhook Tab -->
            <VWindowItem value="webhook">
              <div v-if="detailLoading" class="text-center py-4">
                <VProgressCircular indeterminate />
              </div>
              <div v-else-if="webhookInfo">
                <VList density="compact">
                  <VListItem title="URL" :subtitle="webhookInfo.url || 'Not set'" prepend-icon="bx-link" />
                  <VListItem title="Has Custom Certificate" :subtitle="String(webhookInfo.has_custom_certificate ?? false)" prepend-icon="bx-certification" />
                  <VListItem title="Pending Updates" prepend-icon="bx-message">
                    <template #subtitle>
                      <span class="d-flex align-center">
                        {{ String(webhookInfo.pending_update_count ?? 0) }}
                        <VBtn v-if="(webhookInfo.pending_update_count ?? 0) > 0" size="x-small" color="warning" variant="text" icon="bx-refresh" class="ms-2" :loading="resetLoading" @click="handleResetUpdates" />
                      </span>
                    </template>
                  </VListItem>
                  <VListItem v-if="webhookInfo.last_error_date" title="Last Error" :subtitle="`[${new Date(webhookInfo.last_error_date * 1000).toLocaleString()}] ${webhookInfo.last_error_message || ''}`" prepend-icon="bx-error" />
                  <VListItem v-if="webhookInfo.allowed_updates" title="Allowed Updates" :subtitle="webhookInfo.allowed_updates.join(', ')" prepend-icon="bx-filter" />
                </VList>
                <VBtn variant="outlined" color="primary" class="mt-4" @click="showSetWebhookDialog = true">
                  <VIcon start icon="bx-cog" />Set Webhook
                </VBtn>
              </div>
              <div v-else class="text-center py-4 text-medium-emphasis">
                No webhook info available
              </div>
            </VWindowItem>

            <!-- Authorized Chats Tab -->
            <VWindowItem value="chats">
              <div v-if="detailLoading" class="text-center py-4">
                <VProgressCircular indeterminate />
              </div>
              <div v-else>
                <!-- Stats -->
                <VRow v-if="authStats" class="mb-3">
                  <VCol cols="4">
                    <VCard variant="tonal" color="primary">
                      <VCardText class="text-center pa-2">
                        <div class="text-h5">{{ authStats.totalAuthorizations || 0 }}</div>
                        <div class="text-caption">Total</div>
                      </VCardText>
                    </VCard>
                  </VCol>
                  <VCol cols="4">
                    <VCard variant="tonal" color="success">
                      <VCardText class="text-center pa-2">
                        <div class="text-h5">{{ authStats.activeAuthorizations || 0 }}</div>
                        <div class="text-caption">Active</div>
                      </VCardText>
                    </VCard>
                  </VCol>
                  <VCol cols="4">
                    <VCard variant="tonal" color="error">
                      <VCardText class="text-center pa-2">
                        <div class="text-h5">{{ authStats.inactiveAuthorizations || 0 }}</div>
                        <div class="text-caption">Inactive</div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>

                <!-- Chat List -->
                <VDataTable
                  :headers="[
                    { title: 'Chat ID', key: 'chatId', width: '150px' },
                    { title: 'Name', key: 'chatName', width: '200px' },
                    { title: 'Type', key: 'type', width: '100px' },
                    { title: 'Status', key: 'status', width: '100px' },
                    { title: 'Action', key: 'action', width: '80px', sortable: false },
                  ]"
                  :items="authorizedChats"
                  density="compact"
                  :items-per-page="10"
                >
                  <template #item.status="{ item }">
                    <VChip :color="item.status === 1 ? 'success' : 'error'" size="x-small">
                      {{ item.status === 1 ? 'Active' : 'Inactive' }}
                    </VChip>
                  </template>
                  <template #item.action="{ item }">
                    <VBtn icon variant="text" color="error" size="x-small" @click="removeChatAuth(item.id)">
                      <VIcon icon="bx-trash" />
                    </VBtn>
                  </template>
                  <template #no-data>
                    <div class="text-center py-4 text-medium-emphasis">No authorized chats</div>
                  </template>
                </VDataTable>
              </div>
            </VWindowItem>
          </VWindow>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showDetailDialog = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Set Webhook Dialog -->
    <VDialog v-model="showSetWebhookDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="bx-cog" class="me-2" />Set Webhook
        </VCardTitle>
        <VDivider />
        <VCardText>
          <p class="text-body-2 text-medium-emphasis mb-4">Bot: <strong>{{ selectedBot?.botName }}</strong></p>
          <VTextField
            v-model="webhookForm.url"
            label="Webhook URL"
            placeholder="https://your-domain.com/callback/MyBot"
            class="mb-4"
            :rules="[(v: string) => !!v || 'Required']"
          />
          <VTextField
            v-model="webhookForm.secretToken"
            label="Secret Token (optional)"
            placeholder="Leave empty to use existing"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="showSetWebhookDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="detailLoading" :disabled="!webhookForm.url" @click="handleSetWebhook">Set</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top end">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
