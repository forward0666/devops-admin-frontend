<script setup lang="ts">
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })
const settings = ref<Record<string, any>>({})

const fieldGroups: { title: string; fields: { key: string; label: string; type: 'text' | 'number' | 'switch' }[] }[] = [
  {
    title: 'Setting',
    fields: [
      { key: 'setting.name', label: 'System Name', type: 'text' },
      { key: 'setting.language', label: 'System Language', type: 'text' },
      { key: 'setting.password.min_length', label: 'Password Min Length', type: 'number' },
      { key: 'setting.password.expire_days', label: 'Password Expire Days', type: 'number' },
      { key: 'setting.password.require_uppercase', label: 'Password Require Uppercase', type: 'switch' },
      { key: 'setting.password.require_number', label: 'Password Require Number', type: 'switch' },
      { key: 'setting.password.require_special', label: 'Password Require Special', type: 'switch' },
      { key: 'setting.login.max_attempts', label: 'Login Max Attempts', type: 'number' },
      { key: 'setting.login.lockout_minutes', label: 'Login Lockout Minutes', type: 'number' },
      { key: 'setting.login.captcha_enabled', label: 'Login Captcha Enabled', type: 'switch' },
      { key: 'setting.session.token_expire', label: 'Token Expire Seconds', type: 'number' },
      { key: 'setting.session.refresh_expire', label: 'Refresh Token Expire Seconds', type: 'number' },
      { key: 'setting.session.max_concurrent', label: 'Max Concurrent Session', type: 'number' },
      { key: 'setting.ip.allowed_ips', label: 'IP Allowed List (comma separated)', type: 'text' },
      { key: 'setting.ip.blocked_ips', label: 'IP Blocked List (comma separated)', type: 'text' },
    ],
    full: true,
  },
]

async function fetchSettings() {
  loading.value = true
  try {
    const { settingService } = await import('~/services/api')
    const res: any = await settingService.getAll()
    const data = res?.data ?? res
    if (typeof data === 'object' && !Array.isArray(data))
      settings.value = data
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
    await settingService.update(settings.value)
    snackbar.value = { show: true, text: 'Saved', color: 'success' }
  }
  catch (e) {
    snackbar.value = { show: true, text: 'Failed', color: 'error' }
  }
  finally {
    loading.value = false
  }
}

function toBool(val: any) {
  return val === true || val === 'true'
}

function getVal(key: string) {
  return settings.value[key] ?? ''
}

function setVal(key: string, val: any) {
  settings.value[key] = val
}

onMounted(fetchSettings)
</script>

<template>
  <div class="d-flex flex-column gap-4">
    <VCard v-for="group in fieldGroups" :key="group.title" :loading="loading">
      <VCardTitle class="text-body-1 font-weight-medium">
        {{ group.title }}
      </VCardTitle>
      <VDivider />
      <VCardText>
        <div v-for="field in group.fields" :key="field.key" class="d-flex align-center py-2">
          <div class="text-body-2" style="min-width: 220px;">{{ field.label }}</div>
          <div style="width: 200px;">
            <VSwitch
              v-if="field.type === 'switch'"
              :model-value="toBool(getVal(field.key))"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="setVal(field.key, $event)"
            />
            <VTextField
              v-else
              :model-value="getVal(field.key)"
              :type="field.type"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="setVal(field.key, $event)"
            />
          </div>
        </div>
      </VCardText>
    </VCard>
    <VBtn color="primary" :loading="loading" @click="saveSettings">
      Save
    </VBtn>
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top end">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
