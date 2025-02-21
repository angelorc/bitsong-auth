export type Coin = {
  denom: string
  amount: string
}

type CoinMetadata = {
  chain_name?: string
  name?: string
  symbol?: string
  decimals?: number
  logo?: string
  coingecko_id?: string
  formatted_amount?: number
}

export type CoinWithMetadata = Coin & CoinMetadata & {
  ibc?: CoinMetadata
}

export type BankResponse = {
  balances: Coin[]
}
