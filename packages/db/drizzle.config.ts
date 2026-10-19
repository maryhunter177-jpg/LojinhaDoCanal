import { loadDatabaseConfig } from '@ofertas/core';
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: { url: loadDatabaseConfig().DATABASE_URL },
  strict: true,
});
