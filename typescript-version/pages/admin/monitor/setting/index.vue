<script setup lang="ts">
import { settingsService } from '~/services/api'

const activeTab = ref('system')
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const systemSettings = ref<Record<string, any>>({})
const securitySettings = ref<Record<string, any>>({})
const passwordPolicy = ref<Record<string, any>>({})
const loginSettings = ref<Record<string, any>>({})
const ipSettings = ref<Record<string, any>>({})
const sessionSettings = ref<Record<string, any>>({})

async function fetchSettings() {
  loading.value = true
  try {
    const [sys, sec, pwd, login, ip, session] = await Promise.all([
      settingsService.getSystem(),
      settingsService.getSecurity(),
      settingsService.getPasswordPolicy(),
      settingsService.getLoginSettings(),
      settingsService.getIpControl(),
      settingsService.getSession(),
    ])
    systemSettings.value = sys?.data || sys || {}
    securitySettings.value = sec?.data || sec || {}
    passwordPolicy.value = pwd?.data || pwd || {}
    loginSettings.value = login?.data || login || {}
    ipSettings.value = ip?.data || ip || {}
    sessionSettings.value = session?.data || session || {}
  } catch (e) {
    console.error('Failed to fetch settings:', e)
  } finally {
    loading.value = false
  }
}

async function saveSettings(section: string) {
  try {
    let data: Record<string, any>
    switch (section) {
      case 'system': data = systemSettings.value; await settingsService.updateSystem(data); break
      case 'security': data = securitySettings.value; await settingsService.updateSecurity(data); break
      case 'password': data = passwordPolicy.value; await settingsService.updatePasswordPolicy(data); break
      case 'login': data = loginSettings.value; await settingsService.updateLoginSettings(data); break
      case 'ip': data = ipSettings.value; await settingsService.updateIpControl(data); break
      case 'session': data = sessionSettings.value; await settingsService.updateSession(data); break
    }
    snackbar.value = { show: true, text: 'Settings saved successfully', color: 'success' }
  } catch (e) {
    snackbar.value = { show: true, text: 'Failed to save settings', color: 'error' }
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div>
    <VCard :loading="loading">
      <VTabs v-model="activeTab">
        <VTab value="system">System</VTab>
        <VTab value="security">Security</VTab>
        <VTab value="password">Password Policy</VTab>
        <VTab value="login">Login Security</VTab>
        <VTab value="session">Session</VTab>
        <VTab value="ip">IP Control</VTab>
      </VTabs>
      <VDivider />
      <VWindow v-model="activeTab">
        <VWindowItem value="system">
          <VCardText>
            <VRow><VCol v-for="(value, key) in systemSettings" :key="key" cols="12" md="6">
              <VTextField :model-value="value" :label="String(key)" density="comfortable" variant="outlined" hide-details @update:model-value="systemSettings[key] = $event" />
            </VCol></VRow>
            <div v-if="!Object.keys(systemSettings).length" class="text-center text-medium-emphasis pa-4">No system settings found</div>
            <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings('system')">Save</VBtn>
          </VCardText>
        </VWindowItem>
        <VWindowItem value="security">
          <VCardText>
            <VRow><VCol v-for="(value, key) in securitySettings" :key="key" cols="12" md="6">
              <VTextField :model-value="value" :label="String(key)" density="comfortable" variant="outlined" hide-details @update:model-value="securitySettings[key] = $event" />
            </VCol></VRow>
            <div v-if="!Object.keys(securitySettings).length" class="text-center text-medium-emphasis pa-4">No security settings found</div>
            <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings('security')">Save</VBtn>
          </VCardText>
        </VWindowItem>
        <VWindowItem value="password">
          <VCardText>
            <VRow><VCol v-for="(value, key) in passwordPolicy" :key="key" cols="12" md="6">
              <VTextField :model-value="value" :label="String(key)" density="comfortable" variant="outlined" hide-details @update:model-value="passwordPolicy[key] = $event" />
            </VCol></VRow>
            <div v-if="!Object.keys(passwordPolicy).length" class="text-center text-medium-emphasis pa-4">No password policy found</div>
            <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings('password')">Save</VBtn>
          </VCardText>
        </VWindowItem>
        <VWindowItem value="login">
          <VCardText>
            <VRow><VCol v-for="(value, key) in loginSettings" :key="key" cols="12" md="6">
              <VTextField :model-value="value" :label="String(key)" density="comfortable" variant="outlined" hide-details @update:model-value="loginSettings[key] = $event" />
            </VCol></VRow>
            <div v-if="!Object.keys(loginSettings).length" class="text-center text-medium-emphasis pa-4">No login settings found</div>
            <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings('login')">Save</VBtn>
          </VCardText>
        </VWindowItem>
        <VWindowItem value="session">
          <VCardText>
            <VRow><VCol v-for="(value, key) in sessionSettings" :key="key" cols="12" md="6">
              <VTextField :model-value="value" :label="String(key)" density="comfortable" variant="outlined" hide-details @update:model-value="sessionSettings[key] = $event" />
            </VCol></VRow>
            <div v-if="!Object.keys(sessionSettings).length" class="text-center text-medium-emphasis pa-4">No session settings found</div>
            <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings('session')">Save</VBtn>
          </VCardText>
        </VWindowItem>
        <VWindowItem value="ip">
          <VCardText>
            <VRow><VCol v-for="(value, key) in ipSettings" :key="key" cols="12" md="6">
              <VTextField :model-value="value" :label="String(key)" density="comfortable" variant="outlined" hide-details @update:model-value="ipSettings[key] = $event" />
            </VCol></VRow>
            <div v-if="!Object.keys(ipSettings).length" class="text-center text-medium-emphasis pa-4">No IP control settings found</div>
            <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings('ip')">Save</VBtn>
          </VCardText>
        </VWindowItem>
      </VWindow>
    </VCard>
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top end">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
