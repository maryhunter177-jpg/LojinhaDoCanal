import { NextRequest, NextResponse } from 'next/server';
import { isAllowedAffiliateUrl } from '@ofertas/core';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import pino from 'pino';

export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const unavailable = () =>
    NextResponse.redirect(new URL('/link-indisponivel', request.url), {
      status: 303,
      headers: { 'Cache-Control': 'no-store' },
    });
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160)
    return unavailable();
  try {
    const client = await createServerSupabaseClient();
    if (!client) return unavailable();
    const { data, error } = await client
      .from('catalog_items')
      .select('platform,affiliate_url')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    if (error) throw new Error('Affiliate lookup failed');
    if (
      !data ||
      (data.platform !== 'hotmart' && data.platform !== 'shopee') ||
      typeof data.affiliate_url !== 'string' ||
      !isAllowedAffiliateUrl(data.affiliate_url, data.platform)
    )
      return unavailable();
    return NextResponse.redirect(data.affiliate_url, {
      status: 302,
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error: unknown) {
    pino().error(
      {
        operation: 'catalog.redirect',
        errorType: error instanceof Error ? error.name : typeof error,
      },
      'Affiliate destination unavailable',
    );
    return unavailable();
  }
}
