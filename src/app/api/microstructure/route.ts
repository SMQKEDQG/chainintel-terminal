import { NextResponse } from 'next/server';

// LEVEL UP 4: Market Microstructure Dashboard
// Order book depth, liquidation cascades, exchange flow divergence
// The on-chain edge Bloomberg architecturally cannot replicate

interface CacheEntry { data: any; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 15_000; // 15s — microstructure needs to be fast

async function cachedFetch(key: string, url: string): Promise<any> {
  if (cache[key] && Date.now() - cache[key].ts < TTL) return cache[key].data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch { return cache[key]?.data || null; }
}

export async function GET() {
  const [btcDepth, ethDepth, btcLiqs, ethLiqs, btcOI, ethOI, btcFunding, btcLS, btcTrades] = await Promise.allSettled([
    // Order Book Depth (20 levels)
    cachedFetch('btc-depth', 'https://data-api.binance.vision/api/v3/depth?symbol=BTCUSDT&limit=20'),
    cachedFetch('eth-depth', 'https://data-api.binance.vision/api/v3/depth?symbol=ETHUSDT&limit=20'),
    // Liquidations
    cachedFetch('btc-liq', 'https://fapi.binance.com/fapi/v1/allForceOrders?symbol=BTCUSDT&limit=50'),
    cachedFetch('eth-liq', 'https://fapi.binance.com/fapi/v1/allForceOrders?symbol=ETHUSDT&limit=30'),
    // Open Interest
    cachedFetch('btc-oi', 'https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT'),
    cachedFetch('eth-oi', 'https://fapi.binance.com/fapi/v1/openInterest?symbol=ETHUSDT'),
    // Funding
    cachedFetch('btc-fr', 'https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=10'),
    // Long/Short
    cachedFetch('btc-ls', 'https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=12'),
    // Recent trades for flow analysis
    cachedFetch('btc-trades', 'https://data-api.binance.vision/api/v3/trades?symbol=BTCUSDT&limit=100'),
  ]);

  const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

  // Parse order book into heatmap-ready data
  function parseDepth(data: any, currentPrice?: number) {
    if (!data) return null;
    const bids = (data.bids || []).map((b: any) => ({ price: parseFloat(b[0]), qty: parseFloat(b[1]), usd: parseFloat(b[0]) * parseFloat(b[1]) }));
    const asks = (data.asks || []).map((a: any) => ({ price: parseFloat(a[0]), qty: parseFloat(a[1]), usd: parseFloat(a[0]) * parseFloat(a[1]) }));
    const bidWall = bids.reduce((max: any, b: any) => b.usd > (max?.usd || 0) ? b : max, null);
    const askWall = asks.reduce((max: any, a: any) => a.usd > (max?.usd || 0) ? a : max, null);
    const bidTotal = bids.reduce((s: number, b: any) => s + b.usd, 0);
    const askTotal = asks.reduce((s: number, a: any) => s + a.usd, 0);
    const imbalance = bidTotal + askTotal > 0 ? ((bidTotal - askTotal) / (bidTotal + askTotal) * 100).toFixed(1) : '0';
    return {
      bids: bids.slice(0, 10),
      asks: asks.slice(0, 10),
      bidWall: bidWall ? { price: bidWall.price, usd: bidWall.usd } : null,
      askWall: askWall ? { price: askWall.price, usd: askWall.usd } : null,
      bidTotal: Math.round(bidTotal),
      askTotal: Math.round(askTotal),
      imbalance: parseFloat(imbalance),
      spread: asks[0] && bids[0] ? +(asks[0].price - bids[0].price).toFixed(2) : 0,
      midPrice: asks[0] && bids[0] ? +((asks[0].price + bids[0].price) / 2).toFixed(2) : 0,
    };
  }

  // Parse liquidations into cascade analysis
  function parseLiquidations(data: any) {
    if (!Array.isArray(data)) return { events: [], totalLong: 0, totalShort: 0, cascadeRisk: 'LOW' };
    const events = data.map((l: any) => ({
      side: l.side,
      price: parseFloat(l.price),
      qty: parseFloat(l.origQty),
      usd: parseFloat(l.price) * parseFloat(l.origQty),
      time: l.time,
    }));
    const totalLong = events.filter((e: any) => e.side === 'SELL').reduce((s: number, e: any) => s + e.usd, 0);
    const totalShort = events.filter((e: any) => e.side === 'BUY').reduce((s: number, e: any) => s + e.usd, 0);
    // Cascade risk: if >$5M liquidated in recent batch, risk is HIGH
    const total = totalLong + totalShort;
    const cascadeRisk = total > 5_000_000 ? 'HIGH' : total > 1_000_000 ? 'MEDIUM' : 'LOW';
    return { events: events.slice(0, 15), totalLong: Math.round(totalLong), totalShort: Math.round(totalShort), cascadeRisk };
  }

  // Parse trade flow (buy vs sell pressure from recent trades)
  function parseTradeFlow(data: any) {
    if (!Array.isArray(data)) return null;
    let buyVolume = 0, sellVolume = 0;
    for (const t of data) {
      const vol = parseFloat(t.price) * parseFloat(t.qty);
      if (t.isBuyerMaker) sellVolume += vol; else buyVolume += vol;
    }
    const total = buyVolume + sellVolume || 1;
    return {
      buyVolume: Math.round(buyVolume),
      sellVolume: Math.round(sellVolume),
      buyPressure: +((buyVolume / total) * 100).toFixed(1),
      sellPressure: +((sellVolume / total) * 100).toFixed(1),
      netFlow: buyVolume > sellVolume ? 'BUY DOMINANT' : 'SELL DOMINANT',
    };
  }

  // Parse long/short history
  const lsData = val(btcLS);
  const longShortHistory = Array.isArray(lsData) ? lsData.map((l: any) => ({
    ratio: parseFloat(l.longShortRatio),
    longPct: parseFloat(l.longAccount),
    shortPct: parseFloat(l.shortAccount),
    time: l.timestamp,
  })) : [];

  // Parse funding history
  const frData = val(btcFunding);
  const fundingHistory = Array.isArray(frData) ? frData.map((f: any) => ({
    rate: parseFloat(f.fundingRate),
    time: f.fundingTime,
    annualized: +(parseFloat(f.fundingRate) * 3 * 365 * 100).toFixed(2),
  })) : [];

  return NextResponse.json({
    orderBook: {
      btc: parseDepth(val(btcDepth)),
      eth: parseDepth(val(ethDepth)),
    },
    liquidations: {
      btc: parseLiquidations(val(btcLiqs)),
      eth: parseLiquidations(val(ethLiqs)),
    },
    openInterest: {
      btc: val(btcOI) ? { oi: parseFloat(val(btcOI).openInterest), symbol: 'BTCUSDT' } : null,
      eth: val(ethOI) ? { oi: parseFloat(val(ethOI).openInterest), symbol: 'ETHUSDT' } : null,
    },
    tradeFlow: parseTradeFlow(val(btcTrades)),
    fundingHistory,
    longShortHistory,
    sources: ['binance-depth', 'binance-liquidation', 'binance-futures-oi', 'binance-funding', 'binance-long-short', 'binance-trades'],
    sourceCount: 6,
    timestamp: Date.now(),
  });
}
