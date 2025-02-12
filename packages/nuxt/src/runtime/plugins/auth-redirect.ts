import { defu } from 'defu'
import { useAuth } from '../composables/useAuth'
import { addRouteMiddleware, defineNuxtPlugin, defineNuxtRouteMiddleware, navigateTo } from '#imports'

type MiddlewareOptions = false | {
  /**
   * Only apply auth middleware to guest or user
   */
  only?: 'guest' | 'user'
  /**
   * Redirect authenticated user to this route
   */
  redirectUserTo?: string
  /**
   * Redirect guest to this route
   */
  redirectGuestTo?: string
}

declare module '#app' {
  interface PageMeta {
    auth?: MiddlewareOptions
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    auth?: MiddlewareOptions
  }
}

export default defineNuxtPlugin({
  name: 'auth-redirect',
  setup() {
    addRouteMiddleware(
      'global-auth',
      defineNuxtRouteMiddleware(async (to) => {
        // If auth is disabled, skip middleware
        if (to.meta?.auth === false) {
          return
        }
        console.log('auth middleware', to.path)
        const { loggedIn, options, fetchSession } = useAuth()
        const { only, redirectUserTo, redirectGuestTo } = defu(to.meta?.auth, options)

        console.log('loggedIn', loggedIn.value)

        // If guest mode, redirect if authenticated
        if (only === 'guest' && loggedIn.value) {
          // Avoid infinite redirect
          if (to.path === redirectUserTo) {
            return
          }
          return navigateTo(redirectUserTo)
        }

        // If client-side, fetch session between each navigation
        if (import.meta.client) {
          console.log('fetching session on client-side')
          await fetchSession()
        }
        // If not authenticated, redirect to home
        if (!loggedIn.value) {
          // Avoid infinite redirect
          if (to.path === redirectGuestTo) {
            return
          }
          return navigateTo(redirectGuestTo)
        }
      }),
      { global: true },
    )
  },
})
