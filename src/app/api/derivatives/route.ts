import { NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';

// Cross-Exchange Derivatives Data
// Sources: CoinGecko (aggregated), Binance Futures, Bybit v5
// No API keys needed — all public endpoints

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

// Fetch Binance funding rates for major pairs
async function fetchBinanceFunding(): Promise<Record<string, { fundingRate: number; markPrice: number }>> {
  const result: Record<string, { fundingRate: number; markPrice: number }> = {};
  try {
    const [fundRes, markRes] = await Promise.all([
      fetchWithRetry('https://fapi.binance.com/fapi/v1/premiumIndex', {
        headers: { Accept: 'application/json' },
      }),
      fetchWithRetry('https://fapi.binance.com/fapi/v1/ticker/24hr', {
        headers: { Accept: 'application/json' },
      }),
    ]);
    if (fundRes.ok) {
      const fundData = await fundRes.json();
      for (const item of fundData) {
        if (item.symbol?.endsWith('USDT')) {
          const asset = item.symbol.replace('USDT', '').toUpperCase();
          result[asset] = {
            fundingRate: parseFloat(item.lastFundingRate) || 0,
            markPrice: parseFloat(item.markPrice) || 0,
          };
        }
      }
    }
    // Enrich with OI from 24hr ticker
    if (markRes.ok) {
      const tickerData = await markRes.json();
      for (const item of tickerData) {
        if (item.symbol?.endsWith('USDT')) {
          const asset = item.symbol.replace('USDT', '').toUpperCase();
          if (result[asset]) {
            (result[asset] as any).volume24h = parseFloat(item.quoteVolume) || 0;
          }
        }
      }
    }
  } catch {
    // Binance may be unavailable — gracefully degrade
  }
  return result;
}

// Fetch Bybit v5 funding rates + OI
async function fetchBybitFunding(): Promise<Record<string, { fundingRate: number; oi: number }>> {
  const result: Record<string, { fundingRate: number; oi: number }> = {};
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOGEUSDT', 'DOTUSDT'];
    const [tickerRes, ...oiResults] = await Promise.all([
      fetchWithRetry('https://api.bybit.com/v5/market/tickers?category=linear', {
        headers: { Accept: 'application/json' },
      }),
      ...symbols.map(s =>
        fetchWithRetry(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${s}&intervalTime=5min&limit=1`, {
          headers: { Accept: 'application/json' },
        })
      ),
    ]);

    if (tickerRes.ok) {
      const tickerData = await tickerRes.json();
      const list = tickerData?.result?.list || [];
      for (const item of list) {
        if (item.symbol?.endsWith('USDT')) {
          const asset = item.symbol.replace('USDT', '').toUpperCase();
          result[asset] = {
            fundingRate: parseFloat(item.fundingRate) || 0,
            oi: parseFloat(item.openInterestValue) || 0,
          };
        }
      }
    }

    // Enrich with open interest
    for (let i = 0; i < symbols.length; i++) {
      const asset = symbols[i].replace('USDT', '').toUpperCase();
      try {
        if (oiResults[i].ok) {
          const oiData = await oiResults[i].json();
          const entry = oiData?.result?.list?.[0];
          if (entry && result[asset]) {
            result[asset].oi = parseFloat(entry.openInterestValue) || result[asset].oi;
          }
        }
      } catch { /* ignore individual failures */ }
    }
  } catch {
    // Bybit may be unavailable — gracefully degrade
  }
  return result;
}

export async function GET() {
  // Return cached if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  }

  try {
    // Fetch all three sources in parallel
    const [cgRes, binanceData, bybitData] = await Promise.all([
      fetchWithRetry('https://api.coingecko.com/api/v3/derivatives?order=open_interest_desc', {
        headers: { Accept: 'application/json' },
        next: { revalidate: 120 },
      }).then(async (res) => {
        if (!res.ok) return [];
        return res.json();
      }).catch(() => []),
      fetchBinanceFunding(),
      fetchBybitFunding(),
    ]);

    // Parse CoinGecko data
    const perps = (cgRes as any[]).filter((d: any) => d.contract_type === 'perpetual' && d.funding_rate !== 0);
    const byAsset = new Map<string, any[]>();
    for (const d of perps) {
      const key = d.index_id?.toUpperCase() || d.symbol.replace(/USDT|USD|BUSD/gi, '').toUpperCase();
      if (!key) continue;
      if (!byAsset.has(key)) byAsset.set(key, []);
      byAsset.get(key)!.push(d);
    }

    // Target assets
    const targetAssets = ['BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'ADA', 'AVAX', 'LINK', 'DOGE', 'DOT'];
    const aggregated: AggregatedAsset[] = [];

    for (const assetId of targetAssets) {
      const cgEntries = byAsset.get(assetId) || [];
      const binance = binanceData[assetId];
      const bybit = bybitData[assetId];

      // Collect exchange-level funding rates
      const exchanges: { name: string; fundingRate: number; oi: number }[] = [];

      // CoinGecko exchanges (top by OI from their data)
      const cgSorted = [...cgEntries].sort((a, b) => (b.open_interest || 0) - (a.open_interest || 0));
      for (const e of cgSorted.slice(0, 3)) {
        const name = e.market.replace(' (Futures)', '').replace(' Futures', '');
        // Skip Binance/Bybit from CoinGecko since we have direct data
        if (name.toLowerCase().includes('binance') || name.toLowerCase().includes('bybit')) continue;
        exchanges.push({ name, fundingRate: e.funding_rate, oi: e.open_interest || 0 });
      }

      // Add Binance direct data
      if (binance) {
        exchanges.unshift({ name: 'Binance', fundingRate: binance.fundingRate, oi: (binance as any).volume24h || 0 });
      }

      // Add Bybit direct data
      if (bybit) {
        exchanges.splice(1, 0, { name: 'Bybit', fundingRate: bybit.fundingRate, oi: bybit.oi });
      }

      if (exchanges.length === 0 && cgEntries.length === 0) continue;

      // Calculate aggregated metrics
      const allFundingRates = exchanges.map(e => e.fundingRate).filter(r => r !== 0);
      const avgFunding = allFundingRates.length > 0
        ? allFundingRates.reduce((s, r) => s + r, 0) / allFundingRates.length
        : 0;

      const cgTotalOI = cgEntries.reduce((s: number, e: any) => s + (e.open_interest || 0), 0);
      const totalOI = cgTotalOI + (bybit?.oi || 0);
      const cgTotalVolume = cgEntries.reduce((s: number, e: any) => s + (e.volume_24h || 0), 0);
      const totalVolume = cgTotalVolume + ((binance as any)?.volume24h || 0);

      const topPrice = cgEntries.length > 0
        ? cgEntries.reduce((best: any, e: any) => (e.volume_24h > best.volume_24h ? e : best), cgEntries[0])
        : null;

      aggregated.push({
        asset: assetId,
        avgFundingRate: avgFunding,
        totalOI,
        totalVolume,
        exchanges: exchanges.slice(0, 5),
        price: topPrice ? parseFloat(topPrice.price) || (binance?.markPrice || 0) : (binance?.markPrice || 0),
        change24h: topPrice?.price_percentage_change_24h || 0,
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

    // Cross-exchange funding divergence (max spread between exchanges for BTC)
    const btcExchanges = aggregated.find(a => a.asset === 'BTC')?.exchanges || [];
    const btcRates = btcExchanges.map(e => e.fundingRate).filter(r => r !== 0);
    const fundingDivergence = btcRates.length >= 2
      ? Math.max(...btcRates) - Math.min(...btcRates)
      : 0;

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
        fundingDivergence,
        exchanges: ['CoinGecko Aggregated', 'Binance Futures', 'Bybit v5'],
      },
      sources: {
        coingecko: perps.length > 0,
        binance: Object.keys(binanceData).length > 0,
        bybit: Object.keys(bybitData).length > 0,
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
