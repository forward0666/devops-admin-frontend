<script setup lang="ts">
import { telegramBotService } from '~/services/api'

definePageMeta({ layout: 'default' })

const BOT_HEADERS = { 'X-Encrypted-Data': import.meta.env.VITE_BOT_SECRET || '' }

interface TopicItem {
  id: number
  threadId: number | null
  topicName: string
}

interface GroupItem {
  id: number
  chatId: number
  chatTitle: string
  chatType: string
  status: number
  topicCount: number
  topics: TopicItem[]
}

const groups = ref<GroupItem[]>([])
const bots = ref<any[]>([])
const loading = ref(false)
const selectedBot = ref<string>('')
const snackbar = ref({ show: false, text: '', color: 'success' })

// Add group
const isAddDialogVisible = ref(false)
const newGroup = ref({ chatId: '', chatTitle: '' })

// Edit group
const isEditDialogVisible = ref(false)
const editingGroup = ref<GroupItem | null>(null)

// Add topic
const isAddTopicDialogVisible = ref(false)
const topicGroupId = ref<number | null>(null)
const topicGroupTitle = ref('')
const newTopic = ref({ threadId: '', topicName: '' })

// Edit topic
const isEditTopicDialogVisible = ref(false)
const editingTopic = ref<TopicItem | null>(null)

// Delete dialog
const isDeleteDialogVisible = ref(false)
const deletingItem = ref<{ type: 'group' | 'topic'; item: any } | null>(null)

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
    const apiClient = (await import('~/services/api')).default
    const res = await apiClient.get(`/bot/group/${selectedBot.value}`, { headers: BOT_HEADERS }).then((r: any) => r.data?.data || r.data)
    const raw: any[] = res?.groups || []
    groups.value = Array.isArray(raw) ? raw : []
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load groups', color: 'error' }
  } finally {
    loading.value = false
  }
}

watch(selectedBot, () => fetchGroups())
onMounted(() => { fetchBots() })

