<script setup lang="ts">
import apiClient, { domainGroupService, projectService, userConsoleDomainService } from '~/services/api'

definePageMeta({ layout: 'default' })

const loading = ref(false)
const syncing = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Data
const groups = ref<any[]>([])
const projects = ref<any[]>([])
const groupMeta = ref<Record<string, { type: string; remark: string; groupId: string }>>({})
const groupZones = ref<any[]>([])

// Saved rules
const rules = ref<any[]>([])
const selectedRule = ref<any>(null)
const dialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ name: '', groupId: '', projectId: '', env: 'prod', type: 'web', enabled: true })

const envOptions = ['prod', 'uat', 'test', 'dev']
const typeOptions = ['web', 'admin', 'callback', 'api']

// DNS
const dnsRecords = ref<any[]>([])
const dnsLoading = ref(false)
const expandedDomains = ref<Record<string, boolean>>({})

// Stats
const totalRules = computed(() => rules.value.length)
const activeRules = computed(() => rules.value.filter(r => r.enabled))

async function fetchData() {
  loading.value = true
  try {
    const [g, meta, projRes] = await Promise.all([
      domainGroupService.listGroups(),
      domainGroupService.listMeta(),
      projectService.list(),
    ])
    groups.value = g || []
    const m: Record<string, { type: string; remark: string; groupId: string }> = {}
    for (const item of (meta || [])) {
      if (item.zoneId) m[item.zoneId] = { type: item.type || '', remark: item.remark || '', groupId: item.groupId || '' }
    }
    groupMeta.value = m
    projects.value = Array.isArray(projRes) ? projRes : projRes?.data || []
    try {
      const { data: accData } = await apiClient.get('/cloudflare/accounts')
      const accounts = accData?.data || []
      const results = await Promise.all(
        accounts.map((a: any) =>
          apiClient.get('/cloudflare/zones', { params: { account_id: a.id } })
            .then((r: any) => (r.data?.data || []).map((z: any) => ({ ...z, accountName: a.name })))
            .catch(() => [])
        )
      )
      const all: any[] = []
      results.forEach((r: any) => all.push(...r))
      groupZones.value = all
    } catch { groupZones.value = [] }
  } catch (e: any) {
    console.error('Failed to fetch', e)
  } finally {
    loading.value = false
  }
}

function loadRules() {
  try {
    const saved = localStorage.getItem('sync_domain_rules')
    rules.value = saved ? JSON.parse(saved) : []
  } catch { rules.value = [] }
}

function saveRulesToStorage() {
  localStorage.setItem('sync_domain_rules', JSON.stringify(rules.value))
}

onMounted(() => {
  fetchData()
  loadRules()
})

// Helpers
function getGroupName(groupId: string) {
  return groups.value.find(g => g.id === groupId)?.name || groupId
}
function getProjectName(projectId: string) {
  return projects.value.find(p => String(p.id) === projectId)?.name || projectId
}

function getGroupZoneList(groupId: string) {
  return groupZones.value.filter(z => groupMeta.value[z.zone_id]?.groupId === groupId)
}

function getGroupDomains(rule: any) {
  return getGroupZoneList(rule.groupId).map(z => ({
    domain: z.name,
    env: rule.env || 'prod',
    type: rule.type || groupMeta.value[z.zone_id]?.type || 'web',
    remark: '',
    cdn: '',
  }))
}

// DNS
async function fetchDnsRecords(groupId: string) {
  const zones = getGroupZoneList(groupId)
  if (!zones.length) { dnsRecords.value = []; return }
  dnsLoading.value = true
  try {
    const { data } = await apiClient.get('/cloudflare/dns')
    const allRecords = data?.data || []
    const zoneNames = new Set(zones.map((z: any) => z.name))
    dnsRecords.value = allRecords.filter((r: any) => {
      const name = (r.name || '').toLowerCase()
      const rtype = (r.type || '').toUpperCase()
      if (rtype !== 'A' && rtype !== 'CNAME') return false
      for (const zn of zoneNames) {
        if (name === zn.toLowerCase() || name.endsWith('.' + zn.toLowerCase())) return true
      }
      return false
    })
  } catch { dnsRecords.value = [] }
  finally { dnsLoading.value = false }
}

function dnsByZone(zoneName: string) {
  return dnsRecords.value.filter((r: any) => {
    const name = (r.name || '').toLowerCase()
    return name === zoneName.toLowerCase() || name.endsWith('.' + zoneName.toLowerCase())
  })
}

function selectRule(rule: any) {
  selectedRule.value = rule
  expandedDomains.value = {}
  fetchDnsRecords(rule.groupId)
}

