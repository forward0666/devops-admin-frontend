<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const name = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value)?.name || 'Unknown Project')

const itemsPerPage = ref(10)
const searchQuery = ref('')
const selectedRole = ref()

const members = ref([
  { id: 1, name: 'Keith', email: 'keith@jhdevops.com', role: 'Project Lead', status: 'Active', joined: '2024-01-01', tasks: 42, avatar: 'K' },
  { id: 2, name: 'Eileen', email: 'eileen@jhdevops.com', role: 'Senior Developer', status: 'Active', joined: '2024-01-05', tasks: 38, avatar: 'E' },
  { id: 3, name: 'Owen', email: 'owen@jhdevops.com', role: 'UI Designer', status: 'Active', joined: '2024-01-10', tasks: 25, avatar: 'O' },
  { id: 4, name: 'Merline', email: 'merline@jhdevops.com', role: 'Developer', status: 'Away', joined: '2024-02-01', tasks: 15, avatar: 'M' },
  { id: 5, name: 'Harmonia', email: 'harmonia@jhdevops.com', role: 'QA Engineer', status: 'Active', joined: '2024-02-15', tasks: 30, avatar: 'H' },
  { id: 6, name: 'Rebecca', email: 'rebecca@jhdevops.com', role: 'Developer', status: 'Active', joined: '2024-03-01', tasks: 22, avatar: 'R' },
])

const resolveAvatarColor = (name: string) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
  return colors[name.charCodeAt(0) % colors.length]
}

const filteredMembers = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(m => {
    const matchRole = !selectedRole.value || m.role === selectedRole.value
    const matchSearch = !query || m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
    return matchRole && matchSearch
  })
})

const headers = [
  { title: 'Member', key: 'member', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Tasks', key: 'tasks', sortable: true },
  { title: 'Joined', key: 'joined', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h4 class="text-h4">{{ name }} - Member</h4>
      </div>
      <VBtn prepend-icon="bx-user-plus" color="primary">Add Member</VBtn>
    </div>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 pb-0">
        <VTextField v-model="searchQuery" placeholder="Search Member" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" prepend-inner-icon="bx-search" />
        <VSelect v-model="selectedRole" placeholder="Select Role" :items="['Project Lead', 'Senior Developer', 'Developer', 'UI Designer', 'QA Engineer']" density="comfortable" style="inline-size: 12.5rem;" clearable hide-details variant="outlined" />
        <VSpacer />
      </VCardText>
      <VDivider class="mt-4" />
      <VDataTable :headers="headers" :items="filteredMembers" :items-per-page="itemsPerPage" class="text-no-wrap">
        <template #item.member="{ item }">
          <div class="d-flex align-center gap-x-3">
            <VAvatar size="34" variant="tonal" :color="resolveAvatarColor(item.name)">
              <span class="text-sm font-weight-medium">{{ item.avatar }}</span>
            </VAvatar>
            <div>
              <h6 class="text-base font-weight-medium">{{ item.name }}</h6>
              <span class="text-sm text-medium-emphasis">{{ item.email }}</span>
            </div>
          </div>
        </template>
        <template #item.role="{ item }">
          <VChip variant="tonal" color="primary" size="small" label>{{ item.role }}</VChip>
        </template>
        <template #item.status="{ item }">
          <VChip variant="tonal" :color="item.status === 'Active' ? 'success' : 'warning'" size="small" label class="text-capitalize">{{ item.status }}</VChip>
        </template>
        <template #item.tasks="{ item }">
          <span class="text-body-1 text-high-emphasis">{{ item.tasks }}</span>
        </template>
        <template #item.joined="{ item }">
          <span class="text-body-2">{{ item.joined }}</span>
        </template>
        <template #item.actions="{ item }">
          <IconBtn><VIcon icon="bx-show" /></IconBtn>
          <IconBtn><VIcon icon="bx-edit" /></IconBtn>
          <IconBtn><VIcon icon="bx-trash" /></IconBtn>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
