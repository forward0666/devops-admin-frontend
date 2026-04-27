<script setup lang="ts">
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })
const activeTab = ref('system')
const systemData = ref<Record<string, any>>({})
const securityData = ref<Record<string, any>>({})

async function fetchSettings() {
  loading.value = true
  try {
    const { settingService } = await import('~/services/api')
    const [sysRes, secRes] = await Promise.all([
      settingService.getSystem(),
      settingService.getSecurity(),
    ])
    const sys = sysRes?.data ?? sysRes
    const sec = secRes?.data ?? secRes
    systemData.value = (typeof sys === 'object' && !Array.isArray(sys)) ? sys : {}
    securityData.value = (typeof sec === 'object' && !Array.isArray(sec)) ? sec : {}
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

async function saveSettings(section: string) {
  loading.value = true
  try {
    const { settingService } = await import('~/services/api')
    if (section === 'system') {
      await settingService.updateSystem(systemData.value)
    }
    else {
      await settingService.updateSecurity(securityData.value)
    }
    snackbar.value = { show: true, text: 'Saved', color: 'success' }
  }
  catch (e) {
    snackbar.value = { show: true, text: 'Failed', color: 'error' }
  }
  finally {
    loading.value = false
  }
}

function formatKey(key: string) {
  return key.split('.').pop()!.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

onMounted(fetchSettings)
</script>

<template>
  <div>
    <VCard :loading="loading">
      <VTabs v-model="activeTab">
        <VTab value="system">
          System
        </VTab>
        <VTab value="security">
          Security
        </VTab>
      </VTabs>
      <VDivider />
      <VWindow v-model="activeTab">
        <VWindowItem value="system">
          <VCardText>
            <VRow>
              <VCol v-for="(value, key) in systemData" :key="key" cols="12" md="6">
                <VTextField :model-value="value" :label="formatKey(key)" density="comfortable" variant="outlined" hide-details @update:model-value="systemData[key] = $event" />
              </VCol>
            </VRow>
            <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings('system')">
              Save
            </VBtn>
          </VCardText>
        </VWindowItem>
        <VWindowItem value="security">
          <VCardText>
            <VRow>
              <VCol v-for="(value, key) in securityData" :key="key" cols="12" md="6">
                <VTextField :model-value="value" :label="formatKey(key)" density="comfortable" variant="outlined" hide-details @update:model-value="securityData[key] = $event" />
              </VCol>
            </VRow>
            <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings('security')">
              Save
            </VBtn>
          </VCardText>
        </VWindowItem>
      </VWindow>
    </VCard>
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top end">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
