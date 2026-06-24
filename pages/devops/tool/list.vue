<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import apiClient from '~/services/api'

definePageMeta({ layout: 'default' })

const CF_GATEWAY = '/cloudflare'

const cfLists = ref<any[]>([])
const loading = ref(false)
const selectedFilter = ref<string>(localStorage.getItem('wl_selectedFilter') || 'all') // 'all' | 'list:<id>'
const search = ref('')
const allExpanded = ref(true)
const listExpanded = ref(true)
const hostnameExpanded = ref(true)
const asnExpanded = ref(true)
const accountExpanded = ref<Record<string, boolean>>({})
const allListItems = ref<any[]>([]) // Aggregated items for 'all' view
const listItemsLoading = ref(false)

// --- Fetch ---
async function fetchData() {
  loading.value = true
  try {
    fetchAccounts()
    await fetchLists()
    if (selectedFilter.value === 'all') {
      await fetchAllListItems()
    } else if (selectedFilter.value.startsWith('list:')) {
      await fetchListItems(selectedFilter.value.slice(5))
    }
  } catch (e) {
    console.error('Failed to fetch', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchAllListItems() // Always load all items first
  if (selectedFilter.value !== 'all' && !selectedFilter.value.startsWith('kind:')) {
    fetchData()
  }
})

// --- List counts ---
const listCounts = computed(() => {
  const m: Record<string, number> = {}
  // Use fetched items count from 'all' data if available
  for (const item of allListItems.value) {
    const lid = (item as any).list_id
    if (lid) m[lid] = (m[lid] || 0) + 1
  }
  // Fallback to CF API count for lists not yet fetched
  for (const l of cfLists.value) {
    if (!m[l.id]) m[l.id] = (l as any).item_count || (l as any).num_items || (l as any).count || 0
  }
  return m
})

async function fetchLists() {
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/configurations/lists`)
    cfLists.value = data?.data || []
  } catch { cfLists.value = [] }
}

// --- Fetch all list items (from MongoDB cache) ---
async function fetchAllListItems() {
  listItemsLoading.value = true
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/configurations/lists/all`)
    allListItems.value = (data?.data || []).map((item: any) => {
      const kind = item.list_kind || 'ip'
      return {
        ...item,
        _listName: item.list_name || '-',
        _listId: item.list_id || '',
        _listKind: kind,
      }
    })
  } catch { allListItems.value = [] }
  finally { listItemsLoading.value = false }
}

// --- Sync all lists + items from CF ---
async function syncListMeta() {
  loading.value = true
  try {
    await fetchLists()
  } finally {
    loading.value = false
  }
}

function kindItemCount(kind: string) {
  return allListItems.value.filter((item: any) => item._listKind === kind).length
}

async function selectKind(kind: string) {
  selectedFilter.value = 'kind:' + kind
  localStorage.setItem('wl_selectedFilter', 'kind:' + kind)
  search.value = ''
  if (allListItems.value.length === 0) {
    await fetchAllListItems()
  }
}

function selectAll() {
  selectedFilter.value = 'all'
  localStorage.setItem('wl_selectedFilter', 'all')
  search.value = ''
  fetchAllListItems()
}

// --- Selected list items ---
const selectedListItems = ref<any[]>([])

// --- Edit List Item (delete + add) ---
const editListItemDialog = ref(false)
const editListItemSaving = ref(false)
const editListItemForm = ref({ listId: '', itemId: '', ip: '', comment: '', kind: 'ip' as string })

function openEditListItem(item: any, listId: string) {
  const list = cfLists.value.find((l: any) => l.id === listId)
  const kind = list?.kind || item._listKind || 'ip'
  editListItemForm.value = {
    listId,
    itemId: item.id,
    ip: item.ip || item.asn?.toString() || item.hostname?.hostname || '',
    comment: item.comment || '',
    kind,
  }
  editListItemDialog.value = true
}

async function saveEditListItem() {
  editListItemSaving.value = true
  try {
    const list = cfLists.value.find((l: any) => l.id === editListItemForm.value.listId)
    const accountId = list?.account_id
    const kind = editListItemForm.value.kind
    const newItem: any = {}
    if (kind === 'asn') newItem.asn = Number(editListItemForm.value.ip)
    else if (kind === 'hostname') newItem.hostname = { hostname: editListItemForm.value.ip }
    else newItem.ip = editListItemForm.value.ip
    if (editListItemForm.value.comment) newItem.comment = editListItemForm.value.comment
    await apiClient.post(`${CF_GATEWAY}/configurations/lists/${editListItemForm.value.listId}/items`, {
      items: [newItem],
    }, { params: { account_id: accountId } })
    snackbar.value = { show: true, text: 'Item updated', color: 'success' }
    editListItemDialog.value = false
    if (selectedFilter.value === 'all') await fetchAllListItems()
    else await fetchListItems(editListItemForm.value.listId)
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || e?.message || 'Failed', color: 'error' }
  } finally {
    editListItemSaving.value = false
  }
}

