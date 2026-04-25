<script setup lang="ts">
import { userConsoleProjectService as projectService, userConsoleMemberService as projectMemberService, userService } from '~/services/api'

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const authStore = useAuthStore()
const userStore = useUserStore()

const project = ref<any>(null)
const members = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)

const snackbar = ref({ show: false, message: '', color: 'success' })

function showSnackbar(message: string, color = 'success') {
  snackbar.value = { show: true, message, color }
}

const name = computed(() => project.value?.name || 'Project')

const canInvite = computed(() => {
  if (!authStore.isReady) return false
  return ['sys_admin', 'admin'].includes(authStore.role) || true
})

const itemsPerPage = ref(10)
const searchQuery = ref('')
const selectedProjectRole = ref()
const isViewDialogVisible = ref(false)
const viewingMember = ref<any>(null)
const isDeleteDialogVisible = ref(false)
const deletingMember = ref<any>(null)
const isInviteDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const editingMember = ref<any>(null)
const editProjectRole = ref('')
const inviteSearch = ref('')
const selectedInviteUsers = ref<any[]>([])

async function fetchData() {
  loading.value = true
  try {
    const [projectRes, memberRes] = await Promise.all([
      projectService.getById(projectId.value),
      projectMemberService.list(projectId.value),
    ])
    project.value = Array.isArray(projectRes) ? projectRes[0] : projectRes?.data || projectRes
    members.value = Array.isArray(memberRes) ? memberRes : memberRes?.data || []
  }
  catch {
    members.value = []
  }
  finally {
    loading.value = false
  }
}

async function fetchUsers() {
  if (!userStore.users.length) {
    await userStore.fetchUsers()
  }
}

const availableUsers = computed(() => {
  const query = inviteSearch.value.toLowerCase()
  const memberUserIds = new Set(members.value.map(m => Number(m.userId)))
  return userStore.users.filter(u => {
    if (memberUserIds.has(Number(u.id))) return false
    if (!query) return true
    return u.fullName?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query)
  })
})

const isUserSelected = (user: any) => selectedInviteUsers.value.some(u => u.id === user.id)

function toggleUser(user: any) {
  const idx = selectedInviteUsers.value.findIndex(u => u.id === user.id)
  if (idx === -1)
    selectedInviteUsers.value.push(user)
  else
    selectedInviteUsers.value.splice(idx, 1)
}

async function inviteMembers() {
  saving.value = true
  try {
    await Promise.all(
      selectedInviteUsers.value.map(user =>
        projectMemberService.create({
          projectId: projectId.value,
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          projectRole: 'Member',
        }),
      ),
    )
    showSnackbar(`Successfully invited ${selectedInviteUsers.value.length} member(s)`)
    selectedInviteUsers.value = []
    inviteSearch.value = ''
    isInviteDialogVisible.value = false
    await fetchData()
  }
  catch (e: any) {
    showSnackbar(e?.message || 'Failed to invite members', 'error')
  }
  finally {
    saving.value = false
  }
}

function deleteMember(member: any) {
  deletingMember.value = member
  isDeleteDialogVisible.value = true
}

async function confirmDelete() {
  if (deletingMember.value) {
    saving.value = true
    try {
      await projectMemberService.delete(deletingMember.value.id)
      showSnackbar('Member removed successfully')
      await fetchData()
    }
    catch (e: any) {
      showSnackbar(e?.message || 'Failed to remove member', 'error')
    }
    finally {
      saving.value = false
    }
  }
  isDeleteDialogVisible.value = false
}

const resolveAvatarColor = (name: string) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
  return colors[(name?.charCodeAt(0) || 0) % colors.length]
}

const filteredMembers = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(m => {
    const displayName = m.fullName || m.username || ''
    const matchRole = !selectedProjectRole.value || m.role === selectedProjectRole.value
    const matchSearch = !query
      || displayName.toLowerCase().includes(query)
      || m.username?.toLowerCase().includes(query)
      || m.email?.toLowerCase().includes(query)
    return matchRole && matchSearch
  })
})

function openView(member: any) {
  viewingMember.value = member
  isViewDialogVisible.value = true
}

function openEdit(member: any) {
  editingMember.value = { ...member }
  editProjectRole.value = member.role || ''
  isEditDialogVisible.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    await projectMemberService.update(editingMember.value.id, {
      projectRole: editProjectRole.value,
    })
    showSnackbar('Member updated successfully')
    isEditDialogVisible.value = false
    await fetchData()
  }
  catch (e: any) {
    showSnackbar(e?.message || 'Failed to update member', 'error')
  }
  finally {
    saving.value = false
  }
}

