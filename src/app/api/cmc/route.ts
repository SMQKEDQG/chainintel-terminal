import { NextRequest, NextResponse } from 'next/server';

// ─── CoinMarketCap API proxy ─────────────────────────────────────────────────
// Server-side proxy to keep CMC_API_KEY secret.
// Free tier: 10K credits/mo, 30 req/min, 1-min refresh.
// Caches responses in-memory for 60s to minimize API calls.

const CMC_BASE = 'https://pro-api.coinmarketcap.com';

interface CacheEntry {
  data: unknown;
  ts: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60_000; // 60 seconds

// Allowed CMC endpoints (whitelist to prevent abuse)
const ALLOWED_PATHS = new Set([
  '/v1/cryptocurrency/listings/latest',
  '/v1/cryptocurrency/quotes/latest',
  '/v1/global-metrics/quotes/latest',
  '/v1/cryptocurrency/trending/gainers-losers',
  '/v1/cryptocurrency/trending/latest',
  '/v1/cryptocurrency/trending/most-visited',
]);

export async function GET(req: NextRequest) {
  const cmcKey = process.env.CMC_API_KEY;
  if (!cmcKey) {
    return NextResponse.json(
      { error: 'CMC_API_KEY not configured', fallback: true },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');
  
  if (!endpoint || !ALLOWED_PATHS.has(endpoint)) {
    return NextResponse.json(
      { error: 'Invalid or disallowed endpoint' },
      { status: 400 }
    );
  }

  // Build query params (exclude our 'endpoint' param)
  const cmcParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') cmcParams.set(key, value);
  });

  const cacheKey = `${endpoint}?${cmcParams.toString()}`;

  // Return cached if fresh
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ data: cached.data, source: 'cached', cachedAt: cached.ts });
  }

  try {
    const url = `${CMC_BASE}${endpoint}?${cmcParams.toString()}`;
    const res = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': cmcKey,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[cmc] ${res.status}: ${errBody.slice(0, 200)}`);
      
      // If rate limited, return cached data if available (even stale)
      if (res.status === 429 && cached) {
        return NextResponse.json({ data: cached.data, source: 'stale-cache', cachedAt: cached.ts });
      }

      return NextResponse.json(
        { error: `CMC API error: ${res.status}`, fallback: true },
        { status: res.status }
      );
    }

    const json = await res.json();
    
    // Cache the response
    cache.set(cacheKey, { data: json, ts: Date.now() });

    return NextResponse.json({ data: json, source: 'live' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[cmc]', msg);

    // Return stale cache on network error
    if (cached) {
      return NextResponse.json({ data: cached.data, source: 'stale-cache', cachedAt: cached.ts });
    }

    return NextResponse.json(
      { error: msg, fallback: true },
      { status: 500 }
    );
  }
}
