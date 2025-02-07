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
import { computed, navigateTo, ref, useRequestHeaders, useState, useRuntimeConfig, onMounted } from '#imports'

interface RuntimeAuthConfig {
  redirectUserTo: RouteLocationRaw | string
  redirectGuestTo: RouteLocationRaw | string
}

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
  const {
    baseURL = 'http://localhost:3000',
  } = params || {}

  async function createIFrame(src: string): Promise<ParentRPCHandlerClass> {
    console.log('creating iframe')
    const session = await createParentIFrameRPCSession(src)
    console.log('session', session)

    return session.registerHandlerClass<ParentRPCHandlerClass, IChildFrameRPCInterface>(
      (peer, session) => new ParentRPCHandlerClass(peer, session),
    )
  }

  const headers = import.meta.server ? useRequestHeaders() : undefined

  const client = createAuthClient({
    // baseURL: url.origin,
    baseURL,
    fetchOptions: {
      headers,
    },
    // plugins: [customSessionClient<typeof auth>()],
  })

  const options = defu(useRuntimeConfig().public.auth as Partial<RuntimeAuthConfig>, {
    redirectUserTo: '/',
    redirectGuestTo: '/',
  })
  const session = useState<InferSessionFromClient<ClientOptions> | null>('auth:session', () => null)
  const user = useState<InferUserFromClient<ClientOptions> | null>('auth:user', () => null)
  const wallet = useState<WalletInfo | null>('auth:wallet', () => null)
  const sessionFetching = import.meta.server ? ref(false) : useState('auth:sessionFetching', () => false)
  const iframe = useState<ParentRPCHandlerClass | null>('auth:iframe', () => null)

  // onMounted(async () => {
  //   if (iframe.value === null) {
  //     iframe.value = await createIFrame(`${baseURL}/iframe`)
  //   }
  // })

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
    wallet.value = data?.wallet || null
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
    wallet,
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
  }
}
