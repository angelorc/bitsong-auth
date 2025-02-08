import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

/*
 * AUTH SCHEMA
 */
export const auth_users = pgTable('auth_users', {
  id: text('id').primaryKey(),
  isWeb3: boolean('is_web3'),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  selectedWallet: text('selected_wallet'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const auth_sessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => auth_users.id),
})

export const auth_accounts = pgTable('auth_accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => auth_users.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const auth_verifications = pgTable('auth_verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export const auth_wallets = pgTable('auth_wallets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => auth_users.id),
  chainType: text('chain_type').notNull(),
  chainName: text('chain_name').notNull(),
  coinType: integer('coin_type').notNull(),
  address: text('address').notNull().unique(),
  pubkey: text('pubkey').notNull(),
  parentPubkey: text('parent_pubkey'),
  walletType: text('wallet_type').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export const shares = pgTable('shares', {
  id: text('id').$defaultFn(() => uuidv7()).primaryKey(),
  userId: text('user_id').notNull().references(() => auth_users.id),
  share: text('share').notNull(),
  backup_share: text('backup_share'),
  createdAt: timestamp().defaultNow().notNull(),
})
