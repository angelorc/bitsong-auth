export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    'nuxt-workers',
  ],

  devtools: { enabled: false },

  runtimeConfig: {
    trustedOrigin: 'http://localhost:3001', // https://demo-auth.bitsong.io
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
})
