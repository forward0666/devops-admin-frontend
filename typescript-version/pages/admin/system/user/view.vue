<script setup lang="ts">
const route = useRoute()
const userStore = useUserStore()
const departmentStore = useDepartmentStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const userId = computed(() => Number(route.query.id))
const dbUser = ref<any>(null)
const loading = ref(false)
const activeTab = ref('account')

const isResetPasswordDialogVisible = ref(false)
const resetPwdForm = ref({ newPassword: '', confirmPassword: '' })

onMounted(async () => {
  if (!userId.value) return
  departmentStore.fetchDepartments()
  loading.value = true
  try {
    dbUser.value = await userStore.fetchUserById(userId.value)
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to load user', color: 'error' }
  } finally {
    loading.value = false
  }
})

const userData = computed(() => {
  const u = dbUser.value
  if (!u) return { fullName: 'Unknown User', username: '-', email: '-', role: '-', status: '-', department: '-', phone: '-', position: '-', active: false, emailVerified: false, phoneVerified: false, createdAt: '-' }
  return {
    fullName: u.fullName || u.username || 'Unknown',
    username: u.username || '-',
    email: u.email || '-',
    role: u.role || '-',
    status: u.active !== false ? 'Active' : 'Inactive',
    department: departmentStore.departments.find((d: any) => d.id === u.departmentId)?.name || '-',
    phone: u.phone || '-',
    position: u.position || '-',
    active: u.active !== false,
    emailVerified: u.emailVerified || false,
    phoneVerified: u.phoneVerified || false,
    createdAt: u.createdAt || '-',
  }
})

