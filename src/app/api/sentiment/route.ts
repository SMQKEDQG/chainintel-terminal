import { NextResponse } from 'next/server';

let lastGoodResponse: { data: any; ts: number } | null = null;
const STALE_TTL = 600_000;

async function fetchWithRetry(url: string, opts?: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) });
      if (res.ok) return res;
      if (res.status === 429 && i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      if (i === retries) return res;
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error('Max retries');
}

export async function GET() {
  try {
    const CMC_KEY = process.env.CMC_API_KEY || 'a45ac72ec0834ee58ae4f6f16b5756ff';

    // Parallel fetch: Fear & Greed (current + history), CoinGecko trending, CMC global metrics
    const [fngRes, fngHistRes, trendingRes, globalRes] = await Promise.allSettled([
      fetchWithRetry('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 300 } } as any),
      fetchWithRetry('https://api.alternative.me/fng/?limit=30', { next: { revalidate: 3600 } } as any),
      fetchWithRetry('https://api.coingecko.com/api/v3/search/trending', { next: { revalidate: 300 } } as any),
      fetchWithRetry(`https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest`, {
        headers: { 'X-CMC_PRO_API_KEY': CMC_KEY, 'Accept': 'application/json' },
        next: { revalidate: 300 },
      } as any),
    ]);

    // --- Fear & Greed ---
    let fngValue = 0;
    let fngLabel = 'Unknown';
    let fngHistory: { value: number; date: string }[] = [];

    if (fngRes.status === 'fulfilled' && fngRes.value.ok) {
      const data = await fngRes.value.json();
      if (data?.data?.[0]) {
        fngValue = Number(data.data[0].value);
        fngLabel = data.data[0].value_classification;
      }
    }

    if (fngHistRes.status === 'fulfilled' && fngHistRes.value.ok) {
      const data = await fngHistRes.value.json();
      if (data?.data) {
        fngHistory = data.data.map((d: any) => ({
          value: Number(d.value),
          date: new Date(Number(d.timestamp) * 1000).toISOString().split('T')[0],
        })).reverse();
      }
    }

    // Compute stats
    const last7 = fngHistory.slice(-7);
    const avg7d = last7.length > 0 ? Math.round(last7.reduce((s, d) => s + d.value, 0) / last7.length) : fngValue;
    const prev7 = fngHistory.slice(-14, -7);
    const avg7dPrev = prev7.length > 0 ? Math.round(prev7.reduce((s, d) => s + d.value, 0) / prev7.length) : avg7d;
    const weekOverWeek = avg7d - avg7dPrev;

    let zone: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
    if (fngValue <= 25) zone = 'extreme_fear';
    else if (fngValue <= 45) zone = 'fear';
    else if (fngValue <= 55) zone = 'neutral';
    else if (fngValue <= 75) zone = 'greed';
    else zone = 'extreme_greed';

    // --- Trending Coins (CoinGecko) ---
    let trending: { symbol: string; name: string; rank: number | null; thumb: string; price_btc?: number }[] = [];
    let trendingCategories: { name: string; coins_count?: number }[] = [];

    if (trendingRes.status === 'fulfilled' && trendingRes.value.ok) {
      const data = await trendingRes.value.json();
      if (data?.coins) {
        trending = data.coins.slice(0, 7).map((c: any) => ({
          symbol: c.item.symbol,
          name: c.item.name,
          rank: c.item.market_cap_rank || null,
          thumb: c.item.thumb || '',
          price_btc: c.item.price_btc || undefined,
        }));
      }
      if (data?.categories) {
        trendingCategories = data.categories.slice(0, 5).map((cat: any) => ({
          name: cat.name,
          coins_count: cat.coins_count || undefined,
        }));
      }
    }

    // --- Global Market Metrics (CMC) ---
    let globalMetrics: {
      btcDominance: number;
      ethDominance: number;
      totalMarketCap: number;
      totalVolume24h: number;
      activeCryptos: number;
      activeExchanges: number;
      defiVolume24h: number;
      defiMarketCap: number;
      stablecoinVolume24h: number;
      stablecoinMarketCap: number;
      totalMarketCapChange24h: number;
    } | null = null;

    if (globalRes.status === 'fulfilled' && globalRes.value.ok) {
      const data = await globalRes.value.json();
      if (data?.data) {
        const d = data.data;
        const q = d.quote?.USD || {};
        globalMetrics = {
          btcDominance: Number((d.btc_dominance || 0).toFixed(2)),
          ethDominance: Number((d.eth_dominance || 0).toFixed(2)),
          totalMarketCap: q.total_market_cap || 0,
          totalVolume24h: q.total_volume_24h || 0,
          activeCryptos: d.active_cryptocurrencies || 0,
          activeExchanges: d.active_exchanges || 0,
          defiVolume24h: d.defi_volume_24h || 0,
          defiMarketCap: d.defi_market_cap || 0,
          stablecoinVolume24h: d.stablecoin_volume_24h || 0,
          stablecoinMarketCap: d.stablecoin_market_cap || 0,
          totalMarketCapChange24h: q.total_market_cap_yesterday_percentage_change || 0,
        };
      }
    }

    // --- AI Context ---
    let aiContext = '';
    const dominanceNote = globalMetrics
      ? `BTC dominance at ${globalMetrics.btcDominance}%${globalMetrics.btcDominance > 55 ? ' — risk-off regime, capital flowing to safety' : globalMetrics.btcDominance < 45 ? ' — alt season conditions emerging' : ' — balanced market structure'}.`
      : '';

    const trendingNote = trending.length > 0
      ? ` Trending: ${trending.slice(0, 3).map(t => t.symbol).join(', ')}.`
      : '';

    if (zone === 'extreme_fear') {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — historically, readings below 25 precede 60-day mean reversions of +28%. Smart money accumulates here while retail capitulates. ${weekOverWeek > 0 ? 'Sentiment recovering week-over-week.' : 'Sentiment still deteriorating.'} ${dominanceNote}${trendingNote}`;
    } else if (zone === 'fear') {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — cautious positioning but not panic. ${weekOverWeek > 0 ? 'Recovering from deeper fear levels.' : 'Sliding toward extreme fear zone.'} ${dominanceNote}${trendingNote}`;
    } else if (zone === 'neutral') {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — balanced market. No strong directional bias from sentiment. ${dominanceNote}${trendingNote}`;
    } else if (zone === 'greed') {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — elevated optimism. Monitor for overheating. ${weekOverWeek > 0 ? 'Greed intensifying.' : 'Starting to cool off.'} ${dominanceNote}${trendingNote}`;
    } else {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — extreme greed historically precedes 10-20% corrections within 30 days. Reduce risk exposure. ${dominanceNote}${trendingNote}`;
    }

    const responseData = {
      fearGreed: { value: fngValue, label: fngLabel, zone },
      history: fngHistory,
      stats: { avg7d, avg7dPrev, weekOverWeek },
      trending,
      trendingCategories,
      globalMetrics,
      aiContext,
      source: 'live' as const,
      timestamp: Date.now(),
    };

    lastGoodResponse = { data: responseData, ts: Date.now() };
    return NextResponse.json(responseData);
  } catch (err) {
    console.error('Sentiment API error:', err);
    if (lastGoodResponse && Date.now() - lastGoodResponse.ts < STALE_TTL) {
      return NextResponse.json({ ...lastGoodResponse.data, source: 'stale-cache' });
    }
    return NextResponse.json({ error: 'Failed to fetch sentiment data' }, { status: 500 });
  }
}
