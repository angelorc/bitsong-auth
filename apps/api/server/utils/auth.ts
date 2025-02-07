import { betterAuth } from 'better-auth'
import { customSession } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { auth_accounts, auth_sessions, auth_users, auth_verifications, shares } from '../../db/schema'
import { db } from '../../db'

// export const betterAuthParams: BetterAuthOptions = {
//   database: drizzleAdapter(db, {
//     provider: 'pg',
//     schema: {
//       user: auth_users,
//       session: auth_sessions,
//       account: auth_accounts,
//       verification: auth_verifications,
//     },
//   }),
//   // baseURL: getBaseURL(),
//   emailAndPassword: {
//     enabled: false,
//   },
//   socialProviders: {
//     google: {
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     },
//     github: {
//       clientId: process.env.GITHUB_CLIENT_ID!,
//       clientSecret: process.env.GITHUB_CLIENT_SECRET!,
//     },
//   },
//   account: {
//     accountLinking: {
//       enabled: true,
//     },
//   },
//   // plugins: [anonymous(), admin()],
// }

let _auth: ReturnType<typeof betterAuth>
export function serverAuth() {
  if (!_auth) {
    _auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
          user: auth_users,
          session: auth_sessions,
          account: auth_accounts,
          verification: auth_verifications,
        },
      }),
      baseURL: getBaseURL(),
      trustedOrigins: ['http://localhost:3001'],
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
        customSession(async ({ user, session }) => {
          const data = await db.query.shares.findFirst({
            columns: {
              addresses: true,
              pubkeys: true,
            },
            where: eq(shares.userId, user.id),
          })

          return {
            user,
            session,
            wallet: data ? data : undefined,
          }
        }),
      ],
    })
  }
  return _auth
}

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
