import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// LEVEL UP 1: Cross-Source Correlation Engine
// Fuses: whale activity + funding rates + ETF flows + sentiment + price momentum
// into a composite CI Signal per asset

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface CacheEntry { data: any; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 60_000;

async function cachedFetch(key: string, url: string): Promise<any> {
  if (cache[key] && Date.now() - cache[key].ts < TTL) return cache[key].data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch { return cache[key]?.data || null; }
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

export async function GET() {
  // Gather all signal sources in parallel
  const [fng, funding, prices, etfFlows, chainscores] = await Promise.allSettled([
    cachedFetch('fng', 'https://api.alternative.me/fng/?limit=1'),
    cachedFetch('funding', 'https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1'),
    cachedFetch('prices', 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,ripple,solana,cardano&order=market_cap_desc&price_change_percentage=24h,7d,30d'),
    supabaseKey ? (async () => {
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data } = await sb.from('etf_flows').select('*').order('date', { ascending: false }).limit(10);
      return data;
    })() : Promise.resolve(null),
    supabaseKey ? (async () => {
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data } = await sb.from('chainscore_ratings').select('*').order('total_score', { ascending: false });
      return data;
    })() : Promise.resolve(null),
  ]);

  const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

  // Fear & Greed (0-100, inverted: low fear = contrarian bullish)
  const fngData = val(fng);
  const fngValue = fngData?.data?.[0] ? parseInt(fngData.data[0].value) : 50;
  const fngLabel = fngData?.data?.[0]?.value_classification || 'Neutral';
  // Contrarian signal: extreme fear (0-25) = bullish opportunity, extreme greed (75-100) = caution
  const sentimentSignal = fngValue <= 25 ? 80 : fngValue <= 40 ? 65 : fngValue <= 60 ? 50 : fngValue <= 75 ? 35 : 20;

  // Funding rate signal
  const fundingData = val(funding);
  const fundingRate = fundingData?.[0] ? parseFloat(fundingData[0].fundingRate) : 0;
  // Positive funding = longs paying shorts (overheated). Negative = shorts paying longs (capitulation)
  const fundingSignal = fundingRate > 0.001 ? 30 : fundingRate > 0 ? 50 : fundingRate > -0.001 ? 65 : 80;

  // ETF Flow signal
  const etfData = val(etfFlows);
  let etfSignal = 50;
  let etfStreak = 0;
  let etfDirection = 'neutral';
  if (Array.isArray(etfData) && etfData.length > 0) {
    // Group by date and sum flows
    const byDate: Record<string, number> = {};
    for (const row of etfData) {
      const d = row.date;
      byDate[d] = (byDate[d] || 0) + (row.flow_usd_millions || 0);
    }
    const sortedDates = Object.keys(byDate).sort().reverse();
    const latestFlow = byDate[sortedDates[0]] || 0;
    // Count streak
    let dir = latestFlow > 0 ? 1 : -1;
    etfStreak = 0;
    for (const d of sortedDates) {
      if ((byDate[d] > 0 && dir > 0) || (byDate[d] < 0 && dir < 0)) etfStreak++;
      else break;
    }
    etfDirection = latestFlow > 0 ? 'inflow' : 'outflow';
    etfSignal = latestFlow > 500 ? 90 : latestFlow > 200 ? 75 : latestFlow > 0 ? 60 : latestFlow > -200 ? 40 : 20;
  }

  // Price momentum signal per asset
  const priceData = val(prices);
  const assets = Array.isArray(priceData) ? priceData : [];

  // ChainScore signal
  const csData = val(chainscores);
  const chainscoreMap: Record<string, number> = {};
  if (Array.isArray(csData)) {
    for (const cs of csData) chainscoreMap[cs.asset_symbol] = cs.total_score;
  }

  // Build per-asset correlation signals
  const assetSignals = assets.map((asset: any) => {
    const symbol = (asset.symbol || '').toUpperCase();
    const priceChange7d = asset.price_change_percentage_7d_in_currency || 0;
    const priceChange30d = asset.price_change_percentage_30d_in_currency || 0;

    // Momentum score (7d + 30d weighted)
    const momentumRaw = (priceChange7d * 0.6 + priceChange30d * 0.4);
    const momentumSignal = clamp(50 + momentumRaw * 2, 0, 100);

    // ChainScore contribution
    const csScore = chainscoreMap[symbol] || 50;

    // Composite CI Signal (weighted blend)
    const ciSignal = Math.round(
      sentimentSignal * 0.20 +   // 20% sentiment (contrarian)
      fundingSignal * 0.15 +     // 15% funding rate
      etfSignal * 0.20 +         // 20% ETF flows
      momentumSignal * 0.25 +    // 25% price momentum
      csScore * 0.20             // 20% ChainScore
    );

    const ciLabel = ciSignal >= 75 ? 'STRONG BUY' : ciSignal >= 60 ? 'BUY' : ciSignal >= 45 ? 'HOLD' : ciSignal >= 30 ? 'REDUCE' : 'SELL';
    const ciColor = ciSignal >= 75 ? 'var(--green)' : ciSignal >= 60 ? 'var(--cyan)' : ciSignal >= 45 ? 'var(--gold)' : 'var(--red)';

    return {
      symbol,
      name: asset.name,
      price: asset.current_price,
      change24h: asset.price_change_percentage_24h,
      change7d: priceChange7d,
      ciSignal,
      ciLabel,
      ciColor,
      components: {
        sentiment: sentimentSignal,
        funding: fundingSignal,
        etfFlow: etfSignal,
        momentum: Math.round(momentumSignal),
        chainScore: csScore,
      },
    };
  });

  // Global CI Signal (weighted average of top 5 assets by market cap)
  const globalSignal = assetSignals.length > 0
    ? Math.round(assetSignals.reduce((s: number, a: any) => s + a.ciSignal, 0) / assetSignals.length)
    : 50;
  const globalLabel = globalSignal >= 75 ? 'RISK ON' : globalSignal >= 60 ? 'CONSTRUCTIVE' : globalSignal >= 45 ? 'NEUTRAL' : globalSignal >= 30 ? 'CAUTIOUS' : 'RISK OFF';

  return NextResponse.json({
    global: { signal: globalSignal, label: globalLabel },
    assets: assetSignals,
    inputs: {
      fearGreed: { value: fngValue, label: fngLabel, signal: sentimentSignal },
      funding: { rate: fundingRate, signal: fundingSignal },
      etf: { signal: etfSignal, streak: etfStreak, direction: etfDirection },
    },
    methodology: 'Sentiment 20% (contrarian) + Funding 15% + ETF Flows 20% + Momentum 25% + ChainScore 20%',
    sources: ['fng-index', 'binance-funding', 'supabase-etf', 'coingecko-markets', 'chainscore-engine'],
    sourceCount: 5,
    timestamp: Date.now(),
  });
}
