import { NextResponse } from 'next/server';

interface Anomaly {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  asset?: string;
  value: string;
}

async function safeFetch(url: string): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

let scanCache: { data: Anomaly[]; ts: number } | null = null;
const SCAN_TTL = 120_000; // 2 min

export async function GET() {
  if (scanCache && Date.now() - scanCache.ts < SCAN_TTL) {
    return NextResponse.json({ anomalies: scanCache.data });
  }

  const anomalies: Anomaly[] = [];

  const [marketData, sentimentData, derivData] = await Promise.allSettled([
    safeFetch('https://api.coinpaprika.com/v1/tickers?quotes=USD'),
    safeFetch('https://api.alternative.me/fng/?limit=1'),
    safeFetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT'),
  ]);

  // 1. Price spikes — any top-50 asset moves >8% in 24h
  const tickers = marketData.status === 'fulfilled' && Array.isArray(marketData.value) ? marketData.value : [];
  const top50 = tickers.filter((t: any) => t.rank > 0 && t.rank <= 50).sort((a: any, b: any) => a.rank - b.rank);
  for (const t of top50) {
    const chg = t.quotes?.USD?.percent_change_24h || 0;
    if (Math.abs(chg) > 8) {
      anomalies.push({
        type: 'price_spike',
        severity: Math.abs(chg) > 15 ? 'critical' : 'warning',
        title: `${t.symbol} ${chg > 0 ? 'surge' : 'crash'}: ${chg >= 0 ? '+' : ''}${chg.toFixed(1)}%`,
        detail: `${t.name} (rank #${t.rank}) moved ${Math.abs(chg).toFixed(1)}% in 24h — significant price anomaly detected.`,
        asset: t.symbol,
        value: `${chg >= 0 ? '+' : ''}${chg.toFixed(1)}%`,
      });
    }
  }

  // 2. Volume surge — volume > 3x typical for that rank tier
  for (const t of top50.slice(0, 30)) {
    const vol = t.quotes?.USD?.volume_24h || 0;
    const mcap = t.quotes?.USD?.market_cap || 0;
    if (mcap > 0 && vol / mcap > 0.3) {
      anomalies.push({
        type: 'volume_surge',
        severity: 'warning',
        title: `${t.symbol} volume surge — ${((vol / mcap) * 100).toFixed(0)}% of MCAP`,
        detail: `${t.name} 24h volume ($${(vol / 1e9).toFixed(2)}B) is ${((vol / mcap) * 100).toFixed(0)}% of market cap — unusually high trading activity.`,
        asset: t.symbol,
        value: `${((vol / mcap) * 100).toFixed(0)}% v/mc`,
      });
    }
  }

  // 3. Funding rate extreme
  const fundingData = derivData.status === 'fulfilled' ? derivData.value : null;
  if (fundingData?.lastFundingRate) {
    const rate = parseFloat(fundingData.lastFundingRate);
    if (rate > 0.0005 || rate < -0.0003) {
      anomalies.push({
        type: 'funding_extreme',
        severity: rate > 0.001 || rate < -0.0005 ? 'critical' : 'warning',
        title: `BTC funding rate ${rate > 0 ? 'extremely positive' : 'deeply negative'}`,
        detail: `BTC perpetual funding: ${(rate * 100).toFixed(4)}%. ${rate > 0 ? 'Longs heavily paying shorts — over-leveraged longs risk liquidation cascade.' : 'Shorts paying premium — bearish positioning at extreme levels.'}`,
        asset: 'BTC',
        value: `${(rate * 100).toFixed(4)}%`,
      });
    }
  }

  // 4. Fear & Greed extreme
  const fngData = sentimentData.status === 'fulfilled' ? sentimentData.value : null;
  const fngValue = fngData?.data?.[0]?.value ? parseInt(fngData.data[0].value) : null;
  if (fngValue !== null && (fngValue < 15 || fngValue > 85)) {
    anomalies.push({
      type: 'sentiment_extreme',
      severity: fngValue < 10 || fngValue > 90 ? 'critical' : 'warning',
      title: fngValue < 15 ? `Extreme Fear: ${fngValue}/100` : `Extreme Greed: ${fngValue}/100`,
      detail: fngValue < 15
        ? `Fear & Greed Index at ${fngValue} — historically, readings below 15 have preceded 40-60% rallies within 3-6 months.`
        : `Fear & Greed Index at ${fngValue} — historically, readings above 85 precede corrections. Consider risk management.`,
      value: `${fngValue}/100`,
    });
  }

  // Sort by severity
  const sevOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  anomalies.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  scanCache = { data: anomalies, ts: Date.now() };
  return NextResponse.json({ anomalies });
}
