<script lang="ts" setup>
import NavItems from '@/layouts/components/NavItems.vue'
import logo from '@images/logo.svg?raw'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'

const authStore = useAuthStore()
const currentRole = ref('sys_admin')

watch(() => authStore.isReady, (ready) => {
  if (ready) currentRole.value = authStore.role
})

const switchToAdmin = () => {
  currentRole.value = 'sys_admin'
  authStore.setRole('sys_admin')
  navigateTo('/admin/dashboard')
}

const switchToUser = () => {
  currentRole.value = 'user'
  authStore.setRole('user')
  navigateTo('/user/dashboard')
}
</script>

<template>
  <VerticalNavLayout>
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <!-- 👉 Vertical nav toggle in overlay mode -->
        <IconBtn
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="bx-menu" />
        </IconBtn>

        <!-- 👉 Search -->
        <div
          class="d-flex align-center cursor-pointer ms-lg-n3"
          style="user-select: none;"
        >
          <!-- 👉 Search Trigger button -->
          <IconBtn>
            <VIcon icon="bx-search" />
          </IconBtn>

          <span class="d-none d-md-flex align-center text-disabled ms-2">
            <span class="me-2">Search</span>
            <span class="meta-key">&#8984;K</span>
          </span>
        </div>

        <VSpacer />


        <!-- 👉 Role Switch (admin only) -->
        <ClientOnly>
          <VBtnToggle v-if="authStore.isAdmin" :model-value="currentRole" mandatory density="comfortable" variant="outlined" divided class="me-2" style="min-inline-size: 200px;">
          <VBtn size="small" style="flex: 1;" :variant="currentRole === 'sys_admin' ? 'flat' : 'outlined'" @click="switchToAdmin">
            <VIcon start icon="bx-shield" size="16" />Admin
          </VBtn>
          <VBtn size="small" style="flex: 1;" :variant="currentRole === 'user' ? 'flat' : 'outlined'" @click="switchToUser">
            <VIcon start icon="bx-user" size="16" />User
          </VBtn>
        </VBtnToggle>
        </ClientOnly>

        <IconBtn>
          <VIcon icon="bx-bell" />
        </IconBtn>

        <NavbarThemeSwitcher class="me-1" />

        <UserProfile />
      </div>
    </template>

    <template #vertical-nav-header>
    </template>

    <template #vertical-nav-content>
      <NavItems />
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
    </template>
  </VerticalNavLayout>
</template>

<style lang="scss" scoped>
.meta-key {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 1.5625rem;
  line-height: 1.3125rem;
  padding-block: 0.125rem;
  padding-inline: 0.25rem;
}

.app-logo {
  display: flex;
  align-items: center;
  column-gap: 0.75rem;

  .app-logo-title {
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 1.75rem;
  }
}
</style>
