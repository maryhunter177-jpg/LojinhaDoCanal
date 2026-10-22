import { describe, expect, it, vi } from 'vitest';
import { requireCatalogAdmin } from './auth.js';
describe('catalog admin authorization', () => {
  it('does not query permissions without a verified user', async () => {
    const rpc = vi.fn();
    await expect(
      requireCatalogAdmin({
        auth: { getUser: async () => ({ data: { user: null }, error: null }) },
        rpc,
      }),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it('rejects auth errors despite a cached user', async () => {
    const rpc = vi.fn();
    await expect(
      requireCatalogAdmin({
        auth: {
          getUser: async () => ({
            data: { user: { id: 'user' } },
            error: new Error('expired'),
          }),
        },
        rpc,
      }),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it('fails closed on missing, malformed or failed permission responses', async () => {
    for (const permission of [
      { data: false, error: null },
      { data: null, error: null },
      { data: 'true', error: null },
      { data: true, error: new Error('unavailable') },
    ]) {
      await expect(
        requireCatalogAdmin({
          auth: {
            getUser: async () => ({
              data: { user: { id: 'user' } },
              error: null,
            }),
          },
          rpc: async () => permission,
        }),
      ).rejects.toThrow();
    }
  });
  it('allows only a verified user with explicit permission', async () => {
    const rpc = vi.fn(async () => ({ data: true, error: null }));
    await expect(
      requireCatalogAdmin({
        auth: {
          getUser: async () => ({
            data: { user: { id: 'user' } },
            error: null,
          }),
        },
        rpc,
      }),
    ).resolves.toBe('user');
    expect(rpc).toHaveBeenCalledWith('is_catalog_admin');
  });
});