const headers = [
  { title: 'Member', key: 'member', sortable: true },
  { title: 'Role', key: 'projectRole', sortable: true },
  { title: 'Joined', key: 'joinedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

onMounted(() => {
  fetchData()
  fetchUsers()
})
</script>

<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h4 class="text-h4">{{ name }} - Members</h4>
      </div>
      <VBtn prepend-icon="bx-user-plus" color="primary" :disabled="!canInvite" @click="isInviteDialogVisible = true">Invite Member</VBtn>
    </div>

    <VCard>
      <template v-if="loading">
        <div class="d-flex justify-center align-center pa-8">
          <VProgressCircular indeterminate size="48" color="primary" />
        </div>
      </template>

      <template v-else>
        <VCardText class="d-flex flex-wrap gap-4 pb-0">
          <VTextField v-model="searchQuery" placeholder="Search Member" density="comfortable" style="inline-size: 15.625rem;" hide-details variant="outlined" prepend-inner-icon="bx-search" />
          <VSelect v-model="selectedProjectRole" placeholder="Select Role" :items="['Administrator', 'DevOps', 'Leader', 'Member']" density="comfortable" style="inline-size: 12.5rem;" clearable hide-details variant="outlined" />
          <VSpacer />
        </VCardText>
        <VDivider class="mt-4" />
        <VDataTable :headers="headers" :items="filteredMembers" :items-per-page="itemsPerPage" class="text-no-wrap">
          <template #item.member="{ item }">
            <div class="d-flex align-center gap-x-3">
              <VAvatar size="34" variant="tonal" :color="resolveAvatarColor(item.fullName || item.username)">
                <span class="text-sm font-weight-medium">{{ (item.fullName || item.username || '?').charAt(0) }}</span>
              </VAvatar>
              <div>
                <h6 class="text-base font-weight-medium">{{ item.fullName || item.username }}</h6>
                <span class="text-sm text-medium-emphasis">{{ item.username }}</span>
              </div>
            </div>
          </template>
          <template #item.projectRole="{ item }">
            <VChip variant="tonal" :color="item.projectRole === 'Administrator' ? 'error' : item.projectRole === 'DevOps' ? 'warning' : item.projectRole === 'Leader' ? 'success' : 'primary'" size="small" label class="text-capitalize">{{ item.projectRole }}</VChip>
          </template>
          <template #item.joinedAt="{ item }">
            <span class="text-body-2">{{ item.joinedAt || '-' }}</span>
          </template>
          <template #item.actions="{ item }">
            <IconBtn @click="openView(item)"><VIcon icon="bx-show" /></IconBtn>
            <IconBtn @click="openEdit(item)"><VIcon icon="bx-edit" /></IconBtn>
            <IconBtn @click="deleteMember(item)"><VIcon icon="bx-x-circle" /></IconBtn>
          </template>
          <template #no-data>
            <div class="text-center pa-6">
              <VIcon icon="bx-user-x" size="48" color="secondary" class="mb-2" />
              <p class="text-body-1 text-medium-emphasis">No members found</p>
            </div>
          </template>
        </VDataTable>
      </template>
    </VCard>

    <!-- View Member Dialog -->
    <VDialog v-model="isViewDialogVisible" max-width="500">
      <VCard v-if="viewingMember">
        <VCardText class="text-center pt-8 pb-4">
          <VAvatar size="100" variant="tonal" :color="resolveAvatarColor(viewingMember.fullName || viewingMember.username)" rounded class="mb-4">
            <span class="text-h3 font-weight-medium">{{ (viewingMember.fullName || viewingMember.username || '?').charAt(0) }}</span>
          </VAvatar>
          <h5 class="text-h5">{{ viewingMember.fullName || viewingMember.username }}</h5>
          <VChip variant="tonal" color="secondary" size="small" label class="text-capitalize mt-2">{{ viewingMember.projectRole || '-' }}</VChip>
        </VCardText>
        <VDivider />
        <VCardText>
          <VList class="card-list" density="compact" lines="one">
            <VListItem><VListItemTitle><h6 class="text-h6">Username: <span class="text-body-1 d-inline-block">{{ viewingMember.username || '-' }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Role: <span class="text-body-1 d-inline-block">{{ viewingMember.projectRole || '-' }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Email: <span class="text-body-1 d-inline-block">{{ viewingMember.email || '-' }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Phone: <span class="text-body-1 d-inline-block">{{ viewingMember.phone || '-' }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Telegram: <span class="text-body-1 d-inline-block">{{ viewingMember.tgUsername || '-' }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Department: <span class="text-body-1 d-inline-block">{{ viewingMember.departmentName || '-' }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Position: <span class="text-body-1 d-inline-block">{{ viewingMember.userPosition || '-' }}</span></h6></VListItemTitle></VListItem>
            <VListItem><VListItemTitle><h6 class="text-h6">Joined: <span class="text-body-1 d-inline-block">{{ viewingMember.joinedAt || '-' }}</span></h6></VListItemTitle></VListItem>
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
        <VCardText>
          Are you sure you want to remove <strong>{{ deletingMember?.fullName || deletingMember?.username }}</strong> from this project?
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isDeleteDialogVisible = false">Cancel</VBtn>
          <VBtn color="error" :loading="saving" @click="confirmDelete">Remove</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Invite Member Dialog -->
    <VDialog v-model="isEditDialogVisible" max-width="450">
      <VCard>
        <VCardItem>
          <VCardTitle>Edit Member</VCardTitle>
          <template #append><VBtn icon variant="text" @click="isEditDialogVisible = false"><VIcon icon="bx-x" /></VBtn></template>
        </VCardItem>
        <VDivider />
        <VCardText class="pt-6">
          <VSelect v-model="editProjectRole" label="Role" :items="['Administrator', 'DevOps', 'Leader', 'Member']" density="comfortable" variant="outlined" class="mb-4" />
        </VCardText>
        <VDivider />
        <VCardActions class="justify-end pa-4">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="saving" @click="saveEdit">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

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
                  <span class="text-sm font-weight-medium">{{ user.fullName?.charAt(0) || '?' }}</span>
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
          <p v-else class="text-body-2 text-medium-emphasis text-center py-4">No available users to invite</p>
          <VDivider class="my-4" />
          <p v-if="selectedInviteUsers.length" class="text-body-2 text-medium-emphasis mb-2">{{ selectedInviteUsers.length }} user(s) selected</p>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn color="primary" :disabled="!selectedInviteUsers.length" :loading="saving" @click="inviteMembers">Invite</VBtn>
          <VBtn variant="tonal" @click="isInviteDialogVisible = false">Cancel</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top end">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>
