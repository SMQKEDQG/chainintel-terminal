import { NextResponse } from 'next/server';

/* ───────── Macro Correlation API ─────────
 * Fetches 30-day daily closes from Yahoo Finance (SPX, NASDAQ, DXY, Gold, 10Y, Oil)
 * + BTC from CoinGecko, computes Pearson correlation coefficients.
 * 5-minute in-memory cache to stay within free-tier limits.
 */

interface MacroAsset {
  name: string;
  symbol: string;
  yahooTicker: string;
  value: number;
  change7d: number;
  changeBps?: number;
  changeDir: 'up' | 'dn' | 'flat';
  correlation: number;
  corrLabel: string;
  corrPct: string;
  color: string;
  unit: string;
}

let cache: { data: MacroAsset[]; ts: number; btcPrice: number; btcChange7d: number } | null = null;
const CACHE_MS = 5 * 60 * 1000; // 5 min

/* ── Pearson correlation ── */
function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 5) return 0;
  const xs = x.slice(-n), ys = y.slice(-n);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

function corrLabel(r: number): string {
  const abs = Math.abs(r);
  const dir = r >= 0 ? '↑' : '↓';
  if (abs >= 0.7) return `${r >= 0 ? '+' : ''}${r.toFixed(2)} Strong ${dir}`;
  if (abs >= 0.4) return `${r >= 0 ? '+' : ''}${r.toFixed(2)} Moderate ${dir}`;
  if (abs >= 0.2) return `${r >= 0 ? '+' : ''}${r.toFixed(2)} Weak ${dir}`;
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)} Negligible`;
}

function corrColor(r: number): string {
  if (r >= 0.4) return 'var(--green)';
  if (r <= -0.4) return 'var(--red)';
  if (r >= 0.2) return 'var(--green)';
  if (r <= -0.2) return 'var(--red)';
  return 'var(--text2)';
}

/* ── Yahoo Finance fetcher ── */
async function fetchYahoo(ticker: string): Promise<{ closes: number[]; latest: number; change7d: number; changeBps: number }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1mo&interval=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChainIntelBot/1.0)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Yahoo ${ticker}: ${res.status}`);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo ${ticker}: no data`);
  const closes: number[] = (result.indicators?.quote?.[0]?.close || []).filter((c: any) => c != null);
  if (closes.length < 5) throw new Error(`Yahoo ${ticker}: insufficient data (${closes.length})`);
  const latest = closes[closes.length - 1];
  // 7-day change
  const weekAgo = closes.length >= 5 ? closes[Math.max(0, closes.length - 6)] : closes[0];
  const change7d = ((latest - weekAgo) / weekAgo) * 100;
  const changeBps = (latest - weekAgo) * 100; // for yields: absolute bps change
  return { closes, latest, change7d, changeBps };
}

/* ── BTC from CoinGecko (daily closes) ── */
async function fetchBTC(): Promise<{ closes: number[]; latest: number; change7d: number }> {
  const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30', {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`CoinGecko BTC: ${res.status}`);
  const json = await res.json();
  const prices: [number, number][] = json.prices || [];
  // Resample to daily — take one per day
  const daily: number[] = [];
  let lastDay = -1;
  for (const [ts, price] of prices) {
    const day = Math.floor(ts / 86400000);
    if (day !== lastDay) {
      daily.push(price);
      lastDay = day;
    }
  }
  if (daily.length < 5) throw new Error('CoinGecko BTC: insufficient daily data');
  const latest = daily[daily.length - 1];
  const weekAgo = daily.length >= 7 ? daily[daily.length - 7] : daily[0];
  const change7d = ((latest - weekAgo) / weekAgo) * 100;
  return { closes: daily, latest, change7d };
}

const MACRO_TICKERS = [
  { name: 'S&P 500 (SPX)', symbol: 'SPX', yahooTicker: '^GSPC', unit: '', fmt: (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 }) },
  { name: 'NASDAQ (QQQ)', symbol: 'NDX', yahooTicker: '^IXIC', unit: '', fmt: (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 }) },
  { name: 'DXY (Dollar)', symbol: 'DXY', yahooTicker: 'DX-Y.NYB', unit: '', fmt: (v: number) => v.toFixed(1) },
  { name: 'Gold (XAU)', symbol: 'XAU', yahooTicker: 'GC=F', unit: '$', fmt: (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
  { name: '10Y Treasury', symbol: 'TNX', yahooTicker: '^TNX', unit: '%', fmt: (v: number) => `${v.toFixed(2)}%` },
  { name: 'Crude Oil (WTI)', symbol: 'WTI', yahooTicker: 'CL=F', unit: '$', fmt: (v: number) => `$${v.toFixed(1)}` },
];

export async function GET() {
  // Return cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_MS) {
    return NextResponse.json({ assets: cache.data, btcPrice: cache.btcPrice, btcChange7d: cache.btcChange7d, updatedAt: new Date(cache.ts).toISOString(), live: true });
  }

  try {
    // Fetch BTC + all macro tickers in parallel
    const [btcData, ...macroResults] = await Promise.allSettled([
      fetchBTC(),
      ...MACRO_TICKERS.map(t => fetchYahoo(t.yahooTicker)),
    ]);

    if (btcData.status === 'rejected') {
      throw new Error(`BTC fetch failed: ${btcData.reason}`);
    }

    const btc = btcData.value;
    const assets: MacroAsset[] = [];

    for (let i = 0; i < MACRO_TICKERS.length; i++) {
      const ticker = MACRO_TICKERS[i];
      const result = macroResults[i];

      if (result.status === 'fulfilled') {
        const { closes, latest, change7d, changeBps } = result.value;
        const r = pearson(btc.closes, closes);
        const chgStr = ticker.symbol === 'TNX'
          ? `${change7d >= 0 ? '+' : ''}${(change7d * latest / 100).toFixed(0)}bps 7d`
          : `${change7d >= 0 ? '+' : ''}${change7d.toFixed(1)}% 7d`;

        assets.push({
          name: ticker.name,
          symbol: ticker.symbol,
          yahooTicker: ticker.yahooTicker,
          value: latest,
          change7d,
          changeBps: ticker.symbol === 'TNX' ? changeBps : undefined,
          changeDir: change7d > 0.1 ? 'up' : change7d < -0.1 ? 'dn' : 'flat',
          correlation: parseFloat(r.toFixed(3)),
          corrLabel: corrLabel(r),
          corrPct: `${Math.round(Math.abs(r) * 100)}%`,
          color: corrColor(r),
          unit: ticker.unit,
        });
      }
    }

    if (assets.length === 0) {
      throw new Error('No macro data available');
    }

    cache = { data: assets, ts: Date.now(), btcPrice: btc.latest, btcChange7d: btc.change7d };

    return NextResponse.json({
      assets,
      btcPrice: btc.latest,
      btcChange7d: btc.change7d,
      updatedAt: new Date().toISOString(),
      live: true,
    });
  } catch (err: any) {
    // Return stale cache if available
    if (cache) {
      return NextResponse.json({
        assets: cache.data,
        btcPrice: cache.btcPrice,
        btcChange7d: cache.btcChange7d,
        updatedAt: new Date(cache.ts).toISOString(),
        live: false,
        stale: true,
      });
    }
    return NextResponse.json({ error: err.message || 'Failed to fetch macro data', assets: [] }, { status: 502 });
  }
}
