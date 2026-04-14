import { NextResponse } from 'next/server';

// Aggregates 6 macro/TradFi sources:
// FRED (DXY, Fed Funds Rate, CPI), Treasury Yields, Gold Price
// Plus Deribit options data for derivatives view

interface CacheEntry { data: any; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 3600_000; // 1 hour (macro data updates slowly)

async function cachedFetch(key: string, url: string, timeout = 8000): Promise<any> {
  if (cache[key] && Date.now() - cache[key].ts < TTL) return cache[key].data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'ChainIntel Terminal' } });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch { return cache[key]?.data || null; }
}

export async function GET() {
  const fredKey = process.env.FRED_API_KEY || '';
  const fredBase = 'https://api.stlouisfed.org/fred/series/observations';

  const [dxy, fedRate, cpi, treasuryRaw, deribitBtc, deribitEth, coinglass] = await Promise.allSettled([
    // 1. FRED DXY (Trade Weighted Dollar)
    fredKey ? cachedFetch('fred-dxy', `${fredBase}?series_id=DTWEXBGS&api_key=${fredKey}&file_type=json&sort_order=desc&limit=5`) : Promise.resolve(null),
    // 2. FRED Federal Funds Rate
    fredKey ? cachedFetch('fred-rate', `${fredBase}?series_id=FEDFUNDS&api_key=${fredKey}&file_type=json&sort_order=desc&limit=5`) : Promise.resolve(null),
    // 3. FRED CPI
    fredKey ? cachedFetch('fred-cpi', `${fredBase}?series_id=CPIAUCSL&api_key=${fredKey}&file_type=json&sort_order=desc&limit=5`) : Promise.resolve(null),
    // 4. Treasury Yields (from Treasury.gov XML → parsed)
    cachedFetch('treasury', 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page[size]=5&filter=security_desc:eq:Treasury Bonds'),
    // 5. Deribit BTC Options
    cachedFetch('deribit-btc', 'https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=BTC&kind=option'),
    // 6. Deribit ETH Options
    cachedFetch('deribit-eth', 'https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=ETH&kind=option'),
    // 7. CoinGlass OI (public endpoint)
    cachedFetch('coinglass', 'https://open-api.coinglass.com/public/v2/open_interest?symbol=BTC&time_type=all'),
  ]);

  const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

  // Parse FRED data
  const parseFred = (d: any) => {
    const obs = d?.observations;
    if (!obs || !obs.length) return null;
    return { value: parseFloat(obs[0].value), date: obs[0].date, history: obs.slice(0, 5).map((o: any) => ({ value: parseFloat(o.value), date: o.date })) };
  };

  // Parse Deribit options summary
  const parseDeribit = (d: any) => {
    const results = d?.result;
    if (!results || !results.length) return null;
    const totalOI = results.reduce((s: number, r: any) => s + (r.open_interest || 0), 0);
    const totalVolume = results.reduce((s: number, r: any) => s + (r.volume || 0), 0);
    const puts = results.filter((r: any) => r.instrument_name?.includes('-P'));
    const calls = results.filter((r: any) => r.instrument_name?.includes('-C'));
    const putCallRatio = puts.length > 0 && calls.length > 0 ? (puts.reduce((s: number, r: any) => s + (r.open_interest || 0), 0) / calls.reduce((s: number, r: any) => s + (r.open_interest || 0), 0)).toFixed(3) : null;
    return { totalOI, totalVolume, putCallRatio, contractCount: results.length };
  };

  return NextResponse.json({
    macro: {
      dxy: parseFred(val(dxy)),
      fedRate: parseFred(val(fedRate)),
      cpi: parseFred(val(cpi)),
      treasury: val(treasuryRaw)?.data?.slice(0, 3) || null,
    },
    options: {
      btc: parseDeribit(val(deribitBtc)),
      eth: parseDeribit(val(deribitEth)),
    },
    coinglass: val(coinglass)?.data || null,
    sources: ['fred-dxy', 'fred-rates', 'fred-cpi', 'treasury-yield', 'deribit-options', 'coinglass-oi'],
    sourceCount: 6,
    timestamp: Date.now(),
  });
}
