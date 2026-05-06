<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { telegramBotService } from '~/services/api'

definePageMeta({ layout: 'default' })

const BOT_TYPES = [
  { title: 'General', value: 'general' },
  { title: 'IP White List', value: 'ip_white_list' },
  { title: 'Customer Service', value: 'customer_service' },
  { title: 'Tool', value: 'tool' },
]

const menus = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editingMenu = ref<any>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

// Edit form
const form = ref({
  botType: 'general' as string,
  menuLevel: 1,
  menuKey: '',
  title: '',
  buttons: JSON.stringify([[{ text: '', callbackData: '' }]]),
  parentId: null as number | null,
  sortOrder: 0,
})

const mainMenus = computed(() => menus.value.filter((m: any) => m.menuLevel === 1))
const subMenus = computed(() => {
  const mains = menus.value.filter((m: any) => m.menuLevel === 1)
  const result: Record<string, any[]> = {}
  for (const main of mains) {
    result[main.menuKey] = menus.value.filter((m: any) => m.parentId === main.id)
  }
  return result
})

function parseButtons(buttonsStr: string) {
  try {
    const parsed = JSON.parse(buttonsStr)
    if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) return parsed
    if (Array.isArray(parsed)) return parsed.map(b => [b])
    return []
  } catch {
    return []
  }
}

function buttonsPreview(buttonsStr: string) {
  const rows = parseButtons(buttonsStr)
  return rows.map(row => {
    if (row.length === 0) return '--- separator ---'
    return row.map((b: any) => `${b.text || '(empty)'} -> ${b.callbackData || '(empty)'}`).join('  |  ')
  }).join('\n')
}

async function loadMenus() {
  loading.value = true
  try {
    const res = await telegramBotService.getMenus()
    menus.value = Array.isArray(res?.menus) ? res.menus : []
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load menus', color: 'error' }
  } finally {
    loading.value = false
  }
}

function openCreateDialog(level: number, parentId?: number, botType?: string) {
  editingMenu.value = null
  const sameLevel = menus.value.filter((m: any) =>
    m.menuLevel === level && (level === 1 || m.parentId === parentId)
  )
  const nextOrder = sameLevel.length > 0 ? Math.max(...sameLevel.map((m: any) => m.sortOrder ?? 0)) + 1 : 0
  form.value = {
    botType: botType || 'general',
    menuLevel: level,
    menuKey: '',
    title: '',
    buttons: JSON.stringify([[{ text: '', callbackData: '' }]]),
    parentId: parentId || null,
    sortOrder: nextOrder,
  }
  dialog.value = true
}

function openEditDialog(menu: any) {
  editingMenu.value = menu
  form.value = {
    botType: menu.botType || 'general',
    menuLevel: menu.menuLevel,
    menuKey: menu.menuKey,
    title: menu.title || '',
    buttons: menu.buttons || '[]',
    parentId: menu.parentId,
    sortOrder: menu.sortOrder,
  }
  dialog.value = true
}

async function saveMenu() {
  loading.value = true
  try {
    const data = { ...form.value }
    if (editingMenu.value) {
      await telegramBotService.updateMenu(editingMenu.value.id, data)
      snackbar.value = { show: true, text: 'Menu updated', color: 'success' }
    } else {
      await telegramBotService.createMenu(data)
      snackbar.value = { show: true, text: 'Menu created', color: 'success' }
    }
    dialog.value = false
    await loadMenus()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to save', color: 'error' }
  } finally {
    loading.value = false
  }
}

