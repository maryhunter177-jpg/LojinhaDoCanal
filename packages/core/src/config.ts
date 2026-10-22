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

const optionalStorefrontUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  httpUrl
    .refine((value) => {
      try {
        const url = new URL(value);
        return !url.username && !url.password;
      } catch {
        return false;
      }
    }, 'URLs must not include credentials')
    .optional(),
);
const optionalDeploymentHost = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .string()
    .max(253)
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i,
      'Use a hostname without scheme, credentials, path or port',
    )
    .optional(),
);
export const storefrontConfigSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: optionalStorefrontUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalSecret,
    SITE_URL: optionalStorefrontUrl,
    VERCEL_PROJECT_PRODUCTION_URL: optionalDeploymentHost,
    VERCEL_URL: optionalDeploymentHost,
    LOG_LEVEL: databaseConfigSchema.shape.LOG_LEVEL,
  })
  .superRefine((config, context) => {
    if (
      Boolean(config.NEXT_PUBLIC_SUPABASE_URL) !==
      Boolean(config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Configure Supabase URL and publishable key together',
        path: ['NEXT_PUBLIC_SUPABASE_URL'],
      });
    }
  });
export type StorefrontConfig = z.infer<typeof storefrontConfigSchema>;
export function loadStorefrontConfig(
  env: Record<string, string | undefined> = process.env,
): StorefrontConfig {
  return storefrontConfigSchema.parse(env);
}

export function getStorefrontSiteUrl(
  config: StorefrontConfig = loadStorefrontConfig(),
): string {
  if (config.SITE_URL) return config.SITE_URL;
  const host = config.VERCEL_PROJECT_PRODUCTION_URL ?? config.VERCEL_URL;
  return host ? 'https://' + host.toLowerCase() : 'http://localhost:3000';
}
