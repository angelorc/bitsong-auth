import { useIframe } from '../composables/useIframe.client'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'iframe:plugin',
  order: -1,
  parallel: false,
  async setup(nuxtApp) {
    await useIframe().init()
  },
})
