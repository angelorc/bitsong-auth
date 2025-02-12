import { fileURLToPath } from 'node:url'
import { defineNuxtModule, addRouteMiddleware, addPlugin, createResolver, addImports } from '@nuxt/kit'

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

    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)

    nuxt.hook('imports:dirs', (dirs) => {
      dirs.push(resolve(runtimeDir, 'composables'))
    })

    // if (!hasNuxtModule('@quirks/nuxt', nuxt)) {
    //   await installModule('@quirks/nuxt')
    // }

    // addImports([{
    //   name: 'useAuth',
    //   from: resolve('./runtime/composables/useAuth'),
    // }])
    addPlugin(resolve(runtimeDir, 'plugins', 'auth.client'))
    addPlugin(resolve(runtimeDir, 'plugins', 'auth.server'))
    // addPlugin(resolve('./runtime/plugins/quirks'))
    // addPlugin(resolve('./runtime/plugins/iframe.client'))
    // addPlugin(resolve('./runtime/plugins/auth-redirect'))
    addRouteMiddleware({
      name: 'auth',
      path: resolve(runtimeDir, 'middleware', 'auth.global'),
      global: true,
    })
    // addPlugin(resolve('./runtime/plugin'))
  },
})
