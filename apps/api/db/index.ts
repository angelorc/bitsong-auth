import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as dotenv from 'dotenv'
import * as schema from './schema'

dotenv.config({
  path: '.env',
})

// const sql = postgres(`${process.env.DATABASE_URL}`, { ssl: 'require', max: 1 })
const sql = postgres(`${process.env.DATABASE_URL}`)
export const db = drizzle(sql, { schema })

