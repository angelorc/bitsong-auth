import type { 
  AuthPluginSchema, 
  BetterAuthClientPlugin, 
  BetterAuthPlugin, 
  InferOptionSchema, 
  Session, 
  User
} from 'better-auth'
import { z } from 'zod'
import { createAuthEndpoint } from 'better-auth/plugins'
import { mergeSchema } from 'better-auth/db'
import { validateLogin } from './utils'
import { logger, setSessionCookie } from 'better-auth'
import { chain } from 'chain-registry/mainnet/bitsong'
import { coin } from '@cosmjs/amino'

const chains = ['bitsong', 'osmosis', 'cosmoshub', 'noble']

const schema = {
  wallets: {
    fields: {
      userId: {
        type: 'string', 
        required: true,
        references: {
          model: 'user',
          field: 'id',
          onDelete: 'cascade'
        }
      },
      chainType: {
        type: 'string',
        required: true,
        validator: {
          input: z.enum(['cosmos']) // 'evm', 'solana'
        }
      },
      chainName: {
        type: 'string',
        required: true,
        validator: {
          input: z.enum(['bitsong', 'osmosis', 'cosmoshub', 'noble'])
        }
      },
      coinType: {
        type: 'number',
        required: true,
      },
      address: {
        type: 'string',
        required: true,
        unique: true,
        sortable: true,
      },
      pubkey: {
        type: 'string',
        required: true,
      },
      parentPubkey: {
        type: 'string',
        required: false,
      },
      walletType: {
        type: 'string',
        required: true,
        validator: {
          input: z.enum(['embedded', 'external'])
        }
      },
      createdAt: {
        type: 'date',
        required: false,
        defaultValue: () => new Date(),
      },
      updatedAt: {
        type: 'date',
        required: false,
        defaultValue: () => new Date(),
      }
    }
  },
  user: {
    fields: {
      isWeb3: {
        type: 'boolean',
        required: false,
      },
      selectedWallet: {
        type: 'string',
        required: false
      }
    },
  },
} satisfies AuthPluginSchema

export interface UserWithWeb3 extends User {
  isWeb3: boolean
  selectedWallet?: string
}

export interface Web3Options {
  emailDomainName?: string
  onLinkAccount?: (data: {
    anonymousUser: {
      user: UserWithWeb3 & Record<string, unknown>
      session: Session & Record<string, unknown>
    }
    newUser: {
      user: User & Record<string, unknown>
      session: Session & Record<string, unknown>
    }
  }) => Promise<void> | void
  disableDeleteWeb3User?: boolean
  schema?: InferOptionSchema<typeof schema>
}

function getHost(url: string) {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.host
  }
  catch {
    return null
  }
}

const chainSchema = z.object({
  pub_key: z.object({
    type: z.string(),
    value: z.string(),
  }),
  signature: z.string(),
  message: z.string(),
})

const bodySchema = z.object({
  bitsong: chainSchema,
  osmosis: chainSchema,
  rememberMe: z
  .boolean({
    description: "Remember the session",
  })
  .optional(),
})

export type BodySchema = z.infer<typeof bodySchema>

export const bitsong = (options?: Web3Options) => {
  const ERROR_CODES = {
    FAILED_TO_CREATE_USER: 'Failed to create user',
    COULD_NOT_CREATE_SESSION: 'Could not create session',
  } as const

  return {
    id: 'bitsong',
    endpoints: {
      signInWeb3Bitsong: createAuthEndpoint(
        '/sign-in/bitsong',
        {
          method: 'POST',
          body: bodySchema,
          metadata: {
            openapi: {
              description: 'Sign in with Web3 Bitsong',
              responses: {
                200: {
                  description: 'Sign in with Web3 Bitsong',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          user: {
                            $ref: '#/components/schemas/User',
                          },
                          session: {
                            $ref: '#/components/schemas/Session',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        async (ctx) => {
          const data = await validateLogin(ctx.body)
          if (data.error) {
            return ctx.json(null, {
              status: 400,
              body: {
                message: data.error,
                status: 400,
              },
            })
          }

          const bitsongAddress = data.data!.addresses['bitsong']

          let wallet = await ctx.context.adapter.findOne<{
            userId: string
            chainType: string
            chainName: string
            coinType: number
            address: string
            pubkey: string
            walletType: string
            createdAt: Date
          }>({
            model: 'wallets',
            where: [{
              field: 'address',
              value: bitsongAddress,
            }, {
              field: 'chainName',
              value: 'bitsong',
            }]
          })

          let user: UserWithWeb3 | null = null

          if (!wallet) {
            const { emailDomainName = getHost(ctx.context.baseURL) } = options || {}
            const id = ctx.context.generateId({ model: 'user' })
            const email = `${bitsongAddress}@${emailDomainName}`

            user = await ctx.context.internalAdapter.createUser({
              id,
              email,
              emailVerified: false,
              // isAnonymous: true,
              isWeb3: true,
              name: bitsongAddress,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            if (!user) {
              return ctx.json(null, {
                status: 500,
                body: {
                  message: ERROR_CODES.FAILED_TO_CREATE_USER,
                  status: 500,
                },
              })
            }

            for (const chain of chains) {
              const coinType = chain === 'bitsong' ? 639 : 118
              await ctx.context.adapter.create({
                model: 'wallets',
                data: {
                  userId: id,
                  chainType: 'cosmos',
                  coinType,
                  chainName: chain,
                  address: data.data!.addresses[chain],
                  pubkey: data.data!.pubkeys[coinType],
                  parentPubkey: chain === 'bitsong' ? undefined : data.data!.pubkeys[639],
                  walletType: 'external',
                  createdAt: new Date(),
                }
              })
              .catch((e) => {
                logger.error('Failed to create address.\nError: ', e)
              })
            }
          } else {
            user = await ctx.context.adapter.findOne<UserWithWeb3>({
              model: 'user',
              where: [{
                field: 'id',
                value: wallet.userId,
              }]
            })
            if (!user) {
              return ctx.json(null, {
                status: 500,
                body: {
                  message: 'Failed to find user',
                  status: 500,
                },
              })
            }
          }

          await ctx.context.internalAdapter.updateUser(user.id, {
            selectedWallet: bitsongAddress,
          })

          const session = await ctx.context.internalAdapter.createSession(
            user.id,
            ctx.headers,
            ctx.body.rememberMe === false,
          );

          if (!session) {
            return ctx.json(null, {
              status: 500,
              body: {
                message: "Failed to create session",
                status: 500,
              },
            });
          }

          await setSessionCookie(
            ctx,
            { 
              session: {
                ...session,
                test: 'prova'
              },
              user
            }, 
            ctx.body.rememberMe === false
          )

          return ctx.json({
						token: session.token,
						user: {
							id: user.id,
							email: user.email,
							emailVerified: user.emailVerified,
							name: user.name,
							image: user.image,
              isWeb3: user.isWeb3,
              selectedWallet: user.selectedWallet,
							createdAt: user.createdAt,
							updatedAt: user.updatedAt,
						},
					});
        },
      ),
    },
    schema: mergeSchema(schema, options?.schema),
    $ERROR_CODES: ERROR_CODES,
  } satisfies BetterAuthPlugin
}

export const bitsongClient = () => {
  return {
    id: 'bitsong',
    $InferServerPlugin: {} as ReturnType<typeof bitsong>,
    pathMethods: {
      '/sign-in/bitsong': 'POST',
    },
  } satisfies BetterAuthClientPlugin
}