async function deleteMenu(id: number) {
  if (!confirm('Delete this menu?')) return
  loading.value = true
  try {
    await telegramBotService.deleteMenu(id)
    snackbar.value = { show: true, text: 'Menu deleted', color: 'success' }
    await loadMenus()
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to delete', color: 'error' }
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadMenus() })
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center flex-wrap gap-3 py-3">
        <div class="flex-grow-1">
          <h4 class="text-h4 mb-1">Bot Menu Config</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage shared menus by bot type</p>
        </div>
        <VBtn color="primary" @click="openCreateDialog(1)">
          <VIcon icon="bx-plus" class="me-1" /> Add Main Menu
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Group by botType -->
    <template v-for="bt in BOT_TYPES" :key="bt.value">
      <VCard v-if="menus.filter((m: any) => m.botType === bt.value).length > 0" class="mb-4">
        <VCardTitle class="text-subtitle-1 py-2 px-4">
          <VChip size="small" :color="bt.value === 'general' ? 'primary' : 'secondary'" variant="tonal">{{ bt.title }}</VChip>
        </VCardTitle>

        <VCardText>
          <VCard v-for="main in menus.filter((m: any) => m.botType === bt.value && m.menuLevel === 1)" :key="main.id" class="mb-3" variant="outlined">
            <div class="d-flex align-center mb-2">
              <VChip size="small" color="primary" variant="tonal" class="me-2">Lv1</VChip>
              <span class="text-h6">{{ main.title || main.menuKey }}</span>
              <VSpacer />
              <VBtn icon size="x-small" variant="text" color="primary" @click="openEditDialog(main)"><VIcon icon="bx-edit" /></VBtn>
              <VBtn icon size="x-small" variant="text" color="error" @click="deleteMenu(main.id)"><VIcon icon="bx-trash" /></VBtn>
            </div>
            <VAlert v-if="main.buttons" type="info" variant="tonal" density="compact" class="mb-2">
              <pre class="text-caption ma-0 text-left" style="white-space: pre-wrap">{{ buttonsPreview(main.buttons) }}</pre>
            </VAlert>
            <div class="text-caption text-medium-emphasis">
              menuKey: {{ main.menuKey }} · sortOrder: {{ main.sortOrder }}
            </div>

            <!-- Sub Menus -->
            <template v-if="subMenus[main.menuKey]?.length">
              <VDivider class="my-3" />
              <VCard v-for="sub in subMenus[main.menuKey]" :key="sub.id" variant="outlined" class="mb-2 pa-3">
                <div class="d-flex align-center mb-1">
                  <VChip size="small" color="secondary" variant="tonal" class="me-2">Lv2</VChip>
                  <span class="text-subtitle-1">{{ sub.title || sub.menuKey }}</span>
                  <VSpacer />
                  <VBtn icon size="x-small" variant="text" color="primary" @click="openEditDialog(sub)"><VIcon icon="bx-edit" /></VBtn>
                  <VBtn icon size="x-small" variant="text" color="error" @click="deleteMenu(sub.id)"><VIcon icon="bx-trash" /></VBtn>
                </div>
                <VAlert v-if="sub.buttons" type="info" variant="tonal" density="compact">
                  <pre class="text-caption ma-0" style="white-space: pre-wrap">{{ buttonsPreview(sub.buttons) }}</pre>
                </VAlert>
                <div class="text-caption text-medium-emphasis mt-1">
                  menuKey: {{ sub.menuKey }} · sortOrder: {{ sub.sortOrder }}
                </div>
              </VCard>
            </template>

            <VBtn size="small" variant="text" class="mt-2" @click="openCreateDialog(2, main.id, bt.value)">
              <VIcon icon="bx-plus" size="small" class="me-1" /> Add Sub Menu
            </VBtn>
          </VCard>
        </VCardText>
      </VCard>
    </template>

    <!-- Create/Edit Dialog -->
    <VDialog v-model="dialog" max-width="600">
      <VCard>
        <VCardTitle>{{ editingMenu ? 'Edit Menu' : 'Create Menu' }}</VCardTitle>
        <VCardText>
          <VSelect v-model="form.botType" :items="BOT_TYPES" label="Bot Type" density="compact" class="mb-3" />
          <VTextField v-model="form.title" label="Title" density="compact" class="mb-3" />
          <VTextField v-model="form.menuKey" label="Menu Key (callback_data identifier)" density="compact" class="mb-3" :rules="[(v: string) => !!v && v.trim() !== '' || 'Required']" />
          <VSelect v-model="form.menuLevel" :items="[{ title: 'Main Menu', value: 1 }, { title: 'Sub Menu', value: 2 }]" label="Level" density="compact" class="mb-3" />
          <VSelect
            v-if="form.menuLevel === 2"
            v-model="form.parentId"
            :items="mainMenus.filter((m: any) => m.botType === form.botType).map((m: any) => ({ title: `${m.title || m.menuKey} (${m.id})`, value: m.id }))"
            label="Parent Menu"
            density="compact"
            class="mb-3"
          />
          <VTextField v-model.number="form.sortOrder" label="Sort Order" type="number" density="compact" class="mb-3" />
          <VTextarea
            v-model="form.buttons"
            label="Buttons JSON"
            rows="6"
            density="compact"
            class="mb-2 font-monospace"
            hint='Each row is an array. Example: [[{"text":"A","callbackData":"x"},{"text":"B","callbackData":"y"}],[{"text":"C","callbackData":"z"}]]'
            persistent-hint
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="loading" :disabled="!form.menuKey?.trim()" @click="saveMenu">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
