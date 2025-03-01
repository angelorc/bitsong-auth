// import { drizzle } from 'drizzle-orm/postgres-js'
import { drizzle } from 'drizzle-orm/neon-http'
// import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'
import * as schema from './schema'

config({ path: '.env' })

// const sql = postgres(`${process.env.DATABASE_URL}`, { ssl: 'require', max: 1 })
// const sql = postgres(`${process.env.DATABASE_URL}`)
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle({ client: sql, schema })
