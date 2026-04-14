import { NextResponse } from 'next/server';

/* ───────── Stablecoin Supply API ─────────
 * Fetches stablecoin market data from DefiLlama (free, no key needed).
 * 5-minute in-memory cache.
 */

interface StablecoinInfo {
  name: string;
  symbol: string;
  supply: number;
  change30d: number;
  peg: number;
  chain: string;
}

let cache: { data: any; ts: number } | null = null;
const CACHE_MS = 5 * 60 * 1000; // 5 min

// Stablecoins we care about
const TARGET_SYMBOLS: Record<string, string> = {
  'USDT': 'Multi',
  'USDC': 'Multi',
  'USDS': 'ETH',
  'DAI': 'ETH',
  'FDUSD': 'Multi',
  'RLUSD': 'XRP/ETH',
};

export async function GET() {
  // Return cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json(cache.data, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=300' },
    });
  }

  try {
    // DefiLlama stablecoins endpoint
    const res = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true', {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`DefiLlama stablecoins: ${res.status}`);
    const json = await res.json();
    const peggedAssets = json.peggedAssets || [];

    const stablecoins: StablecoinInfo[] = [];
    let totalSupply = 0;
    let totalChange30d = 0;

    for (const asset of peggedAssets) {
      const symbol = asset.symbol?.toUpperCase();
      const chain = TARGET_SYMBOLS[symbol];
      if (!chain) {
        // Still add to total supply if it's a USD stablecoin
        const currentPeg = asset.pegMechanism;
        if (currentPeg || asset.pegType === 'peggedUSD') {
          const supply = asset.circulating?.peggedUSD || 0;
          totalSupply += supply;
        }
        continue;
      }

      const currentSupply = asset.circulating?.peggedUSD || 0;
      totalSupply += currentSupply;

      // 30d change: compare circulatingPrevMonth
      const prevMonth = asset.circulatingPrevMonth?.peggedUSD || currentSupply;
      const change30d = currentSupply - prevMonth;
      totalChange30d += change30d;

      // Get peg price
      const price = asset.price || 1.0;

      stablecoins.push({
        name: asset.name || symbol,
        symbol,
        supply: currentSupply,
        change30d,
        peg: price,
        chain,
      });
    }

    // Sort by supply descending
    stablecoins.sort((a, b) => b.supply - a.supply);

    const result = {
      stablecoins,
      totalSupply,
      totalChange30d,
      updatedAt: new Date().toISOString(),
      live: true,
    };

    cache = { data: result, ts: Date.now() };

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=300' },
    });
  } catch (err: any) {
    if (cache) {
      return NextResponse.json({ ...cache.data, live: false, stale: true }, {
        headers: { 'X-Cache': 'STALE' },
      });
    }
    return NextResponse.json({ error: err.message, stablecoins: [], live: false }, { status: 502 });
  }
}
