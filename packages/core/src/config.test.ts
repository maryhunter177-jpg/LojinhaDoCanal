import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { loadConfig, loadDatabaseConfig } from './config.js';
const env = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/offers',
  REDIS_URL: 'redis://localhost:6379',
  SHORTENER_BASE_URL: 'http://localhost:3001',
};
describe('configuration', () => {
  it('defaults to dry run without publishing credentials', () => {
    expect(loadConfig(env).DRY_RUN).toBe(true);
  });
  it('parses false explicitly', () => {
    expect(
      loadConfig({
        ...env,
        DRY_RUN: 'false',
        ADMIN_PASSWORD_HASH: 'a'.repeat(32),
        SESSION_SECRET: 'b'.repeat(32),
        CLICK_HASH_SALT: 'c'.repeat(32),
      }).DRY_RUN,
    ).toBe(false);
  });
  it('rejects invalid booleans and live mode without secrets', () => {
    expect(() => loadConfig({ ...env, DRY_RUN: 'yes' })).toThrow(ZodError);
    expect(() => loadConfig({ ...env, DRY_RUN: 'false' })).toThrow(ZodError);
  });
  it('validates database without publishing credentials', () => {
    expect(
      loadDatabaseConfig({ DATABASE_URL: env.DATABASE_URL }).DATABASE_URL,
    ).toBe(env.DATABASE_URL);
    expect(() =>
      loadDatabaseConfig({ DATABASE_URL: 'https://example.com' }),
    ).toThrow(ZodError);
  });
  it('rejects non HTTP short links and invalid timezones', () => {
    expect(() =>
      loadConfig({ ...env, SHORTENER_BASE_URL: 'javascript:alert(1)' }),
    ).toThrow(ZodError);
    expect(() => loadConfig({ ...env, TIMEZONE: 'bad/zone' })).toThrow(
      ZodError,
    );
  });
  it('normalizes blank optional credentials and test connection', () => {
    const config = loadConfig({
      ...env,
      TELEGRAM_BOT_TOKEN: '',
      TELEGRAM_CHAT_ID: '',
      DISCORD_WEBHOOK_URL: '',
      TEST_DATABASE_URL: '',
    });
    expect(config.TELEGRAM_BOT_TOKEN).toBeUndefined();
    expect(config.TELEGRAM_CHAT_ID).toBeUndefined();
    expect(config.DISCORD_WEBHOOK_URL).toBeUndefined();
    expect(config.TEST_DATABASE_URL).toBeUndefined();
  });
  it('validates optional integration database separately', () => {
    expect(
      loadDatabaseConfig({
        DATABASE_URL: env.DATABASE_URL,
        TEST_DATABASE_URL: 'postgres://localhost/offers_test',
      }).TEST_DATABASE_URL,
    ).toBe('postgres://localhost/offers_test');
    expect(() =>
      loadDatabaseConfig({
        DATABASE_URL: env.DATABASE_URL,
        TEST_DATABASE_URL: 'redis://localhost:6379',
      }),
    ).toThrow(ZodError);
    expect(() =>
      loadDatabaseConfig({ TEST_DATABASE_URL: env.DATABASE_URL }),
    ).toThrow(ZodError);
  });
  it('checks Redis and webhook protocols', () => {
    expect(
      loadConfig({
        ...env,
        REDIS_URL: 'rediss://localhost:6379',
        DISCORD_WEBHOOK_URL: 'https://example.com/webhook',
      }).REDIS_URL,
    ).toBe('rediss://localhost:6379');
    expect(() =>
      loadConfig({ ...env, REDIS_URL: 'https://example.com' }),
    ).toThrow(ZodError);
    expect(() =>
      loadConfig({ ...env, DISCORD_WEBHOOK_URL: 'file:///webhook' }),
    ).toThrow(ZodError);
  });
  it('rejects ports outside TCP range and fractional values', () => {
    for (const API_PORT of ['0', '-1', '65536', '1.5', '', 'abc'])
      expect(() => loadConfig({ ...env, API_PORT })).toThrow(ZodError);
    expect(loadConfig({ ...env, API_PORT: '65535' }).API_PORT).toBe(65535);
  });
  it('requires every live secret to have at least 32 characters', () => {
    const live = {
      ...env,
      DRY_RUN: 'false',
      ADMIN_PASSWORD_HASH: 'a'.repeat(32),
      SESSION_SECRET: 'b'.repeat(32),
      CLICK_HASH_SALT: 'c'.repeat(32),
    };
    for (const key of [
      'ADMIN_PASSWORD_HASH',
      'SESSION_SECRET',
      'CLICK_HASH_SALT',
    ] as const) {
      expect(() => loadConfig({ ...live, [key]: 'x'.repeat(31) })).toThrow(
        ZodError,
      );
      expect(() => loadConfig({ ...live, [key]: '' })).toThrow(ZodError);
    }
  });
  it('rejects unknown log levels and ambiguous dry run values', () => {
    expect(() =>
      loadDatabaseConfig({
        DATABASE_URL: env.DATABASE_URL,
        LOG_LEVEL: 'verbose',
      }),
    ).toThrow(ZodError);
    for (const DRY_RUN of ['FALSE', '0', '1', ' true ', ''])
      expect(() => loadConfig({ ...env, DRY_RUN })).toThrow(ZodError);
  });
  it('returns ZodError for malformed URLs rather than raw URL exceptions', () => {
    for (const value of ['not a URL', 'http://[', '://', '']) {
      for (const key of [
        'DATABASE_URL',
        'REDIS_URL',
        'SHORTENER_BASE_URL',
      ] as const)
        expect(() => loadConfig({ ...env, [key]: value })).toThrow(ZodError);
      if (value !== '') {
        expect(() =>
          loadConfig({ ...env, DISCORD_WEBHOOK_URL: value }),
        ).toThrow(ZodError);
        expect(() =>
          loadDatabaseConfig({
            DATABASE_URL: env.DATABASE_URL,
            TEST_DATABASE_URL: value,
          }),
        ).toThrow(ZodError);
      }
    }
  });
});
