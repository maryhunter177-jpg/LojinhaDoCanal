import type { CatalogItem } from './catalog.ts';
export type StorefrontSection = 'home' | 'courses' | 'shopee' | 'mercadolivre';
export function selectStorefrontItems(
  items: readonly CatalogItem[],
  section: StorefrontSection,
): CatalogItem[] {
  return items.filter(
    (item) =>
      item.published &&
      (section === 'shopee' || section === 'mercadolivre'
        ? item.kind === 'product' && item.platform === section
        : item.kind === 'course' && item.platform === 'hotmart'),
  );
}
