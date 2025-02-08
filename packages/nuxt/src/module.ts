import { defineNuxtModule, addPlugin, createResolver, addImportsDir, addRouteMiddleware, hasNuxtModule, installModule, addImports } from '@nuxt/kit'

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'my-module',
    configKey: 'myModule',
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    if (!hasNuxtModule('@quirks/nuxt', nuxt)) {
      await installModule('@quirks/nuxt')
    }

    addPlugin(resolve('./runtime/plugins/quirks'))
    addPlugin({
      src: resolve('./runtime/plugins/auth.client'),
      mode: 'client',
      order: 1,
    })
    addPlugin({ src: resolve('./runtime/plugins/auth.server'), mode: 'server', order: 0 })
    addImportsDir(resolve('./runtime/composables'))
    addRouteMiddleware({
      name: 'auth',
      path: resolve('./runtime/middleware/auth.global'),
      global: true,
    })
    // addPlugin(resolve('./runtime/plugin'))
  },
})
