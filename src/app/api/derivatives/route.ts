import { NextResponse } from 'next/server';

// CoinGecko free API — derivatives data
// No API key needed, 30 req/min rate limit

interface DerivativeEntry {
  market: string;
  symbol: string;
  index_id: string;
  price: string;
  price_percentage_change_24h: number;
  contract_type: string;
  index: number;
  basis: number;
  spread: number;
  funding_rate: number;
  open_interest: number;
  volume_24h: number;
  last_traded_at: number;
  expired_at: number | null;
}

interface AggregatedAsset {
  asset: string;
  avgFundingRate: number;
  totalOI: number;
  totalVolume: number;
  exchanges: { name: string; fundingRate: number; oi: number }[];
  price: number;
  change24h: number;
}

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 120_000; // 2 min cache

export async function GET() {
  // Return cached if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  }

  try {
    const res = await fetch('https://api.coingecko.com/api/v3/derivatives?order=open_interest_desc', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 120 },
    });

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data: DerivativeEntry[] = await res.json();

    // Filter perpetuals only & aggregate by index_id
    const perps = data.filter((d) => d.contract_type === 'perpetual' && d.funding_rate !== 0);

    // Group by asset (index_id)
    const byAsset = new Map<string, DerivativeEntry[]>();
    for (const d of perps) {
      const key = d.index_id?.toUpperCase() || d.symbol.replace(/USDT|USD|BUSD/gi, '').toUpperCase();
      if (!key) continue;
      if (!byAsset.has(key)) byAsset.set(key, []);
      byAsset.get(key)!.push(d);
    }

    // Aggregate top assets
    const targetAssets = ['BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'ADA', 'AVAX', 'LINK', 'DOGE', 'DOT'];
    const aggregated: AggregatedAsset[] = [];

    for (const assetId of targetAssets) {
      const entries = byAsset.get(assetId);
      if (!entries || entries.length === 0) continue;

      const avgFunding = entries.reduce((s, e) => s + e.funding_rate, 0) / entries.length;
      const totalOI = entries.reduce((s, e) => s + (e.open_interest || 0), 0);
      const totalVolume = entries.reduce((s, e) => s + (e.volume_24h || 0), 0);
      const topPrice = entries.reduce((best, e) => (e.volume_24h > best.volume_24h ? e : best), entries[0]);

      // Get per-exchange breakdown (top 4 by OI)
      const sorted = [...entries].sort((a, b) => (b.open_interest || 0) - (a.open_interest || 0));
      const topExchanges = sorted.slice(0, 4).map((e) => ({
        name: e.market.replace(' (Futures)', '').replace(' Futures', ''),
        fundingRate: e.funding_rate,
        oi: e.open_interest || 0,
      }));

      aggregated.push({
        asset: assetId,
        avgFundingRate: avgFunding,
        totalOI,
        totalVolume,
        exchanges: topExchanges,
        price: parseFloat(topPrice.price) || 0,
        change24h: topPrice.price_percentage_change_24h || 0,
      });
    }

    // Sort by total OI descending
    aggregated.sort((a, b) => b.totalOI - a.totalOI);

    // Summary stats
    const totalOI = aggregated.reduce((s, a) => s + a.totalOI, 0);
    const totalVolume = aggregated.reduce((s, a) => s + a.totalVolume, 0);
    const btcOI = aggregated.find((a) => a.asset === 'BTC')?.totalOI || 0;
    const ethOI = aggregated.find((a) => a.asset === 'ETH')?.totalOI || 0;
    const btcFunding = aggregated.find((a) => a.asset === 'BTC')?.avgFundingRate || 0;

    const result = {
      assets: aggregated,
      summary: {
        totalOI,
        totalVolume,
        btcOI,
        ethOI,
        btcFunding,
        assetCount: aggregated.length,
        dataPoints: perps.length,
      },
      updatedAt: new Date().toISOString(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch (err: any) {
    // Return stale cache if available
    if (cache) {
      return NextResponse.json(cache.data, {
        headers: { 'X-Cache': 'STALE', 'Cache-Control': 'public, s-maxage=60' },
      });
    }
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
