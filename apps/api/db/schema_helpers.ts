import { sql } from 'drizzle-orm'
import { numeric, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const id = text('id').$defaultFn(() => uuidv7()).primaryKey()

export const amount = numeric({ precision: 30, scale: 18 }) // 30 digits, 18 after the decimal point (123456789012345678.123456789012345678)

export const timestamps = {
  updated_at: timestamp('updated_at', { mode: 'string' }).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  created_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
}