async function verifyEmail() {
  if (!userId.value) return
  try {
    await userStore.verifyEmail(userId.value)
    if (dbUser.value) dbUser.value.emailVerified = true
    snackbar.value = { show: true, text: 'Email verified', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to verify email', color: 'error' }
  }
}

async function verifyPhone() {
  if (!userId.value) return
  try {
    await userStore.verifyPhone(userId.value)
    if (dbUser.value) dbUser.value.phoneVerified = true
    snackbar.value = { show: true, text: 'Phone verified', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to verify phone', color: 'error' }
  }
}

async function resetPassword() {
  if (!userId.value || resetPwdForm.value.newPassword !== resetPwdForm.value.confirmPassword) {
    snackbar.value = { show: true, text: 'Passwords do not match', color: 'error' }
    return
  }
  try {
    await userStore.resetPassword(userId.value, { newPassword: resetPwdForm.value.newPassword })
    isResetPasswordDialogVisible.value = false
    resetPwdForm.value = { newPassword: '', confirmPassword: '' }
    snackbar.value = { show: true, text: 'Password reset successfully', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to reset password', color: 'error' }
  }
}

const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
</script>

<template>
  <div>
    <VRow>
      <!-- Left Column -->
      <VCol cols="12" md="5" lg="4">
        <VCard :loading="loading">
          <VCardText class="text-center pt-12">
            <VAvatar size="120" variant="tonal" color="primary" rounded>
              <span class="text-h2 font-weight-medium">{{ userData.fullName.charAt(0) }}</span>
            </VAvatar>
            <h5 class="text-h5 mt-4">{{ userData.fullName }}</h5>
            <VChip variant="tonal" :color="userData.active ? 'success' : 'error'" size="small" label class="mt-4">{{ userData.status }}</VChip>
          </VCardText>
          <VCardText>
            <h5 class="text-h5">Details</h5>
            <VDivider class="my-4" />
            <VList class="card-list mt-2" density="compact" lines="one">
              <VListItem><VListItemTitle><h6 class="text-h6">Username: <span class="text-body-1 d-inline-block">{{ userData.username }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Role: <span class="text-body-1 d-inline-block">{{ userData.role }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Email: <span class="text-body-1 d-inline-block">{{ userData.email }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Phone: <span class="text-body-1 d-inline-block">{{ userData.phone }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Department: <span class="text-body-1 d-inline-block">{{ userData.department }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Position: <span class="text-body-1 d-inline-block">{{ userData.position }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Created: <span class="text-body-1 d-inline-block">{{ userData.createdAt }}</span></h6></VListItemTitle></VListItem>
            </VList>
          </VCardText>
          <VCardText class="d-flex flex-column gap-2">
            <VBtn variant="elevated" color="primary" size="small" @click="isResetPasswordDialogVisible = true">Reset Password</VBtn>
            <VBtn variant="tonal" color="info" size="small" :loading="userStore.loading" @click="verifyEmail">Verify Email</VBtn>
            <VBtn variant="tonal" color="info" size="small" :loading="userStore.loading" @click="verifyPhone">Verify Phone</VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right Column -->
      <VCol cols="12" md="7" lg="8">
        <VTabs v-model="activeTab">
          <VTab value="account"><VIcon icon="bx-user" size="18" class="me-1" />Account</VTab>
          <VTab value="security"><VIcon icon="bx-lock-alt" size="18" class="me-1" />Security</VTab>
        </VTabs>

        <div v-show="activeTab === 'account'" class="mt-6">
          <VCard>
            <VCardItem><VCardTitle>User Info</VCardTitle></VCardItem>
            <VDivider />
            <VCardText>
              <VRow>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Full Name</span><h6 class="text-h6">{{ userData.fullName }}</h6></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Username</span><h6 class="text-h6">{{ userData.username }}</h6></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Email</span><h6 class="text-h6">{{ userData.email }} <VChip v-if="userData.emailVerified" variant="tonal" color="success" size="x-small" label class="ml-2">verified</VChip></h6></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Phone</span><h6 class="text-h6">{{ userData.phone }} <VChip v-if="userData.phoneVerified" variant="tonal" color="success" size="x-small" label class="ml-2">verified</VChip></h6></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Role</span><VChip variant="tonal" color="primary" size="small" label>{{ userData.role }}</VChip></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Department</span><h6 class="text-h6">{{ userData.department }}</h6></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Position</span><h6 class="text-h6">{{ userData.position }}</h6></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Status</span><VChip variant="tonal" :color="userData.active ? 'success' : 'error'" size="small" label>{{ userData.status }}</VChip></div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </div>

        <div v-show="activeTab === 'security'" class="mt-6">
          <VCard title="Reset Password">
            <VCardText>
              <p class="text-body-2 text-medium-emphasis mb-4">Set a new password for this user. They will need to change it on next login.</p>
              <VBtn variant="elevated" color="warning" prepend-icon="bx-lock" @click="isResetPasswordDialogVisible = true">Reset Password</VBtn>
            </VCardText>
          </VCard>
        </div>
      </VCol>
    </VRow>

    <!-- Reset Password Dialog -->
    <VDialog v-model="isResetPasswordDialogVisible" max-width="450">
      <VCard>
        <VCardItem>
          <VCardTitle>Reset Password</VCardTitle>
          <VBtn icon variant="text" @click="isResetPasswordDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VAlert variant="tonal" color="warning" density="comfortable" class="mb-4">
            <template #prepend><VIcon icon="bx-info-circle" /></template>
            This will set a new password for <strong>{{ userData.username }}</strong>.
          </VAlert>
          <VTextField
            v-model="resetPwdForm.newPassword"
            :type="isNewPasswordVisible ? 'text' : 'password'"
            label="New Password"
            :append-inner-icon="isNewPasswordVisible ? 'bx-hide' : 'bx-show'"
            density="comfortable" variant="outlined" class="mb-3"
            @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
          />
          <VTextField
            v-model="resetPwdForm.confirmPassword"
            :type="isConfirmPasswordVisible ? 'text' : 'password'"
            label="Confirm Password"
            :append-inner-icon="isConfirmPasswordVisible ? 'bx-hide' : 'bx-show'"
            density="comfortable" variant="outlined"
            @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
          />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isResetPasswordDialogVisible = false">Cancel</VBtn>
          <VBtn color="warning" :loading="userStore.loading" @click="resetPassword">Reset</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
