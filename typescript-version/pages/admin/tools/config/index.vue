<script setup lang="ts">
const settingsStore = useSettingsStore()
const snackbar = ref({ show: false, text: '', color: 'success' })

const activeTab = ref('system')

onMounted(async () => {
  await Promise.all([
    settingsStore.fetchSystemConfig(),
    settingsStore.fetchSecurity(),
    settingsStore.fetchPasswordPolicy(),
    settingsStore.fetchLoginSettings(),
    settingsStore.fetchIpControl(),
  ])
})

async function save(tab: string) {
  try {
    switch (tab) {
      case 'system':
        if (settingsStore.systemConfig) await settingsStore.updateSystemConfig(settingsStore.systemConfig)
        break
      case 'security':
        if (settingsStore.securityConfig) await settingsStore.updateSecurity(settingsStore.securityConfig)
        break
      case 'password':
        if (settingsStore.passwordPolicy) await settingsStore.updatePasswordPolicy(settingsStore.passwordPolicy)
        break
      case 'login':
        if (settingsStore.loginSettings) await settingsStore.updateLoginSettings(settingsStore.loginSettings)
        break
      case 'ip':
        if (settingsStore.ipControl) await settingsStore.updateIpControl(settingsStore.ipControl)
        break
    }
    snackbar.value = { show: true, text: 'Saved successfully', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Save failed', color: 'error' }
  }
}

async function clearCache() {
  try {
    await settingsStore.clearAllCache()
    snackbar.value = { show: true, text: 'Cache cleared', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e.message || 'Failed to clear cache', color: 'error' }
  }
}

// Reactive form helpers
function updateField(obj: any, key: string, value: any) {
  if (obj) obj[key] = value
}
</script>

<template>
  <div>
    <VRow class="mb-4">
      <VCol cols="12" md="6"><h4 class="text-h4">System Config</h4></VCol>
      <VCol cols="12" md="6" class="d-flex justify-end gap-3">
        <VBtn prepend-icon="bx-refresh" variant="tonal" color="primary" :loading="settingsStore.loading" @click="clearCache">Clear Cache</VBtn>
      </VCol>
    </VRow>

    <VTabs v-model="activeTab">
      <VTab value="system">System</VTab>
      <VTab value="security">Security</VTab>
      <VTab value="password">Password Policy</VTab>
      <VTab value="login">Login Settings</VTab>
      <VTab value="ip">IP Control</VTab>
    </VTabs>

    <!-- System Tab -->
    <div v-show="activeTab === 'system'" class="mt-6">
      <VCard :loading="settingsStore.loading">
        <VCardItem><VCardTitle>System Settings</VCardTitle></VCardItem>
        <VDivider />
        <VCardText>
          <VRow v-if="settingsStore.systemConfig">
            <VCol v-for="(value, key) in settingsStore.systemConfig" :key="key" cols="12" md="6">
              <VTextField :label="String(key)" :model-value="value" density="comfortable" variant="outlined" @update:model-value="updateField(settingsStore.systemConfig, String(key), $event)" />
            </VCol>
          </VRow>
          <div v-else class="text-center py-6 text-medium-emphasis">No system config loaded</div>
        </VCardText>
        <VDivider />
        <VCardActions class="justify-end pa-4">
          <VBtn color="primary" :loading="settingsStore.loading" @click="save('system')">Save</VBtn>
        </VCardActions>
      </VCard>
    </div>

    <!-- Security Tab -->
    <div v-show="activeTab === 'security'" class="mt-6">
      <VCard :loading="settingsStore.loading">
        <VCardItem><VCardTitle>Security Settings</VCardTitle></VCardItem>
        <VDivider />
        <VCardText>
          <VRow v-if="settingsStore.securityConfig">
            <VCol v-for="(value, key) in settingsStore.securityConfig" :key="key" cols="12" md="6">
              <VTextField :label="String(key)" :model-value="value" density="comfortable" variant="outlined" @update:model-value="updateField(settingsStore.securityConfig, String(key), $event)" />
            </VCol>
          </VRow>
          <div v-else class="text-center py-6 text-medium-emphasis">No security config loaded</div>
        </VCardText>
        <VDivider />
        <VCardActions class="justify-end pa-4">
          <VBtn color="primary" :loading="settingsStore.loading" @click="save('security')">Save</VBtn>
        </VCardActions>
      </VCard>
    </div>

    <!-- Password Policy Tab -->
    <div v-show="activeTab === 'password'" class="mt-6">
      <VCard :loading="settingsStore.loading">
        <VCardItem><VCardTitle>Password Policy</VCardTitle></VCardItem>
        <VDivider />
        <VCardText>
          <VRow v-if="settingsStore.passwordPolicy">
            <VCol v-for="(value, key) in settingsStore.passwordPolicy" :key="key" cols="12" md="6">
              <VTextField :label="String(key)" :model-value="value" density="comfortable" variant="outlined" @update:model-value="updateField(settingsStore.passwordPolicy, String(key), $event)" />
            </VCol>
          </VRow>
          <div v-else class="text-center py-6 text-medium-emphasis">No password policy loaded</div>
        </VCardText>
        <VDivider />
        <VCardActions class="justify-end pa-4">
          <VBtn color="primary" :loading="settingsStore.loading" @click="save('password')">Save</VBtn>
        </VCardActions>
      </VCard>
    </div>

    <!-- Login Settings Tab -->
    <div v-show="activeTab === 'login'" class="mt-6">
      <VCard :loading="settingsStore.loading">
        <VCardItem><VCardTitle>Login Settings</VCardTitle></VCardItem>
        <VDivider />
        <VCardText>
          <VRow v-if="settingsStore.loginSettings">
            <VCol v-for="(value, key) in settingsStore.loginSettings" :key="key" cols="12" md="6">
              <VTextField :label="String(key)" :model-value="value" density="comfortable" variant="outlined" @update:model-value="updateField(settingsStore.loginSettings, String(key), $event)" />
            </VCol>
          </VRow>
          <div v-else class="text-center py-6 text-medium-emphasis">No login settings loaded</div>
        </VCardText>
        <VDivider />
        <VCardActions class="justify-end pa-4">
          <VBtn color="primary" :loading="settingsStore.loading" @click="save('login')">Save</VBtn>
        </VCardActions>
      </VCard>
    </div>

    <!-- IP Control Tab -->
    <div v-show="activeTab === 'ip'" class="mt-6">
      <VCard :loading="settingsStore.loading">
        <VCardItem><VCardTitle>IP Control</VCardTitle></VCardItem>
        <VDivider />
        <VCardText>
          <VRow v-if="settingsStore.ipControl">
            <VCol v-for="(value, key) in settingsStore.ipControl" :key="key" cols="12" md="6">
              <VTextField :label="String(key)" :model-value="value" density="comfortable" variant="outlined" @update:model-value="updateField(settingsStore.ipControl, String(key), $event)" />
            </VCol>
          </VRow>
          <div v-else class="text-center py-6 text-medium-emphasis">No IP control config loaded</div>
        </VCardText>
        <VDivider />
        <VCardActions class="justify-end pa-4">
          <VBtn color="primary" :loading="settingsStore.loading" @click="save('ip')">Save</VBtn>
        </VCardActions>
      </VCard>
    </div>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
