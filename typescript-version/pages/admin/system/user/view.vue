<script setup lang="ts">
const activeTab = ref('account')
const isConfirmDeleteDialogVisible = ref(false)
const isEditDialogVisible = ref(false)
const editForm = ref({ fullName: '', contact: '', telegram: '', google: '', slack: '', language: '', country: '' })

function openEditDialog() {
  editForm.value = {
    fullName: userData.fullName,
    contact: userData.contact,
    telegram: userData.telegram,
    google: userData.google,
    slack: userData.slack,
    language: userData.language,
    country: userData.country,
  }
  isEditDialogVisible.value = true
}

function saveEdit() {
  Object.assign(userData, editForm.value)
  isEditDialogVisible.value = false
}

const route = useRoute()
const userStore = useUserStore()

const userId = computed(() => Number(route.query.id))
const dbUser = computed(() => userStore.users.find(u => u.id === userId.value))

const userData = reactive({
  fullName: dbUser.value?.fullName || 'Selina Kyle',
  username: dbUser.value?.fullName || 'Selina Kyle',
  email: dbUser.value?.email || 'irena.dubrovna@wayne.com',
  role: dbUser.value?.role || 'admin',
  status: dbUser.value?.status || 'Active',
  contact: '(829) 537-0057',
  telegram: '@johndoe',
  google: 'john@gmail.com',
  slack: 'john-doe',
  language: 'English',
  country: 'United States',
  department: dbUser.value?.department || 'Engineering',
  team: dbUser.value?.team || 'Backend',
  taskDone: '1.23k',
  projectDone: '568',
})

const itemsPerPage = ref(5)

const projects = ref([
  { name: 'BGC eCommerce App', type: 'React Project', leader: 'Eileen', progress: 78, img: '/images/pages/react.png', team: ['avatar-1.png', 'avatar-8.png', 'avatar-6.png'], teamExtra: 3 },
  { name: 'Falcon Logo Design', type: 'Figma Project', leader: 'Owen', progress: 25, img: '/images/pages/figma.png', team: ['avatar-5.png', 'avatar-2.png'], teamExtra: 0 },
  { name: 'Dashboard Design', type: 'Vuejs Project', leader: 'Keith', progress: 62, img: '/images/pages/vuejs.png', team: ['avatar-8.png', 'avatar-2.png', 'avatar-1.png'], teamExtra: 0 },
  { name: 'Foodista mobile app', type: 'Xamarin Project', leader: 'Merline', progress: 8, img: '/images/pages/xamarin.png', team: ['avatar-3.png', 'avatar-4.png', 'avatar-7.png'], teamExtra: 8 },
  { name: 'Dojo Email App', type: 'Python Project', leader: 'Harmonia', progress: 51, img: '/images/pages/python.png', team: ['avatar-4.png', 'avatar-3.png', 'avatar-1.png'], teamExtra: 5 },
  { name: 'Hilton Group', type: 'React Project', leader: 'Rebecca', progress: 85, img: '/images/pages/react.png', team: ['avatar-2.png', 'avatar-5.png', 'avatar-4.png'], teamExtra: 2 },
  { name: 'Mobile App UI', type: 'Figma Project', leader: 'Olivia', progress: 40, img: '/images/pages/figma.png', team: ['avatar-7.png', 'avatar-1.png'], teamExtra: 1 },
])

const recentDevices = ref([
  { device: 'iPhone 13 Pro', browser: 'Safari', location: 'San Francisco, US', time: '10:30 AM', icon: 'bx-mobile', current: true },
  { device: 'MacBook Pro', browser: 'Chrome', location: 'New York, US', time: 'Yesterday', icon: 'bx-laptop', current: false },
  { device: 'iPad Mini', browser: 'Safari', location: 'Los Angeles, US', time: '3 days ago', icon: 'bx-tablet', current: false },
])

