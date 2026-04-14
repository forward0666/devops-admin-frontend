<script setup lang="ts">
const route = useRoute()
const activeTab = ref('account')
const isConfirmDeleteDialogVisible = ref(false)
const isTwoFactorDialogVisible = ref(false)

const userData = {
  fullName: 'Selina Kyle',
  username: 'Selina Kyle',
  email: 'irena.dubrovna@wayne.com',
  role: 'admin',
  status: 'Active',
  taxId: 'Tax-8894',
  contact: '(829) 537-0057',
  language: 'English',
  country: 'United States',
  taskDone: '1.23k',
  projectDone: '568',
}

const itemsPerPage = ref(5)

const projects = ref([
  { name: 'BGC eCommerce App', type: 'React Project', leader: 'Eileen', progress: 78, img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAAwFBMVEXq+v/o+v9h2vtl4v9j3P1j3v9m5f9n3Pxk4P/k+f/P9P+W6P7d9/9y3vzg+P/D8f514P3m+f/i+P/M8/+O5f3I8v5u3fxq3fzY9v9p3/6A4f257/627v6b6P6f6P1n5/+87/6y7f6S5/2J5P1t3/174PzT9P6i6v554f3a9v9o4v+v7P7F8v++8P595v525f5v4v5n3v6p6/2D4/1+4/6H4/3V9f+M6v+H6f9s5P9r4f9q5/+m6v5y5P7R9P/A8P7oQCwMAAAEN0lEQVRYw+2X15aiQBCGgY5kVDKSk4KO2VmdsO//Vtsm5uyVI3O1e/y9oAH9uqq6uqrlnnrqqaee+g/EjzK1rCWe+9Lgc12q5mzQizcICsBETP2GHIzkJWAy0mEf+6QClFFYruKVvD8/mdZL3EzkyG9e5vzjQDHEpcIueo7wJGETWDva+IHGcZJJQuVxoFK+tRdysMDOepgYQF2fOXy7fB318NjxrOuwMunKLxp/dn33++Vl/jhwJtj7240WrahndrfWr8X4caCO1GkXz8CjXijebkevvYCwAw70JbDJ8p3/EdAS1OqW4AbeSBH9SK/vZr8WwePAT4dYl5G7AaXLuTKa6N2i/O6RNsZbcOZNZerVM11vDbq57MPxx6/R48Bh/hZVybtZqgKEAqUIsqs9yaNkFHmy+7jLromIg+OYInZVVdWwbUdAFMeAEJgxUx+SqMsqhJAYu8ympeUqiqYpriWjIjcNcjI1m2sP1JnEhzG1SbNWxGC1TL52z/YgD7R14TlN3Gxm4jd5VY5iYiZV/hbye/Ug819xHXuL8bAmmZWYBT7K1bccnxcxkSVmZ0rVaQ2MPRtKkRn+Zga5MtjNXou1yImjsAFb/RtGJit8yTe+sr1QPayZYe0RAOCxmjWwjI98cclCMTXARL9bvF0b75SrgxmF0GcUnSBBEOCy5jmlhoJwSxprg/O7XmfAULotDOExZbUmA8JJ0N+zbTihanozS5+Q9N5iE1B3Y82nJfu+sqUX4EJnNzXKR106mKuJfgdogOwrt1VoVIyxuQJfLBaSjG47hrZbZdIdYEpXyW3+FqEm4rnh+8XlFQuumDiI1MPrjOuP4m5LFXfYGd88BjZUJY7fbwFbCmSwmfZmY6+upUF7X6Lofrea+hjK1bkiEhJs3jKelTKTILKZM2PHZLFmDYA/bZv8iLLvFAlNhtiJJE6sgS8GsJifc3ImaSeIf5BdmYSaKEUGPtbK9wpNsgUx2bXl25rTzMb/+pVS063Et8U2zAsMdvq3DxBa6gsxhtAMRnP7EHXxnS+XURWYDgL46LfDh+qXFaoQ4ViwCXTCdhwEwbiNJkiwHYyRoMq69vhRBJSm4SAMEKWYiQ0QxZRM8hLK0x5nmw0LoVjpaWQzSMk+DjxmqS6JXLvs01Om6mF+7fKOV58CaBzkS9iSPl2P/7TJ1YzhO/LagTVpcvcnfdkS7KrLTFDUG+BL3cnhI+0DVN3beGpCiLaz2zuJAfk+wH1XpiwHFRH3M+CIOFIH3yKI1Fb80XFuahzmt163xEZr0uOt9Cd9DpycmMfy2V3JRNgfcdPQw+V4eF5171V6HDgYIyfQlJlcxKtweuKkBm426ed0/OK99/lfoeSxoNowbvyEv6YmgwNie/TcVXpEMfMAcnbjzppTdzcI9bITrxdSktcu//cjTZpVQ+6pp5566ql/X38AmYlpr95+tigAAAAASUVORK5CYII=' },
  { name: 'Falcon Logo Design', type: 'Figma Project', leader: 'Owen', progress: 25, img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAA+VBMVEX/7uz/cmKiWf/yTh4Kz4MavP75fmP97uzCi/hd2qY5w/xYyvpxr8Lsc2Wk2vP/nJDB4PHy7O3/6uf/4+D/1dAR0Ib/eWmh2vP27ej+0cid4cJ23bIs05Ii0o32dlLzUyWnYP6mXv6Smfq7gPqok/nOoPbUqPXrzfDe5+7d5+723u7T6dn/3tjE59Jk2qpM159B15v6rZn/k4b/c2P0ZDr0Wy+zdPuzc/vZsfPYsPPp6+Ln6+GVw8ub18T/ycN8vML8x7ncs7e/qrT/u7O+pa//tKv/raPcoaH/ppz1ppoX0YnxjYj4lnv/iHvugnb/fm/3iGr3hGP0YTfsgWsHAAABW0lEQVRYw+3U526DMBDA8UuA0pCWkgQIIQS6m7TZo3vvvd7/YUpEoVgt/nC4Eor8f4CfbJ19wOPxeLwZqDxwJ0LQXC7IfLmtoL3aOMBCMDSvsJ4nkGDUDe6+YyEJHOkYcCCQYLwhBnQp4AgzmAkFzNUQoEcDTxHgJw3ETOWdApplBHhOAe8B00ci+Ib7fRU3ATR17G549v4Ch21A1354XQx6Wpp2d315oQO+rbV82DyAXFUkP0WVsd6mD/2ApaL0XbGE8w7ycVD2vUhEnXF7hQCrUiwVA27kCVCJgwoG3CXAdYmohQCXCXCVBLUsgHu0KzezMBTmzwb2KQ87G1/v13JQo+WA7ujkbCHoGKa1NK0J+Ky6IYYVIH1WXxSZggWRLdgRGYNd1mCDNWj87wnr6cEeAdrpQTvuGYfpQdmh3BjVzmPk9WVgIjrhiC1gk2z3GobT7QCPx+PxZrEvM4ogL9NmJ9MAAAAASUVORK5CYII=' },
  { name: 'Dashboard Design', type: 'Vuejs Project', leader: 'Keith', progress: 62, img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAABL1BMVEXj//NBuIM0SV5BuYNBuoQ0R15DuYRDvYbf/vFCvIU0S19AtIHe/fA2TWDc/O5TwpBGwYpFv4hAt4I6gXAzRV3h/vLa++zX++tHu4dFu4XP9+XF8t9ix5tJvIlBvIRAsIA/q388j3U1WmPS+OjN9uS879ix6tKg4sWd4MOY376F1rF60altzKJlyZxdxZZYw5ROwY5Qvo0/p30+nXo8lHY4cGo2ZWc1X2Q5UGM0VmI0U2Hd+e7V8ujJ9OG37dWp5syxzMiU3byQ27qXsbJlfog+o3w6inM5em43amk0UGDN6eHC8Nyu6c+q5cum5ciJ2LWB1K9yz6Vpyp5xipFedoI/sIBYb3w+oHtRZ3VFWms8U2ba9uvU+OjF4tqpxcGM2beL2beQqa1yzqaFnqNnyZ49BA2OAAACmUlEQVRYw+3UV1vqQBAG4AlLZElCAEMvigJSRBAUsffe27GdXv7/bzjy7Ew43khCcnN88t4Bu8O3yeyAx+PxeP5PN2PkyCeE7tYA8e0QfrnawVUsvwXvyuaZJBRWZbF5eRvQ+r0PGSquitY5vIvvBnHp+KGMu+8/i9+0PQwoTxdwkT9cgiGKLazIJnsxjLgHffHTJ5+gTI1jwUhVgyH4ZVBCiz5Z7H86hVdrv5cx4PGkHw88V4ShErMRjKgeUcS7/oG3nxXxceWR0YE3wYJy2I/rD6Yx4vM3gPV9eoLGuCjIIt91sIDvBCRE7yW0v76296KIeksd+sPcGViycRvAHYVjPPTLz68PIqCsTGE9Fq3EwZqtID6kiUVFFhEfzAMv0RsJ5DJgUXKOIqpLMWoVrLd6OIG/5WtgWSXvp4h0X0hXZRiwkQTL9F/UjKz7tt7KAgVsn4MNG2brdETroJCB9VjqCmzZTVPzGsqgotKbZFiwmQFbkk3a+annM51Qy0jpKti0laaps6iYAY9parE/OtjEGxJSu2bARwmlNsG2bIphxIMTLHhEAQPXGtjGfwQooiFeizlWWXgDRpAJUzMWpmNvx2pNgxHwChVUp2S5f4nZkEs8fNRGqXW6sdc7Qo00PwOjiZfnaVItrMQMlcZqPQEj0nYpomr0DrB4sHkGI8vSHGOdBXoj0SqH0V3SqDUFcyVw4EsOIxJ/agccqeKoJcFGERxJNEQzIta+AIfO2/9GTM9q4JB2lWaDgK0SOBUvtQYFUzVwTquMSWQuAS5I3ppPcAbcwDdTOGVmdXBF4lp0dzgL7ohn2/1mjOzo4BK99hox0MyAW+LFm+gYjlV38Jn5SD0JLkrWW2VwEy9f6OAqroHH4/F4Ppi/HW8/FvOjUkYAAAAASUVORK5CYII=' },
  { name: 'Foodista mobile app', type: 'Xamarin Project', leader: 'Merline', progress: 8, img: '/images/pages/xamarin.png' },
  { name: 'Dojo Email App', type: 'Python Project', leader: 'Harmonia', progress: 18, img: '/images/pages/python.png' },
])

const teamAvatars = [
  '/images/avatars/avatar-1.png',
  '/images/avatars/avatar-2.png',
  '/images/avatars/avatar-3.png',
  '/images/avatars/avatar-4.png',
]

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
const newPassword = ref('')
const confirmPassword = ref('')
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
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
                  <VListItem><VListItemTitle><h6 class="text-h6">Billing Email: <span class="text-body-1 d-inline-block">{{ userData.email }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Status: <span class="text-body-1 text-capitalize d-inline-block">{{ userData.status }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Role: <span class="text-body-1 text-capitalize d-inline-block">{{ userData.role }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Tax ID: <span class="text-body-1 d-inline-block">{{ userData.taxId }}</span></h6></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><h6 class="text-h6">Contact: <span class="text-body-1 d-inline-block">{{ userData.contact }}</span></h6></VListItemTitle></VListItem>
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
          <!-- Current Plan Card -->
          <VCol cols="12">
            <VCard class="current-plan">
              <VCardText class="d-flex">
                <VChip variant="tonal" color="primary" size="small" label class="font-weight-medium">Popular</VChip>
                <VSpacer />
                <div class="d-flex align-center">
                  <sup class="text-h5 text-primary mt-1">$</sup>
                  <h1 class="text-h1 text-primary">99</h1>
                  <sub class="mt-3"><h6 class="text-h6 font-weight-regular mb-n1">/ month</h6></sub>
                </div>
              </VCardText>
              <VCardText>
                <VList class="card-list" density="compact" lines="one">
                  <VListItem><VListItemTitle><div class="d-flex align-center gap-x-2"><VIcon icon="bx-bxs-circle" size="6" color="secondary" /><div class="text-medium-emphasis">10 Users</div></div></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><div class="d-flex align-center gap-x-2"><VIcon icon="bx-bxs-circle" size="6" color="secondary" /><div class="text-medium-emphasis">Up to 10GB storage</div></div></VListItemTitle></VListItem>
                  <VListItem><VListItemTitle><div class="d-flex align-center gap-x-2"><VIcon icon="bx-bxs-circle" size="6" color="secondary" /><div class="text-medium-emphasis">Basic Support</div></div></VListItemTitle></VListItem>
                </VList>
                <div class="my-6">
                  <div class="d-flex justify-space-between mb-1">
                    <h6 class="text-h6">Days</h6>
                    <h6 class="text-h6">26 of 30 Days</h6>
                  </div>
                  <VProgressLinear model-value="65" color="primary" rounded height="6" />
                  <p class="mt-1 text-body-2 mb-0">4 days remaining</p>
                </div>
                <div class="d-flex gap-4">
                  <VBtn block variant="elevated" color="primary">Upgrade Plan</VBtn>
                </div>
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

        <VWindow v-model="activeTab" class="mt-6">
          <!-- Account Tab -->
          <VWindowItem value="account">
            <VCard>
              <VCardItem><VCardTitle>Projects List</VCardTitle></VCardItem>
              <VCardItem class="pt-0">
                <div class="d-flex justify-space-between align-center flex-wrap gap-4">
                  <AppSelect v-model="itemsPerPage" :items="[5, 10, 25, 50]" style="inline-size: 5rem;" />
                  <AppTextField placeholder="Search Project" style="inline-size: 250px;" />
                </div>
              </VCardItem>
              <VDivider />
              <VDataTable :items="projects" :items-per-page="itemsPerPage" :headers="[{ title: 'PROJECT', key: 'project' }, { title: 'LEADER', key: 'leader' }, { title: 'TEAM', key: 'team' }, { title: 'PROGRESS', key: 'progress' }, { title: 'Action', key: 'action', sortable: false }]" class="text-no-wrap">
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
                <template #item.team>
                  <div class="d-flex">
                    <VAvatarGroup size="26">
                      <VAvatar v-for="(avatar, i) in teamAvatars" :key="i" size="26"><VImg :src="avatar" /></VAvatar>
                      <VAvatar size="26" color="grey-light"><span class="text-caption text-high-emphasis">+3</span></VAvatar>
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
          </VWindowItem>

          <!-- Security Tab -->
          <VWindowItem value="security">
            <!-- Change Password -->
            <VCard>
              <VCardItem>
                <VCardTitle>Change Password</VCardTitle>
                <VCardSubtitle>Update your security credentials to keep your account safe.</VCardSubtitle>
              </VCardItem>
              <VDivider />
              <VCardText>
                <VForm @submit.prevent>
                  <VRow>
                    <VCol cols="12">
                      <p class="text-body-2 text-medium-emphasis mb-4">Ensure that these requirements are met:</p>
                      <div class="d-flex gap-x-2 mb-6">
                        <VIcon icon="bx-check-circle" size="20" color="success" />
                        <span class="text-body-2">Minimum 8 characters long, uppercase & symbol</span>
                      </div>
                      <AppTextField v-model="newPassword" :type="isNewPasswordVisible ? 'text' : 'password'" label="New Password" placeholder="Enter new password" :append-inner-icon="isNewPasswordVisible ? 'bx-hide' : 'bx-show'" @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible" />
                    </VCol>
                    <VCol cols="12">
                      <AppTextField v-model="confirmPassword" :type="isConfirmPasswordVisible ? 'text' : 'password'" label="Confirm Password" placeholder="Confirm new password" :append-inner-icon="isConfirmPasswordVisible ? 'bx-hide' : 'bx-show'" @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible" />
                    </VCol>
                    <VCol cols="12">
                      <VBtn type="submit" variant="elevated" color="primary">Change Password</VBtn>
                    </VCol>
                  </VRow>
                </VForm>
              </VCardText>
            </VCard>
            <!-- Two-Steps Verification -->
            <VCard class="mt-6">
              <VCardItem>
                <VCardTitle>Two-steps verification</VCardTitle>
                <VCardSubtitle>Keep your account extra secure by enabling two-factor authentication (2FA).</VCardSubtitle>
              </VCardItem>
              <VDivider />
              <VCardText>
                <VAlert variant="tonal" color="primary" class="mb-6">
                  <template #prepend><VIcon icon="bx-info-circle" /></template>
                  <span class="text-body-2">Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to log in.</span>
                </VAlert>
                <div class="d-flex align-center justify-space-between flex-wrap gap-4">
                  <div>
                    <h6 class="text-h6 mb-1">Authenticated via phone number</h6>
                    <p class="text-body-2 text-medium-emphasis mb-0">{{ phoneNumber }}</p>
                  </div>
                  <VBtn variant="tonal" prepend-icon="bx-phone" size="small" @click="isTwoFactorDialogVisible = !isTwoFactorDialogVisible">Change</VBtn>
                </div>
                <VDivider class="my-4" />
                <div class="d-flex align-center justify-space-between flex-wrap gap-4">
                  <div>
                    <h6 class="text-h6 mb-1">Authenticator App</h6>
                    <p class="text-body-2 text-medium-emphasis mb-0">{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</p>
                  </div>
                  <VSwitch v-model="twoFactorEnabled" color="primary" hide-details />
                </div>
                <VDivider class="my-4" />
                <div class="d-flex align-center justify-space-between flex-wrap gap-4">
                  <div>
                    <h6 class="text-h6 mb-1">Recovery Codes</h6>
                    <p class="text-body-2 text-medium-emphasis mb-0">Generate one-time use backup codes to use when you don't have access to your device.</p>
                  </div>
                  <VBtn variant="tonal" prepend-icon="bx-download" size="small">Generate</VBtn>
                </div>
              </VCardText>
            </VCard>
            <!-- Recent Devices -->
            <VCard class="mt-6">
              <VCardItem>
                <VCardTitle>Recent Devices</VCardTitle>
                <VCardSubtitle>We need permission from your browser to show notifications.</VCardSubtitle>
              </VCardItem>
              <VDivider />
              <VDataTable :items="recentDevices" :headers="[{ title: 'DEVICE', key: 'device' }, { title: 'BROWSER', key: 'browser' }, { title: 'LOCATION', key: 'location' }, { title: 'RECENT ACTIVITY', key: 'time' }]" class="text-no-wrap" :items-per-page="3" hide-default-footer>
                <template #item.device="{ item }">
                  <div class="d-flex align-center gap-x-3">
                    <VIcon :icon="item.icon" size="22" class="text-high-emphasis" />
                    <div>
                      <div class="text-high-emphasis font-weight-medium">{{ item.device }}</div>
                      <VChip v-if="item.current" variant="tonal" color="success" size="x-small" label class="mt-1">Current</VChip>
                    </div>
                  </div>
                </template>
                <template #item.browser="{ item }"><span class="text-body-1">{{ item.browser }}</span></template>
                <template #item.location="{ item }"><span class="text-body-1">{{ item.location }}</span></template>
                <template #item.time="{ item }"><span class="text-body-1 text-medium-emphasis">{{ item.time }}</span></template>
              </VDataTable>
            </VCard>
          </VWindowItem>

          <!-- Notifications Tab -->
          <VWindowItem value="notifications">
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
          </VWindowItem>

          <!-- Connections Tab -->
          <VWindowItem value="connections">
            <VCard>
              <VCardText>
                <div class="d-flex align-center justify-space-between mb-4">
                  <div><h5 class="text-h5">Connected Accounts</h5><p class="text-body-2 text-medium-emphasis">Manage your connected third-party accounts</p></div>
                </div>
                <VDivider class="mb-4" />
                <VList>
                  <VListItem>
                    <template #prepend><VAvatar color="#4267B2" variant="tonal" size="40" rounded><VIcon icon="bxl-facebook" /></VAvatar></template>
                    <VListItemTitle>Facebook</VListItemTitle><VListItemSubtitle>Connected</VListItemSubtitle>
                    <template #append><VBtn variant="tonal" color="error" size="small">Disconnect</VBtn></template>
                  </VListItem>
                  <VListItem>
                    <template #prepend><VAvatar color="#1DA1F2" variant="tonal" size="40" rounded><VIcon icon="bxl-twitter" /></VAvatar></template>
                    <VListItemTitle>Twitter</VListItemTitle><VListItemSubtitle>Connected</VListItemSubtitle>
                    <template #append><VBtn variant="tonal" color="error" size="small">Disconnect</VBtn></template>
                  </VListItem>
                  <VListItem>
                    <template #prepend><VAvatar color="#EA4335" variant="tonal" size="40" rounded><VIcon icon="bxl-google" /></VAvatar></template>
                    <VListItemTitle>Google</VListItemTitle><VListItemSubtitle>Not Connected</VListItemSubtitle>
                    <template #append><VBtn variant="tonal" color="primary" size="small">Connect</VBtn></template>
                  </VListItem>
                </VList>
              </VCardText>
            </VCard>
          </VWindowItem>
        </VWindow>
      </VCol>
    </VRow>

    <ConfirmDialog v-model:is-dialog-visible="isConfirmDeleteDialogVisible" title="Suspend User" message="Are you sure you want to suspend this user account?" confirm-text="Yes, Suspend" cancel-text="Cancel" @confirm="isConfirmDeleteDialogVisible = false" @cancel="isConfirmDeleteDialogVisible = false" />
  </div>
</template>
