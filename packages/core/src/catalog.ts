import { z } from 'zod';

export const catalogPlatforms = [
  'hotmart',
  'shopee',
  'amazon',
  'mercadolivre',
] as const;
export const catalogLevels = [
  'iniciante',
  'intermediario',
  'avancado',
] as const;
export type CatalogPlatform = (typeof catalogPlatforms)[number];
const affiliateHosts: Record<CatalogPlatform, readonly string[]> = {
  hotmart: ['hotmart.com', 'go.hotmart.com', 'pay.hotmart.com'],
  shopee: ['shopee.com.br', 's.shopee.com.br', 'shope.ee'],
  amazon: ['amazon.com.br', 'amzn.to'],
  mercadolivre: ['mercadolivre.com.br', 'meli.la'],
};
export function isAllowedAffiliateUrl(
  value: string,
  platform: CatalogPlatform,
): boolean {
  try {
    const url = new URL(value);
    return (
      value === value.trim() &&
      !/\s/.test(value) &&
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      value.match(/^https:\/\/([^/?#]+)/i)?.[1]?.toLowerCase() ===
        url.hostname.toLowerCase() &&
      affiliateHosts[platform].includes(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}
const nullableText = z.string().trim().min(1).nullable().default(null);
const imageSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (
      /^\/images\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) &&
      !value.includes('..')
    )
      return true;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      return false;
    }
  }, 'Use imagem local ou HTTPS')
  .nullable()
  .default(null);
const fields = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(5000).default(''),
  kind: z.enum(['course', 'product']),
  platform: z.enum(catalogPlatforms),
  category: z.string().trim().min(1).max(120).default('Geral'),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  imageUrl: imageSchema,
  affiliateUrl: nullableText,
  priceCents: z
    .number()
    .int()
    .nonnegative()
    .max(2147483647)
    .nullable()
    .default(null),
  currency: z.literal('BRL').default('BRL'),
  badge: nullableText,
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(-2147483648).max(2147483647).default(0),
  published: z.boolean().default(false),
  courseLevel: z.enum(catalogLevels).nullable().default(null),
  confirmedAt: z.string().datetime({ offset: true }).nullable().default(null),
});
function validate(
  value: z.infer<typeof fields>,
  context: z.RefinementCtx,
): void {
  if (
    value.affiliateUrl !== null &&
    !isAllowedAffiliateUrl(value.affiliateUrl, value.platform)
  )
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['affiliateUrl'],
      message: 'Link HTTPS incompatível com a plataforma',
    });
  if (
    value.published &&
    (value.affiliateUrl === null ||
      !['hotmart', 'shopee'].includes(value.platform))
  )
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['published'],
      message: 'Publicação exige link válido da Hotmart ou Shopee',
    });
  if (value.priceCents !== null && value.confirmedAt === null)
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmedAt'],
      message: 'Informe a confirmação do preço',
    });
  if (value.kind === 'product' && value.courseLevel !== null)
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['courseLevel'],
      message: 'Nível se aplica somente a cursos',
    });
}
export const catalogFormSchema = fields.superRefine(validate);
export const catalogItemSchema = fields
  .extend({
    id: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .superRefine(validate);
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type CatalogForm = z.infer<typeof catalogFormSchema>;
export const PRICE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export function getDisplayPriceCents(
  item: Pick<CatalogItem, 'priceCents' | 'confirmedAt'>,
  now: number = Date.now(),
): number | null {
  if (
    item.priceCents === null ||
    item.confirmedAt === null ||
    !Number.isSafeInteger(item.priceCents) ||
    item.priceCents < 0 ||
    !Number.isFinite(now)
  )
    return null;
  const date = Date.parse(item.confirmedAt),
    age = now - date;
  return Number.isFinite(date) && age >= 0 && age <= PRICE_MAX_AGE_MS
    ? item.priceCents
    : null;
}
export interface CatalogFilters {
  search?: string;
  kind?: 'all' | 'course' | 'product';
  category?: string;
  platform?: 'all' | CatalogPlatform;
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest';
}
function normalized(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
export function filterCatalogItems(
  items: readonly CatalogItem[],
  filters: CatalogFilters = {},
  now: number = Date.now(),
): CatalogItem[] {
  const search = normalized(filters.search?.trim() ?? '');
  const result = items.filter(
    (item) =>
      (!filters.kind || filters.kind === 'all' || item.kind === filters.kind) &&
      (!filters.category ||
        filters.category === 'all' ||
        item.category === filters.category) &&
      (!filters.platform ||
        filters.platform === 'all' ||
        item.platform === filters.platform) &&
      (!search ||
        normalized(
          [item.title, item.description, item.category, ...item.tags].join(' '),
        ).includes(search)),
  );
  return result.sort((a, b) => {
    if (filters.sort === 'newest')
      return (
        Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
        a.id.localeCompare(b.id)
      );
    if (filters.sort === 'price-asc' || filters.sort === 'price-desc') {
      const ap = getDisplayPriceCents(a, now),
        bp = getDisplayPriceCents(b, now);
      if (ap === null && bp !== null) return 1;
      if (ap !== null && bp === null) return -1;
      if (ap !== null && bp !== null && ap !== bp)
        return filters.sort === 'price-asc' ? ap - bp : bp - ap;
    }
    return (
      Number(b.featured) - Number(a.featured) ||
      a.sortOrder - b.sortOrder ||
      a.id.localeCompare(b.id)
    );
  });
}
