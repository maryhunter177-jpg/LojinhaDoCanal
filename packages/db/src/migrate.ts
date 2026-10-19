import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadDatabaseConfig } from '@ofertas/core';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pino from 'pino';
import { createDatabase } from './client.js';
export async function migrateDatabase(
  connectionString: string,
  migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url)),
): Promise<void> {
  const { db, pool } = createDatabase(connectionString);
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const logger = pino();
  try {
    const config = loadDatabaseConfig();
    logger.level = config.LOG_LEVEL;
    await migrateDatabase(config.DATABASE_URL);
    logger.info({ operation: 'db.migrate' }, 'Migrations applied');
  } catch (error: unknown) {
    // Database errors may expose credentials or submitted values.
    logger.error(
      {
        operation: 'db.migrate',
        errorType: error instanceof Error ? error.name : 'UnknownError',
      },
      'Migration failed',
    );
    process.exitCode = 1;
  }
}