// CRUD
function openCreate() {
  editingId.value = null
  form.value = { name: '', groupId: '', projectId: '', env: 'prod', type: 'web', enabled: true }
  dialog.value = true
}

function openEdit(rule: any) {
  editingId.value = rule.id
  form.value = { ...rule }
  dialog.value = true
}

function saveRule() {
  if (!form.value.name.trim() || !form.value.groupId || !form.value.projectId) return
  if (editingId.value) {
    const idx = rules.value.findIndex(r => r.id === editingId.value)
    if (idx >= 0) rules.value[idx] = { ...form.value, id: editingId.value, lastRun: rules.value[idx].lastRun, lastStatus: rules.value[idx].lastStatus }
  } else {
    rules.value.push({ ...form.value, id: Date.now(), lastRun: null, lastStatus: null })
  }
  saveRulesToStorage()
  dialog.value = false
  // Refresh selected rule if edited
  if (selectedRule.value && selectedRule.value.id === editingId.value) {
    selectedRule.value = rules.value.find(r => r.id === editingId.value)
  }
}

function deleteRule(rule: any) {
  if (!confirm(`Delete "${rule.name}"?`)) return
  rules.value = rules.value.filter(r => r.id !== rule.id)
  saveRulesToStorage()
  if (selectedRule.value?.id === rule.id) selectedRule.value = null
}

function toggleRule(rule: any) {
  rule.enabled = !rule.enabled
  saveRulesToStorage()
}

async function runRule(rule: any) {
  const domains = getGroupDomains(rule)
  if (!domains.length) {
    snackbar.value = { show: true, text: 'No domains in this group', color: 'error' }
    return
  }
  rule._running = true
  try {
    await userConsoleDomainService.importDomains({ projectId: rule.projectId, domains })
    rule.lastRun = new Date().toISOString()
    rule.lastStatus = 'success'
    saveRulesToStorage()
    snackbar.value = { show: true, text: `Synced ${domains.length} domains to ${getProjectName(rule.projectId)}`, color: 'success' }
  } catch (e: any) {
    rule.lastRun = new Date().toISOString()
    rule.lastStatus = 'failed'
    saveRulesToStorage()
    snackbar.value = { show: true, text: e?.message || 'Sync failed', color: 'error' }
  } finally {
    rule._running = false
  }
}

