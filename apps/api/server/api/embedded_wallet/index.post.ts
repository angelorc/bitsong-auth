import { fromMessage } from '@bitsongjs/siwco'
import { count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { chain as bitsongChain } from 'chain-registry/mainnet/bitsong/index.js'
import { chain as cosmoshubChain } from 'chain-registry/mainnet/cosmoshub/index.js'
import { chain as osmosisChain } from 'chain-registry/mainnet/osmosis/index.js'
import { chain as nobleChain } from 'chain-registry/mainnet/noble/index.js'
import type { Chain } from '@chain-registry/types'
import { fromBase64, toBech32 } from '@cosmjs/encoding'
import { rawSecp256k1PubkeyToRawAddress } from '@cosmjs/amino'
import { generateId } from 'better-auth'
import { verifySignature } from '~~/server/utils/crypto'
import { auth_wallets, shares } from '~~/db/schema'
import { db } from '~~/db'

const chains: Record<string, Chain> = {
  bitsong: bitsongChain,
  cosmoshub: cosmoshubChain,
  osmosis: osmosisChain,
  noble: nobleChain,
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await serverAuth()
    const session = await auth.api.getSession({
      headers: event.headers,
    })
    if (!session) {
      return { error: 'user not found' }
    }

    const chainSchema = z.object({
      pub_key: z.object({
        type: z.string(),
        value: z.string(),
      }),
      signature: z.string(),
      message: z.string(),
    })

    const schema = z.object({
      share: z.string().min(1).max(150),
      backup_share: z.string().min(1).max(150),
      wallets: z.object({
        bitsong: chainSchema,
        cosmoshub: chainSchema,
      }),
    })

    const { share, backup_share, wallets } = await readValidatedBody(event, schema.parse)

    const _data: {
      addresses: { [key: string]: string }
      pubkeys: { [key: string]: string }
    } = {
      addresses: {},
      pubkeys: {},
    }

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
      if (!address || !chainId || !share) {
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

      _data.addresses[chain.chain_name] = address
      _data.pubkeys[chain.slip44] = wallet.pub_key.value

      if (chain.slip44 === 118) {
        _data.addresses['osmosis'] = toBech32(chains.osmosis.bech32_prefix!, rawSecp256k1PubkeyToRawAddress(fromBase64(wallet.pub_key.value)))
        _data.addresses['noble'] = toBech32(chains.noble.bech32_prefix!, rawSecp256k1PubkeyToRawAddress(fromBase64(wallet.pub_key.value)))
      }
    }

    await db().transaction(async (tx) => {
      const [{ count: total }] = await tx
        .select({ count: count() })
        .from(shares)
        .where(
          eq(shares.userId, session.user.id),
        )

      if (total > 0) {
        throw new Error('embedded wallet already exists')
      }

      await tx
        .insert(shares)
        .values({
          userId: session.user.id,
          share,
          backup_share,
        })

      for (const chain of Object.keys(_data.addresses)) {
        const coinType = chain === 'bitsong' ? 639 : chains[chain].slip44 ?? 0
        const address = _data.addresses[chain]
        await tx
          .insert(auth_wallets)
          .values({
            id: generateId(),
            userId: session.user.id,
            chainType: 'cosmos',
            chainName: chain,
            coinType: coinType,
            address,
            pubkey: _data.pubkeys[coinType],
            walletType: 'embedded',
          })
      }
    })

    const authCtx = await auth.$context
    await authCtx.internalAdapter.updateSession(
      session.session.token,
      { selectedWallet: _data.addresses.bitsong },
    )

    return {
      data: {
        user_id: session.user.id,
        address: _data.addresses.bitsong,
      },
    }
  }
  catch (e) {
    return {
      error: e instanceof Error ? e.message : 'unexpected error',
    }
  }
})