// Group CRUD
async function addGroup() {
  if (!newGroup.value.chatId) return
  try {
    const apiClient = (await import('~/services/api')).default
    await apiClient.post('/bot/group', {
      botName: selectedBot.value,
      chatId: Number(newGroup.value.chatId),
      chatTitle: newGroup.value.chatTitle,
      chatType: 'supergroup',
    }, { headers: BOT_HEADERS })
    isAddDialogVisible.value = false
    newGroup.value = { chatId: '', chatTitle: '' }
    await fetchGroups()
    snackbar.value = { show: true, text: 'Group added', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed', color: 'error' }
  }
}

async function saveEditGroup() {
  if (!editingGroup.value) return
  try {
    const apiClient = (await import('~/services/api')).default
    await apiClient.put(`/bot/group/${editingGroup.value.id}`, {
      chatTitle: editingGroup.value.chatTitle,
      chatType: editingGroup.value.chatType,
    }, { headers: BOT_HEADERS })
    isEditDialogVisible.value = false
    await fetchGroups()
    snackbar.value = { show: true, text: 'Group updated', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed', color: 'error' }
  }
}

// Topic CRUD
function openAddTopic(group: GroupItem) {
  topicGroupId.value = group.id
  topicGroupTitle.value = group.chatTitle
  newTopic.value = { threadId: '', topicName: '' }
  isAddTopicDialogVisible.value = true
}

async function addTopic() {
  if (!topicGroupId.value || !newTopic.value.topicName) return
  try {
    const group = groups.value.find(g => g.id === topicGroupId.value)
    const apiClient = (await import('~/services/api')).default
    await apiClient.post('/bot/group/topic', {
      botName: selectedBot.value,
      chatId: group?.chatId,
      threadId: Number(newTopic.value.threadId) || null,
      topicName: newTopic.value.topicName,
    }, { headers: BOT_HEADERS })
    isAddTopicDialogVisible.value = false
    await fetchGroups()
    snackbar.value = { show: true, text: 'Topic added', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed', color: 'error' }
  }
}

function openEditTopic(topic: TopicItem) {
  editingTopic.value = { ...topic }
  isEditTopicDialogVisible.value = true
}

async function saveEditTopic() {
  if (!editingTopic.value) return
  try {
    const apiClient = (await import('~/services/api')).default
    await apiClient.put(`/bot/group/topic/${editingTopic.value.id}`, {
      topicName: editingTopic.value.topicName,
      threadId: editingTopic.value.threadId,
    }, { headers: BOT_HEADERS })
    isEditTopicDialogVisible.value = false
    await fetchGroups()
    snackbar.value = { show: true, text: 'Topic updated', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed', color: 'error' }
  }
}

// Delete
async function confirmDelete() {
  if (!deletingItem.value) return
  try {
    const apiClient = (await import('~/services/api')).default
    const { type, item } = deletingItem.value
    if (type === 'group') {
      await apiClient.delete(`/bot/group/${item.id}`, { headers: BOT_HEADERS })
    } else {
      await apiClient.delete(`/bot/group/topic/${item.id}`, { headers: BOT_HEADERS })
    }
    isDeleteDialogVisible.value = false
    await fetchGroups()
    snackbar.value = { show: true, text: 'Deleted', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed', color: 'error' }
  }
}

const expandedGroups = ref<string[]>([])
const toggleExpand = (chatId: number) => {
  const idx = expandedGroups.value.indexOf(String(chatId))
  if (idx >= 0) expandedGroups.value.splice(idx, 1)
  else expandedGroups.value.push(String(chatId))
}
const isExpanded = (chatId: number) => expandedGroups.value.includes(String(chatId))
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
        <VBtn prepend-icon="bx-plus" color="primary" size="small" @click="isAddDialogVisible = true">Add Group</VBtn>
      </VCardText>
      <VDivider />
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="groups.length" class="text-no-wrap" hover density="compact">
        <thead>
          <tr class="text-caption text-medium-emphasis">
            <th style="width: 120px;">Chat ID</th>
            <th>Group Name</th>
            <th style="width: 90px;">Topics</th>
            <th style="width: 80px;">Status</th>
            <th style="width: 90px;">Action</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in groups" :key="group.chatId">
            <tr class="cursor-pointer" @click="toggleExpand(group.chatId)">
              <td>{{ group.chatId }}</td>
              <td>
                <div class="d-flex align-center">
                  <VIcon :icon="isExpanded(group.chatId) ? 'bx-chevron-down' : 'bx-chevron-right'" size="16" class="me-1 text-medium-emphasis" />
                  <span class="font-weight-medium">{{ group.chatTitle || '-' }}</span>
                </div>
              </td>
              <td>
                <VChip variant="tonal" color="info" size="small" label>{{ group.topicCount }}</VChip>
              </td>
              <td>
                <VChip variant="tonal" :color="group.status === 1 ? 'success' : 'error'" size="small" label>{{ group.status === 1 ? 'Active' : 'Disabled' }}</VChip>
              </td>
              <td>
                <div class="d-flex gap-1">
                  <IconBtn size="small" @click.stop="editingGroup = { ...group }; isEditDialogVisible = true"><VIcon icon="bx-edit" size="18" /></IconBtn>
                  <IconBtn size="small" color="error" @click.stop="deletingItem = { type: 'group', item: group }; isDeleteDialogVisible = true"><VIcon icon="bx-trash" size="18" /></IconBtn>
                </div>
              </td>
            </tr>
            <template v-if="isExpanded(group.chatId)">
              <tr v-for="topic in group.topics" :key="topic.id">
                <td class="pl-8"></td>
                <td class="pl-12">
                  <div class="d-flex align-center gap-2">
                    <VIcon icon="bx-conversation" size="16" class="text-medium-emphasis" />
                    <span>{{ topic.topicName }}</span>
                    <span class="text-caption text-medium-emphasis">(thread: {{ topic.threadId || '-' }})</span>
                  </div>
                </td>
                <td></td>
                <td></td>
                <td>
                  <div class="d-flex gap-1">
                    <IconBtn size="small" @click.stop="openEditTopic(topic)"><VIcon icon="bx-edit" size="18" /></IconBtn>
                    <IconBtn size="small" color="error" @click.stop="deletingItem = { type: 'topic', item: topic }; isDeleteDialogVisible = true"><VIcon icon="bx-trash" size="18" /></IconBtn>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="5" class="text-center pa-2">
                  <VBtn size="x-small" variant="text" color="primary" @click.stop="openAddTopic(group)">
                    <VIcon icon="bx-plus" size="14" class="me-1" />Add Topic
                  </VBtn>
                </td>
              </tr>
              <tr v-if="!group.topics.length">
                <td colspan="5" class="text-center text-medium-emphasis text-caption pa-2">No topics</td>
              </tr>
            </template>
          </template>
        </tbody>
      </VTable>
      <VCardText v-if="!loading && !groups.length" class="text-center text-medium-emphasis pa-6">
        No groups found
      </VCardText>
    </VCard>

    <!-- Add Group -->
    <VDialog v-model="isAddDialogVisible" max-width="450">
      <VCard>
        <VCardItem><VCardTitle>Add Group</VCardTitle></VCardItem>
        <VCardText>
          <VTextField v-model="newGroup.chatId" label="Chat ID" placeholder="-1001234567890" density="comfortable" class="mb-3" variant="outlined" type="number" />
          <VTextField v-model="newGroup.chatTitle" label="Group Name" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!newGroup.chatId" @click="addGroup">Add</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Group -->
    <VDialog v-model="isEditDialogVisible" max-width="450">
      <VCard>
        <VCardItem><VCardTitle>Edit Group</VCardTitle></VCardItem>
        <VCardText>
          <VTextField v-model="editingGroup!.chatTitle" label="Group Name" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editingGroup!.chatType" label="Type" :items="['supergroup', 'group', 'forum']" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveEditGroup">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Add Topic -->
    <VDialog v-model="isAddTopicDialogVisible" max-width="450">
      <VCard>
        <VCardItem><VCardTitle>Add Topic</VCardTitle></VCardItem>
        <VCardText>
          <p class="text-caption text-medium-emphasis mb-3">Group: {{ topicGroupTitle }}</p>
          <VTextField v-model="newTopic.topicName" label="Topic Name" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="newTopic.threadId" label="Thread ID" density="comfortable" variant="outlined" type="number" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isAddTopicDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!newTopic.topicName" @click="addTopic">Add</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Topic -->
    <VDialog v-model="isEditTopicDialogVisible" max-width="450">
      <VCard>
        <VCardItem><VCardTitle>Edit Topic</VCardTitle></VCardItem>
        <VCardText>
          <VTextField v-model="editingTopic!.topicName" label="Topic Name" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editingTopic!.threadId" label="Thread ID" density="comfortable" variant="outlined" type="number" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditTopicDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveEditTopic">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Dialog -->
    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardItem><VCardTitle>Confirm Delete</VCardTitle></VCardItem>
        <VCardText>Are you sure you want to delete this {{ deletingItem?.type }}?</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
