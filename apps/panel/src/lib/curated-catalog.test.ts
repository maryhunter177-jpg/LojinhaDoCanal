import { describe, expect, it } from 'vitest';
import { curatedCatalog } from './curated-catalog';
import { isAllowedAffiliateUrl, getDisplayPriceCents } from '@ofertas/core';

describe('curadoria de afiliados fornecida pela Mary', () => {
  it('preserva os destinos iniciais e valida toda a curadoria', () => {
    expect(
      curatedCatalog.find((item) => item.kind === 'course')?.affiliateUrl,
    ).toBe('https://go.hotmart.com/S108145758O');
    expect(
      curatedCatalog.find((item) => item.kind === 'product')?.affiliateUrl,
    ).toBe('https://s.shopee.com.br/Lo7DC7AJu');
    expect(new Set(curatedCatalog.map((item) => item.slug)).size).toBe(
      curatedCatalog.length,
    );
    for (const item of curatedCatalog) {
      expect(item.published).toBe(true);
      expect(
        isAllowedAffiliateUrl(item.affiliateUrl ?? '', item.platform),
      ).toBe(true);
      expect(getDisplayPriceCents(item)).toBeNull();
    }
  });
});
