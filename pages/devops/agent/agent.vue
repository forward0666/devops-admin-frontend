<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const AGENT_GATEWAY = '/agent'
const agents = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Chat
const chatDialog = ref(false)
const chatAgentId = ref<number | null>(null)
const chatMessages = ref<Array<{role: string, text: string}>>([])
const chatInput = ref('')
const chatLoading = ref(false)
const chatStreamContent = ref('')
const chatBodyRef = ref<HTMLElement | null>(null)
const expandedPrompt = ref<string | null>(null)
const promptParams = ref<Record<string, string>>({})
const chatSessions = ref<Array<{id: string, title: string, time: string}>>([])
const chatSessionId = ref('')
const chatSessionTitle = ref('')
const currentUserId = ref('')

const form = ref({
  name: '',
  type: 'weather',
  mcp_url: '',
  model_id: null as number | null,
  description: '',
  config: {} as Record<string, any>,
  enabled: true,
})

const modelOptions = ref<{ title: string; value: number }[]>([
  { title: 'None (Keyword Mode)', value: 0 },
])

const typeOptions = [
  { title: 'Weather', value: 'weather' },
  { title: 'K8S', value: 'k8s' },
  { title: 'Cloudflare', value: 'cloudflare' },
  { title: 'DevOps', value: 'devops' },
  { title: 'Custom', value: 'custom' },
]

const mcpServices = ref<any[]>([])
const discovering = ref(false)

async function discoverMcpServices() {
  discovering.value = true
  try {
    const { data } = await apiClient.get(`${AGENT_GATEWAY}/agents/discover`)
    mcpServices.value = data?.data || []
  } catch (e) {
    console.error('Failed to discover MCP services', e)
  } finally {
    discovering.value = false
  }
}

async function fetchModels() {
  try {
    const { data } = await apiClient.get(`${AGENT_GATEWAY}/models`)
    const list = data?.data || []
    modelOptions.value = [{ title: 'None (Keyword Mode)', value: 0 }]
    for (const m of list) {
      modelOptions.value.push({ title: `${m.name} (${m.provider}/${m.model_id})`, value: m.id })
    }
  } catch (e) {
    console.error('Failed to fetch models', e)
  }
}

function onTypeChange() {
  // Auto-fill MCP URL from discovered services
  const typeMap: Record<string, string> = {
    weather: 'mcp-weather',
    k8s: 'mcp-k8s',
    cloudflare: 'mcp-cloudflare',
    devops: 'mcp-devops',
  }
  const mcpName = typeMap[form.value.type] || `${form.value.type}-mcp`
  const matched = mcpServices.value.find(s => s.name === mcpName)
  if (matched && matched.url) {
    form.value.mcp_url = matched.url
  }
}

const statusColors: Record<string, string> = {
  online: 'success',
  offline: 'grey',
  error: 'error',
}

async function fetchAgents() {
  loading.value = true
  try {
    const { data } = await apiClient.get(`${AGENT_GATEWAY}/agents`)
    agents.value = data?.data || []
  } catch (e) {
    console.error('Failed to fetch agents', e)
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  editingId.value = null
  form.value = { name: '', type: 'weather', mcp_url: '', model_id: null, description: '', config: {}, enabled: true }
  await discoverMcpServices()
  await fetchModels()
  onTypeChange()
  dialog.value = true
}

function openEdit(agent: any) {
  editingId.value = agent.id
  fetchModels().then(() => {
    form.value = {
      name: agent.name || '',
      type: agent.type || 'weather',
      mcp_url: agent.mcp_url || '',
      model_id: agent.model_id || null,
      description: agent.description || '',
      config: agent.config || {},
      enabled: !!agent.enabled,
    }
    dialog.value = true
  })
}

async function save() {
  if (!form.value.name.trim()) {
    snackbar.value = { show: true, text: 'Name is required', color: 'error' }
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await apiClient.put(`${AGENT_GATEWAY}/agents/${editingId.value}`, form.value)
      snackbar.value = { show: true, text: 'Agent updated', color: 'success' }
    } else {
      await apiClient.post(`${AGENT_GATEWAY}/agents`, form.value)
      snackbar.value = { show: true, text: 'Agent created', color: 'success' }
    }
    dialog.value = false
    await fetchAgents()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  } finally {
    saving.value = false
  }
}

