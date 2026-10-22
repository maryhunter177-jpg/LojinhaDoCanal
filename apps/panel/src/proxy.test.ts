import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  config: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.createClient }));
vi.mock('@ofertas/core', () => ({ loadStorefrontConfig: mocks.config }));
vi.mock('pino', () => ({
  default: () => ({ warn: mocks.warn, error: mocks.error }),
}));
import { proxy, config } from './proxy.js';

describe('admin session cookie refresh', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.config.mockReturnValue({ LOG_LEVEL: 'silent' });
  });
  it('runs only for admin and does not require Supabase for demo mode', async () => {
    expect(config.matcher).toEqual(['/admin/:path*']);
    const response = await proxy(new NextRequest('https://example.com/admin'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('passes refreshed cookies to both the request and response', async () => {
    mocks.config.mockReturnValue({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-test-key',
      LOG_LEVEL: 'silent',
    });
    mocks.createClient.mockImplementation(
      (
        _url: string,
        _key: string,
        options: {
          cookies: {
            setAll(
              values: {
                name: string;
                value: string;
                options: { httpOnly: boolean };
              }[],
            ): void;
          };
        },
      ) => ({
        auth: {
          getUser: async () => {
            options.cookies.setAll([
              {
                name: 'session',
                value: 'refreshed',
                options: { httpOnly: true },
              },
            ]);
            return { error: null };
          },
        },
      }),
    );
    const request = new NextRequest('https://example.com/admin');
    const response = await proxy(request);
    expect(request.cookies.get('session')?.value).toBe('refreshed');
    expect(response.cookies.get('session')?.value).toBe('refreshed');
    expect(response.cookies.get('session')?.httpOnly).toBe(true);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
  it('does not leak configuration exceptions into the response or logs', async () => {
    mocks.config.mockImplementation(() => {
      throw new Error('secret-connection-data');
    });
    const response = await proxy(new NextRequest('https://example.com/admin'));
    expect(response.status).toBe(200);
    expect(mocks.error).toHaveBeenCalled();
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain(
      'secret-connection-data',
    );
    expect(await response.text()).not.toContain('secret-connection-data');
  });
});
