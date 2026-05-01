<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { telegramBotService } from '~/services/api'

definePageMeta({ layout: 'default' })

interface BlacklistItem {
  botName: string
  chatId: string
  redisKey: string
}

const blacklist = ref<BlacklistItem[]>([])
const bots = ref<any[]>([])
const loading = ref(false)
const selectedBot = ref<string>('')
const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'Bot', key: 'botName', width: '200px' },
  { title: 'Chat ID', key: 'chatId', width: '180px' },
  { title: 'Action', key: 'action', width: '120px', sortable: false },
]

watch(selectedBot, () => loadBlacklist())

async function loadBots() {
  try {
    const res = await telegramBotService.list()
    bots.value = Array.isArray(res?.bots) ? res.bots : []
  } catch {
    bots.value = []
  }
}

async function loadBlacklist() {
  loading.value = true
  try {
    const res = await telegramBotService.getBlacklist(selectedBot.value || undefined)
    blacklist.value = res?.blacklist || []
  } catch (e: any) {
    blacklist.value = []
    snackbar.value = { show: true, text: e?.message || 'Failed to load blacklist', color: 'error' }
  } finally {
    loading.value = false
  }
}

async function removeBlacklist(item: BlacklistItem) {
  loading.value = true
  try {
    await telegramBotService.removeBlacklist(item.botName, item.chatId)
    await loadBlacklist()
    snackbar.value = { show: true, text: 'Blacklist removed', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to remove', color: 'error' }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadBots()
  await loadBlacklist()
})
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="py-3">
        <h4 class="text-h4 mb-1">Blacklist</h4>
        <p class="text-body-2 text-medium-emphasis mb-0">Auto-blacklisted users after 2 unauthorized attempts (30 days TTL)</p>
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
              @update:model-value="loadBlacklist()"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VBtn variant="outlined" block :loading="loading" @click="loadBlacklist">
              <VIcon start icon="bx-refresh" />Refresh
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Blacklist Table -->
    <VCard>
      <VDataTable
        :headers="headers"
        :items="blacklist"
        :loading="loading"
        item-key="redisKey"
        density="comfortable"
        :items-per-page="15"
      >
        <template #item.action="{ item }">
          <VTooltip text="Remove from Blacklist">
            <template #activator="{ props }">
              <VBtn v-bind="props" icon variant="text" color="warning" size="small" @click="removeBlacklist(item)">
                <VIcon icon="mdi-check-circle" />
              </VBtn>
            </template>
          </VTooltip>
        </template>
        <template #no-data>
          <div class="text-center py-8 text-medium-emphasis">No blacklisted users</div>
        </template>
      </VDataTable>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top end" style="z-index: 9999">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
