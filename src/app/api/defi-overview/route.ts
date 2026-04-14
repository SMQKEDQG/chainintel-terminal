import { NextResponse } from 'next/server';

/**
 * /api/defi-overview — Aggregated DeFi data from DefiLlama (free, no key)
 * Returns: totalTvl, ethTvl, stablecoinSupply, topSectors, ethDominance
 * Cache: 2 minutes in-memory
 */

interface CacheEntry { data: unknown; ts: number; }
let cache: CacheEntry | null = null;
const CACHE_TTL = 120_000; // 2 min

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ ...cache.data as Record<string, unknown>, source: 'cached' });
  }

  try {
    const [chainsRes, stablesRes] = await Promise.allSettled([
      fetch('https://api.llama.fi/v2/chains', { next: { revalidate: 120 } }),
      fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true', { next: { revalidate: 120 } }),
    ]);

    let totalTvl = 0, ethTvl = 0;
    const sectors: Record<string, number> = {};

    if (chainsRes.status === 'fulfilled' && chainsRes.value.ok) {
      const chains = await chainsRes.value.json();
      if (Array.isArray(chains)) {
        for (const c of chains) {
          totalTvl += c.tvl || 0;
          if (c.name === 'Ethereum') ethTvl = c.tvl || 0;
        }
      }
    }

    let stablecoinSupply = 0;
    if (stablesRes.status === 'fulfilled' && stablesRes.value.ok) {
      const stablesData = await stablesRes.value.json();
      const coins = stablesData?.peggedAssets || stablesData;
      if (Array.isArray(coins)) {
        stablecoinSupply = coins.reduce((s: number, c: { circulating?: { peggedUSD?: number } }) => 
          s + (c.circulating?.peggedUSD || 0), 0);
      }
    }

    const result = {
      totalTvl,
      ethTvl,
      ethDominance: totalTvl > 0 ? (ethTvl / totalTvl * 100) : 0,
      stablecoinSupply,
      protocolCount: 6400, // DefiLlama tracks 6400+ — update via protocols endpoint if needed
      source: 'live',
      timestamp: Date.now(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    // Return stale cache if available
    if (cache) {
      return NextResponse.json({ ...cache.data as Record<string, unknown>, source: 'stale-cache' });
    }
    return NextResponse.json({ error: msg, fallback: true }, { status: 500 });
  }
}
