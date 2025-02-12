import { defu } from 'defu'
import { defineNuxtRouteMiddleware, navigateTo, useAuth } from '#imports'

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

export default defineNuxtRouteMiddleware(async (to) => {
  console.log('init middleware')
  // If auth is disabled, skip middleware
  if (to.meta?.auth === false) {
    console.log('auth is disabled')
    return
  }
  const { loggedIn, options, fetchSession } = useAuth()
  const { only, redirectUserTo, redirectGuestTo } = defu(to.meta?.auth, options)

  // If guest mode, redirect if authenticated
  if (only === 'guest' && loggedIn.value) {
    console.log('only guest')
    // Avoid infinite redirect
    if (to.path === redirectUserTo) {
      console.log('[guest] avoid infinite redirect')
      return
    }
    console.log('[guest] redirect to', redirectUserTo)
    return navigateTo(redirectUserTo)
  }
  console.log('not only guest')

  // If client-side, fetch session between each navigation
  if (import.meta.client) {
    console.log('client side')
    await fetchSession()
  }
  // If not authenticated, redirect to home
  if (!loggedIn.value) {
    console.log('not logged in')
    // Avoid infinite redirect
    if (to.path === redirectGuestTo) {
      console.log('avoid infinite redirect')
      return
    }
    console.log('redirect to', redirectGuestTo)
    return navigateTo(redirectGuestTo)
  }

  console.log('end middleware')
})
