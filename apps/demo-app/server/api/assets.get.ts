import { chains } from 'chain-registry/mainnet'

export default defineEventHandler(async (event) => {
  return chains
})
