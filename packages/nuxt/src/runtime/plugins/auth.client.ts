import {} from 'nuxt/app'
import { defineNuxtPlugin, useAuth } from '#imports'

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('auth.client.ts')
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