async function handleDelete(agent: any) {
  if (!confirm(`Delete "${agent.name}"?`)) return
  try {
    await apiClient.delete(`${AGENT_GATEWAY}/agents/${agent.id}`)
    snackbar.value = { show: true, text: 'Agent deleted', color: 'success' }
    await fetchAgents()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || 'Failed', color: 'error' }
  }
}

async function toggleEnabled(agent: any) {
  try {
    await apiClient.patch(`${AGENT_GATEWAY}/agents/${agent.id}`, { enabled: !agent.enabled })
    agent.enabled = !agent.enabled
  } catch (e: any) {
    snackbar.value = { show: true, text: 'Failed to toggle', color: 'error' }
  }
}

async function checkStatus(agent: any) {
  try {
    const { data } = await apiClient.get(`${AGENT_GATEWAY}/agents/${agent.id}/status`)
    agent.status = data?.data?.status || 'offline'
  } catch {
    agent.status = 'offline'
  }
}

const activeAgents = computed(() => agents.value.filter(a => a.enabled))
const onlineAgents = computed(() => agents.value.filter(a => a.status === 'online'))

onMounted(() => {
  fetchAgents()
  discoverMcpServices()
  fetchModels()
})

const chatAgentType = ref('')

const chatPlaceholders: Record<string, string> = {
  weather: 'e.g. Beijing or Tokyo forecast',
  k8s: 'e.g. pods, logs my-pod, scale deploy 3, nodes',
}

