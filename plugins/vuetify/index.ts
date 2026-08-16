import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import defaults from './defaults'
import { icons } from './icons'
import { themes } from './theme'

// Styles

import '@core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    ssr: true,
    aliases: {
      IconBtn: VBtn,
    },
    defaults,
    icons,
    theme: {
      defaultTheme: 'light',
      themes,
    },
  })

  // Restore theme from localStorage
  if (import.meta.client) {
    const savedTheme = localStorage.getItem('app-theme')
    if (savedTheme) {
      vuetify.theme.global.name.value = savedTheme
    }
    watch(() => vuetify.theme.global.name.value, (val) => {
      localStorage.setItem('app-theme', val)
    })
  }

  nuxtApp.vueApp.use(vuetify)
})
