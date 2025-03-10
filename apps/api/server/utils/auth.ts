import { betterAuth } from 'better-auth'
import { createAuthMiddleware, customSession } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { bitsong } from '@bitsong-auth/better-auth-plugin'
import { auth_accounts, auth_wallets, auth_sessions, auth_users, auth_verifications, shares } from '../../db/schema'
import { db } from '../../db'

// export const betterAuthParams: BetterAuthOptions = {
// ...
// }

async function getWallets(userId: string) {
  return db().query.auth_wallets.findMany({
    columns: {
      chainType: true,
      chainName: true,
      coinType: true,
      address: true,
      pubkey: true,
      parentPubkey: true,
      walletType: true,
    },
    where: eq(shares.userId, userId),
  })
}

let _auth: ReturnType<typeof betterAuth>
export function serverAuth() {
  if (!_auth) {
    _auth = betterAuth({
      database: drizzleAdapter(db(), {
        provider: 'pg',
        schema: {
          user: auth_users,
          session: auth_sessions,
          account: auth_accounts,
          verification: auth_verifications,
          wallets: auth_wallets,
        },
      }),
      baseURL: getBaseURL(),
      advanced: {
        cookiePrefix: 'bitsong-auth',
        crossSubDomainCookies: {
          enabled: true,
          domain: useRuntimeConfig(useEvent()).crossSubDomainCookies,
        },
      },
      trustedOrigins: useRuntimeConfig(useEvent()).trustedOrigin.split(','),
      emailAndPassword: {
        enabled: false,
      },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        github: {
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
      },
      account: {
        accountLinking: {
          enabled: true,
        },
      },
      plugins: [
        bitsong(),
        customSession(async ({ user, session }) => {
          const wallets = await getWallets(user.id)

          return { user, session, wallets }
        }),
      ],
      hooks: {
        after: createAuthMiddleware(async (ctx) => {
          if (ctx.path === '/callback/:id') {
            if (ctx.params?.id === 'google') {
              console.log('google callback, attaching wallet....')

              const newSession = ctx.context.newSession
              if (newSession?.session?.id === undefined) {
                console.log('no session found')
                return
              }

              const wallets = await getWallets(newSession.user.id)
              const wallet = wallets.find(w => w.chainName === 'bitsong' && w.walletType === 'embedded')
              if (wallet) {
                await ctx.context.internalAdapter.updateSession(
                  newSession.session.token,
                  {
                    selectedWallet: wallet.address,
                  },
                )
              }
            }
            else if (ctx.params?.id === 'github') {
              console.log('github callback, attaching wallet....')

              const newSession = ctx.context.newSession
              if (newSession?.session?.id === undefined) {
                console.log('no session found')
                return
              }

              const wallets = await getWallets(newSession.user.id)
              const wallet = wallets.find(w => w.chainName === 'bitsong' && w.walletType === 'embedded')
              if (wallet) {
                await ctx.context.internalAdapter.updateSession(
                  newSession.session.token,
                  {
                    selectedWallet: wallet.address,
                  },
                )
              }
            }
          }

          // if (ctx.path === '/sign-in/bitsong') {
          //   console.log('web3 callback, attaching external wallet....')
          // }
        }),
      },
    })
  }
  return _auth
}

// export const auth = serverAuth()

function getBaseURL() {
  let baseURL = process.env.BETTER_AUTH_URL
  if (!baseURL) {
    try {
      baseURL = getRequestURL(useEvent()).origin
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (e) { /* empty */ }
  }
  return baseURL
}