// --- Remove List Item ---
async function removeListItem(item: any) {
  if (!confirm(`Remove IP ${item.ip}?`)) return
  try {
    const listId = item._listId || selectedFilter.value.slice(5)
    const list = cfLists.value.find((l: any) => l.id === listId)
    const accountId = list?.account_id
    await apiClient.delete(`${CF_GATEWAY}/configurations/lists/${listId}/items`, {
      data: { items: [{ id: item.id }] },
      params: { account_id: accountId },
    })
    snackbar.value = { show: true, text: 'Item removed', color: 'success' }
    if (selectedFilter.value === 'all') await fetchAllListItems()
    else await fetchListItems(listId)
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || e?.message || 'Failed', color: 'error' }
  }
}

function selectList(listId: string) {
  selectedFilter.value = 'list:' + listId
  localStorage.setItem('wl_selectedFilter', 'list:' + listId)
  search.value = ''
  fetchListItems(listId)
}

async function fetchListItems(listId: string) {
  listItemsLoading.value = true
  try {
    const list = cfLists.value.find((l: any) => l.id === listId)
    const accountId = list?.account_id
    if (!accountId) { selectedListItems.value = []; return }
    const { data } = await apiClient.get(`${CF_GATEWAY}/configurations/lists/${listId}/items`, { params: { account_id: accountId } })
    selectedListItems.value = data?.data || []
    // Store to MongoDB for 'All' view
    try {
      await apiClient.post(`${CF_GATEWAY}/configurations/lists/all/store`, {
        list_id: listId,
        list_name: list?.name || '',
        list_kind: list?.kind || 'ip',
        items: selectedListItems.value,
      })
    } catch { /* silent */ }
  } catch { selectedListItems.value = [] }
  finally { listItemsLoading.value = false }
}

// --- Filtered whitelists ---
const filteredWhitelists = computed(() => {
  let items: any[] = []
  if (selectedFilter.value === 'all' || selectedFilter.value.startsWith('kind:')) {
    const kindFilter = selectedFilter.value.startsWith('kind:') ? selectedFilter.value.slice(5) : null
    items = allListItems.value
      .filter((item: any) => !kindFilter || item._listKind === kindFilter)
      .map((item: any) => ({
        id: item.id,
        ip: item.ip || item.hostname?.url_hostname || (item.asn != null ? `ASN ${item.asn}` : '-') || '-',
        username: item.comment || '-',
        source: item._listName || '-',
        createdAt: item.created_on || null,
        modifiedOn: item.modified_on || null,
        isListItem: true,
        _listId: item._listId,
        _listKind: item._listKind,
      }))
  } else if (selectedFilter.value.startsWith('list:')) {
    const listId = selectedFilter.value.slice(5)
    const list = cfLists.value.find((l: any) => l.id === listId)
    items = selectedListItems.value
      .map((item: any) => ({
        id: item.id,
        ip: item.ip || item.hostname?.url_hostname || (item.asn != null ? `ASN ${item.asn}` : '-') || '-',
        username: item.comment || '-',
        source: list?.name || '-',
        createdAt: item.created_on || null,
        modifiedOn: item.modified_on || null,
        isListItem: true,
        _listId: listId,
      }))
  }
  if (search.value) {
    const s = search.value.toLowerCase()
    items = items.filter(w =>
      (w.ip || '').toLowerCase().includes(s) ||
      (w.username || '').toLowerCase().includes(s) ||
      (w.source || '').toLowerCase().includes(s)
    )
  }
  return items
})

const currentListKind = computed(() => {
  if (selectedFilter.value.startsWith('kind:')) return selectedFilter.value.slice(5)
  if (!selectedFilter.value.startsWith('list:')) return 'ip'
  const listId = selectedFilter.value.slice(5)
  const list = cfLists.value.find((l: any) => l.id === listId)
  return list?.kind || 'ip'
})

