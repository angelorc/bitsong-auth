export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    'nuxt-workers',
  ],

  devtools: { enabled: false },

  runtimeConfig: {
    public: {
      auth: {
        redirectUserTo: '/',
        redirectGuestTo: '/signin',
      },
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-11-01',

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
