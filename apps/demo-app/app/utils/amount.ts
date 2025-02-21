import BigNumber from 'bignumber.js'

export const toAmount = (amount: string | number | undefined, decimals: number = 6): number => {
  if (!amount) return 0
  return new BigNumber(amount).dividedBy(10 ** decimals).toNumber()
}

export const formatUsd = (amount: string | number | undefined, decimals: number = 2): string => {
  if (!amount) return '0'
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(amount))
}

export const formatNumber = (amount: string | number | undefined, options?: Intl.NumberFormatOptions): string => {
  if (!amount) return '0'
  return Intl.NumberFormat('en-US', options).format(Number(amount))
}
