<script setup lang="ts">
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })
const activeTab = ref('system')
const settings = ref<Record<string, any>>({})

async function fetchSettings() {
  loading.value = true
  try {
    const { settingsService } = await import('~/services/api')
    const res: any = await settingsService.getSystem()
    settings.value = res?.data || res || {}
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  try {
    const { settingsService } = await import('~/services/api')
    await settingsService.updateSystem(settings.value)
    snackbar.value = { show: true, text: 'Saved', color: 'success' }
  } catch (e) {
    snackbar.value = { show: true, text: 'Failed', color: 'error' }
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div>
    <VCard :loading="loading">
      <VCardText>
        <VRow>
          <VCol v-for="(value, key) in settings" :key="key" cols="12" md="6">
            <VTextField
              :model-value="value"
              :label="String(key)"
              density="comfortable"
              variant="outlined"
              hide-details
              @update:model-value="settings[key] = $event"
            />
          </VCol>
        </VRow>
        <div v-if="!Object.keys(settings).length && !loading" class="text-center text-medium-emphasis pa-4">No settings found</div>
        <VBtn color="primary" class="mt-4" :loading="loading" @click="saveSettings">Save</VBtn>
      </VCardText>
    </VCard>
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top end">{{ snackbar.text }}</VSnackbar>
  </div>
</template>
