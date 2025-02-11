import { defu } from 'defu'
import { createAuthClient } from 'better-auth/client'
import type {
  InferSessionFromClient,
  InferUserFromClient,
  ClientOptions,
} from 'better-auth/client'
import type { RouteLocationRaw } from 'vue-router'
// import { customSessionClient } from 'better-auth/client/plugins'
// import type { WalletOptions } from '@quirks/core'
import { useConfig, useConnect } from '@quirks/vue'
import { toMessage } from '@bitsongjs/siwco'
import { z } from 'zod'
import { customAlphabet } from 'nanoid'
import { getAddress, getChain, signArbitrary } from '@quirks/store'
import { bitsongClient } from '@bitsong-auth/better-auth-plugin'
import { computed, navigateTo, ref, useRequestHeaders, useState, useRuntimeConfig, useRequestURL } from '#imports'

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
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)

  const {
    baseURL = import.meta.dev ? 'http://localhost:3000' : 'https://bitsong-auth.vercel.app',
  } = params || {}

  const { wallets: _wallets } = useConfig()
  const { connect } = useConnect()

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
    if (sessionFetching.value) {
      console.log('already fetching session')
      return
    }
    sessionFetching.value = true
    const { data } = await client.getSession({
      fetchOptions: {
        headers,
      },
    })
    console.log('session fetched', data)
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

  async function signAndLogin() {
    if (import.meta.server) {
      return
    }

    const nonce = nanoid()

    try {
      // isSigningError.value = false
      // isSigning.value = true

      const [bitsong, osmosis] = await Promise.all(
        ['bitsong', 'osmosis'].map(async (chain_name: string) => {
          const chain = getChain(chain_name)
          const address = getAddress(chain_name)
          const chainId = chain?.chain_id || ''
          const url = useRequestURL()

          const message = toMessage({
            address,
            chainId,
            chainName: chain?.chain_name || '',
            domain: url.host.toString(),
            version: '1',
            nonce,
            uri: `${url.protocol}//${url.host}`,
          })

          const { pub_key, signature } = await signArbitrary(chainId, address, message)
          return { message, pub_key, signature }
        }),
      )

      const user = await client.signIn.bitsong({ bitsong, osmosis })
      navigateTo(options.redirectUserTo)

      // useAuthSession().fetch()

      // isSigning.value = false

      // return { address, chainId, message, pub_key, signature } as unknown as SignResponse
    }
    catch (e) {
      // isSigningError.value = true

      // $toast({
      //   variant: 'destructive',
      //   title: 'Uh oh! Something went wrong',
      //   description: (e as Error).message,
      // })
      console.error(e)
    }
  }

  async function openWallet(wallet_name: string) {
    try {
      const wallet = _wallets.value.find(w => w.options.wallet_name === wallet_name)
      if (wallet && !wallet.injected) {
        return
      }
      // selectedWallet.value = wallet
      await connect(wallet_name)
    }
    catch (e) {
      throw new Error((e as Error).message)
    }
    await signAndLogin()
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
    openWallet,
  }
}
