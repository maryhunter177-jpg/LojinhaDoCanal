import { describe, expect, it } from 'vitest';
import { curatedCatalog } from './curated-catalog';
import { mercadoLivreProducts } from './mercadolivre-links';

describe('Mercado Livre aprovado e Amazon pendente', () => {
  it('preserva os dez pares de códigos e destinos sem dados comerciais inventados', () => {
    expect(mercadoLivreProducts).toHaveLength(10);
    expect(
      new Set(mercadoLivreProducts.map((item) => item.searchCode)).size,
    ).toBe(10);
    expect(
      new Set(mercadoLivreProducts.map((item) => item.affiliateUrl)).size,
    ).toBe(10);
    for (const [index, product] of mercadoLivreProducts.entries()) {
      const item = curatedCatalog.find((entry) => entry.slug === product.slug);
      expect(item).toMatchObject({
        platform: 'mercadolivre',
        kind: 'product',
        published: true,
        affiliateUrl: product.affiliateUrl,
        priceCents: null,
        confirmedAt: null,
      });
      expect(item?.tags).toContain(product.searchCode);
      expect(item?.imageUrl).toBe(
        `/images/mercadolivre-product-${index + 1}.png`,
      );
    }
    expect(
      curatedCatalog.some(
        (item) => item.platform === 'amazon' && item.published,
      ),
    ).toBe(false);
  });
});
