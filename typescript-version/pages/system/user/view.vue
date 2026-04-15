<script setup lang="ts">
const activeTab = ref('account')
const isConfirmDeleteDialogVisible = ref(false)
const isTwoFactorDialogVisible = ref(false)

const userData = {
  fullName: 'Selina Kyle',
  username: 'Selina Kyle',
  email: 'irena.dubrovna@wayne.com',
  role: 'admin',
  status: 'Active',
  contact: '(829) 537-0057',
  telegram: '@johndoe',
  google: 'john@gmail.com',
  slack: 'john-doe',
  language: 'English',
  country: 'United States',
  taskDone: '1.23k',
  projectDone: '568',
}

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
                <VAvatar size="120" variant="flat" color="primary" rounded>
                  <VImg src="/images/avatars/avatar-1.png" />
                </VAvatar>
                <h5 class="text-h5 mt-4">{{ userData.fullName }}</h5>
                <VChip variant="tonal" color="secondary" size="small" label class="text-capitalize mt-4">{{ userData.role }}</VChip>
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
                  <VListItem><VListItemTitle><h6 class="text-h6">Role: <span class="text-body-1 text-capitalize d-inline-block">{{ userData.role }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Contact: <span class="text-body-1 d-inline-block">{{ userData.contact }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Telegram: <span class="text-body-1 d-inline-block">{{ userData.telegram }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Google: <span class="text-body-1 d-inline-block">{{ userData.google }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Slack: <span class="text-body-1 d-inline-block">{{ userData.slack }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Language: <span class="text-body-1 d-inline-block">{{ userData.language }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Country: <span class="text-body-1 d-inline-block">{{ userData.country }}</span></h6></VListItemTitle></VListItem>
                </VList>
              </VCardText>
              <VCardText class="d-flex justify-center gap-x-4">
                <VBtn variant="elevated" color="primary">Edit</VBtn>
                <VBtn variant="tonal" color="error" @click="isConfirmDeleteDialogVisible = !isConfirmDeleteDialogVisible">Suspend</VBtn>
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
                  <VAvatar size="34" rounded variant="flat"><VImg :src="item.img" /></VAvatar>
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
                    <VAvatar v-for="(avatar, i) in item.team" :key="i" size="26"><VImg :src="`/images/avatars/${avatar}`" /></VAvatar>
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
          <VCard title="Two-steps verification" subtitle="Keep your account secure with authentication step." class="mt-6">
            <VCardText>
              <!-- Verification method -->
              <VRadioGroup v-model="verifyMethod" density="compact" hide-details class="mb-4">
                <VRadio value="phone" color="primary">
                  <template #label>
                    <div class="d-flex align-center gap-x-2">
                      <VIcon icon="bx-phone" size="18" />
                      <span class="font-weight-medium">Phone Number (SMS)</span>
                    </div>
                  </template>
                </VRadio>
                <VRadio value="email" color="primary">
                  <template #label>
                    <div class="d-flex align-center gap-x-2">
                      <VIcon icon="bx-envelope" size="18" />
                      <span class="font-weight-medium">Google Email</span>
                    </div>
                  </template>
                </VRadio>
                <VRadio value="authenticator" color="primary">
                  <template #label>
                    <div class="d-flex align-center gap-x-2">
                      <VIcon icon="bx-qr" size="18" />
                      <span class="font-weight-medium">Authenticator App</span>
                    </div>
                  </template>
                </VRadio>
              </VRadioGroup>

              <!-- Phone input -->
              <div v-if="verifyMethod === 'phone'">
                <h6 class="text-h6 mb-1">SMS</h6>
                <div class="d-flex align-center gap-x-4">
                  <VTextField
                    v-model="phoneNumber"
                    placeholder="+1(968) 819-2547"
                    density="comfortable"
                    class="flex-grow-1"
                  />
                  <IconBtn color="secondary"><VIcon icon="bx-edit" size="22" /></IconBtn>
                  <IconBtn color="secondary"><VIcon icon="bx-user-plus" size="22" /></IconBtn>
                </div>
              </div>

              <!-- Email input -->
              <div v-if="verifyMethod === 'email'">
                <h6 class="text-h6 mb-1">Google Email</h6>
                <div class="d-flex align-center gap-x-4">
                  <VTextField
                    v-model="emailAddress"
                    placeholder="Enter Google email"
                    density="comfortable"
                    class="flex-grow-1"
                  />
                  <IconBtn color="secondary"><VIcon icon="bx-edit" size="22" /></IconBtn>
                  <IconBtn color="secondary"><VIcon icon="bx-user-plus" size="22" /></IconBtn>
                </div>
              </div>

              <!-- Authenticator App -->
              <div v-if="verifyMethod === 'authenticator'">
                <h6 class="text-h6 mb-1">Authenticator App</h6>
                <div class="d-flex align-center gap-x-4">
                  <VTextField
                    label="Enter 6-digit code"
                    placeholder="000000"
                    maxlength="6"
                    density="comfortable"
                    class="flex-grow-1"
                  />
                  <IconBtn color="secondary"><VIcon icon="bx-edit" size="22" /></IconBtn>
                  <IconBtn color="secondary"><VIcon icon="bx-user-plus" size="22" /></IconBtn>
                </div>
                <VBtn variant="elevated" color="primary" prepend-icon="bx-qr" class="mt-3">Show QR Code</VBtn>
              </div>

            </VCardText>
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

    <ConfirmDialog v-model:is-dialog-visible="isConfirmDeleteDialogVisible" title="Suspend User" message="Are you sure you want to suspend this user account?" confirm-text="Yes, Suspend" cancel-text="Cancel" @confirm="isConfirmDeleteDialogVisible = false" @cancel="isConfirmDeleteDialogVisible = false" />
  </div>
</template>

<style>
.change-password-card .v-card-item + .v-card-text {
  padding-top: 0;
}
</style>
