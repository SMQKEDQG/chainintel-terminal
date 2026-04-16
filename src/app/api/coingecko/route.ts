import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Simple in-memory cache to avoid rate limits
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 60_000; // 60 seconds

export async function GET(req: NextRequest) {
  const demoApiKey = process.env.COINGECKO_DEMO_API_KEY;
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  // Build the full CoinGecko URL — pass through remaining params
  const params = new URLSearchParams();
  searchParams.forEach((v, k) => {
    if (k !== 'path') params.set(k, v);
  });
  const queryStr = params.toString();
  const url = `${COINGECKO_BASE}${path}${queryStr ? '?' + queryStr : ''}`;

  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ data: cached.data, source: 'cache' });
  }

  try {
    const res = await fetch(url, {
      headers: demoApiKey
        ? { 'Accept': 'application/json', 'x-cg-demo-api-key': demoApiKey }
        : { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      // If rate limited, return cached data if available (even if stale)
      if (res.status === 429 && cached) {
        return NextResponse.json({ data: cached.data, source: 'stale_cache' });
      }
      return NextResponse.json(
        { error: `CoinGecko returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });

    return NextResponse.json({ data, source: 'live' });
  } catch (err: any) {
    // Return stale cache on network error
    if (cached) {
      return NextResponse.json({ data: cached.data, source: 'stale_cache' });
    }
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
