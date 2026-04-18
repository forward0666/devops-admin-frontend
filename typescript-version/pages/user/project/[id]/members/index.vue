<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)

const projectStore = useProjectStore()
const authStore = useAuthStore()
const name = computed(() => projectStore.projects.find(p => String(p.id) === projectId.value)?.name || 'Unknown Project')

const canInvite = computed(() => {
  if (!authStore.isReady) return false
  const allowedLoginRoles = ['sys_admin', 'admin']
  if (allowedLoginRoles.includes(authStore.loginRole)) return true
  if (authStore.loginRole === 'leader') return true
})

const itemsPerPage = ref(10)
const searchQuery = ref('')
const selectedRole = ref()
const isViewDialogVisible = ref(false)
const viewingMember = ref<any>(null)
const isDeleteDialogVisible = ref(false)
const deletingMember = ref<any>(null)
const isInviteDialogVisible = ref(false)
const inviteSearch = ref('')
const selectedInviteUsers = ref<any[]>([])

const userStore = useUserStore()

const availableUsers = computed(() => {
  const query = inviteSearch.value.toLowerCase()
  const memberEmails = new Set(members.value.map(m => m.email))
  return userStore.users.filter(u => {
    if (memberEmails.has(u.email)) return false
    if (!query) return true
    return u.fullName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
  })
})

const isUserSelected = (user: any) => selectedInviteUsers.value.some(u => u.id === user.id)

function toggleUser(user: any) {
  const idx = selectedInviteUsers.value.findIndex(u => u.id === user.id)
  if (idx === -1) selectedInviteUsers.value.push(user)
  else selectedInviteUsers.value.splice(idx, 1)
}

function inviteMembers() {
  selectedInviteUsers.value.forEach(user => {
    const newId = Math.max(...members.value.map(m => m.id), 0) + 1
    members.value.push({
      id: newId,
      name: user.fullName,
      email: user.email,
      role: 'Member',
      position: 'Developer',
      status: 'Active',
      joined: new Date().toISOString().split('T')[0],
      tasks: 0,
      avatar: user.fullName.charAt(0).toUpperCase(),
      contact: '', telegram: '', google: '', slack: '', language: 'English', country: 'United States', department: user.department || 'Engineering', team: user.team || 'Frontend',
    })
  })
  selectedInviteUsers.value = []
  inviteSearch.value = ''
  isInviteDialogVisible.value = false
}

function deleteMember(member: any) {
  deletingMember.value = member
  isDeleteDialogVisible.value = true
}

function confirmDelete() {
  if (deletingMember.value) {
    members.value = members.value.filter(m => m.id !== deletingMember.value.id)
  }
  isDeleteDialogVisible.value = false
}

