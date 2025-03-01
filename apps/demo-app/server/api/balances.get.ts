interface BankResponse {
  balances: {
    denom: string
    amount: string
  }[]
}

interface DelegationResponse {
  delegation_responses: {
    delegation: {
      validator_address: string
      shares: string
    }
    balance: {
      denom: string
      amount: string
    }
  }[]
}

interface RewardResponse {
  rewards: {
    validator_address: string
    reward: {
      denom: string
      amount: string
    }[]
  }[]
}

interface BalanceResponse {
  data?: {
    available: BankResponse['balances']
    delegations: DelegationResponse['delegation_responses'] & {
      delegation: {
        validator_avatar: string | null
        validator_name: string
        validator_status: string
        validator_address: string
      }
    }[]
    rewards: RewardResponse['rewards']
  }
  error?: string
}

export default defineEventHandler(async (event) => {
  const { data } = await authClient(event).getSession()
  console.log('data', data)
  if (!data?.session.selectedWallet) {
    return { error: 'Unauthorized' }
  }

  const lcdPrefix = 'https://lcd.explorebitsong.com'

  const [
    { balances: available },
    { delegation_responses },
    { rewards },
    { validators },
  ] = await Promise.all([
    $fetch<BankResponse>(`${lcdPrefix}/cosmos/bank/v1beta1/balances/${data?.session.selectedWallet}`),
    $fetch<DelegationResponse>(`${lcdPrefix}/cosmos/staking/v1beta1/delegations/${data?.session.selectedWallet}`),
    $fetch<RewardResponse>(`${lcdPrefix}/cosmos/distribution/v1beta1/delegators/${data?.session.selectedWallet}/rewards`),
    $fetch(`/api/validators`),
  ])

  const delegations = delegation_responses.map((delegation) => {
    const validator = validators.find(validator => validator.operator_address === delegation.delegation.validator_address)
    return {
      ...delegation,
      delegation: {
        ...delegation.delegation,
        validator_avatar: validator?.description?.avatar || null,
        validator_name: validator?.description?.moniker || '',
        validator_status: validator?.status || '',
      },
    }
  })

  return <BalanceResponse>{
    data: {
      available,
      delegations: delegations.sort((a, b) => Number(b.balance.amount) - Number(a.balance.amount)),
      rewards,
    },
  }
})
