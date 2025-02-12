import { } from 'nuxt/app'
import { defineNuxtPlugin, useAuth, useRequestEvent } from '#imports'

export default defineNuxtPlugin({
  name: 'better-auth-fetch-plugin',
  enforce: 'pre',
  async setup(nuxtApp) {
    console.log('auth.server.ts')
    console.log('[plugin] auth.server.ts - 1', Boolean(useRequestEvent()?.context.cache))
    console.log('[plugin] auth.server.ts - 2.0', nuxtApp.payload.serverRendered)
    console.log('[plugin] auth.server.ts - 2.1', !nuxtApp.payload.prerenderedAt)
    console.log('[plugin] auth.server.ts - 2.2', !nuxtApp.payload.isCached)
    // Flag if request is cached
    nuxtApp.payload.isCached = Boolean(useRequestEvent()?.context.cache)
    if (nuxtApp.payload.serverRendered && !nuxtApp.payload.prerenderedAt && !nuxtApp.payload.isCached) {
      console.log('auth.server.ts: serverRendered && !prerenderedAt && !isCached')
      await useAuth().fetchSession()
    }
  },
})
