import { describe, expect, it } from 'vitest';
import {
  catalogFormSchema,
  catalogItemSchema,
  filterCatalogItems,
  getDisplayPriceCents,
  isAllowedAffiliateUrl,
  PRICE_MAX_AGE_MS,
} from './catalog.js';
import { loadStorefrontConfig } from './config.js';

const now = Date.parse('2026-10-22T12:00:00Z');
const base = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'curso-html',
  title: 'Introdução ao HTML',
  kind: 'course',
  platform: 'hotmart',
  createdAt: '2026-10-22T12:00:00Z',
  updatedAt: '2026-10-22T12:00:00Z',
};
const item = catalogItemSchema.parse(base);
describe('catalog validation', () => {
  it('draft defaults contain no fabricated commercial data', () => {
    expect(item).toMatchObject({
      published: false,
      priceCents: null,
      affiliateUrl: null,
      confirmedAt: null,
    });
    expect(
      catalogFormSchema.safeParse({ ...base, published: true }).success,
    ).toBe(false);
    expect(
      catalogFormSchema.safeParse({
        ...base,
        published: true,
        affiliateUrl: 'https://go.hotmart.com/ABC',
      }).success,
    ).toBe(true);
  });
  it.each([
    'https://go.hotmart.com.evil.test/path',
    'http://go.hotmart.com/a',
    'https://go.hotmart.com@evil.test/a',
    'https://user:pass@go.hotmart.com/a',
    'https://evil.test/?next=https://go.hotmart.com',
    'javascript:alert(1)',
    'https://go.hotmart.com:443/a',
    'https://go.hotmart.com:8443/a',
  ])('rejects unsafe destination %s', (url: string) =>
    expect(isAllowedAffiliateUrl(url, 'hotmart')).toBe(false),
  );
  it('checks platform as well as hostname', () => {
    expect(isAllowedAffiliateUrl('https://shope.ee/abc', 'shopee')).toBe(true);
    expect(isAllowedAffiliateUrl('https://shope.ee/abc', 'hotmart')).toBe(
      false,
    );
    expect(
      catalogFormSchema.safeParse({
        ...base,
        platform: 'amazon',
        affiliateUrl: 'https://amzn.to/test',
        published: true,
      }).success,
    ).toBe(false);
  });
  it('enables Mercado Livre while Amazon remains draft-only', () => {
    expect(
      catalogFormSchema.safeParse({
        ...base,
        kind: 'product',
        platform: 'mercadolivre',
        affiliateUrl: 'https://meli.la/33pSvwN',
        published: true,
      }).success,
    ).toBe(true);
    for (const affiliateUrl of [
      'http://meli.la/33pSvwN',
      'https://meli.la.evil.test/33pSvwN',
      'https://meli.la@evil.test/33pSvwN',
      'https://meli.la:443/33pSvwN',
      'https://amzn.to/example',
    ]) {
      expect(
        catalogFormSchema.safeParse({
          ...base,
          kind: 'product',
          platform: 'mercadolivre',
          affiliateUrl,
          published: true,
        }).success,
      ).toBe(false);
    }
    expect(
      catalogFormSchema.safeParse({
        ...base,
        kind: 'product',
        platform: 'amazon',
        affiliateUrl: 'https://amzn.to/example',
        published: true,
      }).success,
    ).toBe(false);
  });
  it('requires confirmation for a nonnegative integer price', () => {
    expect(
      catalogFormSchema.safeParse({ ...base, priceCents: 100 }).success,
    ).toBe(false);
    expect(
      catalogFormSchema.safeParse({
        ...base,
        priceCents: -1,
        confirmedAt: base.createdAt,
      }).success,
    ).toBe(false);
    expect(
      catalogFormSchema.safeParse({
        ...base,
        priceCents: 1.5,
        confirmedAt: base.createdAt,
      }).success,
    ).toBe(false);
  });
});
describe('display price freshness', () => {
  it('shows only confirmed nonfuture prices within 24 hours', () => {
    expect(
      getDisplayPriceCents(
        { priceCents: 100, confirmedAt: new Date(now).toISOString() },
        now,
      ),
    ).toBe(100);
    expect(
      getDisplayPriceCents(
        {
          priceCents: 0,
          confirmedAt: new Date(now - PRICE_MAX_AGE_MS).toISOString(),
        },
        now,
      ),
    ).toBe(0);
    for (const confirmedAt of [
      null,
      'invalid',
      new Date(now + 1).toISOString(),
      new Date(now - PRICE_MAX_AGE_MS - 1).toISOString(),
    ])
      expect(
        getDisplayPriceCents({ priceCents: 100, confirmedAt }, now),
      ).toBeNull();
  });
});
describe('catalog filters', () => {
  const second = catalogItemSchema.parse({
    ...base,
    id: '00000000-0000-4000-8000-000000000002',
    slug: 'mouse',
    title: 'Mouse',
    kind: 'product',
    platform: 'shopee',
    category: 'Setup',
    priceCents: 5000,
    confirmedAt: base.createdAt,
  });
  it('search ignores case and accents and combines filters', () => {
    expect(
      filterCatalogItems([item, second], {
        search: 'INTRODUCAO',
        kind: 'course',
        platform: 'hotmart',
      }),
    ).toEqual([item]);
    expect(filterCatalogItems([item, second], { category: 'Setup' })).toEqual([
      second,
    ]);
    expect(
      filterCatalogItems([item, second], { search: 'Mouse', kind: 'course' }),
    ).toEqual([]);
  });
  it('sorts unknown prices last in both directions without mutating input', () => {
    const input = [item, second];
    expect(filterCatalogItems(input, { sort: 'price-asc' }, now)).toEqual([
      second,
      item,
    ]);
    expect(filterCatalogItems(input, { sort: 'price-desc' }, now)).toEqual([
      second,
      item,
    ]);
    expect(input).toEqual([item, second]);
  });
});
describe('storefront environment', () => {
  it('works without database or Redis and pairs Supabase credentials', () => {
    expect(loadStorefrontConfig({}).NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(() =>
      loadStorefrontConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      }),
    ).toThrow();
    expect(() =>
      loadStorefrontConfig({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public' }),
    ).toThrow();
    expect(
      loadStorefrontConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public',
      }).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ).toBe('public');
  });
});
