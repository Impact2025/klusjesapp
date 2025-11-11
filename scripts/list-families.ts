import { config } from 'dotenv';

config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/server/db/schema';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }

  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  const families = await db.query.families.findMany({
    with: {
      children: true,
    },
    limit: 10,
  });

  console.log(JSON.stringify(families, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
