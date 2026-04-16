<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const name = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value)?.name || 'Unknown Project')

const itemsPerPage = ref(10)
const searchQuery = ref('')
const selectedRole = ref()
const isViewDialogVisible = ref(false)
const viewingMember = ref<any>(null)

const members = ref([
  { id: 1, name: 'Keith', email: 'keith@jhdevops.com', role: 'Project Lead', status: 'Active', joined: '2024-01-01', tasks: 42, avatar: 'K', contact: '(829) 537-0057', telegram: '@keith', google: 'keith@gmail.com', slack: 'keith-dev', language: 'English', country: 'United States', department: 'Engineering', team: 'Frontend' },
  { id: 2, name: 'Eileen', email: 'eileen@jhdevops.com', role: 'Senior Developer', status: 'Active', joined: '2024-01-05', tasks: 38, avatar: 'E', contact: '(555) 123-4567', telegram: '@eileen', google: 'eileen@gmail.com', slack: 'eileen-dev', language: 'English', country: 'Canada', department: 'Engineering', team: 'Backend' },
  { id: 3, name: 'Owen', email: 'owen@jhdevops.com', role: 'UI Designer', status: 'Active', joined: '2024-01-10', tasks: 25, avatar: 'O', contact: '(555) 987-6543', telegram: '@owen', google: 'owen@gmail.com', slack: 'owen-design', language: 'Chinese', country: 'China', department: 'Design', team: 'UI Team' },
  { id: 4, name: 'Merline', email: 'merline@jhdevops.com', role: 'Developer', status: 'Away', joined: '2024-02-01', tasks: 15, avatar: 'M', contact: '(555) 456-7890', telegram: '@merline', google: 'merline@gmail.com', slack: 'merline-dev', language: 'English', country: 'United States', department: 'Engineering', team: 'Frontend' },
  { id: 5, name: 'Harmonia', email: 'harmonia@jhdevops.com', role: 'QA Engineer', status: 'Active', joined: '2024-02-15', tasks: 30, avatar: 'H', contact: '(555) 321-6540', telegram: '@harmonia', google: 'harmonia@gmail.com', slack: 'harmonia-qa', language: 'Japanese', country: 'Japan', department: 'Engineering', team: 'QA' },
  { id: 6, name: 'Rebecca', email: 'rebecca@jhdevops.com', role: 'Developer', status: 'Active', joined: '2024-03-01', tasks: 22, avatar: 'R', contact: '(555) 654-3210', telegram: '@rebecca', google: 'rebecca@gmail.com', slack: 'rebecca-dev', language: 'English', country: 'United Kingdom', department: 'Engineering', team: 'Backend' },
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

function openView(member: any) {
  viewingMember.value = member
  isViewDialogVisible.value = true
}

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
          <IconBtn @click="openView(item)"><VIcon icon="bx-show" /></IconBtn>
          <IconBtn><VIcon icon="bx-edit" /></IconBtn>
          <IconBtn><VIcon icon="bx-trash" /></IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- View Member Dialog -->
    <VDialog v-model="isViewDialogVisible" max-width="500">
      <VCard v-if="viewingMember">
        <VCardText class="text-center pt-8 pb-4">
          <VAvatar size="100" variant="tonal" :color="resolveAvatarColor(viewingMember.name)" rounded class="mb-4">
            <span class="text-h3 font-weight-medium">{{ viewingMember.avatar }}</span>
          </VAvatar>
          <h5 class="text-h5">{{ viewingMember.name }}</h5>
          <VChip variant="tonal" color="secondary" size="small" label class="text-capitalize mt-2">{{ viewingMember.role }}</VChip>
        </VCardText>
        <VDivider />
        <VCardText>
          <VList class="card-list" density="compact" lines="one">
            <VListItem><VListItemTitle><h6 class="text-h6">Username: <span class="text-body-1 d-inline-block">{{ viewingMember.name }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Status: <span class="text-body-1 text-capitalize d-inline-block">{{ viewingMember.status }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Role: <span class="text-body-1 d-inline-block">{{ viewingMember.role }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Contact: <span class="text-body-1 d-inline-block">{{ viewingMember.contact }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Telegram: <span class="text-body-1 d-inline-block">{{ viewingMember.telegram }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Google: <span class="text-body-1 d-inline-block">{{ viewingMember.google }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Slack: <span class="text-body-1 d-inline-block">{{ viewingMember.slack }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Department: <span class="text-body-1 d-inline-block">{{ viewingMember.department }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Team: <span class="text-body-1 d-inline-block">{{ viewingMember.team }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Language: <span class="text-body-1 d-inline-block">{{ viewingMember.language }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Country: <span class="text-body-1 d-inline-block">{{ viewingMember.country }}</span></h6></VListItemTitle></VListItem>
          </VList>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isViewDialogVisible = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
