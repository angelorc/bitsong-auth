import { cfetch } from 'cosmos-fetch'
import { z } from 'zod'
import BigNumber from 'bignumber.js'
import { chains } from 'chain-registry/mainnet'
import type { BankResponse } from '../types'

// function decodeIbc() {
//   // https://tutorials.cosmos.network/tutorials/6-ibc-dev/
//   // 1. https://lcd.explorebitsong.com/ibc/apps/transfer/v1/denom_traces/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518
//   // 2. https://lcd.explorebitsong.com/ibc/core/channel/v1/channels/channel-0/ports/transfer/client_state
// }

const decodeDenomTrace = defineCachedFunction(async (denom: string, chain: string) => {
  console.log(`Calling chain: ${chain}, url: /ibc/apps/transfer/v1/denom_traces/${denom.replace('ibc/', '')}`)
  const { denom_trace: { base_denom, path } } = await cfetch<
    { denom_trace: { base_denom: string, path: string } }
  >(`/ibc/apps/transfer/v1/denom_traces/${denom.replace('ibc/', '')}`, {
    chain,
  })

  return { base_denom, path }
}, {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  getKey: (denom: string, chain: string) => `${denom}-${chain}`,
})

const decodeClientState = defineCachedFunction(async (port: string, channel: string, chain: string) => {
  console.log(`Calling chain: ${chain}, url: /ibc/core/channel/v1/channels/${channel}/ports/${port}/client_state`)
  const { identified_client_state: { client_state: { chain_id } } } = await cfetch<
    { identified_client_state: { client_state: { chain_id: string } } }
  >(`/ibc/core/channel/v1/channels/${channel}/ports/${port}/client_state`, {
    chain,
  })

  return chain_id
}, {
  maxAge: 60 * 60 * 24 * 30, // 30 days
  getKey: (port: string, channel: string, chain: string) => `${port}-${channel}-${chain}`,
})

async function decodeIbcToken(chain: string, denom: string, amount: string = '0') {
  const { base_denom, path } = await decodeDenomTrace(denom, chain)
  const [port, channel] = path.split('/')

  const chain_id = await decodeClientState(port, channel, chain)

  const chain_dst = chains.find(chain => chain.chain_id === chain_id)
  if (!chain_dst) {
    return undefined
  }

  const chain_assets = assetsFromChainName(chain_dst.chain_name)
  if (!chain_assets) {
    return undefined
  }

  return addCoinData({ denom: base_denom, amount: amount.toString() }, chain_dst.chain_name, chain_assets)
}

export default defineEventHandler(async (event) => {
  const schema = z.object({ address: z.string().trim() })
  const { address } = await getValidatedQuery(event, schema.parse)

  const chain = chainNameFromAddress(address)
  if (!chain) {
    return createError({ statusCode: 400, message: 'Invalid address' })
  }

  // TODO: add cache
  const response = await cfetch<BankResponse>(`/cosmos/bank/v1beta1/balances/${address}`, { chain })

  const chain_assets = assetsFromChainName(chain)
  if (!chain_assets) {
    return response.balances
  }

  let enrichedResponse = response.balances.map(coin => addCoinData(coin, chain, chain_assets))

  const ibcTokens = enrichedResponse.filter(coin => coin.denom.startsWith('ibc/'))
  for (const coin of ibcTokens) {
    const ibcCoin = await decodeIbcToken(chain, coin.denom, coin.amount)
    console.log(ibcCoin)
    if (ibcCoin) {
      enrichedResponse.find(c => c.denom === coin.denom)!.ibc = ibcCoin
    }
  }

  const uniqueCoingeckoIds = Array.from(new Set(
    enrichedResponse.map(coin => coin.coingecko_id).concat(enrichedResponse.map(coin => coin.ibc?.coingecko_id).filter(Boolean) as string[]),
  )).filter(Boolean) as string[]
  console.log(uniqueCoingeckoIds)
  const prices = await getCoingeckoPrices(event, uniqueCoingeckoIds)

  enrichedResponse = enrichedResponse.map((coin) => {
    const ibcPrice = coin.ibc ? (prices.find(price => price.id === coin.ibc?.coingecko_id)?.price ?? 0) : 0
    const price = ibcPrice > 0 ? ibcPrice : (prices.find(price => price.id === coin.coingecko_id)?.price ?? 0)
    return {
      ...coin,
      price,
      value_usd: new BigNumber((coin.formatted_amount ?? 0)).times(price).toNumber(),
      ibc: coin.ibc
        ? {
            ...coin.ibc,
            price: ibcPrice,
            value_usd: new BigNumber((coin.ibc.formatted_amount ?? 0)).times(ibcPrice).toNumber(),
          }
        : undefined,
    }
  })

  return enrichedResponse
})
