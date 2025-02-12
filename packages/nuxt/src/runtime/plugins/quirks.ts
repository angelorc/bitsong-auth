import {
  chain as _bitsong,
  assets as bitsongAssetList,
} from 'chain-registry/mainnet/bitsong'
import {
  chain as osmosis,
  assets as osmosisAssetList,
} from 'chain-registry/mainnet/osmosis'
import type { Config } from '@quirks/store'
import {
  keplrExtension,
  leapExtension,
  cosmostationExtension,
  okxExtension,
  keplrMobile,
  leapMobile,
  cosmostationMobile,
} from '@quirks/wallets'
import { quirksPlugin } from '@quirks/vue'
import { generateConfig, initialStateWithCookie } from '@quirks/ssr'
import { defineNuxtPlugin, useCookie } from '#imports'
// import { WCWallet, type WalletOptions } from '@quirks/core'

export default defineNuxtPlugin({
  name: 'quirks:plugin',
  order: 0,
  async setup(nuxtApp) {
    const bitsong = {
      ..._bitsong,
      apis: {
        rpc: [
          {
            address: 'https://rpc.explorebitsong.com',
            provider: 'bitsong-team',
          },
        ],
        rest: [
          {
            address: 'https://lcd.explorebitsong.com',
            provider: 'bitsong-team',
          },
        ],
      },
    }

    const config: Config = generateConfig({
      wallets: [
        keplrExtension,
        keplrMobile,
        leapExtension,
        leapMobile,
        cosmostationExtension,
        cosmostationMobile,
        okxExtension,
      ],
      chains: [bitsong, osmosis],
      assetsLists: [bitsongAssetList, osmosisAssetList],
      // autoAccountChange: false,
      walletConnectOptions: {
        providerOpts: {
          logger: 'info',
          projectId: 'caa1d0efe307c7a09860e3a9e17fa293', // TODO: move to env
          metadata: {
            name: 'BitSong Studio',
            description: 'BitSong Studio x WalletConnect',
            url: 'https://bitsong.studio',
            icons: ['https://bitsong.studio/images/logo-circle.png'],
          },
        },
      },
    })

    const cookie = useCookie('quirks')
    const configWithCookie = initialStateWithCookie(config, JSON.stringify(cookie.value))

    nuxtApp.vueApp.use(quirksPlugin, configWithCookie)
    console.log('Quirks plugin injected!')
  },
})
