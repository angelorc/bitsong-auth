import { defu } from 'defu'
import { createAuthClient } from 'better-auth/client'
import type {
  InferSessionFromClient,
  InferUserFromClient,
  ClientOptions,
} from 'better-auth/client'
import type { RouteLocationRaw } from 'vue-router'
// import { customSessionClient } from 'better-auth/client/plugins'
import { createParentIFrameRPCSession } from 'safe-rpc-iframe'
import type { EncryptedRPCSession } from 'safe-rpc-iframe'
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
  addresses: {
    cosmos: {
      bitsong: string
      osmosis: string
      cosmoshub: string
      noble: string
      [key: string]: string
    }
  }
  pubkeys: {
    cosmos: {
      639: string
      118: string
      [key: string]: string
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IParentFrameRPCInterface {}

export interface IChildFrameRPCInterface {
  createWallet(): Promise<string | undefined>
}

abstract class InternalLogic {
  peer: IChildFrameRPCInterface

  rpcSession: EncryptedRPCSession

  constructor(peer: IChildFrameRPCInterface, rpcSession: EncryptedRPCSession) {
    this.peer = peer
    this.rpcSession = rpcSession
  }

  dispose() {
    this.rpcSession.dispose()
  }
}

export class ParentRPCHandlerClass extends InternalLogic implements IParentFrameRPCInterface {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(peer: IChildFrameRPCInterface, rpcSession: EncryptedRPCSession) {
    super(peer, rpcSession)
  }
}

interface AuthParams {
  baseURL?: string
}

export function useAuth(params?: AuthParams) {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)

  const {
    baseURL = 'http://localhost:3000',
  } = params || {}

  const { wallets: _wallets } = useConfig()
  const { connect } = useConnect()

  const headers = import.meta.server ? useRequestHeaders() : undefined

  const session = useState<InferSessionFromClient<ClientOptions> | null>('auth:session', () => null)
  const user = useState<InferUserFromClient<ClientOptions> | null>('auth:user', () => null)
  const wallets = useState<WalletInfo[] | null>('auth:wallets', () => null)
  const sessionFetching = import.meta.server ? ref(false) : useState('auth:sessionFetching', () => false)
  const iframe = useState<ParentRPCHandlerClass | null>('auth:iframe', () => null)
  // const selectedWallet = useState<WalletOptions | null>('selectedWallet', () => null)

  async function createIFrame(src: string): Promise<ParentRPCHandlerClass> {
    console.log('creating iframe')
    const session = await createParentIFrameRPCSession(src)
    console.log('session', session)

    return session.registerHandlerClass<ParentRPCHandlerClass, IChildFrameRPCInterface>(
      (peer, session) => new ParentRPCHandlerClass(peer, session),
    )
  }

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

  const init = async () => {
    if (iframe.value === null) {
      iframe.value = await createIFrame(`${baseURL}/iframe`)
    }
  }

  const createWallet = async () => {
    return iframe.value?.peer.createWallet()
  }

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
      console.log('wallet', wallet)
      console.log('name', wallet_name)
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
    createWallet,
    init,
    openWallet,
  }
}
