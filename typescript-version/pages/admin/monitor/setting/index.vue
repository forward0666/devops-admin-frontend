<script setup lang="ts">
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })
const settings = ref<Record<string, any>>({})

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
    settings.value = { ...(typeof sys === 'object' ? sys : {}), ...(typeof sec === 'object' ? sec : {}) }
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

async function saveSettings() {
  loading.value = true
  try {
    const { settingService } = await import('~/services/api')
    const systemData: Record<string, any> = {}
    const securityData: Record<string, any> = {}
    for (const [key, value] of Object.entries(settings.value)) {
      if (key.startsWith('system.'))
        systemData[key] = value
      else if (key.startsWith('security.'))
        securityData[key] = value
    }
    if (Object.keys(systemData).length)
      await settingService.updateSystem(systemData)
    if (Object.keys(securityData).length)
      await settingService.updateSecurity(securityData)
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
      <VCardText>
        <VRow>
          <VCol v-for="(value, key) in settings" :key="key" cols="12" md="6">
            <VTextField :model-value="value" :label="formatKey(key)" density="comfortable" variant="outlined" hide-details @update:model-value="settings[key] = $event" />
          </VCol>
        </VRow>
        <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings">
          Save
        </VBtn>
      </VCardText>
    </VCard>
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top end">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
