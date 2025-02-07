import type { SignOptions } from 'jsonwebtoken'
import { sign } from 'jsonwebtoken'
import { getRandomValues } from 'uncrypto'

type createRequestParams = {
  request_method: 'GET' | 'POST'
  request_path: string
}

async function createRequest({
  request_method,
  request_path,
}: createRequestParams) {
  // TODO: alert, this is a temporary key, remove once test are completed
  // DO NOT USE IN PRODUCTION !!!
  const key = {
    name: 'organizations/1a9f7939-4ba1-4d94-9a81-8f293a2cfe95/apiKeys/95b12ad2-32a6-4416-9cd0-d318d07d1c6f',
    privateKey: '-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIIbPv3a36AcfUIf/8ddvUxzg0nZjcTDsKD92wf2b+x8WoAoGCCqGSM49\nAwEHoUQDQgAEptg1D9QOiL60EYI8800awW+HA0tbVGbQKfOJ2pazEDfAXH6dJAaM\nyjKYrX7+RW+CLoQl74Iu//aAZM70fbhF+Q==\n-----END EC PRIVATE KEY-----\n',
  }

  const host = 'api.developer.coinbase.com'

  const url = `https://${host}${request_path}`
  const uri = `${request_method} ${host}${request_path}`

  const payload = {
    iss: 'coinbase-cloud',
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120,
    sub: key.name,
    uri,
  }

  const signOptions: SignOptions = {
    header: {
      kid: key.name,
      nonce: Array.from(getRandomValues(new Uint8Array(16)))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(''),
    },
  }

  const jwt = sign(payload, key.privateKey, signOptions)

  return { url, jwt }
}

export default defineEventHandler(async (event) => {

})
