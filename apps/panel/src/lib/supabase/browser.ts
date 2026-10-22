'use client';
import { createBrowserClient } from '@supabase/ssr';
import { loadStorefrontConfig } from '@ofertas/core';

export function createBrowserSupabaseClient() {
  const config = loadStorefrontConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (
    !config.NEXT_PUBLIC_SUPABASE_URL ||
    !config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return null;
  return createBrowserClient(
    config.NEXT_PUBLIC_SUPABASE_URL,
    config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
