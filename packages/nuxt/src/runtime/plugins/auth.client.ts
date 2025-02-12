import {} from 'nuxt/app'
import { defineNuxtPlugin, useAuth } from '#imports'

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('auth.client.ts')
  console.log('[plugin] auth.client.ts - 1', nuxtApp.payload.serverRendered)
  console.log('[plugin] auth.client.ts - 2.0', nuxtApp.payload.prerenderedAt)
  console.log('[plugin] auth.client.ts - 2.1', Boolean(nuxtApp.payload.prerenderedAt))
  console.log('[plugin] auth.client.ts - 3.0', nuxtApp.payload.isCached)
  console.log('[plugin] auth.client.ts - 3.1', Boolean(nuxtApp.payload.isCached))
  if (!nuxtApp.payload.serverRendered) {
    console.log('auth.client.ts: !nuxtApp.payload.serverRendered')
    await useAuth().fetchSession()
  }
  else if (Boolean(nuxtApp.payload.prerenderedAt) || Boolean(nuxtApp.payload.isCached)) {
    // To avoid hydration mismatch
    nuxtApp.hook('app:mounted', async () => {
      console.log('auth.client.ts: prerenderedAt || isCached')
      await useAuth().fetchSession()
    })
  }
})
