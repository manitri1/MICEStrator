import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// 런타임에만 초기화 (빌드 타임 DATABASE_URL 부재 대응)
let _db: NodePgDatabase<typeof schema> | null = null

function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: { rejectUnauthorized: false },
    })
    _db = drizzle(pool, { schema })
  }
  return _db
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as never)[prop as never]
  },
})
