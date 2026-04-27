<script setup lang="ts">
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })
const settings = ref<Record<string, any>>({})

const fields: { key: string; label: string; type: 'text' | 'number' | 'switch' }[] = [
  { key: 'setting.name', label: '系统名称', type: 'text' },
  { key: 'setting.logo', label: '系统Logo URL', type: 'text' },
  { key: 'setting.language', label: '系统语言', type: 'text' },
  { key: 'setting.theme', label: '系统主题', type: 'text' },
  { key: 'setting.password.min_length', label: '密码最小长度', type: 'number' },
  { key: 'setting.password.require_uppercase', label: '密码要求大写字母', type: 'switch' },
  { key: 'setting.password.require_number', label: '密码要求数字', type: 'switch' },
  { key: 'setting.password.require_special', label: '密码要求特殊字符', type: 'switch' },
  { key: 'setting.password.expire_days', label: '密码过期天数', type: 'number' },
  { key: 'setting.login.max_attempts', label: '最大登录尝试次数', type: 'number' },
  { key: 'setting.login.lockout_minutes', label: '登录锁定时间(分钟)', type: 'number' },
  { key: 'setting.login.captcha_enabled', label: '启用登录验证码', type: 'switch' },
  { key: 'setting.session.token_expire', label: 'Token过期时间(秒)', type: 'number' },
  { key: 'setting.session.refresh_expire', label: 'Refresh Token过期时间(秒)', type: 'number' },
  { key: 'setting.session.max_concurrent', label: '最大并发会话数', type: 'number' },
  { key: 'setting.ip.allowed_ips', label: 'IP白名单(逗号分隔)', type: 'text' },
  { key: 'setting.ip.blocked_ips', label: 'IP黑名单(逗号分隔)', type: 'text' },
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
  <div>
    <VCard :loading="loading">
      <VCardText>
        <VRow>
          <VCol v-for="field in fields" :key="field.key" cols="12" md="6">
            <VSwitch
              v-if="field.type === 'switch'"
              :model-value="toBool(getVal(field.key))"
              :label="field.label"
              color="primary"
              hide-details
              @update:model-value="setVal(field.key, $event)"
            />
            <VTextField
              v-else
              :model-value="getVal(field.key)"
              :label="field.label"
              :type="field.type"
              density="comfortable"
              variant="outlined"
              hide-details
              @update:model-value="setVal(field.key, $event)"
            />
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
