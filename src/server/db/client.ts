import 'server-only';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set - database features will not be available');
}

// Create a dummy SQL function if no connection string
const sql = connectionString ? neon(connectionString) : (() => { throw new Error('DATABASE_URL not configured'); }) as any;

export const db = drizzle(sql, { schema });
export type DbClient = typeof db;
