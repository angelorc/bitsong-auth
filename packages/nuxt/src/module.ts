import { defineNuxtModule, addPlugin, createResolver, addImportsDir, hasNuxtModule, installModule } from '@nuxt/kit'

// Module options TypeScript interface definition
export interface ModuleOptions {}

declare module 'nuxt/schema' {
  interface RuntimeConfig {
    apiUrl: string
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'my-module',
    configKey: 'myModule',
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.apiUrl = nuxt.options.runtimeConfig.public.apiUrl || 'http://localhost:3000'

    if (!hasNuxtModule('@quirks/nuxt', nuxt)) {
      await installModule('@quirks/nuxt')
    }

    addPlugin(resolve('./runtime/plugins/quirks'))
    addImportsDir(resolve('./runtime/composables'))
    addPlugin(resolve('./runtime/plugins/iframe.client'))
    addPlugin({
      src: resolve('./runtime/plugins/auth.client'),
      mode: 'client',
      order: 1,
    })
    addPlugin({ src: resolve('./runtime/plugins/auth.server'), mode: 'server', order: 0 })
    addPlugin(resolve('./runtime/plugins/auth-redirect'))
    // addRouteMiddleware({
    //   name: 'auth',
    //   path: resolve('./runtime/middleware/auth.global'),
    //   global: true,
    // })
    // addPlugin(resolve('./runtime/plugin'))
  },
})
