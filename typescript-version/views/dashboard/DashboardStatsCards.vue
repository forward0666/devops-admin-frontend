<script setup lang="ts">
const stats = [
  {
    title: '用户总数',
    value: '1,284',
    icon: 'tabler-users',
    color: 'primary',
    subtitle: '较上月 +12.5%',
  },
  {
    title: '活跃用户',
    value: '986',
    icon: 'tabler-user-check',
    color: 'success',
    subtitle: '占比 76.8%',
  },
  {
    title: '禁用用户',
    value: '42',
    icon: 'tabler-user-x',
    color: 'error',
    subtitle: '较上月 +3',
  },
  {
    title: '今日新增',
    value: '18',
    icon: 'tabler-user-plus',
    color: 'info',
    subtitle: '本周累计 67',
  },
]
</script>

<template>
  <VRow>
    <VCol
      v-for="stat in stats"
      :key="stat.title"
      cols="12"
      sm="6"
      md="3"
    >
      <VCard>
        <VCardText class="d-flex align-center">
          <VAvatar
            size="48"
            rounded
            variant="tonal"
            :color="stat.color"
            class="me-4"
          >
            <VIcon
              :icon="stat.icon"
              size="26"
            />
          </VAvatar>
          <div class="flex-grow-1">
            <div class="text-subtitle-2 text-medium-emphasis">
              {{ stat.title }}
            </div>
            <div class="text-h5 font-weight-bold">
              {{ stat.value }}
            </div>
          </div>
        </VCardText>
        <VDivider />
        <VCardText class="text-caption text-medium-emphasis py-2">
          {{ stat.subtitle }}
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
