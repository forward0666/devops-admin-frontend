<script setup lang="ts">
import { useTheme } from 'vuetify'

const { global } = useTheme()

const authProviders = [
  {
    icon: 'bxl-telegram',
    color: '#0088cc',
    colorInDark: '#0088cc',
  },
  {
    icon: 'bxl-google',
    color: '#db4437',
    colorInDark: '#db4437',
  },
  {
    icon: 'bxl-slack',
    color: '#4a154b',
    colorInDark: '#e01e5a',
  },
]
</script>

<template>
  <VBtn
    v-for="link in authProviders"
    :key="link.icon"
    :icon="link.icon"
    variant="text"
    :color="global.name.value === 'dark' ? link.colorInDark : link.color"
  />
</template>
