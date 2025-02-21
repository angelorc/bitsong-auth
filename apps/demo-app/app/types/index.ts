export type Coin = {
  denom: string
  amount: string
}

type CoinMetadata = Coin & {
  chain_name?: string
  name?: string
  symbol?: string
  decimals?: number
  logo?: string
  coingecko_id?: string
  formatted_amount?: number
  price?: number
  value_usd?: number
}

export type CoinWithMetadata = CoinMetadata & {
  ibc?: CoinMetadata
}
