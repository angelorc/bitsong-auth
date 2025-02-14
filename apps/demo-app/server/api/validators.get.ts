import { getValidatorAvatar } from "../utils/keybase"

interface Validator {
  operator_address: string
  consensus_pubkey: {
    '@type': string
    'key': string
  }
  jailed: boolean
  status: string
  tokens: string
  delegator_shares: string
  description: {
    moniker: string
    identity: string
    website: string
    security_contact: string
    details: string
  }
  unbonding_height: string
  unbonding_time: string
  commission: {
    commission_rates: {
      rate: string
      max_rate: string
      max_change_rate: string
    }
    update_time: string
  }
  min_self_delegation: string
  unbonding_on_hold_ref_count: string
  unbonding_ids: string[]
}

interface ValidatorsResponse {
  validators: Validator[]
}

export default defineEventHandler(async (_event) => {
  const lcdPrefix = 'https://lcd.explorebitsong.com'

  const { validators } = await $fetch<ValidatorsResponse>(`${lcdPrefix}/cosmos/staking/v1beta1/validators?pagination.limit=1000`)

  const avatars = await Promise.all(validators.map(async (validator) => {
    if (!validator.description.identity) {
      return {
        operator_address: validator.operator_address,
        avatar: null,
      }
    }

    const avatar = await getValidatorAvatar(validator.description.identity)
    return {
      operator_address: validator.operator_address,
      avatar,
    }
  }))

  return {
    validators: validators.map((validator, i) => ({
      ...validator,
      description: {
        ...validator.description,
        avatar: avatars[i].avatar,
      },
    })),
  }
})
