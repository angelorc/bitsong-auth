import { } from 'nuxt/app'
import { defineNuxtPlugin, useAuth, useRequestEvent } from '#imports'

export default defineNuxtPlugin({
  name: 'better-auth-fetch-plugin',
  enforce: 'pre',
  async setup(nuxtApp) {
    // Flag if request is cached
    nuxtApp.payload.isCached = Boolean(useRequestEvent()?.context.cache)
    if (nuxtApp.payload.serverRendered && !nuxtApp.payload.prerenderedAt && !nuxtApp.payload.isCached) {
      console.log('auth.server.ts: serverRendered && !prerenderedAt && !isCached')
      await useAuth().fetchSession()
    }
  },
})
