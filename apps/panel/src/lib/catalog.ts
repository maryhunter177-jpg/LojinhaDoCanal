import 'server-only';
import {
  catalogItemSchema,
  loadStorefrontConfig,
  type CatalogItem,
} from '@ofertas/core';
import pino from 'pino';
import { demoCatalog } from './demo-catalog';
import { createServerSupabaseClient } from './supabase/server';

export interface CatalogState {
  source: 'demo' | 'supabase' | 'unavailable';
  items: CatalogItem[];
}

export function mapCatalogRow(input: unknown): CatalogItem {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    throw new Error('Invalid catalog row');
  const row = input as Record<string, unknown>;
  return catalogItemSchema.parse({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    kind: row.kind,
    platform: row.platform,
    category: row.category,
    tags: row.tags,
    imageUrl: row.image_url,
    affiliateUrl: row.affiliate_url,
    priceCents: row.price_cents,
    currency: row.currency,
    badge: row.badge,
    featured: row.featured,
    sortOrder: row.sort_order,
    published: row.published,
    courseLevel: row.course_level,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
export async function getCatalogState(): Promise<CatalogState> {
  let logger = pino();
  try {
    const config = loadStorefrontConfig();
    logger = pino({ level: config.LOG_LEVEL });
    if (
      !config.NEXT_PUBLIC_SUPABASE_URL &&
      !config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return { source: 'demo', items: demoCatalog };
    }
    const client = await createServerSupabaseClient();
    if (!client) throw new Error('Supabase client unavailable');
    const { data, error } = await client
      .from('catalog_items')
      .select(
        'id,slug,title,description,kind,platform,category,tags,image_url,affiliate_url,price_cents,currency,badge,featured,sort_order,published,course_level,confirmed_at,created_at,updated_at',
      )
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw new Error('Catalog query failed');
    const items = (data ?? []).map((row: unknown) => mapCatalogRow(row));
    return { source: 'supabase', items };
  } catch (error: unknown) {
    logger.error(
      {
        operation: 'catalog.read',
        errorType: error instanceof Error ? error.name : typeof error,
      },
      'Catalog unavailable',
    );
    return { source: 'unavailable', items: [] };
  }
}
