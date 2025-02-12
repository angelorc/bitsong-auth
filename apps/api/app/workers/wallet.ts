import { Buffer } from 'buffer'
import { toMessage } from '@bitsongjs/siwco'
import { Bip39, Random, stringToPath } from '@cosmjs/crypto'
import { toBase64 } from '@cosmjs/encoding'
import { split } from 'shamir-secret-sharing'
import { customAlphabet } from 'nanoid'
import { Secp256k1HdWallet, type AminoSignResponse, type OfflineAminoSigner, type StdSignDoc } from '@cosmjs/amino'
import { $fetch } from 'ofetch'
import { get, set } from 'idb-keyval'
import { chain as bitsongChain } from 'chain-registry/mainnet/bitsong'
import { chain as cosmoshubChain } from 'chain-registry/mainnet/cosmoshub'
import { chain as osmosisChain } from 'chain-registry/mainnet/osmosis'
import { chain as nobleChain } from 'chain-registry/mainnet/noble'
import type { Chain } from '@chain-registry/types'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)

let entropy: Uint8Array

const chains: Record<string, Chain> = {
  bitsong: bitsongChain,
  cosmoshub: cosmoshubChain,
  osmosis: osmosisChain,
  noble: nobleChain,
}

async function getChainByName(chainName: string = 'bitsong'): Promise<Chain> {
  const chain = chains[chainName]
  if (!chain) {
    throw new Error(`Chain "${chainName}" not found`)
  }
  return chain
}

export async function getOfflineSignerOnlyAmino(chainName: string = 'bitsong'): Promise<OfflineAminoSigner> {
  if (entropy === undefined) {
    throw new Error('unlock the wallet')
  }

  const chain = await getChainByName(chainName)
  return Secp256k1HdWallet.fromMnemonic(Bip39.encode(entropy).toString(), {
    prefix: chain.bech32_prefix,
    hdPaths: [stringToPath(`m/44'/${chain.slip44}'/0'/0/0`)],
  })
}

async function createAndSignCreateWalletMsg(chainName: string = 'bitsong') {
  try {
    const signer = await getOfflineSignerOnlyAmino(chainName)
    const [account] = await signer.getAccounts()
    if (!account) {
      throw new Error('account not found')
    }

    const chain = await getChainByName(chainName)

    // const url = useRequestURL()
    const url = import.meta.dev ? new URL('http://localhost:3001') : new URL('https://demo-auth.bitsong.io')
    const message = toMessage({
      address: account.address,
      chainId: chain.chain_id,
      chainName: chain.chain_name,
      domain: url.host.toString(),
      version: '1',
      nonce: nanoid(),
      uri: `${url.protocol}//${url.host}`,
    })

    const { signature: { pub_key, signature } } = await signAminoADR36({ chainName, address: account.address, message })

    return { message, pub_key, signature }
  }
  catch (e) {
    console.error('there is an error', e)
    throw e
  }
}

interface ADR36AminoSignDoc {
  chainName: string
  address: string
  message: string | Uint8Array
}

export function makeADR36AminoSignDoc(data: ADR36AminoSignDoc): StdSignDoc {
  if (typeof data.message === 'string') {
    data.message = Buffer.from(data.message).toString('base64')
  }
  else {
    data.message = Buffer.from(data.message).toString('base64')
  }

  return {
    chain_id: '',
    account_number: '0',
    sequence: '0',
    fee: {
      gas: '0',
      amount: [],
    },
    msgs: [
      {
        type: 'sign/MsgSignData',
        value: {
          signer: data.address,
          data: data.message,
        },
      },
    ],
    memo: '',
  }
}

export async function signAminoADR36(data: ADR36AminoSignDoc): Promise<AminoSignResponse> {
  const signer = await getOfflineSignerOnlyAmino(data.chainName)
  const signDoc = makeADR36AminoSignDoc({ chainName: data.chainName, address: data.address, message: data.message })

  return signer.signAmino(data.address, signDoc)
}

type StdResponse = {
  data?: string
  error?: string
}

export async function createWorkerWallet(): Promise<StdResponse> {
  // 1. Generate new entropy
  entropy = Random.getBytes(32)

  // 2. Generate 3 shares from entropy
  const [share1, share2, share3] = await split(entropy, 3, 2)
  if (!share1 || !share2 || !share3) {
    return { error: 'some share is missing' }
  }

  // 3. Get Offline Signer
  const [bitsong, cosmoshub] = await Promise.all(
    ['bitsong', 'cosmoshub'].map(async (chainName) => {
      const offlineSigner = await getOfflineSignerOnlyAmino(chainName)
      const [account] = await offlineSigner.getAccounts()

      const { message, pub_key, signature } = await createAndSignCreateWalletMsg(chainName)
      const address = account?.address

      return { message, pub_key, signature, address }
    }),
  )

  // 4. TODO: fetch pubkey for end-to-end encryption

  // 5. Store share2 on backend
  const { data, error } = await $fetch<
    { data: { address: string, user_id: string }, error?: string }
  >(`/api/embedded_wallet`, {
    method: 'POST',
    body: {
      share: toBase64(share2),
      backup_share: toBase64(share3),
      wallets: {
        bitsong,
        cosmoshub,
      },
    },
  })
  if (error) {
    return { error }
  }

  // 6. Store share1 on local idb
  await set(`bitsong-wallet:${data.user_id}:${data.address}`, toBase64(share1))

  return { data: data.address }
}

export async function assertWalletLocal({
  user_id,
  address,
}: {
  user_id: string
  address: string
}) {
  const wallet = await get(`bitsong-wallet:${user_id}:${address}`)
  if (!wallet) {
    throw new Error('local share not found')
  }
}

export async function recreateWallet() {
  //
}
