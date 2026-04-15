<script setup lang="ts">
const search = ref('')
const isPermDialogVisible = ref(false)
const selectedGroup = ref<any>(null)

const projectMenuTree = [
  {
    name: 'Dashboard Design', children: [
      { name: 'Project Info' },
      { name: 'Project Assets' },
    ],
  },
  {
    name: 'BGC eCommerce App', children: [
      { name: 'Project Info' },
      { name: 'Project Assets' },
    ],
  },
  {
    name: 'Falcon Logo Design', children: [
      { name: 'Project Info' },
      { name: 'Project Assets' },
    ],
  },
  {
    name: 'Foodista Mobile App', children: [
      { name: 'Project Info' },
      { name: 'Project Assets' },
    ],
  },
]

const getAllMenuNames = (items: any[]): string[] => {
  const result: string[] = []
  items.forEach(item => {
    result.push(item.name)
    if (item.children) result.push(...getAllMenuNames(item.children))
  })
  return result
}

const allMenuNames = getAllMenuNames(projectMenuTree)
const makeEmptyPerms = () => Object.fromEntries(allMenuNames.map(m => [m, 'none']))

const groups = ref([
  {
    id: 1, name: 'all-projects', label: 'All Projects', description: 'Access to all projects', builtin: true,
    users: ['admin', 'john', 'mary', 'tom'],
    permissions: { ...makeEmptyPerms(), 'Dashboard Design': 'edit', 'BGC eCommerce App': 'edit', 'Falcon Logo Design': 'view', 'Foodista Mobile App': 'view', 'Project Info': 'view', 'Project Assets': 'view' },
  },
  {
    id: 2, name: 'design-team', label: 'Design Team', description: 'Design related projects only', builtin: false,
    users: ['mary'],
    permissions: { ...makeEmptyPerms(), 'Dashboard Design': 'edit', 'Falcon Logo Design': 'edit', 'Project Info': 'view', 'Project Assets': 'edit' },
  },
])

const allUsers = ['admin', 'john', 'mary', 'tom', 'lucy', 'jack']

const childToParent = computed(() => {
  const map: Record<string, string> = {}
  const walk = (items: any[], parent: string | null) => {
    items.forEach(item => {
      if (parent) map[item.name] = parent
      if (item.children) walk(item.children, item.name)
    })
  }
  walk(projectMenuTree, null)
  return map
})

const isMenuDisabled = (menuName: string): boolean => {
  if (!selectedGroup.value) return false
  let current = menuName
  while (current) {
    const parent = childToParent.value[current]
    if (parent && selectedGroup.value.permissions[parent] === 'none') return true
    current = parent
  }
  return false
}