// --- All view: grouped by kind ---
function kindItems(kind: string) {
  return filteredWhitelists.value.filter((w: any) => w._listKind === kind)
}
function kindExpanded(kind: string) {
  if (kind === 'ip') return listExpanded.value
  if (kind === 'hostname') return hostnameExpanded.value
  return asnExpanded.value
}
function toggleKind(kind: string) {
  if (kind === 'ip') listExpanded.value = !listExpanded.value
  else if (kind === 'hostname') hostnameExpanded.value = !hostnameExpanded.value
  else asnExpanded.value = !asnExpanded.value
}
function kindColor(kind: string) {
  if (kind === 'ip') return 'warning'
  if (kind === 'hostname') return 'success'
  return 'error'
}
function kindLabel(kind: string) {
  if (kind === 'ip') return 'IP List'
  if (kind === 'hostname') return 'Hostname List'
  return 'ASN List'
}

// --- Sort ---
const sortKey = ref<string>('ip')
const sortDir = ref<'asc' | 'desc'>('asc')

// --- Pagination ---
const page = ref(1)
const pageSize = ref(50)
watch(search, () => { page.value = 1 })
const pageSizeOptions = [50, 100, 200, 500, 1000]
function toggleSort(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortIcon(key: string) {
  if (sortKey.value !== key) return 'bx-sort'
  return sortDir.value === 'asc' ? 'bx-sort-up' : 'bx-sort-down'
}
const sortedWhitelists = computed(() => {
  const list = [...filteredWhitelists.value]
  const dir = sortDir.value === 'asc' ? 1 : -1
  list.sort((a, b) => {
    let va: string, vb: string
    switch (sortKey.value) {
      case 'ip': va = a.ip || ''; vb = b.ip || ''; break
      case 'source': va = a.source || ''; vb = b.source || ''; break
      default: va = ''; vb = ''
    }
    return va.localeCompare(vb) * dir
  })
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedWhitelists.value.length / pageSize.value)))
const paginatedWhitelists = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedWhitelists.value.slice(start, start + pageSize.value)
})

// --- Add Whitelist ---
const whitelistDialog = ref(false)
const whitelistForm = ref({ targetType: 'list' as 'list', accountId: '', listId: '', username: '', ip: '' })
const whitelistSaving = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })



const listDialog = ref(false)
const listSaving = ref(false)
const listForm = ref({ accountId: '', name: '', description: '' })
const accounts = ref<any[]>([])
const accountOptions = computed(() => accounts.value.map((a: any) => ({ title: a.name, value: a.id })))
const filteredListOptions = computed(() => {
  const ipLists = cfLists.value.filter((l: any) => l.kind === 'ip')
  if (!whitelistForm.value.accountId) return ipLists.map((l: any) => ({ title: l.name, value: l.id }))
  return ipLists.filter((l: any) => String(l.account_id) === String(whitelistForm.value.accountId)).map((l: any) => ({ title: l.name, value: l.id }))
})

// --- Lists grouped by kind then account ---
const listsByAccount = computed(() => {
  const grouped: Record<number, { name: string; lists: any[] }> = {}
  for (const a of accounts.value) {
    grouped[a.id] = { name: a.name, lists: [] }
  }
  for (const l of cfLists.value) {
    if ((l as any).kind !== 'ip') continue
    const aid = (l as any).account_id
    if (!grouped[aid]) grouped[aid] = { name: `Account ${aid}`, lists: [] }
    grouped[aid].lists.push(l)
  }
  return Object.values(grouped).filter(g => g.lists.length > 0)
})

const hostnameListsByAccount = computed(() => {
  const grouped: Record<number, { name: string; lists: any[] }> = {}
  for (const a of accounts.value) grouped[a.id] = { name: a.name, lists: [] }
  for (const l of cfLists.value) {
    if ((l as any).kind !== 'hostname') continue
    const aid = (l as any).account_id
    if (!grouped[aid]) grouped[aid] = { name: `Account ${aid}`, lists: [] }
    grouped[aid].lists.push(l)
  }
  return Object.values(grouped).filter(g => g.lists.length > 0)
})

const asnListsByAccount = computed(() => {
  const grouped: Record<number, { name: string; lists: any[] }> = {}
  for (const a of accounts.value) grouped[a.id] = { name: a.name, lists: [] }
  for (const l of cfLists.value) {
    if ((l as any).kind !== 'asn') continue
    const aid = (l as any).account_id
    if (!grouped[aid]) grouped[aid] = { name: `Account ${aid}`, lists: [] }
    grouped[aid].lists.push(l)
  }
  return Object.values(grouped).filter(g => g.lists.length > 0)
})

// --- Edit List ---
const editListDialog = ref(false)
const editListSaving = ref(false)
const editListForm = ref({ id: '', name: '', description: '' })

