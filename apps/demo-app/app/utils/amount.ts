import BigNumber from 'bignumber.js'

export const toAmount = (amount: string | number, decimals: number = 6): number => {
  return new BigNumber(amount).dividedBy(10 ** decimals).toNumber()
}
