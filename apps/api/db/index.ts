import { drizzle as drizzle_pg } from 'drizzle-orm/postgres-js'
import { drizzle as drizzle_neon } from 'drizzle-orm/neon-http'
import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import * as schema from './schema'

config({ path: '.env' })

// const sql = postgres(`${process.env.DATABASE_URL}`, { ssl: 'require', max: 1 })

export const db = () => {
  if (import.meta.dev) {
    return drizzle_pg({
      client: postgres(process.env.DATABASE_URL!),
      schema,
    })
  }

  return drizzle_neon({
    client: neon(process.env.DATABASE_URL!),
    schema,
  })
}
