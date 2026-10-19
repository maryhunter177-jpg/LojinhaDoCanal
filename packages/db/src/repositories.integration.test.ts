import { randomUUID } from 'node:crypto';
import {
  cp,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDatabaseConfig } from '@ofertas/core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories } from './repositories.js';
import * as schema from './schema.js';
import { seedDatabase } from './seed.js';

describe('PostgreSQL: migrations e repositorios', () => {
  const namespace = `phase1_test_${randomUUID().replaceAll('-', '')}`;
  let admin: pg.Pool | undefined;
  let pool: pg.Pool | undefined;
  let repositories: ReturnType<typeof createRepositories>;
  let database: ReturnType<typeof drizzle<typeof schema>>;
  let created = false;
  let migrationDirectory: string | undefined;
  beforeAll(async () => {
    const { TEST_DATABASE_URL } = loadDatabaseConfig();
    if (!TEST_DATABASE_URL)
      throw new Error(
        'Defina TEST_DATABASE_URL para um PostgreSQL de teste e execute pnpm test:integration. A suite nao e ignorada sem banco.',
      );
    admin = new pg.Pool({ connectionString: TEST_DATABASE_URL });
    await admin.query(`CREATE SCHEMA "${namespace}"`);
    created = true;
    pool = new pg.Pool({
      connectionString: TEST_DATABASE_URL,
      options: `-c search_path=${namespace}`,
      max: 2,
    });
    database = drizzle(pool, { schema });
    migrationDirectory = await mkdtemp(join(tmpdir(), 'ofertas-migrations-'));
    await cp(
      fileURLToPath(new URL('../migrations', import.meta.url)),
      migrationDirectory,
      { recursive: true },
    );
    for (const filename of await readdir(migrationDirectory)) {
      if (filename.endsWith('.sql')) {
        const path = join(migrationDirectory, filename);
        const source = await readFile(path, 'utf8');
        await writeFile(
          path,
          source.replaceAll('"public".', `"${namespace}".`),
        );
      }
    }
    const options = {
      migrationsFolder: migrationDirectory,
      migrationsSchema: namespace,
    };
    await migrate(database, options);
    await migrate(database, options);
    repositories = createRepositories(database);
  }, 30_000);
  afterAll(async () => {
    try {
      await pool?.end();
    } finally {
      try {
        if (created && admin)
          await admin.query(`DROP SCHEMA "${namespace}" CASCADE`);
      } finally {
        try {
          await admin?.end();
        } finally {
          if (migrationDirectory)
            await rm(migrationDirectory, { recursive: true, force: true });
        }
      }
    }
  });
  const productInput = (externalId = randomUUID()) => ({
    marketplace: 'amazon' as const,
    externalId,
    title: 'Teclado',
    urlCanonical: 'https://example.com/teclado',
  });
  it('aplica nove tabelas e indice de historico do zero', async () => {
    const tables = await pool?.query<{ table_name: string }>(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = $1',
      [namespace],
    );
    expect(tables?.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        'products',
        'price_history',
        'offers',
        'channels',
        'posts',
        'short_links',
        'clicks',
        'commissions',
        'settings',
      ]),
    );
    const indexes = await pool?.query<{ indexdef: string }>(
      'SELECT indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = $2',
      [namespace, 'price_history'],
    );
    expect(
      indexes?.rows.some((row) =>
        row.indexdef.includes('(product_id, captured_at)'),
      ),
    ).toBe(true);
  });
  it('upsert preserva identidade e data de criacao e separa marketplaces', async () => {
    const input = productInput();
    const first = await repositories.products.upsert(input);
    const updated = await repositories.products.upsert({
      ...input,
      title: 'Atualizado',
      id: randomUUID(),
      createdAt: new Date(0),
    });
    expect(updated).toMatchObject({
      id: first.id,
      createdAt: first.createdAt,
      title: 'Atualizado',
    });
    expect(
      await repositories.products.findByExternalId('amazon', input.externalId),
    ).toEqual(updated);
    await expect(repositories.products.create(input)).rejects.toThrow();
    expect(
      (await repositories.products.create({ ...input, marketplace: 'shopee' }))
        .id,
    ).not.toBe(first.id);
  });
  it('mantem snapshots, ordem cronologica e integridade de precos/FKs', async () => {
    const product = await repositories.products.create(productInput());
    const latest = await repositories.priceHistory.create({
      productId: product.id,
      priceCents: 9000,
      inStock: false,
      capturedAt: new Date('2026-01-02T12:00:00Z'),
    });
    const oldest = await repositories.priceHistory.create({
      productId: product.id,
      priceCents: 10000,
      originalPriceCents: null,
      inStock: true,
      capturedAt: new Date('2026-01-01T12:00:00Z'),
    });
    expect(await repositories.priceHistory.listByProduct(product.id)).toEqual([
      oldest,
      latest,
    ]);
    await expect(
      repositories.priceHistory.create({
        productId: product.id,
        priceCents: -1,
        inStock: true,
      }),
    ).rejects.toThrow();
    await expect(
      repositories.priceHistory.create({
        productId: randomUUID(),
        priceCents: 100,
        inStock: true,
      }),
    ).rejects.toThrow();
    await expect(repositories.products.delete(product.id)).rejects.toThrow();
  });
  it('persiste oferta/canal/post/link/clique e rejeita duplicacoes e IP puro', async () => {
    const product = await repositories.products.create(productInput());
    const offer = await repositories.offers.create({
      productId: product.id,
      score: 90,
      status: 'approved',
    });
    expect(await repositories.offers.listByStatus('approved')).toContainEqual(
      offer,
    );
    await expect(
      repositories.offers.create({ productId: product.id, score: 101 }),
    ).rejects.toThrow();
    const channel = await repositories.channels.create({
      type: 'whatsapp_export',
      name: 'Teste manual',
      config: { manual: true },
    });
    expect(channel.active).toBe(false);
    await expect(
      repositories.channels.create({
        type: 'telegram',
        name: 'Invalido',
        minIntervalSeconds: 0,
      }),
    ).rejects.toThrow();
    const post = await repositories.posts.create({
      offerId: offer.id,
      channelId: channel.id,
      text: 'Teclado: link de afiliado',
    });
    await expect(
      repositories.posts.create({
        offerId: offer.id,
        channelId: channel.id,
        text: 'Duplicado',
      }),
    ).rejects.toThrow();
    const linkInput = {
      code: randomUUID(),
      targetUrl: product.urlCanonical,
      productId: product.id,
      channelId: channel.id,
      postId: post.id,
    };
    const link = await repositories.shortLinks.create(linkInput);
    await expect(
      repositories.shortLinks.create({ ...linkInput, postId: null }),
    ).rejects.toThrow();
    expect(await repositories.shortLinks.findByCode(link.code)).toEqual(link);
    const updated = await repositories.posts.update(post.id, {
      shortLinkId: link.id,
      status: 'sent',
      sentAt: new Date(),
      externalMessageId: 'manual-test',
    });
    expect(await repositories.posts.listByChannel(channel.id)).toContainEqual(
      updated,
    );
    const click = await repositories.clicks.create({
      shortLinkId: link.id,
      ipHash: 'a'.repeat(64),
      userAgentHash: 'b'.repeat(64),
      isBot: true,
    });
    expect(await repositories.clicks.listByShortLink(link.id)).toEqual([click]);
    await expect(
      repositories.clicks.create({ shortLinkId: link.id, ipHash: '127.0.0.1' }),
    ).rejects.toThrow();
    const columns = await pool?.query<{ column_name: string }>(
      'SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2',
      [namespace, 'clicks'],
    );
    expect(columns?.rows.map((row) => row.column_name)).not.toContain('ip');
  });
  it('comissoes identificam pedido/produto sem duplicar importacao', async () => {
    const input = {
      marketplace: 'amazon' as const,
      externalOrderId: randomUUID(),
      productRef: 'produto-1',
      amountCents: 250,
      occurredAt: new Date(),
    };
    const commission = await repositories.commissions.create(input);
    await expect(repositories.commissions.create(input)).rejects.toThrow();
    expect(
      await repositories.commissions.findByExternalOrderId(
        input.marketplace,
        input.externalOrderId,
      ),
    ).toEqual([commission]);
    await repositories.commissions.create({
      ...input,
      productRef: 'produto-2',
    });
    expect(
      await repositories.commissions.findByExternalOrderId(
        input.marketplace,
        input.externalOrderId,
      ),
    ).toHaveLength(2);
  });
  it('preserva tipos JSONB no roundtrip das configuracoes', async () => {
    for (const value of [
      'false',
      '123',
      '{"x":false}',
      false,
      true,
      123,
      { x: false },
      ['false'],
    ]) {
      const key = randomUUID();
      expect(await repositories.settings.set(key, value)).toEqual({
        key,
        value,
      });
      expect(await repositories.settings.get(key)).toEqual({ key, value });
      expect(await repositories.settings.delete(key)).toEqual({ key, value });
      expect(await repositories.settings.get(key)).toBeUndefined();
    }
    expect(await repositories.settings.setPublishingPaused(false)).toEqual({
      key: 'publishing_paused',
      value: false,
    });
  });
  it('kill switch so libera com boolean false explicito', async () => {
    await repositories.settings.delete('publishing_paused');
    expect(await repositories.settings.isPublishingPaused()).toBe(true);
    for (const malformed of ['false', 0, {}, []]) {
      await repositories.settings.set('publishing_paused', malformed);
      expect(await repositories.settings.isPublishingPaused()).toBe(true);
    }
    await repositories.settings.setPublishingPaused(false);
    expect(await repositories.settings.isPublishingPaused()).toBe(false);
    await repositories.settings.setPublishingPaused(true);
    expect(await repositories.settings.isPublishingPaused()).toBe(true);
  });
  it('seed e idempotente e preserva ajustes existentes', async () => {
    await repositories.settings.delete('publishing_paused');
    await seedDatabase(database);
    expect(await repositories.settings.isPublishingPaused()).toBe(true);
    const before = await repositories.channels.list();
    const seeded = before.filter((channel) =>
      ['Telegram', 'Discord', 'WhatsApp (exportação manual)'].includes(
        channel.name,
      ),
    );
    expect(seeded).toHaveLength(3);
    expect(seeded.every((channel) => !channel.active)).toBe(true);
    const telegram = seeded.find((channel) => channel.type === 'telegram');
    if (!telegram) throw new Error('Seed nao criou Telegram');
    await repositories.channels.update(telegram.id, {
      minIntervalSeconds: 1800,
    });
    await repositories.settings.setPublishingPaused(false);
    await seedDatabase(database);
    await seedDatabase(database);
    expect(await repositories.channels.list()).toHaveLength(before.length);
    expect(
      (await repositories.channels.findById(telegram.id))?.minIntervalSeconds,
    ).toBe(1800);
    expect(await repositories.settings.isPublishingPaused()).toBe(false);
  });
  it('propaga erro da tabela de controle sem liberar publicacao', async () => {
    if (!pool) throw new Error('Pool nao inicializado');
    await pool.query('ALTER TABLE settings RENAME TO settings_unavailable');
    try {
      await expect(
        repositories.settings.isPublishingPaused(),
      ).rejects.toThrow();
    } finally {
      await pool.query('ALTER TABLE settings_unavailable RENAME TO settings');
    }
  });
});
