import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';
import { logger } from '../lib/logger.ts';

const { Pool } = pg;

declare global {
  var _postgresPool: pg.Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: process.env.NODE_ENV === 'production' ? 50 : 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });
    
    global._postgresPool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle SQL pool client');
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
