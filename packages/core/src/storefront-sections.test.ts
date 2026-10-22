import { describe, expect, it } from 'vitest';
import { catalogItemSchema } from './catalog.ts';
import { selectStorefrontItems } from './storefront-sections.ts';

const base = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'fixture',
  title: 'Fixture',
  createdAt: '2026-10-22T12:00:00Z',
  updatedAt: '2026-10-22T12:00:00Z',
};
const shopee = catalogItemSchema.parse({
  ...base,
  slug: 'webcam',
  kind: 'product',
  platform: 'shopee',
  published: true,
  affiliateUrl: 'https://s.shopee.com.br/fixture',
});
const meli = catalogItemSchema.parse({
  ...base,
  slug: 'controle',
  kind: 'product',
  platform: 'mercadolivre',
  published: true,
  affiliateUrl: 'https://meli.la/fixture',
});
const course = catalogItemSchema.parse({
  ...base,
  slug: 'curso',
  kind: 'course',
  platform: 'hotmart',
  published: true,
  affiliateUrl: 'https://go.hotmart.com/fixture',
});
const draft = catalogItemSchema.parse({
  ...base,
  slug: 'draft',
  kind: 'product',
  platform: 'shopee',
  published: false,
});
const amazon = catalogItemSchema.parse({
  ...base,
  slug: 'amazon',
  kind: 'product',
  platform: 'amazon',
  published: false,
});
const items = [meli, shopee, course, draft, amazon];
describe('isolamento dos catálogos públicos', () => {
  it('Shopee e Mercado Livre nunca misturam produtos ou incluem cursos e rascunhos', () => {
    expect(selectStorefrontItems(items, 'shopee')).toEqual([shopee]);
    expect(selectStorefrontItems(items, 'mercadolivre')).toEqual([meli]);
  });
  it('início e cursos preservam apenas a seleção de cursos publicados', () => {
    expect(selectStorefrontItems(items, 'home')).toEqual([course]);
    expect(selectStorefrontItems(items, 'courses')).toEqual([course]);
    expect(items).toEqual([meli, shopee, course, draft, amazon]);
  });
});
