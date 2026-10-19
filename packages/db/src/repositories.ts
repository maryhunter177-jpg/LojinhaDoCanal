import { and, asc, eq, sql } from 'drizzle-orm';
import type { Database } from './client.js';
import {
  products,
  priceHistory,
  offers,
  channels,
  posts,
  shortLinks,
  clicks,
  commissions,
  settings,
} from './schema.js';

function requireRow<T>(row: T | undefined): T {
  if (row === undefined) throw new Error('Database mutation returned no row');
  return row;
}

// Wrap JSON scalars so pg handles JSON decoding once, without Drizzle parsing strings again.
const settingsProjection = {
  key: settings.key,
  wrapped: sql<{
    value: unknown;
  }>`jsonb_build_object('value', ${settings.value})`,
};

function unwrapSetting(
  row: { key: string; wrapped: { value: unknown } } | undefined,
) {
  return row === undefined
    ? undefined
    : { key: row.key, value: row.wrapped.value };
}
export function createRepositories(db: Database) {
  return {
    products: {
      async create(value: typeof products.$inferInsert) {
        const [row] = await db.insert(products).values(value).returning();
        return requireRow(row);
      },
      async findById(id: string) {
        const [row] = await db
          .select()
          .from(products)
          .where(eq(products.id, id));
        return row;
      },
      async list() {
        return db.select().from(products).orderBy(asc(products.id));
      },
      async update(
        id: string,
        value: Partial<Omit<typeof products.$inferInsert, 'id'>>,
      ) {
        const [row] = await db
          .update(products)
          .set(value)
          .where(eq(products.id, id))
          .returning();
        return row;
      },
      async delete(id: string) {
        const [row] = await db
          .delete(products)
          .where(eq(products.id, id))
          .returning();
        return row;
      },
      async findByExternalId(
        marketplace: typeof products.$inferSelect.marketplace,
        externalId: string,
      ) {
        const [row] = await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.marketplace, marketplace),
              eq(products.externalId, externalId),
            ),
          );
        return row;
      },
      async upsert(value: typeof products.$inferInsert) {
        const [row] = await db
          .insert(products)
          .values(value)
          .onConflictDoUpdate({
            target: [products.marketplace, products.externalId],
            set: {
              title: value.title,
              urlCanonical: value.urlCanonical,
              imageUrl: value.imageUrl,
              category: value.category,
              sellerName: value.sellerName,
              sellerRating: value.sellerRating,
            },
          })
          .returning();
        return requireRow(row);
      },
    },
    priceHistory: {
      async create(value: typeof priceHistory.$inferInsert) {
        const [row] = await db.insert(priceHistory).values(value).returning();
        return requireRow(row);
      },
      async findById(id: string) {
        const [row] = await db
          .select()
          .from(priceHistory)
          .where(eq(priceHistory.id, id));
        return row;
      },
      async list() {
        return db.select().from(priceHistory).orderBy(asc(priceHistory.id));
      },
      async update(
        id: string,
        value: Partial<Omit<typeof priceHistory.$inferInsert, 'id'>>,
      ) {
        const [row] = await db
          .update(priceHistory)
          .set(value)
          .where(eq(priceHistory.id, id))
          .returning();
        return row;
      },
      async delete(id: string) {
        const [row] = await db
          .delete(priceHistory)
          .where(eq(priceHistory.id, id))
          .returning();
        return row;
      },
      async listByProduct(productId: string) {
        return db
          .select()
          .from(priceHistory)
          .where(eq(priceHistory.productId, productId))
          .orderBy(asc(priceHistory.capturedAt), asc(priceHistory.id));
      },
    },
    offers: {
      async create(value: typeof offers.$inferInsert) {
        const [row] = await db.insert(offers).values(value).returning();
        return requireRow(row);
      },
      async findById(id: string) {
        const [row] = await db.select().from(offers).where(eq(offers.id, id));
        return row;
      },
      async list() {
        return db.select().from(offers).orderBy(asc(offers.id));
      },
      async update(
        id: string,
        value: Partial<Omit<typeof offers.$inferInsert, 'id'>>,
      ) {
        const [row] = await db
          .update(offers)
          .set(value)
          .where(eq(offers.id, id))
          .returning();
        return row;
      },
      async delete(id: string) {
        const [row] = await db
          .delete(offers)
          .where(eq(offers.id, id))
          .returning();
        return row;
      },
      async listByStatus(status: typeof offers.$inferSelect.status) {
        return db
          .select()
          .from(offers)
          .where(eq(offers.status, status))
          .orderBy(asc(offers.createdAt), asc(offers.id));
      },
    },
    channels: {
      async create(value: typeof channels.$inferInsert) {
        const [row] = await db.insert(channels).values(value).returning();
        return requireRow(row);
      },
      async findById(id: string) {
        const [row] = await db
          .select()
          .from(channels)
          .where(eq(channels.id, id));
        return row;
      },
      async list() {
        return db.select().from(channels).orderBy(asc(channels.id));
      },
      async update(
        id: string,
        value: Partial<Omit<typeof channels.$inferInsert, 'id'>>,
      ) {
        const [row] = await db
          .update(channels)
          .set(value)
          .where(eq(channels.id, id))
          .returning();
        return row;
      },
      async delete(id: string) {
        const [row] = await db
          .delete(channels)
          .where(eq(channels.id, id))
          .returning();
        return row;
      },
    },
    posts: {
      async create(value: typeof posts.$inferInsert) {
        const [row] = await db.insert(posts).values(value).returning();
        return requireRow(row);
      },
      async findById(id: string) {
        const [row] = await db.select().from(posts).where(eq(posts.id, id));
        return row;
      },
      async list() {
        return db.select().from(posts).orderBy(asc(posts.id));
      },
      async update(
        id: string,
        value: Partial<Omit<typeof posts.$inferInsert, 'id'>>,
      ) {
        const [row] = await db
          .update(posts)
          .set(value)
          .where(eq(posts.id, id))
          .returning();
        return row;
      },
      async delete(id: string) {
        const [row] = await db
          .delete(posts)
          .where(eq(posts.id, id))
          .returning();
        return row;
      },
      async listByChannel(channelId: string) {
        return db
          .select()
          .from(posts)
          .where(eq(posts.channelId, channelId))
          .orderBy(asc(posts.scheduledAt), asc(posts.id));
      },
    },
    shortLinks: {
      async create(value: typeof shortLinks.$inferInsert) {
        const [row] = await db.insert(shortLinks).values(value).returning();
        return requireRow(row);
      },
      async findById(id: string) {
        const [row] = await db
          .select()
          .from(shortLinks)
          .where(eq(shortLinks.id, id));
        return row;
      },
      async list() {
        return db.select().from(shortLinks).orderBy(asc(shortLinks.id));
      },
      async update(
        id: string,
        value: Partial<Omit<typeof shortLinks.$inferInsert, 'id'>>,
      ) {
        const [row] = await db
          .update(shortLinks)
          .set(value)
          .where(eq(shortLinks.id, id))
          .returning();
        return row;
      },
      async delete(id: string) {
        const [row] = await db
          .delete(shortLinks)
          .where(eq(shortLinks.id, id))
          .returning();
        return row;
      },
      async findByCode(code: string) {
        const [row] = await db
          .select()
          .from(shortLinks)
          .where(eq(shortLinks.code, code));
        return row;
      },
    },
    clicks: {
      async create(value: typeof clicks.$inferInsert) {
        const [row] = await db.insert(clicks).values(value).returning();
        return requireRow(row);
      },
      async findById(id: string) {
        const [row] = await db.select().from(clicks).where(eq(clicks.id, id));
        return row;
      },
      async list() {
        return db.select().from(clicks).orderBy(asc(clicks.id));
      },
      async update(
        id: string,
        value: Partial<Omit<typeof clicks.$inferInsert, 'id'>>,
      ) {
        const [row] = await db
          .update(clicks)
          .set(value)
          .where(eq(clicks.id, id))
          .returning();
        return row;
      },
      async delete(id: string) {
        const [row] = await db
          .delete(clicks)
          .where(eq(clicks.id, id))
          .returning();
        return row;
      },
      async listByShortLink(shortLinkId: string) {
        return db
          .select()
          .from(clicks)
          .where(eq(clicks.shortLinkId, shortLinkId))
          .orderBy(asc(clicks.clickedAt), asc(clicks.id));
      },
    },
    commissions: {
      async create(value: typeof commissions.$inferInsert) {
        const [row] = await db.insert(commissions).values(value).returning();
        return requireRow(row);
      },
      async findById(id: string) {
        const [row] = await db
          .select()
          .from(commissions)
          .where(eq(commissions.id, id));
        return row;
      },
      async list() {
        return db.select().from(commissions).orderBy(asc(commissions.id));
      },
      async update(
        id: string,
        value: Partial<Omit<typeof commissions.$inferInsert, 'id'>>,
      ) {
        const [row] = await db
          .update(commissions)
          .set(value)
          .where(eq(commissions.id, id))
          .returning();
        return row;
      },
      async delete(id: string) {
        const [row] = await db
          .delete(commissions)
          .where(eq(commissions.id, id))
          .returning();
        return row;
      },
      async findByExternalOrderId(
        marketplace: typeof commissions.$inferSelect.marketplace,
        externalOrderId: string,
      ) {
        return db
          .select()
          .from(commissions)
          .where(
            and(
              eq(commissions.marketplace, marketplace),
              eq(commissions.externalOrderId, externalOrderId),
            ),
          );
      },
    },
    settings: {
      async get(key: string) {
        const [row] = await db
          .select(settingsProjection)
          .from(settings)
          .where(eq(settings.key, key));
        return unwrapSetting(row);
      },
      async set(key: string, value: unknown) {
        const [row] = await db
          .insert(settings)
          .values({ key, value })
          .onConflictDoUpdate({ target: settings.key, set: { value } })
          .returning(settingsProjection);
        return requireRow(unwrapSetting(row));
      },
      async delete(key: string) {
        const [row] = await db
          .delete(settings)
          .where(eq(settings.key, key))
          .returning(settingsProjection);
        return unwrapSetting(row);
      },
      async isPublishingPaused() {
        const [row] = await db
          .select({
            paused: sql<boolean>`${settings.value} IS DISTINCT FROM 'false'::jsonb`,
          })
          .from(settings)
          .where(eq(settings.key, 'publishing_paused'));
        return row?.paused !== false;
      },
      async setPublishingPaused(paused: boolean) {
        const [row] = await db
          .insert(settings)
          .values({ key: 'publishing_paused', value: paused })
          .onConflictDoUpdate({ target: settings.key, set: { value: paused } })
          .returning(settingsProjection);
        return requireRow(unwrapSetting(row));
      },
    },
  };
}
export type Repositories = ReturnType<typeof createRepositories>;
