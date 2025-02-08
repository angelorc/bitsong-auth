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

  devServer: {
    port: 3000,
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