function openEditList(l: any) {
  editListForm.value = { id: l.id, name: l.name || '', description: l.description || '' }
  editListDialog.value = true
}

async function saveEditList() {
  if (!editListForm.value.name.trim()) return
  editListSaving.value = true
  try {
    await apiClient.put(`${CF_GATEWAY}/configurations/lists/${editListForm.value.id}`, {
      name: editListForm.value.name.trim(),
      description: editListForm.value.description.trim(),
    })
    snackbar.value = { show: true, text: 'List updated', color: 'success' }
    editListDialog.value = false
    await fetchLists()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || e?.message || 'Failed', color: 'error' }
  } finally {
    editListSaving.value = false
  }
}


async function fetchAccounts() {
  try {
    const { data } = await apiClient.get(`${CF_GATEWAY}/accounts`)
    accounts.value = data?.data || []
  } catch { accounts.value = [] }
}

function openAddList() {
  listForm.value = { accountId: '', name: '', description: '' }
  listDialog.value = true
}

async function saveList() {
  if (!listForm.value.accountId || !listForm.value.name.trim()) return
  listSaving.value = true
  try {
    await apiClient.post(`${CF_GATEWAY}/configurations/lists`, {
      name: listForm.value.name.trim(),
      description: listForm.value.description.trim(),
      kind: 'ip',
    }, { params: { account_id: listForm.value.accountId } })
    snackbar.value = { show: true, text: 'List created', color: 'success' }
    listDialog.value = false
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || e?.message || 'Failed', color: 'error' }
  } finally {
    listSaving.value = false
  }
}

function openWhitelistCreate() {
  whitelistForm.value = {
    targetType: 'list',
    accountId: '',
    listId: '',
    username: '',
    ip: '',
  }
  whitelistDialog.value = true
}

