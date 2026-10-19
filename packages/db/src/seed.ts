import { pathToFileURL } from 'node:url';
import { and, eq, sql } from 'drizzle-orm';
import pino from 'pino';
import { loadDatabaseConfig } from '@ofertas/core';
import { createDatabase, type Database } from './client.js';
import { channels, settings } from './schema.js';

const initialChannels = [
  { type: 'telegram', name: 'Telegram' },
  { type: 'discord', name: 'Discord' },
  { type: 'whatsapp_export', name: 'WhatsApp (exportação manual)' },
] as const;

/** Initializes safe defaults without overwriting operator configuration. */
export async function seedDatabase(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(186865321, 1)`);
    await tx
      .insert(settings)
      .values({ key: 'publishing_paused', value: true })
      .onConflictDoNothing();
    for (const channel of initialChannels) {
      const [existing] = await tx
        .select({ id: channels.id })
        .from(channels)
        .where(
          and(eq(channels.type, channel.type), eq(channels.name, channel.name)),
        );
      if (existing === undefined) {
        await tx.insert(channels).values({
          ...channel,
          config: {},
          active: false,
          minIntervalSeconds: 3600,
          maxPostsPerHour: 1,
          windowStart: '09:00:00',
          windowEnd: '21:00:00',
        });
      }
    }
  });
}

async function main(): Promise<void> {
  let logger = pino();
  try {
    const config = loadDatabaseConfig();
    logger = pino({ level: config.LOG_LEVEL });
    const { db, pool } = createDatabase(config.DATABASE_URL);
    try {
      await seedDatabase(db);
      logger.info('Database seed completed');
    } finally {
      await pool.end();
    }
  } catch (error: unknown) {
    logger.error(
      {
        errorType: error instanceof Error ? error.name : typeof error,
        operation: 'database.seed',
      },
      'Database seed failed',
    );
    process.exitCode = 1;
  }
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  void main();
}