const members = ref([
  { id: 1, name: 'Keith', email: 'keith@jhdevops.com', role: 'Leader', position: 'Tech Lead', status: 'Active', joined: '2024-01-01', tasks: 42, avatar: 'K', contact: '(829) 537-0057', telegram: '@keith', google: 'keith@gmail.com', slack: 'keith-dev', language: 'English', country: 'United States', department: 'Engineering', team: 'Frontend' },
  { id: 2, name: 'Eileen', email: 'eileen@jhdevops.com', role: 'Member', position: 'Senior Developer', status: 'Active', joined: '2024-01-05', tasks: 38, avatar: 'E', contact: '(555) 123-4567', telegram: '@eileen', google: 'eileen@gmail.com', slack: 'eileen-dev', language: 'English', country: 'Canada', department: 'Engineering', team: 'Backend' },
  { id: 3, name: 'Owen', email: 'owen@jhdevops.com', role: 'Member', position: 'UI Designer', status: 'Active', joined: '2024-01-10', tasks: 25, avatar: 'O', contact: '(555) 987-6543', telegram: '@owen', google: 'owen@gmail.com', slack: 'owen-design', language: 'Chinese', country: 'China', department: 'Design', team: 'UI Team' },
  { id: 4, name: 'Merline', email: 'merline@jhdevops.com', role: 'Member', position: 'Developer', status: 'Away', joined: '2024-02-01', tasks: 15, avatar: 'M', contact: '(555) 456-7890', telegram: '@merline', google: 'merline@gmail.com', slack: 'merline-dev', language: 'English', country: 'United States', department: 'Engineering', team: 'Frontend' },
  { id: 5, name: 'Harmonia', email: 'harmonia@jhdevops.com', role: 'Member', position: 'QA Engineer', status: 'Active', joined: '2024-02-15', tasks: 30, avatar: 'H', contact: '(555) 321-6540', telegram: '@harmonia', google: 'harmonia@gmail.com', slack: 'harmonia-qa', language: 'Japanese', country: 'Japan', department: 'Engineering', team: 'QA' },
  { id: 6, name: 'Rebecca', email: 'rebecca@jhdevops.com', role: 'Member', position: 'Developer', status: 'Active', joined: '2024-03-01', tasks: 22, avatar: 'R', contact: '(555) 654-3210', telegram: '@rebecca', google: 'rebecca@gmail.com', slack: 'rebecca-dev', language: 'English', country: 'United Kingdom', department: 'Engineering', team: 'Backend' },
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
  { title: 'Position', key: 'position', sortable: true },
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
      <VBtn prepend-icon="bx-user-plus" color="primary" :disabled="!canInvite" @click="isInviteDialogVisible = true">Invite Member</VBtn>
    </div>

    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 pb-0">
        <VTextField v-model="searchQuery" placeholder="Search Member" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" prepend-inner-icon="bx-search" />
        <VSelect v-model="selectedRole" placeholder="Select Role" :items="['Leader', 'Member']" density="comfortable" style="inline-size: 12.5rem;" clearable hide-details variant="outlined" />
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
          <VChip variant="tonal" :color="item.role === 'Leader' ? 'warning' : 'primary'" size="small" label class="text-capitalize">{{ item.role }}</VChip>
        </template>
        <template #item.position="{ item }">
          <span class="text-body-1">{{ item.position }}</span>
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
          <IconBtn @click="deleteMember(item)"><VIcon icon="bx-x-circle" /></IconBtn>
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

    <!-- Delete Member Dialog -->
    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard>
        <VCardItem>
          <VCardTitle>Remove Member</VCardTitle>
          <VBtn icon variant="text" @click="isDeleteDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>Are you sure you want to remove <strong>{{ deletingMember?.name }}</strong> from this project?</VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" @click="confirmDelete">Remove</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Invite Member Dialog -->
    <VDialog v-model="isInviteDialogVisible" max-width="600">
      <VCard>
        <VCardItem>
          <VCardTitle>Invite Member</VCardTitle>
          <VBtn icon variant="text" @click="isInviteDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VTextField v-model="inviteSearch" placeholder="Search by name or email" density="comfortable" class="mb-4" variant="outlined" prepend-inner-icon="bx-search" clearable />
          <VList v-if="availableUsers.length" max-height="250" class="border rounded" style="overflow-y: auto;">
            <VListItem v-for="user in availableUsers.slice(0, 10)" :key="user.id" @click="toggleUser(user)" class="cursor-pointer">
              <template #prepend>
                <VAvatar size="34" variant="tonal" color="primary" class="me-3">
                  <span class="text-sm font-weight-medium">{{ user.fullName.charAt(0) }}</span>
                </VAvatar>
              </template>
              <VListItemTitle>{{ user.fullName }}</VListItemTitle>
              <VListItemSubtitle>{{ user.email }}</VListItemSubtitle>
              <template #append>
                <VCheckbox :model-value="isUserSelected(user)" density="compact" hide-details />
              </template>
            </VListItem>
          </VList>
          <p v-else-if="inviteSearch" class="text-body-2 text-medium-emphasis text-center py-4">No users found</p>
          <VDivider class="my-4" />
          <p v-if="selectedInviteUsers.length" class="text-body-2 text-medium-emphasis mb-2">{{ selectedInviteUsers.length }} user(s) selected</p>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn color="primary" :disabled="!selectedInviteUsers.length" @click="inviteMembers">Invite</VBtn>
          <VBtn variant="tonal" @click="isInviteDialogVisible = false">Cancel</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
