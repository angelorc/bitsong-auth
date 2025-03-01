import { defu } from 'defu'
import { createAuthClient } from 'better-auth/client'
import type {
  InferSessionFromClient,
  InferUserFromClient,
  ClientOptions,
} from 'better-auth/client'
import type { RouteLocationRaw } from 'vue-router'
import { z } from 'zod'
import { bitsongClient } from '@bitsong-auth/better-auth-plugin'
import { computed, navigateTo, ref, useRequestHeaders, useState, useRuntimeConfig } from '#imports'

interface RuntimeAuthConfig {
  redirectUserTo: RouteLocationRaw | string
  redirectGuestTo: RouteLocationRaw | string
}

export const SignResponseSchema = z.object({
  address: z.string(),
  chainId: z.literal('bitsong-2b'),
  message: z.string(),
  pub_key: z.object({
    type: z.string(),
    value: z.string(),
  }),
  signature: z.string(),
})

export type SignResponse = z.infer<typeof SignResponseSchema>

type WalletInfo = {
  chainType: string
  chainName: string
  coinType: number
  address: string
  pubkey: string
  parentPubkey: string | null
  walletType: string
}

interface AuthParams {
  baseURL?: string
}

export function useAuth(params?: AuthParams) {
  const {
    baseURL = useRuntimeConfig().public.apiUrl as string,
  } = params || {}

  const headers = import.meta.server ? useRequestHeaders() : undefined

  const session = useState<InferSessionFromClient<ClientOptions> | null>('auth:session', () => null)
  const user = useState<InferUserFromClient<ClientOptions> | null>('auth:user', () => null)
  const wallets = useState<WalletInfo[] | null>('auth:wallets', () => null)
  const sessionFetching = import.meta.server ? ref(false) : useState('auth:sessionFetching', () => false)
  // const selectedWallet = useState<WalletOptions | null>('selectedWallet', () => null)

  const selectedWallet = computed(() => {
    const selected = session.value?.selectedWallet || null
    return wallets.value?.find(w => w.address === selected) || null
  })

  const client = createAuthClient({
    // baseURL: url.origin,
    baseURL,
    fetchOptions: {
      headers,
    },
    plugins: [
      bitsongClient(),
      // customSessionClient<typeof auth>()
    ],
  })

  const options = defu(useRuntimeConfig().public.auth as Partial<RuntimeAuthConfig>, {
    redirectUserTo: '/',
    redirectGuestTo: '/',
  })

  const fetchSession = async () => {
    console.log('fetching session')
    if (sessionFetching.value) {
      return
    }
    sessionFetching.value = true
    const { data } = await client.getSession({
      fetchOptions: {
        headers,
      },
    })
    session.value = data?.session || null
    user.value = data?.user || null
    wallets.value = data?.wallets || null
    sessionFetching.value = false
    return data
  }

  if (import.meta.client) {
    client.$store.listen('$sessionSignal', async (signal) => {
      if (!signal) return
      await fetchSession()
    })
  }

  return {
    session,
    user,
    wallets,
    selectedWallet,
    loggedIn: computed(() => !!session.value),
    signIn: client.signIn,
    signUp: client.signUp,
    async signOut({ redirectTo }: { redirectTo?: RouteLocationRaw } = {}) {
      const res = await client.signOut()
      session.value = null
      user.value = null
      if (redirectTo) {
        await navigateTo(redirectTo)
      }
      return res
    },
    options,
    fetchSession,
    client,
  }
}
