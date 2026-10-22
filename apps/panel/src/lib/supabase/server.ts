import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { loadStorefrontConfig } from '@ofertas/core';
import pino from 'pino';

export async function createServerSupabaseClient() {
  const config = loadStorefrontConfig();
  if (
    !config.NEXT_PUBLIC_SUPABASE_URL ||
    !config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return null;
  const cookieStore = await cookies();
  return createServerClient(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(values) {
          try {
            for (const { name, value, options } of values)
              cookieStore.set(name, value, options);
          } catch {
            // Rendering Server Components cannot mutate cookies. Route handlers can.
            pino({ level: config.LOG_LEVEL }).debug(
              { operation: 'auth.cookie_refresh' },
              'Cookie refresh requires a writable response',
            );
          }
        },
      },
    },
  );
}
