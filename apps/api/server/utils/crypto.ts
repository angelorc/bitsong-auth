import { fromBase64 } from '@cosmjs/encoding'
import { Secp256k1, Secp256k1Signature, Sha256 } from '@cosmjs/crypto'
import type { Pubkey } from '@cosmjs/amino'
import { serializeSignDoc, makeSignDoc, pubkeyToAddress } from '@cosmjs/amino'

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

type VerifySignatureParams = {
  prefix?: string
  msg: string
  pub_key: Pubkey
  signature: string
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
