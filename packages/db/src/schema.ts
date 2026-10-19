import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
export const marketplaceEnum = pgEnum('marketplace', [
  'shopee',
  'mercadolivre',
  'amazon',
]);
export const offerStatusEnum = pgEnum('offer_status', [
  'candidate',
  'approved',
  'rejected',
  'published',
  'expired',
]);
export const channelTypeEnum = pgEnum('channel_type', [
  'telegram',
  'discord',
  'whatsapp_export',
]);
export const postStatusEnum = pgEnum('post_status', [
  'queued',
  'sent',
  'failed',
  'skipped',
]);
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    marketplace: marketplaceEnum('marketplace').notNull(),
    externalId: text('external_id').notNull(),
    title: text('title').notNull(),
    urlCanonical: text('url_canonical').notNull(),
    imageUrl: text('image_url'),
    category: text('category'),
    sellerName: text('seller_name'),
    sellerRating: numeric('seller_rating', { precision: 3, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('products_marketplace_external_id_unique').on(
      t.marketplace,
      t.externalId,
    ),
    check('products_rating_range', sql`${t.sellerRating} BETWEEN 0 AND 5`),
  ],
);
export const priceHistory = pgTable(
  'price_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    priceCents: integer('price_cents').notNull(),
    originalPriceCents: integer('original_price_cents'),
    currency: char('currency', { length: 3 }).default('BRL').notNull(),
    inStock: boolean('in_stock').notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('price_history_product_captured_idx').on(t.productId, t.capturedAt),
    check('price_history_price_nonnegative', sql`${t.priceCents} >= 0`),
    check(
      'price_history_original_nonnegative',
      sql`${t.originalPriceCents} >= 0`,
    ),
    check('price_history_currency_format', sql`${t.currency} ~ '^[A-Z]{3}$'`),
  ],
);
export const offers = pgTable(
  'offers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    score: integer('score').default(0).notNull(),
    status: offerStatusEnum('status').default('candidate').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    check('offers_score_range', sql`${t.score} BETWEEN 0 AND 100`),
    index('offers_status_score_idx').on(t.status, t.score),
    index('offers_product_idx').on(t.productId),
  ],
);
export const channels = pgTable(
  'channels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: channelTypeEnum('type').notNull(),
    name: text('name').notNull(),
    config: jsonb('config')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    active: boolean('active').default(false).notNull(),
    minIntervalSeconds: integer('min_interval_seconds').default(900).notNull(),
    maxPostsPerHour: integer('max_posts_per_hour').default(4).notNull(),
    windowStart: time('window_start').default('08:00:00').notNull(),
    windowEnd: time('window_end').default('22:00:00').notNull(),
  },
  (t) => [
    uniqueIndex('channels_type_name_unique').on(t.type, t.name),
    check('channels_interval_positive', sql`${t.minIntervalSeconds} > 0`),
    check('channels_hour_limit_positive', sql`${t.maxPostsPerHour} > 0`),
  ],
);
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    offerId: uuid('offer_id')
      .notNull()
      .references(() => offers.id),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id),
    shortLinkId: uuid('short_link_id').references(
      (): AnyPgColumn => shortLinks.id,
    ),
    text: text('text').notNull(),
    status: postStatusEnum('status').default('queued').notNull(),
    externalMessageId: text('external_message_id'),
    error: text('error'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('posts_offer_channel_unique').on(t.offerId, t.channelId),
    uniqueIndex('posts_short_link_unique').on(t.shortLinkId),
    index('posts_status_scheduled_idx').on(t.status, t.scheduledAt),
    index('posts_channel_sent_idx').on(t.channelId, t.sentAt),
  ],
);
export const shortLinks = pgTable(
  'short_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    targetUrl: text('target_url').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    channelId: uuid('channel_id').references(() => channels.id),
    postId: uuid('post_id').references((): AnyPgColumn => posts.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('short_links_post_unique').on(t.postId),
    index('short_links_product_idx').on(t.productId),
    index('short_links_channel_idx').on(t.channelId),
  ],
);
export const clicks = pgTable(
  'clicks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shortLinkId: uuid('short_link_id')
      .notNull()
      .references(() => shortLinks.id),
    clickedAt: timestamp('clicked_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    isBot: boolean('is_bot').default(false).notNull(),
    referrer: text('referrer'),
    userAgentHash: text('user_agent_hash'),
    ipHash: text('ip_hash'),
  },
  (t) => [
    index('clicks_link_clicked_idx').on(t.shortLinkId, t.clickedAt),
    index('clicks_clicked_bot_idx').on(t.clickedAt, t.isBot),
    check('clicks_ip_hash_format', sql`${t.ipHash} ~ '^[a-f0-9]{64}$'`),
    check(
      'clicks_user_agent_hash_format',
      sql`${t.userAgentHash} ~ '^[a-f0-9]{64}$'`,
    ),
  ],
);
export const commissions = pgTable(
  'commissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    marketplace: marketplaceEnum('marketplace').notNull(),
    externalOrderId: text('external_order_id').notNull(),
    productRef: text('product_ref').notNull(),
    amountCents: integer('amount_cents').notNull(),
    status: text('status').default('pending').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    importedAt: timestamp('imported_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('commissions_order_product_unique').on(
      t.marketplace,
      t.externalOrderId,
      t.productRef,
    ),
    index('commissions_occurred_idx').on(t.occurredAt),
  ],
);
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
});
