import { NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';

// Aggregates 6 Binance sources: Ticker, Order Book, Futures OI, Funding Rate, Long/Short, Liquidations
// Plus Kraken ticker for cross-exchange validation

interface CacheEntry { data: any; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 30_000; // 30s

async function cachedFetch(key: string, url: string, timeout = 6000): Promise<any> {
  if (cache[key] && Date.now() - cache[key].ts < TTL) return cache[key].data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetchWithRetry(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch { return cache[key]?.data || null; }
}

export async function GET() {
  const [ticker, depth, futuresOI, funding, longShort, liquidations, krakenTicker] = await Promise.allSettled([
    // 1. Binance 24h Ticker (top pairs) — use data-api mirror for geo-compatibility
    cachedFetch('bn-ticker', 'https://data-api.binance.vision/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOTUSDT","LINKUSDT","AVAXUSDT"]'),
    // 2. Binance Order Book Depth (BTC)
    cachedFetch('bn-depth', 'https://data-api.binance.vision/api/v3/depth?symbol=BTCUSDT&limit=20'),
    // 3. Binance Futures Open Interest
    cachedFetch('bn-oi', 'https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT'),
    // 4. Binance Funding Rate
    cachedFetch('bn-fund', 'https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=5'),
    // 5. Binance Long/Short Ratio
    cachedFetch('bn-ls', 'https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=5'),
    // 6. Binance Liquidations (recent)
    cachedFetch('bn-liq', 'https://fapi.binance.com/fapi/v1/allForceOrders?symbol=BTCUSDT&limit=20'),
    // 7. Kraken Ticker (cross-exchange validation)
    cachedFetch('kr-ticker', 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD'),
  ]);

  const getValue = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

  // Parse Binance ticker into clean format
  const tickerData = getValue(ticker);
  const parsedTicker = Array.isArray(tickerData) ? tickerData.map((t: any) => ({
    symbol: t.symbol?.replace('USDT', ''),
    price: parseFloat(t.lastPrice),
    change24h: parseFloat(t.priceChangePercent),
    volume24h: parseFloat(t.quoteVolume),
    high24h: parseFloat(t.highPrice),
    low24h: parseFloat(t.lowPrice),
    trades: parseInt(t.count),
  })) : [];

  // Parse order book depth
  const depthData = getValue(depth);
  const parsedDepth = depthData ? {
    bidTotal: depthData.bids?.reduce((s: number, b: any) => s + parseFloat(b[0]) * parseFloat(b[1]), 0) || 0,
    askTotal: depthData.asks?.reduce((s: number, a: any) => s + parseFloat(a[0]) * parseFloat(a[1]), 0) || 0,
    topBids: depthData.bids?.slice(0, 5).map((b: any) => ({ price: parseFloat(b[0]), qty: parseFloat(b[1]) })) || [],
    topAsks: depthData.asks?.slice(0, 5).map((a: any) => ({ price: parseFloat(a[0]), qty: parseFloat(a[1]) })) || [],
    spread: depthData.asks?.[0] && depthData.bids?.[0] ? (parseFloat(depthData.asks[0][0]) - parseFloat(depthData.bids[0][0])).toFixed(2) : '0',
  } : null;

  // Parse futures data
  const oiData = getValue(futuresOI);
  const fundingData = getValue(funding);
  const lsData = getValue(longShort);
  const liqData = getValue(liquidations);

  const parsedFutures = {
    openInterest: oiData ? parseFloat(oiData.openInterest) : null,
    openInterestUsd: oiData ? parseFloat(oiData.openInterest) * (parsedTicker[0]?.price || 70000) : null,
    fundingRate: fundingData?.[0] ? parseFloat(fundingData[0].fundingRate) : null,
    fundingHistory: Array.isArray(fundingData) ? fundingData.map((f: any) => ({
      rate: parseFloat(f.fundingRate),
      time: f.fundingTime,
    })) : [],
    longShortRatio: lsData?.[0] ? parseFloat(lsData[0].longShortRatio) : null,
    longAccount: lsData?.[0] ? parseFloat(lsData[0].longAccount) : null,
    shortAccount: lsData?.[0] ? parseFloat(lsData[0].shortAccount) : null,
    recentLiquidations: Array.isArray(liqData) ? liqData.slice(0, 10).map((l: any) => ({
      side: l.side,
      price: parseFloat(l.price),
      qty: parseFloat(l.origQty),
      usd: parseFloat(l.price) * parseFloat(l.origQty),
      time: l.time,
    })) : [],
    totalLiqUsd24h: Array.isArray(liqData) ? liqData.reduce((s: number, l: any) => s + parseFloat(l.price) * parseFloat(l.origQty), 0) : 0,
  };

  // Parse Kraken for cross-exchange validation
  const krakenData = getValue(krakenTicker);
  const krakenResult = krakenData?.result || {};
  const parsedKraken = {
    btcPrice: krakenResult?.XXBTZUSD?.c?.[0] ? parseFloat(krakenResult.XXBTZUSD.c[0]) : null,
    ethPrice: krakenResult?.XETHZUSD?.c?.[0] ? parseFloat(krakenResult.XETHZUSD.c[0]) : null,
  };

  return NextResponse.json({
    ticker: parsedTicker,
    depth: parsedDepth,
    futures: parsedFutures,
    kraken: parsedKraken,
    sources: ['binance-ticker', 'binance-depth', 'binance-futures-oi', 'binance-funding', 'binance-long-short', 'binance-liquidation', 'kraken-ticker'],
    sourceCount: 7,
    timestamp: Date.now(),
  });
}
