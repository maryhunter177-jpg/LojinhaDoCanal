import { getCatalogState } from '@/lib/catalog';
import { selectStorefrontItems, type StorefrontSection } from '@ofertas/core';
import { Storefront } from './storefront';
export async function StorefrontPage({
  section,
}: {
  section: StorefrontSection;
}) {
  const catalog = await getCatalogState();
  return (
    <Storefront
      items={selectStorefrontItems(catalog.items, section)}
      source={catalog.source}
      section={section}
    />
  );
}
