import { defineNuxtModule, addPlugin, createResolver, addImportsDir, addRouteMiddleware } from '@nuxt/kit'

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'my-module',
    configKey: 'myModule',
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)

    addPlugin({
      src: resolve('./runtime/plugins/auth.client'),
      mode: 'client',
    })
    addPlugin({ src: resolve('./runtime/plugins/auth.server'), mode: 'server' })

    addImportsDir(resolve('./runtime/composables'))

    addRouteMiddleware({
      name: 'auth',
      path: resolve('./runtime/middleware/auth.global'),
      global: true,
    })

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolve('./runtime/plugin'))
  },
})
