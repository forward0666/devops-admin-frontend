<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { telegramWhitelistService } from '~/services/api'

definePageMeta({ layout: 'default' })

const ips = ref<string[]>([])
const loading = ref(false)
const newIp = ref('')
const newUsername = ref('')
const newDomainType = ref('default')
const snackbar = ref({ show: false, text: '', color: 'success' })

const domainTypes = ['default', 'production', 'staging']

async function loadIps() {
  loading.value = true
  try {
    const res = await telegramWhitelistService.list(newDomainType.value)
    ips.value = Array.isArray(res?.ips) ? res.ips : []
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to load', color: 'error' }
  } finally {
    loading.value = false
  }
}

async function addIp() {
  if (!newIp.value || !newUsername.value) return
  loading.value = true
  try {
    await telegramWhitelistService.add(newIp.value, newUsername.value, newDomainType.value)
    newIp.value = ''
    await loadIps()
    snackbar.value = { show: true, text: 'IP added to whitelist', color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to add IP', color: 'error' }
  } finally {
    loading.value = false
  }
}

async function removeIp(ip: string) {
  loading.value = true
  try {
    await telegramWhitelistService.remove(ip, newDomainType.value)
    await loadIps()
    snackbar.value = { show: true, text: `${ip} removed`, color: 'success' }
  } catch (e: any) {
    snackbar.value = { show: true, text: e?.message || 'Failed to remove IP', color: 'error' }
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadIps() })
</script>

<template>
  <div>
    <VCard class="mb-4">
      <VCardText class="d-flex align-center py-3">
        <div>
          <h4 class="text-h4 mb-1">IP Whitelist</h4>
          <p class="text-body-2 text-medium-emphasis mb-0">Manage IP whitelist for Telegram bot access</p>
        </div>
      </VCardText>
    </VCard>

    <!-- Add IP -->
    <VCard class="mb-4">
      <VCardText>
        <VRow dense>
          <VCol cols="12" md="3">
            <VSelect v-model="newDomainType" :items="domainTypes" label="Domain Type" density="compact" @update:model-value="loadIps()" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="newIp" label="IP Address" placeholder="1.2.3.4" density="compact" />
          </VCol>
          <VCol cols="12" md="3">
            <VTextField v-model="newUsername" label="Username" placeholder="who added" density="compact" />
          </VCol>
          <VCol cols="12" md="2">
            <VBtn color="primary" block :disabled="!newIp || !newUsername" @click="addIp">
              <VIcon start icon="bx-plus" />Add
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- IP List -->
    <VCard>
      <VDataTable
        :headers="[{ title: 'IP Address', key: 'ip' }, { title: 'Action', key: 'action', width: '100px', sortable: false }]"
        :items="ips.map(ip => ({ ip }))"
        :loading="loading"
        density="comfortable"
        :items-per-page="20"
      >
        <template #item.action="{ item }">
          <VBtn icon variant="text" color="error" size="small" @click="removeIp(item.ip)">
            <VIcon icon="bx-trash" />
          </VBtn>
        </template>
        <template #no-data>
          <div class="text-center py-8 text-medium-emphasis">No IPs in whitelist</div>
        </template>
      </VDataTable>
    </VCard>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top end">
      {{ snackbar.text }}
    </VSnackbar>
  </div>
</template>