function formatTime(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Stats -->
    <div class="d-flex gap-4 mb-4 flex-wrap">
      <VCard class="pa-4" style="min-width: 140px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Total</div>
        <div class="text-h4 font-weight-bold">{{ totalRules }}</div>
      </VCard>
      <VCard class="pa-4" style="min-width: 140px; flex: 1;">
        <div class="text-caption text-medium-emphasis">Active</div>
        <div class="text-h4 font-weight-bold text-success">{{ activeRules.length }}</div>
      </VCard>
    </div>

    <!-- Main Content -->
    <div style="display: flex; gap: 16px; flex: 1; min-height: 0;">
      <!-- Left: Rules List -->
      <VCard style="width: 380px; min-width: 380px; display: flex; flex-direction: column;">
        <VCardText class="d-flex align-center gap-3 py-3">
          <VIcon icon="bx-sync" color="primary" />
          <span class="text-h6">Sync Domain</span>
          <VSpacer />
          <VBtn color="primary" size="x-small" prepend-icon="bx-plus" @click="openCreate">Add</VBtn>
        </VCardText>
        <div v-if="loading" class="text-center py-4"><VProgressCircular indeterminate size="24" /></div>
        <div v-else-if="rules.length === 0" class="text-center py-8 text-medium-emphasis">
          <VIcon icon="bx-list-ul" size="40" class="mb-2" /><p>No rules yet</p>
        </div>
        <div v-else style="flex: 1; overflow-y: auto;">
          <div
            v-for="rule in rules"
            :key="rule.id"
            class="pa-3 cursor-pointer border-b"
            :class="{ 'bg-primary-lighten-5': selectedRule?.id === rule.id }"
            @click="selectRule(rule)"
          >
            <div class="d-flex align-center gap-2 mb-1">
              <strong class="text-body-2">{{ rule.name }}</strong>
              <VChip v-if="!rule.enabled" size="x-small" color="warning" variant="tonal">disabled</VChip>
              <VSpacer />
              <VBtn size="x-small" color="primary" variant="tonal" :loading="rule._running" :disabled="!rule.enabled" @click.stop="runRule(rule)">Run</VBtn>
            </div>
            <div class="d-flex align-center gap-1 mb-1">
              <VChip size="x-small" color="info" variant="tonal">{{ getGroupName(rule.groupId) }}</VChip>
              <VIcon icon="bx-right-arrow-alt" size="12" />
              <VChip size="x-small" color="success" variant="tonal">{{ getProjectName(rule.projectId) }}</VChip>
            </div>
            <div class="d-flex align-center gap-2">
              <VChip size="x-small" variant="tonal">{{ rule.env }}</VChip>
              <VChip size="x-small" variant="tonal">{{ rule.type }}</VChip>
              <VSpacer />
              <VBtn icon size="x-small" variant="text" @click.stop="openEdit(rule)"><VIcon icon="bx-pencil" size="14" /></VBtn>
              <VBtn icon size="x-small" variant="text" color="error" @click.stop="deleteRule(rule)"><VIcon icon="bx-trash" size="14" /></VBtn>
            </div>
            <div v-if="rule.lastRun" class="text-caption text-medium-emphasis mt-1">
              Last: {{ formatTime(rule.lastRun) }}
              <VChip v-if="rule.lastStatus === 'success'" size="x-small" color="success" variant="tonal" class="ms-1">OK</VChip>
              <VChip v-else-if="rule.lastStatus === 'failed'" size="x-small" color="error" variant="tonal" class="ms-1">FAIL</VChip>
            </div>
          </div>
        </div>
      </VCard>

      <!-- Right: Domain Preview -->
      <VCard style="flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0;">
        <div v-if="!selectedRule" class="text-center py-8 text-medium-emphasis" style="flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column;">
          <VIcon icon="bx-mouse" size="48" class="mb-2" /><p>Click a rule to preview domains</p>
        </div>
        <template v-else>
          <VCardText class="py-2 border-b d-flex align-center gap-2">
            <strong>{{ selectedRule.name }}</strong>
            <span class="text-caption text-medium-emphasis">{{ getGroupDomains(selectedRule).length }} domains</span>
            <VSpacer />
            <VBtn size="x-small" color="primary" variant="tonal" :loading="selectedRule._running" :disabled="!selectedRule.enabled" @click="runRule(selectedRule)">Run Now</VBtn>
          </VCardText>
          <div style="flex: 1; overflow-y: auto; padding: 12px;">
            <div v-for="(d, idx) in getGroupDomains(selectedRule)" :key="d.domain" class="mb-2">
              <div class="d-flex align-center gap-2 cursor-pointer" @click="expandedDomains[d.domain] = !expandedDomains[d.domain]">
                <VIcon :icon="expandedDomains[d.domain] ? 'bx-chevron-down' : 'bx-chevron-right'" size="14" />
                <span class="text-caption text-medium-emphasis" style="min-width: 24px;">{{ idx + 1 }}.</span>
                <code class="text-body-2">{{ d.domain }}</code>
                <VChip size="x-small" color="info" variant="tonal">{{ dnsByZone(d.domain).length }} DNS</VChip>
              </div>
              <div v-if="expandedDomains[d.domain]" class="ms-7 mt-1">
                <div v-if="dnsLoading" class="text-caption text-medium-emphasis py-1">Loading...</div>
                <div v-else-if="dnsByZone(d.domain).length === 0" class="text-caption text-medium-emphasis py-1">No DNS records</div>
                <div v-else>
                  <div v-for="r in dnsByZone(d.domain)" :key="r.id || r.name" class="d-flex align-center gap-2 py-05" style="font-size: 12px;">
                    <VChip size="x-small" variant="tonal" color="secondary" style="min-width: 50px; justify-content: center;">{{ r.type }}</VChip>
                    <code>{{ r.name }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </VCard>
    </div>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialog" max-width="500">
      <VCard>
        <VCardItem><VCardTitle>{{ editingId ? 'Edit Rule' : 'Add Rule' }}</VCardTitle></VCardItem>
        <VCardText>
          <VTextField v-model="form.name" label="Rule Name" density="compact" hide-details class="mb-3" />
          <VSelect v-model="form.groupId" :items="groups.map(g => ({ title: g.name, value: g.id }))" label="Source Group" density="compact" hide-details clearable class="mb-3" />
          <VSelect v-model="form.projectId" :items="projects.map(p => ({ title: p.name, value: String(p.id) }))" label="Target Project" density="compact" hide-details clearable class="mb-3" />
          <VSelect v-model="form.env" :items="envOptions" label="Environment" density="compact" hide-details class="mb-3" />
          <VSelect v-model="form.type" :items="typeOptions" label="Type" density="compact" hide-details />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :disabled="!form.name.trim() || !form.groupId || !form.projectId" @click="saveRule">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
