import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { getStorefrontSiteUrl, loadStorefrontConfig } from './config.js';
import { catalogFormSchema } from './catalog.js';

describe('storefront deployment configuration', () => {
  it('validates without requiring DATABASE_URL or REDIS_URL', () => {
    expect(loadStorefrontConfig({})).toMatchObject({ LOG_LEVEL: 'info' });
    expect(getStorefrontSiteUrl(loadStorefrontConfig({}))).toBe(
      'http://localhost:3000',
    );
  });
  it.each([
    { NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co' },
    { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example' },
  ])('requires paired Supabase URL and key', (env) => {
    expect(() => loadStorefrontConfig(env)).toThrow(ZodError);
  });
  it.each([
    'not-a-url',
    'ftp://project.supabase.co',
    'javascript:alert(1)',
    'https://user:pass@project.supabase.co',
  ])(
    'rejects malformed or unsafe URL %s with a validation error',
    (url: string) => {
      expect(() =>
        loadStorefrontConfig({
          NEXT_PUBLIC_SUPABASE_URL: url,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public',
        }),
      ).toThrow(ZodError);
    },
  );
  it('prefers explicit SITE_URL then production host then deployment host', () => {
    const env = {
      SITE_URL: 'https://mary.example',
      VERCEL_PROJECT_PRODUCTION_URL: 'production.vercel.app',
      VERCEL_URL: 'preview.vercel.app',
    };
    expect(getStorefrontSiteUrl(loadStorefrontConfig(env))).toBe(
      'https://mary.example',
    );
    expect(
      getStorefrontSiteUrl(loadStorefrontConfig({ ...env, SITE_URL: '' })),
    ).toBe('https://production.vercel.app');
    expect(
      getStorefrontSiteUrl(
        loadStorefrontConfig({ VERCEL_URL: 'Preview.Vercel.App' }),
      ),
    ).toBe('https://preview.vercel.app');
  });
  it.each([
    'https://preview.vercel.app',
    'preview.vercel.app/path',
    'user@preview.vercel.app',
    'preview.vercel.app:443',
    '-invalid.vercel.app',
    'preview.vercel.app?foo=1',
    'preview.vercel.app#fragment',
  ])('rejects unsafe deployment hostname %s', (host: string) => {
    expect(() => loadStorefrontConfig({ VERCEL_URL: host })).toThrow(ZodError);
    expect(() =>
      loadStorefrontConfig({ VERCEL_PROJECT_PRODUCTION_URL: host }),
    ).toThrow(ZodError);
  });
});

describe('catalog PostgreSQL integer boundaries', () => {
  const base = {
    slug: 'curso',
    title: 'Curso',
    kind: 'course',
    platform: 'hotmart',
    confirmedAt: '2026-10-22T12:00:00Z',
  };
  it('accepts inclusive integer boundaries', () => {
    expect(
      catalogFormSchema.safeParse({
        ...base,
        priceCents: 2147483647,
        sortOrder: -2147483648,
      }).success,
    ).toBe(true);
    expect(
      catalogFormSchema.safeParse({
        ...base,
        priceCents: 0,
        sortOrder: 2147483647,
      }).success,
    ).toBe(true);
  });
  it.each([
    { priceCents: 2147483648 },
    { priceCents: -1 },
    { priceCents: 1.5 },
    { sortOrder: 2147483648 },
    { sortOrder: -2147483649 },
    { sortOrder: 0.5 },
  ])('rejects out of range or fractional integers', (fields) => {
    expect(catalogFormSchema.safeParse({ ...base, ...fields }).success).toBe(
      false,
    );
  });
});
