export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },

  modules: ['@nuxtjs/tailwindcss'],

  ssr: false,

  app: {
    head: {
      title: 'Service Management Console',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  routeRules: {
    '/': { ssr: false },
    '/services/**': { ssr: false },
  },

  future: {
    compatibilityVersion: 4,
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
})