const activityTimeline = ref([
  { text: 'Created project "Dashboard Design"', time: '2 min ago', icon: 'bx-folder-plus', color: 'primary' },
  { text: 'Added team member to "BGC eCommerce App"', time: '1 hour ago', icon: 'bx-user-plus', color: 'success' },
  { text: 'Completed task "Update API endpoints"', time: '3 hours ago', icon: 'bx-check-circle', color: 'info' },
  { text: 'Commented on "Falcon Logo Design"', time: '5 hours ago', icon: 'bx-message-dots', color: 'warning' },
  { text: 'Updated project status for "Foodista mobile app"', time: 'Yesterday', icon: 'bx-edit', color: 'error' },
  { text: 'Pushed 3 commits to "Dashboard Design"', time: 'Yesterday', icon: 'bx-git-commit', color: 'primary' },
])

const twoFactorEnabled = ref(false)
const phoneNumber = ref('+1 (234) 567-8901')
const emailAddress = ref('')
const verifyMethod = ref('phone')

const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

const passwordRequirements = [
  'Minimum 8 characters long, uppercase & symbol',
]
</script>

<template>
  <div>
    <VRow>
      <!-- Left Column -->
      <VCol cols="12" md="5" lg="4">
        <VRow>
          <!-- Profile Card -->
          <VCol cols="12">
            <VCard>
              <VCardText class="text-center pt-12">
                <VAvatar size="120" variant="tonal" color="primary" rounded>
                  <span class="text-h2 font-weight-medium">{{ userData.fullName.charAt(0) }}</span>
                </VAvatar>
                <h5 class="text-h5 mt-4">{{ userData.fullName }}</h5>
              </VCardText>
              <VCardText>
                <div class="d-flex justify-space-around gap-x-6 gap-y-2 flex-wrap mb-6">
                  <div class="d-flex align-center me-8">
                    <VAvatar variant="tonal" color="primary" rounded size="40" class="me-4"><VIcon icon="bx-check" size="24" /></VAvatar>
                    <div>
                      <h5 class="text-h5">{{ userData.taskDone }}</h5>
                      <span class="text-body-1 d-inline-block">Task Done</span>
                    </div>
                  </div>
                  <div class="d-flex align-center me-4">
                    <VAvatar variant="tonal" color="primary" rounded size="38" class="me-4"><VIcon icon="bx-customize" size="24" /></VAvatar>
                    <div>
                      <h5 class="text-h5">{{ userData.projectDone }}</h5>
                      <span class="text-body-1 d-inline-block">Project Done</span>
                    </div>
                  </div>
                </div>
                <h5 class="text-h5">Details</h5>
                <VDivider class="my-4" />
                <VList class="card-list mt-2" density="compact" lines="one">
                  <VListItem><VListItemTitle><h6 class="text-h6">Username: <span class="text-body-1 d-inline-block">{{ userData.username }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Status: <span class="text-body-1 text-capitalize d-inline-block">{{ userData.status }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Role: <span class="text-body-1 d-inline-block">{{ userData.role }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Contact: <span class="text-body-1 d-inline-block">{{ userData.contact }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Telegram: <span class="text-body-1 d-inline-block">{{ userData.telegram }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Google: <span class="text-body-1 d-inline-block">{{ userData.google }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Slack: <span class="text-body-1 d-inline-block">{{ userData.slack }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Department: <span class="text-body-1 d-inline-block">{{ userData.department }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Team: <span class="text-body-1 d-inline-block">{{ userData.team }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Language: <span class="text-body-1 d-inline-block">{{ userData.language }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Country: <span class="text-body-1 d-inline-block">{{ userData.country }}</span></h6></VListItemTitle></VListItem>
                </VList>
              </VCardText>
              <VCardText class="d-flex justify-center gap-x-4">
                <VBtn variant="elevated" color="primary" @click="openEditDialog">Edit</VBtn>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>

      <!-- Right Column: Tabs -->
      <VCol cols="12" md="7" lg="8">
        <VTabs v-model="activeTab">
          <VTab value="account"><VIcon icon="bx-user" size="18" class="me-1" />Account</VTab>
          <VTab value="security"><VIcon icon="bx-lock-alt" size="18" class="me-1" />Security</VTab>
          <VTab value="notifications"><VIcon icon="bx-bell" size="18" class="me-1" />Notifications</VTab>
          <VTab value="connections"><VIcon icon="bx-link" size="18" class="me-1" />Connections</VTab>
        </VTabs>

        <!-- Account Tab -->
        <div v-show="activeTab === 'account'" class="mt-6">
          <VCard>
            <VCardItem><VCardTitle>Projects List</VCardTitle></VCardItem>
            <VDataTable show-select :items="projects" :items-per-page="itemsPerPage" :headers="[{ title: 'PROJECT', key: 'project' }, { title: 'LEADER', key: 'leader' }, { title: 'TEAM', key: 'team' }, { title: 'PROGRESS', key: 'progress' }, { title: 'Action', key: 'action', sortable: false }]" class="text-no-wrap">
              <template #item.project="{ item }">
                <div class="d-flex align-center gap-x-3">
                  <VAvatar size="34" rounded variant="tonal" color="primary"><span class="text-sm font-weight-medium">{{ item.name.charAt(0) }}</span></VAvatar>
                  <div>
                    <h6 class="text-h6 text-no-wrap">{{ item.name }}</h6>
                    <div class="text-body-2">{{ item.type }}</div>
                  </div>
                </div>
              </template>
              <template #item.leader="{ item }"><div class="text-base text-high-emphasis">{{ item.leader }}</div></template>
              <template #item.team="{ item }">
                <div class="d-flex">
                  <VAvatarGroup size="26">
                    <VAvatar v-for="(avatar, i) in item.team" :key="i" size="26" variant="tonal" color="primary"><span class="text-caption font-weight-medium">{{ avatar.split('-')[1]?.charAt(0) || avatar.charAt(0) }}</span></VAvatar>
                    <VAvatar v-if="item.teamExtra" size="26" color="grey-light"><span class="text-caption text-high-emphasis">+{{ item.teamExtra }}</span></VAvatar>
                  </VAvatarGroup>
                </div>
              </template>
              <template #item.progress="{ item }">
                <div class="d-flex align-center gap-3">
                  <div class="flex-grow-1"><VProgressLinear :model-value="item.progress" color="primary" rounded height="6" /></div>
                  <div class="text-body-1 text-high-emphasis">{{ item.progress }}%</div>
                </div>
              </template>
              <template #item.action><IconBtn><VIcon icon="bx-dots-vertical-rounded" /></IconBtn></template>
            </VDataTable>
          </VCard>
          <VCard class="mt-6">
            <VCardItem><VCardTitle>User Activity Timeline</VCardTitle></VCardItem>
            <VDivider />
            <VCardText>
              <VTimeline side="end" align="start" truncate-line="both" density="compact">
                <VTimelineItem v-for="(item, index) in activityTimeline" :key="index" :dot-color="item.color" size="x-small">
                  <div class="d-flex align-start justify-space-between flex-wrap gap-x-4">
                    <div>
                      <h6 class="text-h6 mb-1">{{ item.text }}</h6>
                      <span class="text-body-2 text-medium-emphasis">{{ item.time }}</span>
                    </div>
                    <VIcon :icon="item.icon" size="20" class="text-medium-emphasis" />
                  </div>
                </VTimelineItem>
              </VTimeline>
            </VCardText>
          </VCard>
        </div>

        <!-- Security Tab -->
        <div v-show="activeTab === 'security'" class="mt-6">
          <!-- Change Password -->
          <VCard title="Change Password" class="change-password-card">
            <VForm @submit.prevent>
              <VCardText class="pt-0">
                <VAlert variant="tonal" color="warning" density="comfortable" class="mb-4">
                  <template #prepend><VIcon icon="bx-info-circle" /></template>
                  Minimum 8 characters long, uppercase & symbol
                </VAlert>
                <VRow>
                  <VCol cols="12" md="6">
                    <VTextField
                      v-model="newPassword"
                      :type="isNewPasswordVisible ? 'text' : 'password'"
                      label="New Password"
                      placeholder="············"
                      :append-inner-icon="isNewPasswordVisible ? 'bx-hide' : 'bx-show'"
                      @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                    />
                  </VCol>
                  <VCol cols="12" md="6">
                    <VTextField
                      v-model="confirmPassword"
                      :type="isConfirmPasswordVisible ? 'text' : 'password'"
                      label="Confirm Password"
                      placeholder="············"
                      autocomplete="confirm-password"
                      :append-inner-icon="isConfirmPasswordVisible ? 'bx-hide' : 'bx-show'"
                      @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                    />
                  </VCol>
                </VRow>
                <VBtn type="submit" variant="elevated" color="primary" class="mt-4">Change Password</VBtn>
              </VCardText>
            </VForm>
          </VCard>

          <!-- Two-steps verification -->
          <VCard title="Two-steps verification" class="mt-6">
            <VCardText>
              <div class="d-flex flex-column gap-y-4">
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center gap-x-3">
                    <VAvatar variant="tonal" color="primary" rounded size="38"><VIcon icon="bx-phone" size="20" /></VAvatar>
                    <div>
                      <h6 class="text-h6">Phone Number (SMS)</h6>
                      <span class="text-body-2 text-medium-emphasis">+1(968) 819-2547</span>
                    </div>
                  </div>
                  <VChip v-if="verifyMethod === 'phone'" variant="tonal" color="success" size="small" prepend-icon="bx-check">bind</VChip>
                  <VChip v-else variant="tonal" color="grey" size="small" prepend-icon="bx-x">unbind</VChip>
                </div>
                <VDivider />
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center gap-x-3">
                    <VAvatar variant="tonal" color="info" rounded size="38"><VIcon icon="bx-envelope" size="20" /></VAvatar>
                    <div>
                      <h6 class="text-h6">Google Email</h6>
                      <span class="text-body-2 text-medium-emphasis">john@gmail.com</span>
                    </div>
                  </div>
                  <VChip v-if="verifyMethod === 'email'" variant="tonal" color="success" size="small" prepend-icon="bx-check">bind</VChip>
                  <VChip v-else variant="tonal" color="grey" size="small" prepend-icon="bx-x">unbind</VChip>
                </div>
                <VDivider />
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center gap-x-3">
                    <VAvatar variant="tonal" color="warning" rounded size="38"><VIcon icon="bx-qr" size="20" /></VAvatar>
                    <div>
                      <h6 class="text-h6">Authenticator App</h6>
                      <span class="text-body-2 text-medium-emphasis">Google Authenticator</span>
                    </div>
                  </div>
                  <VChip v-if="verifyMethod === 'authenticator'" variant="tonal" color="success" size="small" prepend-icon="bx-check">bind</VChip>
                  <VChip v-else variant="tonal" color="grey" size="small" prepend-icon="bx-x">unbind</VChip>
                </div>
              </div>
            </VCardText>
            <VCardActions class="justify-end">
              <VBtn variant="tonal" color="error" prepend-icon="bx-refresh" size="small">Reset</VBtn>
            </VCardActions>
          </VCard>

          <!-- Recent Devices -->
          <VCard title="Recent devices" class="mt-6">
            <VDivider />
            <VDataTable :items="recentDevices" :headers="[{ title: 'BROWSER', key: 'browser' }, { title: 'DEVICE', key: 'device' }, { title: 'LOCATION', key: 'location' }, { title: 'RECENT ACTIVITY', key: 'time' }]" class="text-no-wrap" :items-per-page="3" hide-default-footer>
              <template #item.browser="{ item }">
                <div class="d-flex align-center gap-x-4">
                  <VIcon :icon="item.icon" :color="item.current ? 'error' : 'info'" size="22" />
                  <span class="text-body-1 text-high-emphasis">Chrome on {{ item.device }}</span>
                </div>
              </template>
              <template #item.device="{ item }"><span>{{ item.device }}</span></template>
              <template #item.location="{ item }"><span>{{ item.location }}</span></template>
              <template #item.time="{ item }"><span>{{ item.time }}</span></template>
            </VDataTable>
          </VCard>
        </div>

        <!-- Notifications Tab -->
        <div v-show="activeTab === 'notifications'" class="mt-6">
          <VCard>
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-4">
                <div><h5 class="text-h5">Email Notifications</h5><p class="text-body-2 text-medium-emphasis">Receive email notifications for important updates</p></div>
                <VSwitch color="primary" />
              </div>
              <VDivider class="mb-4" />
              <div class="d-flex align-center justify-space-between mb-4">
                <div><h5 class="text-h5">Push Notifications</h5><p class="text-body-2 text-medium-emphasis">Receive push notifications on your device</p></div>
                <VSwitch color="primary" />
              </div>
              <VDivider class="mb-4" />
              <div class="d-flex align-center justify-space-between mb-4">
                <div><h5 class="text-h5">Activity Alerts</h5><p class="text-body-2 text-medium-emphasis">Get notified about account activity</p></div>
                <VSwitch color="primary" />
              </div>
            </VCardText>
          </VCard>
        </div>

        <!-- Connections Tab -->
        <div v-show="activeTab === 'connections'" class="mt-6">
          <VCard>
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-4">
                <div><h5 class="text-h5">Connected Accounts</h5><p class="text-body-2 text-medium-emphasis">Manage your connected third-party accounts</p></div>
              </div>
              <VDivider class="mb-4" />
              <VList>
                <VListItem>
                  <template #prepend><VAvatar color="#0088cc" variant="tonal" size="40" rounded><VIcon icon="bxl-telegram" /></VAvatar></template>
                  <VListItemTitle>Telegram</VListItemTitle><VListItemSubtitle>Connected</VListItemSubtitle>
                  <template #append><VBtn variant="tonal" color="error" size="small">Disconnect</VBtn></template>
                </VListItem>
                <VListItem>
                  <template #prepend><VAvatar color="#db4437" variant="tonal" size="40" rounded><VIcon icon="bxl-google" /></VAvatar></template>
                  <VListItemTitle>Google</VListItemTitle><VListItemSubtitle>Connected</VListItemSubtitle>
                  <template #append><VBtn variant="tonal" color="error" size="small">Disconnect</VBtn></template>
                </VListItem>
                <VListItem>
                  <template #prepend><VAvatar color="#4a154b" variant="tonal" size="40" rounded><VIcon icon="bxl-slack" /></VAvatar></template>
                  <VListItemTitle>Slack</VListItemTitle>
                  <VListItemSubtitle>Not Connected</VListItemSubtitle>
                  <template #append><VBtn variant="tonal" color="primary" size="small">Connect</VBtn></template>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </div>
      </VCol>
    </VRow>



    <!-- Edit User Dialog -->
    <VDialog v-model="isEditDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Edit User</VCardTitle>
          <VBtn icon variant="text" @click="isEditDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VTextField v-model="editForm.fullName" label="Full Name" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editForm.contact" label="Contact" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editForm.telegram" label="Telegram" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editForm.google" label="Google" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editForm.slack" label="Slack" density="comfortable" class="mb-3" variant="outlined" />
          <VSelect v-model="editForm.language" label="Language" :items="['English', 'Chinese', 'Japanese']" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editForm.country" label="Country" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" @click="saveEdit">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style>
.change-password-card .v-card-item + .v-card-text {
  padding-top: 0;
}
</style>
