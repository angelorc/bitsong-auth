import { fromBase64, toBech32 } from '@cosmjs/encoding'
import { Secp256k1, Secp256k1Signature, Sha256 } from '@cosmjs/crypto'
import type { Pubkey } from '@cosmjs/amino'
import { 
  rawSecp256k1PubkeyToRawAddress,
  serializeSignDoc,
  makeSignDoc,
  pubkeyToAddress
} from '@cosmjs/amino'
import { fromMessage } from '@bitsongjs/siwco'
import { chain as bitsongChain } from 'chain-registry/mainnet/bitsong/index.js'
import { chain as cosmoshubChain } from 'chain-registry/mainnet/cosmoshub/index.js'
import { chain as osmosisChain } from 'chain-registry/mainnet/osmosis/index.js'
import { chain as nobleChain } from 'chain-registry/mainnet/noble/index.js'
import type { Chain } from '@chain-registry/types'
import { BodySchema } from '.'

export const chains: Record<string, Chain> = {
  bitsong: bitsongChain,
  cosmoshub: cosmoshubChain,
  osmosis: osmosisChain,
  noble: nobleChain,
}

type VerifySignatureParams = {
  prefix?: string
  msg: string
  pub_key: Pubkey
  signature: string
}

function makeMsg(signer: string, msg: string) {
  return [
    {
      type: 'sign/MsgSignData',
      value: {
        signer,
        data: btoa(msg),
      },
    },
  ]
}

export async function verifySignature(params: VerifySignatureParams): Promise<string | undefined> {
  const {
    prefix = 'bitsong',
    msg,
    pub_key,
    signature,
  } = params

  const address = pubkeyToAddress(pub_key, prefix)

  const msgs = makeMsg(address, msg)
  const chainId = ''
  const memo = ''
  const accountNumber = 0
  const sequence = 0
  const fee = {
    gas: '0',
    amount: [],
  }

  const signDoc = makeSignDoc(msgs, fee, chainId, memo, accountNumber, sequence)

  const result = await Secp256k1.verifySignature(
    Secp256k1Signature.fromFixedLength(fromBase64(signature)),
    new Sha256(serializeSignDoc(signDoc)).digest(),
    fromBase64(pub_key.value),
  )

  if (!result) {
    return undefined
  }

  return address
}

export type ValidateLoginResponse = {
  data?: {
    addresses: { [key: string]: string }
    pubkeys: { [key: string]: string }
  }
  error?: string
}

export async function validateLogin({bitsong, osmosis}: BodySchema): Promise<ValidateLoginResponse> {
  const data: {
    addresses: { [key: string]: string }
    pubkeys: { [key: string]: string }
  } = {
    addresses: {},
    pubkeys: {},
  }

  const wallets = { bitsong, osmosis }

  for (const walletInfo of Object.keys(wallets)) {
    const wallet = wallets[walletInfo as keyof typeof wallets]
    const chain = chains[walletInfo as keyof typeof chains]

    const signatureAddress = await verifySignature({
      prefix: chain.bech32_prefix,
      msg: wallet.message,
      pub_key: wallet.pub_key,
      signature: wallet.signature,
    })

    if (signatureAddress === undefined) {
      return {
        error: `invalid signature for ${chain.chain_name}`,
      }
    }

    const { address, chainId } = fromMessage(wallet.message)
    if (!address || !chainId) {
      return {
        error: `invalid message for ${chain.chain_name}`,
      }
    }

    if (signatureAddress !== address) {
      return {
        error: `address signature mismatch for ${chain.chain_name}. expected ${address}, got ${signatureAddress}`,
      }
    }

    if (!chain.slip44) {
      return {
        error: `slip44 not found for ${chain.chain_name}`,
      }
    }

    data.addresses[chain.chain_name] = address
    data.pubkeys[chain.slip44] = wallet.pub_key.value

    if (chain.slip44 === 118) {
      data.addresses['cosmoshub'] = toBech32(chains.cosmoshub.bech32_prefix!, rawSecp256k1PubkeyToRawAddress(fromBase64(wallet.pub_key.value)))
      data.addresses['noble'] = toBech32(chains.noble.bech32_prefix!, rawSecp256k1PubkeyToRawAddress(fromBase64(wallet.pub_key.value)))
    }
  }

  return {
    data,
  }
}