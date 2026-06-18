// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  ssr: true,
  css: ['~/assets/css/main.css'],
  // Deploy na Cloudflare Workers (Nitro modul-worker + statická aktiva přes ASSETS).
  // Lze přepsat přes env NITRO_PRESET.
  nitro: {
    preset: 'cloudflare-module',
  },
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
        { name: 'theme-color', content: '#0f172a' },
        { property: 'og:title', content: 'Mapa světových statistik' },
        { property: 'og:type', content: 'website' },
        {
          property: 'og:description',
          content:
            'Interaktivní mapa světa – vyber statistiku, klikni na zemi a porovnej ostatní země.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      script: [
        {
          // Nastaví uložené téma ještě před vykreslením (bez probliknutí).
          innerHTML:
            "try{var t=localStorage.getItem('wsm-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}",
          tagPosition: 'head',
        },
      ],
    },
  },
})
