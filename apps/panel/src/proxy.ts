import { createServerClient } from '@supabase/ssr';
import { loadStorefrontConfig } from '@ofertas/core';
import { NextResponse, type NextRequest } from 'next/server';
import pino from 'pino';

// Refreshes cookie sessions only. Authorization remains in the admin guard and RLS.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  try {
    const config = loadStorefrontConfig();
    if (
      !config.NEXT_PUBLIC_SUPABASE_URL ||
      !config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )
      return response;
    const logger = pino({ level: config.LOG_LEVEL });
    const supabase = createServerClient(
      config.NEXT_PUBLIC_SUPABASE_URL,
      config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(values) {
            for (const { name, value } of values)
              request.cookies.set(name, value);
            response = NextResponse.next({ request });
            for (const { name, value, options } of values)
              response.cookies.set(name, value, options);
            response.headers.set('Cache-Control', 'private, no-store');
          },
        },
      },
    );
    const { error } = await supabase.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError') {
      logger.warn(
        { operation: 'admin.session_refresh', code: error.code },
        'Unable to verify administrative session',
      );
    }
  } catch {
    // Never log raw auth/config errors: they can contain sensitive connection data.
    pino().error(
      { operation: 'admin.session_refresh' },
      'Administrative session refresh failed',
    );
  }
  return response;
}

export const config = { matcher: ['/admin/:path*'] };
