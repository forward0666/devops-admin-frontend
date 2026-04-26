<script setup lang="ts">
import { userConsoleService } from '~/services/api'
const authStore = useAuthStore()
const userStore = useUserStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const activeTab = ref('account')

const user = computed(() => authStore.user)

const userData = reactive({
  fullName: user.value?.fullName || user.value?.username || 'User',
  username: user.value?.username || 'User',
  email: user.value?.email || '-',
  role: user.value?.role || 'user',
  status: user.value?.active !== false ? 'Active' : 'Inactive',
  department: user.value?.department || '-',
  phone: user.value?.phone || '-',
  position: user.value?.position || '-',
  emailVerified: user.value?.emailVerified || false,
  phoneVerified: user.value?.phoneVerified || false,
})

const isEditDialogVisible = ref(false)
const editForm = ref({ fullName: '', email: '', phone: '' })

function openEditDialog() {
  editForm.value = { fullName: userData.fullName, email: userData.email, phone: userData.phone }
  isEditDialogVisible.value = true
}

async function saveProfile() {
  if (!user.value?.id) return
  try {
    await userStore.updateUser(user.value.id, {
      fullName: editForm.value.fullName,
      email: editForm.value.email,
      phone: editForm.value.phone,
    })
    userData.fullName = editForm.value.fullName
    userData.email = editForm.value.email
    userData.phone = editForm.value.phone
    isEditDialogVisible.value = false
    snackbar.value = { show: true, text: 'Profile updated', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to update profile', color: 'error' }
  }
}

const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function changePassword() {
  if (!user.value?.id) return
  if (newPassword.value !== confirmPassword.value) {
    snackbar.value = { show: true, text: 'Passwords do not match', color: 'error' }
    return
  }
  try {
    const res: any = await userConsoleService.changePassword({ oldPassword: oldPassword.value, newPassword: newPassword.value })
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    // Password changed, force logout and redirect to login
    if (res?.message?.includes('please login again')) {
      await authStore.logout()
      window.location.href = '/login'
      return
    }
    snackbar.value = { show: true, text: 'Password changed', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to change password', color: 'error' }
  } finally {
    loading.value = false
  }
}

const resolveAvatarColor = (name: string) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
  const code = name ? name.charCodeAt(0) : 0

  return colors[code % colors.length]
}
</script>

<template>
  <ClientOnly>
  <div>
    <VRow>
      <!-- Left Column -->
      <VCol cols="12" md="5" lg="4">
        <VCard>
          <VCardText class="text-center pt-12">
            <VAvatar size="120" variant="tonal" :color="resolveAvatarColor(userData.fullName)" rounded>
              <span class="text-h2 font-weight-medium">{{ userData.fullName.charAt(0) }}</span>
            </VAvatar>
            <h5 class="text-h5 mt-4">{{ userData.fullName }}</h5>
            <VChip variant="tonal" :color="resolveAvatarColor(userData.role)" size="small" label class="mt-2">{{ userData.role }}</VChip>
          </VCardText>
          <VCardText>
            <h5 class="text-h5">Details</h5>
            <VDivider class="my-4" />
            <VList class="card-list mt-2" density="compact" lines="one">
              <VListItem><VListItemTitle><h6 class="text-h6">Username: <span class="text-body-1 d-inline-block">{{ userData.username }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Email: <span class="text-body-1 d-inline-block">{{ userData.email }}</span> <VChip v-if="userData.emailVerified" variant="tonal" color="success" size="x-small" label class="ml-1">✓</VChip></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Phone: <span class="text-body-1 d-inline-block">{{ userData.phone }}</span> <VChip v-if="userData.phoneVerified" variant="tonal" color="success" size="x-small" label class="ml-1">✓</VChip></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Department: <span class="text-body-1 d-inline-block">{{ userData.department }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Position: <span class="text-body-1 d-inline-block">{{ userData.position }}</span></h6></VListItemTitle></VListItem>
              <VListItem><VListItemTitle><h6 class="text-h6">Status: <VChip variant="tonal" :color="userData.status === 'Active' ? 'success' : 'error'" size="small" label class="ml-1">{{ userData.status }}</VChip></h6></VListItemTitle></VListItem>
            </VList>
          </VCardText>
          <VCardText class="d-flex justify-center gap-x-4">
            <VBtn variant="elevated" color="primary" @click="openEditDialog">Edit Profile</VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right Column: Tabs -->
      <VCol cols="12" md="7" lg="8">
        <VTabs v-model="activeTab">
          <VTab value="account"><VIcon icon="bx-user" size="18" class="me-1" />Account</VTab>
          <VTab value="security"><VIcon icon="bx-lock-alt" size="18" class="me-1" />Security</VTab>
        </VTabs>

        <!-- Account Tab -->
        <div v-show="activeTab === 'account'" class="mt-6">
          <VCard>
            <VCardItem><VCardTitle>Account Information</VCardTitle></VCardItem>
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
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Email</span><h6 class="text-h6">{{ userData.email }}</h6></div>
                </VCol>
                <VCol cols="12" md="6">
                  <div class="mb-4"><span class="text-body-2 text-medium-emphasis d-block mb-1">Phone</span><h6 class="text-h6">{{ userData.phone }}</h6></div>
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
              </VRow>
            </VCardText>
          </VCard>
        </div>

        <!-- Security Tab -->
        <div v-show="activeTab === 'security'" class="mt-6">
          <VCard title="Change Password" class="change-password-card">
            <VForm @submit.prevent="changePassword">
              <VCardText class="pt-0">
                <VAlert variant="tonal" color="warning" density="comfortable" class="mb-4">
                  <template #prepend><VIcon icon="bx-info-circle" /></template>
                  Minimum 8 characters long, uppercase & symbol
                </VAlert>
                <VRow>
                  <VCol cols="12" md="12">
                    <VTextField v-model="oldPassword" :type="isNewPasswordVisible ? 'text' : 'password'" label="Current Password" placeholder="············" />
                  </VCol>
                  <VCol cols="12" md="12">
                    <VTextField v-model="newPassword" :type="isNewPasswordVisible ? 'text' : 'password'" label="New Password" placeholder="············" :append-inner-icon="isNewPasswordVisible ? 'bx-hide' : 'bx-show'" @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible" />
                  </VCol>
                  <VCol cols="12" md="12">
                    <VTextField v-model="confirmPassword" :type="isConfirmPasswordVisible ? 'text' : 'password'" label="Confirm Password" placeholder="············" autocomplete="confirm-password" :append-inner-icon="isConfirmPasswordVisible ? 'bx-hide' : 'bx-show'" @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible" />
                  </VCol>
                </VRow>
                <VBtn type="submit" variant="elevated" color="primary" class="mt-4" :loading="userStore.loading">Change Password</VBtn>
              </VCardText>
            </VForm>
          </VCard>
        </div>
      </VCol>
    </VRow>

    <!-- Edit Profile Dialog -->
    <VDialog v-model="isEditDialogVisible" max-width="500">
      <VCard>
        <VCardItem>
          <VCardTitle>Edit Profile</VCardTitle>
          <VBtn icon variant="text" @click="isEditDialogVisible = false"><VIcon icon="bx-x" /></VBtn>
        </VCardItem>
        <VCardText>
          <VTextField v-model="editForm.fullName" label="Full Name" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editForm.email" label="Email" density="comfortable" class="mb-3" variant="outlined" />
          <VTextField v-model="editForm.phone" label="Phone" density="comfortable" variant="outlined" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="tonal" @click="isEditDialogVisible = false">Cancel</VBtn>
          <VBtn color="primary" :loading="userStore.loading" @click="saveProfile">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
  </ClientOnly>
</template>

<style>
.change-password-card .v-card-item + .v-card-text {
  padding-top: 0;
}
</style>
