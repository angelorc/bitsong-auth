import { createAuthClient } from 'better-auth/client'
import { bitsongClient } from '@bitsong-auth/better-auth-plugin'
import type { H3Event } from 'h3'

export const authClient = (event: H3Event) => {
  return createAuthClient({
    baseURL: useRuntimeConfig(event).public.apiUrl,
    fetchOptions: {
      headers: event.headers,
    },
    plugins: [
      bitsongClient(),
      // customSessionClient<typeof auth>()
    ],
  })
}
