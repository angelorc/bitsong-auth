import { useConfig, useConnect } from '@quirks/vue'
import { customAlphabet } from 'nanoid'
import { getAddress, getChain, signArbitrary } from '@quirks/store'
import { toMessage } from '@bitsongjs/siwco'
import { navigateTo, useAuth, useRequestURL } from '#imports'

export function useWallet() {
  const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)

  const { wallets: _wallets } = useConfig()
  const { connect } = useConnect()

  const { client } = useAuth()

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

      await client.signIn.bitsong({ bitsong, osmosis })
      navigateTo('/')

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
    openWallet,
  }
}