const onPermChange = (menuName: string, value: string) => {
  if (!selectedGroup.value) return
  selectedGroup.value.permissions[menuName] = value

  if (value === 'none') {
    const cascadeNone = (items: any[], target: string) => {
      items.forEach(item => {
        if (item.name === target && item.children) {
          const setNone = (children: any[]) => {
            children.forEach(c => {
              selectedGroup.value.permissions[c.name] = 'none'
              if (c.children) setNone(c.children)
            })
          }
          setNone(item.children)
        }
        if (item.children) cascadeNone(item.children, target)
      })
    }
    cascadeNone(projectMenuTree, menuName)
  }
}
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">Group & Permission</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-plus" color="primary">New Group</VBtn>
      </VCol>
    </VRow>

    <VExpansionPanels multiple>
      <VExpansionPanel v-for="group in groups" :key="group.id" :value="group.id">
        <VExpansionPanelTitle>
          <div class="d-flex align-center gap-x-3 flex-grow-1">
            <VAvatar size="38" variant="tonal" :color="group.builtin ? 'primary' : 'secondary'">
              <VIcon icon="bx-group" size="22" />
            </VAvatar>
            <div>
              <div class="font-weight-medium text-h6">{{ group.label }}</div>
              <div class="text-body-2 text-medium-emphasis"><code class="me-2">{{ group.name }}</code>{{ group.description }}</div>
            </div>
            <VChipGroup class="ms-4">
              <VChip v-for="u in group.users.slice(0, 3)" :key="u" size="x-small" variant="tonal" color="secondary">{{ u }}</VChip>
              <VChip v-if="group.users.length > 3" size="x-small" variant="flat" color="grey">+{{ group.users.length - 3 }}</VChip>
            </VChipGroup>
          </div>
        </VExpansionPanelTitle>

        <VExpansionPanelText>
          <VRow class="mb-4">
            <VCol cols="12" md="6" class="d-flex align-center">
              <VChip variant="tonal" color="secondary" size="small" label>{{ group.users.length }} members</VChip>
            </VCol>
            <VCol cols="12" md="6" class="d-flex justify-end gap-2">
              <VBtn size="small" variant="tonal" color="primary" prepend-icon="bx-user-plus" @click.stop="selectedGroup = group">Manage Members</VBtn>
              <VBtn size="small" variant="tonal" color="success" prepend-icon="bx-check-shield" @click.stop="selectedGroup = group; isPermDialogVisible = true">Authorize Projects</VBtn>
              <IconBtn v-if="!group.builtin" size="small" color="error"><VIcon icon="bx-trash" size="18" /></IconBtn>
            </VCol>
          </VRow>

          <h6 class="text-h6 mb-2">Members</h6>
          <VChipGroup class="mb-4">
            <VChip v-for="u in group.users" :key="u" closable color="primary" variant="tonal">{{ u }}</VChip>
          </VChipGroup>

          <h6 class="text-h6 mb-2">Authorized Projects</h6>
          <div v-for="section in projectMenuTree" :key="section.name" class="mb-3">
            <div class="font-weight-medium text-body-1 mb-1">{{ section.name }}</div>
            <div v-if="section.children" class="pl-4">
              <template v-for="child in section.children" :key="child.name">
                <div class="d-flex align-center gap-x-2 mb-1">
                  <span class="text-body-2">{{ child.name }}</span>
                  <VChip v-if="group.permissions[child.name] && group.permissions[child.name] !== 'none'" variant="tonal" :color="group.permissions[child.name] === 'edit' ? 'success' : 'info'" size="x-small" label>{{ group.permissions[child.name] }}</VChip>
                  <VChip v-else variant="tonal" color="error" size="x-small" label>none</VChip>
                </div>
              </template>
            </div>
          </div>
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>

    <!-- Authorize Projects Dialog -->
    <VDialog v-model="isPermDialogVisible" max-width="680" scrollable>
      <VCard>
        <VCardText style="max-height: 70vh; overflow-y: auto;">
          <div class="d-flex align-center gap-x-3 mb-4">
            <VAvatar size="40" variant="tonal" color="primary"><VIcon icon="bx-group" size="22" /></VAvatar>
            <div><h5 class="text-h5">{{ selectedGroup?.label }} — Authorize Projects</h5><code class="text-body-2 text-medium-emphasis">{{ selectedGroup?.name }}</code></div>
          </div>
          <VDivider class="mb-4" />
          <VAlert variant="tonal" color="warning" density="compact" class="mb-4">
            <template #prepend><VIcon icon="bx-info-circle" size="18" /></template>
            <span class="text-body-2">Setting a project to "None" will cascade to all sub-pages.</span>
          </VAlert>

          <template v-for="section in projectMenuTree" :key="section.name">
            <div class="font-weight-bold text-body-1 mb-2 mt-3 d-flex align-center gap-x-2">
              <VIcon icon="bx-folder" size="18" />{{ section.name }}
            </div>
            <template v-for="child in section.children" :key="child.name">
              <div class="d-flex align-center gap-x-3 mb-1 pl-2" :style="{ opacity: isMenuDisabled(child.name) ? 0.4 : 1 }">
                <VIcon icon="bx-file" size="16" class="text-medium-emphasis" />
                <span class="text-body-1 font-weight-medium" style="min-width: 180px;">{{ child.name }}</span>
                <VRadioGroup
                  :model-value="selectedGroup?.permissions[child.name] || 'none'"
                  density="compact" hide-details inline class="flex-grow-1"
                  @update:model-value="onPermChange(child.name, $event)"
                >
                  <VRadio value="none" color="error" label="None" />
                  <VRadio value="view" color="info" label="View" />
                  <VRadio value="edit" color="success" label="Edit" />
                </VRadioGroup>
                <VTooltip v-if="isMenuDisabled(child.name)" activator="parent" location="end">
                  Parent has no permission
                </VTooltip>
              </div>
            </template>
          </template>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isPermDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