async function saveWhitelist() {
  if (!whitelistForm.value.ip.trim()) return
  if (!whitelistForm.value.listId) return
  whitelistSaving.value = true
  try {
    await apiClient.post(`${CF_GATEWAY}/configurations/lists/${whitelistForm.value.listId}/items`, {
      items: [{ ip: whitelistForm.value.ip, comment: whitelistForm.value.username || undefined }],
    }, { params: { account_id: whitelistForm.value.accountId } })
    snackbar.value = { show: true, text: 'IP added', color: 'success' }
    whitelistDialog.value = false
    if (selectedFilter.value === 'all') await fetchAllListItems()
    else await fetchData()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.response?.data?.detail || e?.message || 'Failed', color: 'error' }
  } finally {
    whitelistSaving.value = false
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
    <!-- Top Bar -->
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <VIcon icon="bx-shield" color="primary" />
        <span class="text-h6">Whitelist IP</span>
        <VChip size="small" color="info" variant="tonal">IPs: {{ allListItems.length }}</VChip>
        <VSpacer />

        <VBtn color="warning" size="small" prepend-icon="bx-list-plus" @click="openAddList">Add List</VBtn>

        <VBtn color="primary" size="small" prepend-icon="bx-plus" @click="openWhitelistCreate">Add IP</VBtn>
        <VBtn size="small" variant="tonal" color="primary" @click="syncListMeta" :loading="loading">Sync List</VBtn>
      </VCardText>
    </VCard>

    <!-- Main Content -->
    <div style="display: flex; flex: 1; min-height: 0; gap: 12px;">
      <!-- Left: Rule List -->
      <VCard style="width: 270px; min-width: 270px; display: flex; flex-direction: column;">
        <VList density="compact" nav class="rule-list">
          <!-- All: collapsible with 3 type sub-items -->
          <div class="d-flex align-center px-3 py-1 cursor-pointer" :class="{ 'text-primary': selectedFilter === 'all' }" @click="allExpanded = !allExpanded">
            <VIcon :icon="allExpanded ? 'bx-chevron-down' : 'bx-chevron-right'" size="16" class="me-1" />
            <span class="text-caption font-weight-bold">All</span>
            <VChip size="x-small" color="default" variant="tonal" class="ms-1">{{ allListItems.length }}</VChip>
          </div>
          <template v-if="allExpanded">
            <VListItem @click="selectKind('ip')" :active="selectedFilter === 'kind:ip'" style="padding-left: 28px;">
              <template #prepend><VIcon icon="bx-globe" size="14" class="me-1" color="warning" /></template>
              <VListItemTitle style="font-size: 13px;">IP List</VListItemTitle>
              <template #append><VChip size="x-small" color="warning" variant="tonal">{{ kindItemCount('ip') }}</VChip></template>
            </VListItem>
            <VListItem @click="selectKind('hostname')" :active="selectedFilter === 'kind:hostname'" style="padding-left: 28px;">
              <template #prepend><VIcon icon="bx-link" size="14" class="me-1" color="success" /></template>
              <VListItemTitle style="font-size: 13px;">Hostname List</VListItemTitle>
              <template #append><VChip size="x-small" color="success" variant="tonal">{{ kindItemCount('hostname') }}</VChip></template>
            </VListItem>
            <VListItem @click="selectKind('asn')" :active="selectedFilter === 'kind:asn'" style="padding-left: 28px;">
              <template #prepend><VIcon icon="bx-network-chart" size="14" class="me-1" color="error" /></template>
              <VListItemTitle style="font-size: 13px;">ASN List</VListItemTitle>
              <template #append><VChip size="x-small" color="error" variant="tonal">{{ kindItemCount('asn') }}</VChip></template>
            </VListItem>
          </template>
          <VDivider class="my-1" />
          <!-- Lists grouped by account -->
          <div class="d-flex align-center px-3 py-1 cursor-pointer" @click="listExpanded = !listExpanded">
            <span class="text-caption text-medium-emphasis font-weight-bold">IP List</span>
            <VChip size="x-small" color="warning" variant="tonal" class="ms-1">{{ cfLists.length }}</VChip>
            <VSpacer />
            <VIcon :icon="listExpanded ? 'bx-chevron-down' : 'bx-chevron-right'" size="16" color="medium-emphasis" />
          </div>
          <template v-if="listExpanded">
            <template v-for="group in listsByAccount" :key="group.name">
              <div class="d-flex align-center px-3 pt-2 pb-1 cursor-pointer" style="font-size: 11px; opacity: 0.7;" @click="accountExpanded[group.name] = !(accountExpanded[group.name] !== false)">
                <span class="text-caption text-medium-emphasis">{{ group.name }}</span>
                <VSpacer />
                <VIcon :icon="accountExpanded[group.name] !== false ? 'bx-chevron-down' : 'bx-chevron-right'" size="14" color="medium-emphasis" />
              </div>
              <template v-if="accountExpanded[group.name] !== false">
                <VListItem v-for="l in group.lists" :key="l.id" :active="selectedFilter === 'list:' + l.id" @click="selectList(l.id)" style="padding-left: 24px;">
                  <VListItemTitle>{{ l.name }}</VListItemTitle>
                  <template #append>
                    <VIcon icon="bx-edit" size="14" color="medium-emphasis" class="me-1" @click.stop="openEditList(l)" />
                    <VChip size="x-small" color="warning" variant="tonal">{{ listCounts[l.id] || 0 }}</VChip>
                  </template>
                </VListItem>
              </template>
            </template>
          </template>
          <!-- Hostname Lists -->
          <VDivider class="my-1" />
          <div class="d-flex align-center px-3 py-1 cursor-pointer" @click="hostnameExpanded = !hostnameExpanded">
            <span class="text-caption text-medium-emphasis font-weight-bold">Hostname List</span>
            <VChip size="x-small" color="success" variant="tonal" class="ms-1">{{ hostnameListsByAccount.reduce((s, g) => s + g.lists.length, 0) }}</VChip>
            <VSpacer />
            <VIcon :icon="hostnameExpanded ? 'bx-chevron-down' : 'bx-chevron-right'" size="16" color="medium-emphasis" />
          </div>
          <template v-if="hostnameExpanded">
            <template v-for="group in hostnameListsByAccount" :key="'h_'+group.name">
              <div class="d-flex align-center px-3 pt-2 pb-1 cursor-pointer" style="font-size: 11px; opacity: 0.7;" @click="accountExpanded['h_'+group.name] = !(accountExpanded['h_'+group.name] !== false)">
                <span class="text-caption text-medium-emphasis">{{ group.name }}</span>
                <VSpacer />
                <VIcon :icon="accountExpanded['h_'+group.name] !== false ? 'bx-chevron-down' : 'bx-chevron-right'" size="14" color="medium-emphasis" />
              </div>
              <template v-if="accountExpanded['h_'+group.name] !== false">
                <VListItem v-for="l in group.lists" :key="l.id" :active="selectedFilter === 'list:' + l.id" @click="selectList(l.id)" style="padding-left: 24px;">
                  <VListItemTitle>{{ l.name }}</VListItemTitle>
                  <template #append>
                    <VIcon icon="bx-edit" size="14" color="medium-emphasis" class="me-1" @click.stop="openEditList(l)" />
                    <VChip size="x-small" color="success" variant="tonal">{{ listCounts[l.id] || 0 }}</VChip>
                  </template>
                </VListItem>
              </template>
            </template>
          </template>
          <!-- ASN Lists -->
          <VDivider class="my-1" />
          <div class="d-flex align-center px-3 py-1 cursor-pointer" @click="asnExpanded = !asnExpanded">
            <span class="text-caption text-medium-emphasis font-weight-bold">ASN List</span>
            <VChip size="x-small" color="error" variant="tonal" class="ms-1">{{ asnListsByAccount.reduce((s, g) => s + g.lists.length, 0) }}</VChip>
            <VSpacer />
            <VIcon :icon="asnExpanded ? 'bx-chevron-down' : 'bx-chevron-right'" size="16" color="medium-emphasis" />
          </div>
          <template v-if="asnExpanded">
            <template v-for="group in asnListsByAccount" :key="'a_'+group.name">
              <div class="d-flex align-center px-3 pt-2 pb-1 cursor-pointer" style="font-size: 11px; opacity: 0.7;" @click="accountExpanded['a_'+group.name] = !(accountExpanded['a_'+group.name] !== false)">
                <span class="text-caption text-medium-emphasis">{{ group.name }}</span>
                <VSpacer />
                <VIcon :icon="accountExpanded['a_'+group.name] !== false ? 'bx-chevron-down' : 'bx-chevron-right'" size="14" color="medium-emphasis" />
              </div>
              <template v-if="accountExpanded['a_'+group.name] !== false">
                <VListItem v-for="l in group.lists" :key="l.id" :active="selectedFilter === 'list:' + l.id" @click="selectList(l.id)" style="padding-left: 24px;">
                  <VListItemTitle>{{ l.name }}</VListItemTitle>
                  <template #append>
                    <VIcon icon="bx-edit" size="14" color="medium-emphasis" class="me-1" @click.stop="openEditList(l)" />
                    <VChip size="x-small" color="error" variant="tonal">{{ listCounts[l.id] || 0 }}</VChip>
                  </template>
                </VListItem>
              </template>
            </template>
          </template>

        </VList>
      </VCard>

      <!-- Right: IP Table -->
      <VCard style="flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0;">
          <div v-if="loading || listItemsLoading" class="text-center py-8"><VProgressCircular indeterminate color="primary" /></div>
          <div v-else-if="paginatedWhitelists.length === 0" class="text-center py-8 text-medium-emphasis">
            <VIcon icon="bx-list-ul" size="48" class="mb-2" /><p>No records yet.</p>
          </div>

          <VTable v-else class="text-no-wrap sticky-table" hover density="compact" style="flex: 1; min-height: 0; table-layout: fixed; width: 100%;">
            <thead>
              <tr class="text-caption text-medium-emphasis">
                <th style="width: 150px; cursor: pointer;" @click="toggleSort('ip')">{{ currentListKind === 'hostname' ? 'Hostname' : currentListKind === 'asn' ? 'ASN' : 'IP' }} <VIcon :icon="sortIcon('ip')" size="14" /></th>
                <th style="width: auto;">Comment</th>
                <th v-if="selectedFilter === 'all' || selectedFilter.startsWith('kind:')" style="width: 150px; cursor: pointer;" @click="toggleSort('source')">Source <VIcon :icon="sortIcon('source')" size="14" /></th>
                <th v-if="selectedFilter === 'all' || selectedFilter.startsWith('kind:')" style="width: 150px;">Modified On</th>
                <template v-else>
                  <th style="width: 150px;">Created On</th>
                  <th style="width: 150px;">Modified On</th>
                </template>
                <th style="width: 120px;">Action</th>
              </tr>
              <tr>
                <th><VTextField v-model="search" density="compact" hide-details placeholder="Search..." clearable style="font-size: 12px" /></th>
                <th></th>
                <th v-if="selectedFilter === 'all' || selectedFilter.startsWith('kind:')"></th>
                <th v-else></th>
                <th></th>
                <th v-if="selectedFilter !== 'all' && !selectedFilter.startsWith('kind:')">
                  <div class="d-flex align-center gap-1 justify-end">
                    <VSelect v-model="pageSize" :items="pageSizeOptions" density="compact" hide-details style="width: 70px; font-size: 12px;" @update:model-value="page = 1" />
                    <VBtn icon="bx-chevron-left" size="x-small" variant="text" :disabled="page <= 1" @click="page--" />
                    <span class="text-caption">{{ page }}/{{ totalPages }}</span>
                    <VBtn icon="bx-chevron-right" size="x-small" variant="text" :disabled="page >= totalPages" @click="page++" />
                  </div>
                </th>
                <th v-else-if="selectedFilter === 'all'"></th>
                <th v-else>
                  <div class="d-flex align-center gap-1 justify-end">
                    <VSelect v-model="pageSize" :items="pageSizeOptions" density="compact" hide-details style="width: 70px; font-size: 12px;" @update:model-value="page = 1" />
                    <VBtn icon="bx-chevron-left" size="x-small" variant="text" :disabled="page <= 1" @click="page--" />
                    <span class="text-caption">{{ page }}/{{ totalPages }}</span>
                    <VBtn icon="bx-chevron-right" size="x-small" variant="text" :disabled="page >= totalPages" @click="page++" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- ALL mode: grouped by kind -->
              <template v-if="selectedFilter === 'all'">
                <template v-for="kind in ['ip', 'hostname', 'asn']" :key="kind">
                  <tr v-if="kindItems(kind).length > 0">
                    <td :colspan="5" class="pa-0" style="background: rgba(var(--v-theme-surface), 1);">
                      <div class="d-flex align-center px-3 py-1 cursor-pointer" @click="toggleKind(kind)">
                        <VIcon :icon="kindExpanded(kind) ? 'bx-chevron-down' : 'bx-chevron-right'" size="16" class="me-1" />
                        <VChip size="x-small" :color="kindColor(kind)" variant="tonal" class="me-2">{{ kindLabel(kind) }}</VChip>
                        <span class="text-caption text-medium-emphasis">{{ kindItems(kind).length }} items</span>
                      </div>
                    </td>
                  </tr>
                  <template v-if="kindExpanded(kind)">
                    <tr v-for="w in kindItems(kind)" :key="w.id">
                      <td><code class="text-body-2">{{ w.ip || '-' }}</code></td>
                      <td>{{ w.username || '-' }}</td>
                      <td><VChip size="x-small" color="info" variant="tonal" style="cursor: pointer;" @click="selectList(w._listId)">{{ w.source || '-' }}</VChip></td>
                      <td class="text-caption text-medium-emphasis">{{ w.modifiedOn ? new Date(w.modifiedOn.endsWith('Z') ? w.modifiedOn : w.modifiedOn + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
                      <td>
                        <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEditListItem(w, w._listId)">Edit</VBtn>
                        <VBtn size="x-small" variant="tonal" color="error" @click="removeListItem(w)">Remove</VBtn>
                      </td>
                    </tr>
                  </template>
                </template>
              </template>
              <!-- Kind filter mode: flat paginated table with Source column -->
              <template v-else-if="selectedFilter.startsWith('kind:')">
                <tr v-for="w in paginatedWhitelists" :key="w.id">
                  <td><code class="text-body-2">{{ w.ip || '-' }}</code></td>
                  <td>{{ w.username || '-' }}</td>
                  <td><VChip size="x-small" color="info" variant="tonal" style="cursor: pointer;" @click="selectList(w._listId)">{{ w.source || '-' }}</VChip></td>
                  <td class="text-caption text-medium-emphasis">{{ w.modifiedOn ? new Date(w.modifiedOn.endsWith('Z') ? w.modifiedOn : w.modifiedOn + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
                  <td>
                    <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEditListItem(w, w._listId)">Edit</VBtn>
                    <VBtn size="x-small" variant="tonal" color="error" @click="removeListItem(w)">Remove</VBtn>
                  </td>
                </tr>
              </template>
              <!-- Single list mode -->
              <template v-else>
              <tr v-for="w in paginatedWhitelists" :key="w.id">
                <td><code class="text-body-2">{{ w.ip || '-' }}</code></td>
                <td>{{ w.username || '-' }}</td>
                <td v-if="selectedFilter.startsWith('kind:')"><VChip size="x-small" color="info" variant="tonal" style="cursor: pointer;" @click="selectList(w._listId)">{{ w.source || '-' }}</VChip></td>
                <td v-if="selectedFilter.startsWith('kind:')" class="text-caption text-medium-emphasis">{{ w.modifiedOn ? new Date(w.modifiedOn.endsWith('Z') ? w.modifiedOn : w.modifiedOn + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
                <template v-if="!selectedFilter.startsWith('kind:')">
                  <td class="text-caption text-medium-emphasis">{{ w.createdAt ? new Date(w.createdAt.endsWith('Z') ? w.createdAt : w.createdAt + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
                  <td class="text-caption text-medium-emphasis">{{ w.modifiedOn ? new Date(w.modifiedOn.endsWith('Z') ? w.modifiedOn : w.modifiedOn + 'Z').toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }) : '-' }}</td>
                </template>
                <td>
                  <VBtn size="x-small" variant="tonal" color="info" class="me-1" @click="openEditListItem(w, w._listId)">Edit</VBtn>
                  <VBtn size="x-small" variant="tonal" color="error" @click="removeListItem(w)">Remove</VBtn>
                </td>
              </tr>
              </template>
            </tbody>
          </VTable>
      </VCard>
    </div>

    <!-- Add Whitelist Dialog -->
    <VDialog v-model="whitelistDialog" max-width="500">
      <VCard>
        <VCardTitle>Add IP</VCardTitle>
        <VCardText class="pt-2">
          <VSelect v-model="whitelistForm.accountId" :items="accountOptions" label="Account" density="compact" hide-details class="mb-3" clearable @update:model-value="whitelistForm.listId = ''" />
          <VSelect v-model="whitelistForm.listId" :items="filteredListOptions" label="List" density="compact" hide-details class="mb-3" clearable />
          <VTextField v-model="whitelistForm.ip" label="IP" density="compact" hide-details class="mb-3" placeholder="1.2.3.4" />
          <VTextField v-model="whitelistForm.username" label="Comment" density="compact" hide-details class="mb-3" placeholder="备注" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="whitelistDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="whitelistSaving" :disabled="!whitelistForm.listId || !whitelistForm.ip.trim()" @click="saveWhitelist">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Add List Dialog (CF /configurations/lists) -->
    <VDialog v-model="listDialog" max-width="600">
      <VCard>
        <VCardTitle>Add List</VCardTitle>
        <VCardText class="pt-2">
          <VSelect v-model="listForm.accountId" :items="accountOptions" label="Account" density="compact" hide-details class="mb-3" />
          <VTextField v-model="listForm.name" label="Name" density="compact" hide-details class="mb-3" placeholder="my_ip_list" />
          <VTextField v-model="listForm.description" label="Description" density="compact" hide-details placeholder="IP 白名单" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="listDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="listSaving" :disabled="!listForm.accountId || !listForm.name.trim()" @click="saveList">Create</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>


    <!-- Edit List Dialog -->
    <VDialog v-model="editListDialog" max-width="500">
      <VCard>
        <VCardTitle>Edit List</VCardTitle>
        <VCardText class="pt-2">
          <VTextField v-model="editListForm.name" label="Name" density="compact" hide-details class="mb-3" placeholder="my_ip_list" />
          <VTextField v-model="editListForm.description" label="Description" density="compact" hide-details placeholder="描述" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="editListDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="editListSaving" :disabled="!editListForm.name.trim()" @click="saveEditList">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>


    <!-- Edit List Item Dialog -->
    <VDialog v-model="editListItemDialog" max-width="500">
      <VCard>
        <VCardTitle>Edit List Item</VCardTitle>
        <VCardText class="pt-2">
          <VTextField v-model="editListItemForm.ip" :label="editListItemForm.kind === 'asn' ? 'ASN' : editListItemForm.kind === 'hostname' ? 'Hostname' : 'IP'" density="compact" hide-details class="mb-3" :placeholder="editListItemForm.kind === 'asn' ? '12345' : editListItemForm.kind === 'hostname' ? 'example.com' : '1.2.3.4'" :disabled="editListItemForm.kind === 'ip'" />
          <VTextField v-model="editListItemForm.comment" label="Comment" density="compact" hide-details placeholder="备注" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="editListItemDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="editListItemSaving" @click="saveEditListItem">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</VSnackbar>


  </div>
</template>

<style scoped>
.rule-list { flex: 1; overflow-y: auto; }
.rule-list :deep(.v-list-item--active) { background: rgba(var(--v-theme-primary), 0.1); }
.sticky-table { display: flex; flex-direction: column; width: 100%; flex: 1; min-height: 0; }
.sticky-table :deep(.v-table__wrapper) table { table-layout: fixed !important; width: 100% !important; }
.sticky-table :deep(th), .sticky-table :deep(td) { padding: 2px 8px !important; font-size: 13px; }
.sticky-table :deep(.v-table__wrapper) { flex: 1; min-height: 0; overflow-y: auto; }
.sticky-table :deep(thead) { position: sticky; top: 0; z-index: 10; background: rgb(var(--v-theme-surface)); }

.card-scroll { flex: 1; min-height: 0; display: flex; flex-direction: column; }
</style>
