// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/color-mode',
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    '@nuxt/icon',
    'shadcn-nuxt',
    '@bitsong-auth/nuxt',
  ],

  devtools: { enabled: true },

  css: ['./app/assets/css/base.css'],

  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:3000', // https://demo-api-auth.bitsong.io
      auth: {
        redirectUserTo: '/',
        redirectGuestTo: '/signin',
      },
    },
  },

  devServer: {
    port: 3001,
  },

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2025-02-04',

  nitro: {
    experimental: {
      asyncContext: true,
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './app/components/ui',
  },
})
