// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  ssr: true,
  app: {
    head: {
      title: 'Mapa světových statistik',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Interaktivní mapa světa – vyber statistiku, klikni na zemi a porovnej ostatní země.',
        },
      ],
    },
  },
})
