import { z } from 'zod'
import type { CoinWithMetadata } from '../types'

export default defineEventHandler(async (event) => {
  const schema = z.object({ address: z.string().trim() })
  const { address } = await getValidatedQuery(event, schema.parse)

  return await $fetch<{ value_usd: number, balances: CoinWithMetadata[] }>(`https://balance-tracker.nuxt.dev/api/balance?address=${address}`)
})
