import { chains, assets } from 'chain-registry/mainnet'
import type { Asset } from '@chain-registry/types'
import BigNumber from 'bignumber.js'
import { fromBech32 } from '@cosmjs/encoding'
import type { Coin, CoinWithMetadata } from '../types'

export function chainNameFromAddress(address: string) {
  const { prefix } = fromBech32(address)
  if (!prefix) {
    return null
  }

  const chain = chains.find(chain => chain.bech32_prefix === prefix)
  if (!chain) {
    return null
  }

  return chain.chain_name
}

export function assetsFromChainName(chain: string) {
  return assets.find(asset => asset.chain_name === chain)?.assets
}

export function addCoinData(coin: Coin, chain_name: string, chain_assets: Asset[]): CoinWithMetadata {
  const asset = chain_assets.find(asset => asset.base === coin.denom)
  if (!asset) {
    return coin
  }

  const decimals = asset.denom_units.find(unit => unit.denom.toLowerCase() === asset.symbol.toLowerCase())?.exponent || 0

  return {
    ...coin,
    chain_name,
    name: asset.name,
    symbol: asset.symbol,
    decimals,
    logo: asset.logo_URIs?.png ?? undefined,
    coingecko_id: asset.coingecko_id,
    formatted_amount: new BigNumber(coin.amount).div(10 ** (decimals ?? 0)).toNumber(),
  }
}