const chatHints = ref({
  weather: [
    { cmd: 'Beijing', desc: '当前天气' },
    { cmd: 'Tokyo forecast', desc: '天气预报' },
    { cmd: '上海天气', desc: '中文城市名' },
  ] as any[],
  cloudflare: [] as any[],
  k8s: [
    { cmd: 'pods', desc: '列出 Pod' },
    { cmd: 'deploy', desc: '列出 Deployment' },
    { cmd: 'svc / service', desc: '列出 Service' },
    { cmd: 'nodes', desc: '列出节点' },
    { cmd: 'ns / namespace', desc: '列出命名空间' },
    { cmd: 'events', desc: '最近事件' },
    { cmd: 'summary / cluster', desc: '集群概览' },
    { cmd: 'logs <pod>', desc: 'Pod 日志' },
    { cmd: 'scale <deploy> 3', desc: '扩缩容' },
    { cmd: 'restart <pod>', desc: '重启原因' },
    { cmd: 'delete <pod>', desc: '删除 Pod' },
    { cmd: 'ns=xxx pods', desc: '指定命名空间' },
  ],
}

function openChat(agent: any) {
  chatAgentId.value = agent.id
  chatAgentType.value = agent.type || ''
  chatMessages.value = []
  chatInput.value = ''
  chatSessionId.value = ''
  chatSessionTitle.value = ''
  // Get user ID from auth store or localStorage
  try {
    const authData = localStorage.getItem('auth') || '{}'
    const parsed = JSON.parse(authData)
    currentUserId.value = parsed?.user?.username || parsed?.username || parsed?.user?.name || 'anonymous'
  } catch { currentUserId.value = 'anonymous' }
  chatDialog.value = true
  loadChatSessions(agent.id)
  loadAgentTools(agent.id, agent.type)
}

async function loadAgentTools(agentId: number, agentType: string) {
  try {
    const { data } = await apiClient.get(`${AGENT_GATEWAY}/agents/${agentId}/tools`)
    const toolsData = data?.data || {}
    const allHints = [
      ...(toolsData.tools || []).map((t: any) => ({ cmd: t.command || t.name, desc: t.description, params: t.params || [] })),
      ...(toolsData.prompts || []).map((p: any) => ({ cmd: p.command || p.name, desc: p.description, params: p.params || [] })),
    ]
    chatHints.value[agentType] = allHints
  } catch (e) {
    console.error('Load tools error:', e)
  }
}

function togglePrompt(h: any) {
  if (expandedPrompt.value === h.cmd) {
    expandedPrompt.value = null
    promptParams.value = {}
  } else {
    expandedPrompt.value = h.cmd
    promptParams.value = {}
    if (!h.params?.length) {
      // No params, fill directly
      chatInput.value = h.cmd
      expandedPrompt.value = null
    }
  }
}

function executePrompt(h: any) {
  // Build command: cmd param1=val1 param2=val2
  let cmd = h.cmd
  for (const p of (h.params || [])) {
    const val = promptParams.value[p.name]
    if (val) cmd += ` ${p.name}=${val}`
  }
  chatInput.value = cmd
  expandedPrompt.value = null
  promptParams.value = {}
}

function scrollChatBottom() {
  nextTick(() => {
    const el = document.querySelector('.chat-body')
    if (el) el.scrollTop = el.scrollHeight
  })
}

function newChatSession() {
  chatSessionId.value = `${currentUserId.value}_${Date.now()}`
  chatSessionTitle.value = ''
  chatMessages.value = []
}

async function loadChatSessions(agentId: number) {
  try {
    const gatewayBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
    const url = `${gatewayBase}${AGENT_GATEWAY}/agents/${agentId}/chat/sessions`
    console.log('[Agent] Loading sessions:', url)
    const resp = await fetch(url, {
      headers: { 'X-Encrypted-Data': import.meta.env.VITE_AGENT_SECRET || import.meta.env.VITE_GATEWAY_SECRET || '' },
    })
    console.log('[Agent] Sessions response:', resp.status)
    const data = await resp.json()
    console.log('[Agent] Sessions data:', data)
    const allSessions = data?.data || []
    chatSessions.value = allSessions.filter((s: any) => s.id?.startsWith(currentUserId.value + '_'))
    console.log('[Agent] Filtered sessions:', chatSessions.value.length)
  } catch (e) {
    console.error('[Agent] Load sessions error:', e)
    chatSessions.value = []
  }
}

async function deleteChatSession(sessionId: string) {
  if (!confirm('Delete this chat session?')) return
  try {
    const gatewayBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
    await fetch(`${gatewayBase}${AGENT_GATEWAY}/agents/${chatAgentId.value}/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'X-Encrypted-Data': import.meta.env.VITE_AGENT_SECRET || import.meta.env.VITE_GATEWAY_SECRET || '' },
    })
    chatSessions.value = chatSessions.value.filter(s => s.id !== sessionId)
    if (chatSessionId.value === sessionId) {
      chatSessionId.value = ''
      chatMessages.value = []
    }
  } catch (e) {
    console.error('Delete session error:', e)
  }
}

async function loadChatSession(sessionId: string) {
  chatSessionId.value = sessionId
  try {
    const gatewayBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
    const resp = await fetch(`${gatewayBase}${AGENT_GATEWAY}/agents/${chatAgentId.value}/chat/history?session_id=${sessionId}`, {
      headers: { 'X-Encrypted-Data': import.meta.env.VITE_AGENT_SECRET || import.meta.env.VITE_GATEWAY_SECRET || '' },
    })
    const data = await resp.json()
    const history = data?.data || []
    chatMessages.value = history.map((h: any) => ({
      role: h.role,
      text: h.text,
    }))
    chatSessionTitle.value = sessionId.replace(currentUserId.value + '_', '').slice(0, 16)
  } catch {
    chatMessages.value = []
  }
}

async function sendChat() {
  if (!chatInput.value.trim() || !chatAgentId.value) return
  const msg = chatInput.value.trim()
  chatMessages.value.push({ role: 'user', text: msg })
  chatInput.value = ''
  chatLoading.value = true
  scrollChatBottom()
  chatStreamContent.value = ''

  try {
    const gatewayBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
    if (!chatSessionId.value) {
      chatSessionId.value = `${currentUserId.value}_${Date.now()}`
    }
    const url = `${gatewayBase}${AGENT_GATEWAY}/agents/${chatAgentId.value}/chat/stream?message=${encodeURIComponent(msg)}&session_id=${chatSessionId.value}`

    const response = await fetch(url, {
      headers: {
        'X-Encrypted-Data': import.meta.env.VITE_AGENT_SECRET || import.meta.env.VITE_GATEWAY_SECRET || '',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader')
    const decoder = new TextDecoder()
  
    // Add a streaming assistant message
    chatMessages.value.push({ role: 'assistant', text: '' })
    const lastMsg = chatMessages.value[chatMessages.value.length - 1]
  
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6))
          if (event.type === 'content') {
            chatStreamContent.value += event.text
            lastMsg.text = chatStreamContent.value
            scrollChatBottom()
          } else if (event.type === 'response') {
            chatStreamContent.value = event.text
            lastMsg.text = chatStreamContent.value
            scrollChatBottom()
          } else if (event.type === 'status') {
            lastMsg.text = `[${event.text}]`
          } else if (event.type === 'thinking') {
            lastMsg.text = '🤔 Thinking...'
          } else if (event.type === 'error') {
            chatMessages.value[chatMessages.value.length - 1] = { role: 'error', text: event.text }
          } else if (event.type === 'done') {
            if (!chatStreamContent.value) lastMsg.text = 'Done'
          }
        } catch {}
      }
    }
    // Auto-title from first message
    if (chatMessages.value.filter(m => m.role === 'user').length === 1) {
      chatSessionTitle.value = msg.slice(0, 30)
    }
    // Refresh sessions list
    loadChatSessions(chatAgentId.value)
  } catch (e: any) {
    chatMessages.value.push({ role: 'error', text: e?.message || 'Failed' })
  } finally {
    chatLoading.value = false
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Agent Management</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage AI agents and their MCP connections</p>
        </div>
        <VChip size="small" color="primary" variant="tonal">Total: {{ agents.length }}</VChip>
        <VChip size="small" color="success" variant="tonal">Online: {{ onlineAgents.length }}</VChip>
        <VBtn color="primary" @click="openCreate">
          <VIcon icon="bx-plus" class="me-1" /> Add Agent
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Table -->
    <VCard style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
      <VProgressLinear v-if="loading" indeterminate color="primary" />
      <VTable v-if="agents.length > 0" class="sticky-table" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 150px !important" />
          <col style="width: 80px !important" />
          <col style="width: 140px !important" />
          <col style="width: 250px !important" />
          <col style="width: 200px !important" />
          <col style="width: 80px !important" />
          <col style="width: 80px !important" />
          <col style="width: 130px !important" />
        </colgroup>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Model</th>
            <th>MCP URL</th>
            <th>Description</th>
            <th>Status</th>
            <th>Enabled</th>
            <th style="text-align: center;">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="agent in agents" :key="agent.id">
            <td class="font-weight-medium">{{ agent.name }}</td>
            <td>
              <VChip size="x-small" variant="tonal" color="primary">{{ agent.type }}</VChip>
            </td>
            <td>
              <VChip v-if="agent.model_name" size="x-small" variant="tonal" color="info">{{ agent.model_name }}</VChip>
              <span v-else class="text-caption text-medium-emphasis">Keyword</span>
            </td>
            <td>
              <code class="text-caption">{{ agent.mcp_url || '-' }}</code>
            </td>
            <td class="text-caption text-medium-emphasis">{{ agent.description || '-' }}</td>
            <td>
              <VChip size="x-small" :color="statusColors[agent.status] || 'grey'" variant="tonal">
                {{ agent.status || 'offline' }}
              </VChip>
            </td>
            <td>
              <VSwitch
                :model-value="agent.enabled"
                @update:model-value="toggleEnabled(agent)"
                color="success"
                density="compact"
                hide-details
              />
            </td>
            <td style="text-align: center;">
              <VTooltip text="Chat">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="success" @click="openChat(agent)">
                    <VIcon icon="bx-message-rounded" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
              <VTooltip text="Check Status">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="info" @click="checkStatus(agent)">
                    <VIcon icon="bx-refresh" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
              <VTooltip text="Edit">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="primary" @click="openEdit(agent)">
                    <VIcon icon="bx-edit" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
              <VTooltip text="Delete">
                <template #activator="{ props }">
                  <VBtn v-bind="props" icon size="x-small" variant="text" color="error" @click="handleDelete(agent)">
                    <VIcon icon="bx-trash" size="16" />
                  </VBtn>
                </template>
              </VTooltip>
            </td>
          </tr>
        </tbody>
      </VTable>
      <VCardText v-else-if="!loading" class="text-center py-8 text-medium-emphasis">
        <VIcon icon="bx-bot" size="48" class="mb-2" />
        <p>No agents yet. Click "Add Agent" to create one.</p>
      </VCardText>
    </VCard>

    <!-- Dialog -->
    <VDialog v-model="dialog" max-width="600">
      <VCard>
        <VCardTitle>{{ editingId ? 'Edit Agent' : 'Add Agent' }}</VCardTitle>
        <VDivider />
        <VCardText>
          <VTextField v-model="form.name" label="Agent Name" class="mb-3" variant="outlined" hint="e.g. Weather Assistant" persistent-hint />
          <VSelect v-model="form.type" :items="typeOptions" label="Type" class="mb-3" variant="outlined" @update:model-value="onTypeChange" />
          <VSelect v-model="form.model_id" :items="modelOptions" label="Model" class="mb-3" variant="outlined" hint="Select AI model for smart chat, or None for keyword mode" persistent-hint item-title="title" item-value="value" clearable />
          <VTextField v-model="form.mcp_url" label="MCP Server URL" class="mb-3" variant="outlined" :hint="form.type === 'custom' ? 'Enter MCP URL manually' : `Auto: ${form.type}-mcp`" persistent-hint />
          <div v-if="mcpServices.length > 0" class="mb-3">
            <VChip v-for="svc in mcpServices" :key="svc.name" size="x-small" variant="tonal" :color="svc.healthy ? 'success' : 'error'" class="me-1" @click="form.mcp_url = svc.url" style="cursor: pointer">
              {{ svc.name }} ({{ svc.ip }}:{{ svc.port }})
            </VChip>
          </div>
          <VTextarea v-model="form.description" label="Description" rows="2" class="mb-3" variant="outlined" hide-details />
          <VSwitch v-model="form.enabled" label="Enabled" color="success" hide-details />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="save">{{ editingId ? 'Save' : 'Create' }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Chat Dialog -->
    <VDialog v-model="chatDialog" width="1200" height="1200">
      <VCard style="display: flex; flex-direction: row; width: 1200px; height: 1200px; max-width: 100vw; max-height: 100vh;">
        <!-- Sidebar: Chat History -->
        <div style="width: 260px; min-width: 260px; border-right: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column;">
          <div class="pa-3 d-flex align-center">
            <VIcon icon="bx-history" size="18" class="me-2" />
            <span class="text-body-2 font-weight-medium">History</span>
            <VSpacer />
            <VBtn icon size="x-small" variant="text" color="primary" @click="newChatSession">
              <VIcon icon="bx-plus" size="16" />
            </VBtn>
          </div>
          <VDivider />
          <div style="flex: 1; overflow-y: auto;">
            <div
              v-for="s in chatSessions"
              :key="s.id"
              class="pa-2 px-3 d-flex align-center cursor-pointer text-body-2"
              :style="{
                background: s.id === chatSessionId ? 'rgba(var(--v-theme-primary), 0.12)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.04)'
              }"
              @click="loadChatSession(s.id)"
            >
              <div style="flex: 1; min-width: 0;">
                <div class="text-truncate">{{ s.title || 'New Chat' }}</div>
                <div class="text-caption text-medium-emphasis">{{ s.time }}</div>
              </div>
              <VBtn icon size="x-small" variant="text" color="error" @click.stop="deleteChatSession(s.id)">
                <VIcon icon="bx-trash" size="14" />
              </VBtn>
            </div>
            <div v-if="chatSessions.length === 0" class="pa-4 text-center text-caption text-medium-emphasis">
              No history
            </div>
          </div>
        </div>

        <!-- Main Chat Area -->
        <div style="flex: 1; display: flex; flex-direction: column;">
          <VCardTitle class="d-flex align-center py-2 px-4">
            <VIcon icon="bx-message-rounded" class="me-2" />
            {{ chatSessionTitle || 'New Chat' }}
            <VSpacer />
            <VBtn icon variant="text" size="small" @click="chatDialog = false">
              <VIcon icon="bx-x" />
            </VBtn>
          </VCardTitle>
          <VDivider />
          <div class="chat-body" style="flex: 1; overflow-y: auto; padding: 16px;">
            <div v-if="chatMessages.length === 0" class="text-center text-medium-emphasis py-8">
              <p class="mb-3">Type a message to chat with the agent</p>
            </div>
            <div v-for="(msg, i) in chatMessages" :key="i" class="mb-3">
              <div :class="msg.role === 'user' ? 'text-right' : 'text-left'">
                <VChip :color="msg.role === 'user' ? 'primary' : msg.role === 'error' ? 'error' : 'success'" size="small" variant="tonal">
                  {{ msg.role === 'user' ? 'You' : msg.role === 'error' ? 'Error' : 'Agent' }}
                </VChip>
                <div class="mt-1 text-body-2" style="white-space: pre-wrap;">{{ msg.text }}</div>
              </div>
            </div>
            <div v-if="chatLoading" class="text-center">
              <VProgressCircular indeterminate size="24" color="primary" />
            </div>
          </div>
          <VDivider />
          <VCardActions class="pa-3">
            <VTextField
              v-model="chatInput"
              :placeholder="chatPlaceholders[chatAgentType] || 'Type a message...'"
              density="compact"
              hide-details
              @keyup.enter="sendChat"
              :disabled="chatLoading"
              class="me-2"
            />
            <VBtn color="primary" :loading="chatLoading" :disabled="!chatInput.trim()" @click="sendChat">Send</VBtn>
          </VCardActions>
        </div>

        <!-- Right Sidebar: Prompts -->
        <div v-if="chatHints[chatAgentType]?.length" style="width: 220px; min-width: 220px; border-left: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column;">
          <div class="pa-3">
            <span class="text-body-2 font-weight-medium">Prompts</span>
          </div>
          <VDivider />
          <div style="flex: 1; overflow-y: auto; padding: 8px;">
            <div v-for="h in chatHints[chatAgentType]" :key="h.cmd" class="mb-2">
              <VChip
                size="small"
                :variant="expandedPrompt === h.cmd ? 'tonal' : 'outlined'"
                :color="expandedPrompt === h.cmd ? 'primary' : 'default'"
                style="cursor: pointer; width: 100%; justify-content: flex-start;"
                @click="togglePrompt(h)"
              >
                <strong class="me-1">{{ h.cmd }}</strong>
                <span class="text-medium-emphasis text-caption">{{ h.desc }}</span>
              </VChip>
              <!-- Expanded params -->
              <div v-if="expandedPrompt === h.cmd && h.params?.length" class="mt-2 pa-2" style="background: rgba(255,255,255,0.03); border-radius: 8px;">
                <VTextField
                  v-for="p in h.params"
                  :key="p.name"
                  v-model="promptParams[p.name]"
                  :label="p.label"
                  :required="p.required"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="mb-2"
                  style="font-size: 12px;"
                />
                <VBtn size="small" color="primary" block @click="executePrompt(h)">
                  Execute
                </VBtn>
              </div>
            </div>
          </div>
        </div>

      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>

<style scoped>
.sticky-table {
  display: flex;
  flex-direction: column;
}
.sticky-table :deep(.v-table__wrapper) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.sticky-table :deep(thead) {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
}
.message-stream {
  white-space: pre-wrap;
  animation: fadeIn 0.2s ease-in;
}
@keyframes fadeIn {
  from { opacity: 0.5; }
  to { opacity: 1; }
}
</style>
