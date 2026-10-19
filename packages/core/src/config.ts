import { z } from 'zod';

function hasProtocol(value: string, protocols: readonly string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
const postgresUrl = z
  .string()
  .url()
  .refine(
    (value) => hasProtocol(value, ['postgres:', 'postgresql:']),
    'Use PostgreSQL URL',
  );
const httpUrl = z
  .string()
  .url()
  .refine(
    (value) => hasProtocol(value, ['http:', 'https:']),
    'Use HTTP(S) URL',
  );
const optionalSecret = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);
const optionalHttpUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  httpUrl.optional(),
);
export const databaseConfigSchema = z.object({
  DATABASE_URL: postgresUrl,
  TEST_DATABASE_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    postgresUrl.optional(),
  ),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});
export const configSchema = databaseConfigSchema
  .extend({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    REDIS_URL: z
      .string()
      .url()
      .refine(
        (value) => hasProtocol(value, ['redis:', 'rediss:']),
        'Use Redis URL',
      ),
    TELEGRAM_BOT_TOKEN: optionalSecret,
    TELEGRAM_CHAT_ID: optionalSecret,
    DISCORD_WEBHOOK_URL: optionalHttpUrl,
    SHORTENER_BASE_URL: httpUrl,
    ADMIN_PASSWORD_HASH: optionalSecret,
    SESSION_SECRET: optionalSecret,
    CLICK_HASH_SALT: optionalSecret,
    DRY_RUN: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    TIMEZONE: z
      .string()
      .default('America/Sao_Paulo')
      .refine((value) => {
        try {
          new Intl.DateTimeFormat('pt-BR', { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, 'Invalid timezone'),
  })
  .superRefine((config, context) => {
    if (!config.DRY_RUN) {
      for (const key of [
        'ADMIN_PASSWORD_HASH',
        'SESSION_SECRET',
        'CLICK_HASH_SALT',
      ] as const) {
        if (!config[key] || config[key].length < 32)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: 'Live mode requires a secret of at least 32 characters',
          });
      }
    }
  });
export type Config = z.infer<typeof configSchema>;
export function loadConfig(
  env: Record<string, string | undefined> = process.env,
): Config {
  return configSchema.parse(env);
}
export function loadDatabaseConfig(
  env: Record<string, string | undefined> = process.env,
) {
  return databaseConfigSchema.parse(env);
}
