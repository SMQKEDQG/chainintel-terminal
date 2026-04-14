import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// LEVEL UP 3: Smart Alerts Engine
// Monitors threshold conditions and returns active alerts
// Whale moves >$10M, funding rate flip, ETF streak break, regulatory actions

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface CacheEntry { data: any; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 30_000;

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

interface Alert {
  id: string;
  type: 'whale' | 'funding' | 'etf' | 'regulatory' | 'liquidation' | 'price' | 'sentiment';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  value: string;
  timestamp: number;
  source: string;
}

export async function GET() {
  const alerts: Alert[] = [];

  // Gather all data sources in parallel
  const [liquidations, funding, fng, prices, regData, etfData] = await Promise.allSettled([
    cachedFetch('sa-liq', 'https://fapi.binance.com/fapi/v1/allForceOrders?symbol=BTCUSDT&limit=50'),
    cachedFetch('sa-fund', 'https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=3'),
    cachedFetch('sa-fng', 'https://api.alternative.me/fng/?limit=2'),
    cachedFetch('sa-prices', 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,ripple&order=market_cap_desc&price_change_percentage=1h,24h'),
    supabaseKey ? (async () => {
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data } = await sb.from('regulatory_cache').select('*').order('date_published', { ascending: false }).limit(5);
      return data;
    })() : Promise.resolve(null),
    supabaseKey ? (async () => {
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data } = await sb.from('etf_flows').select('*').order('date', { ascending: false }).limit(15);
      return data;
    })() : Promise.resolve(null),
  ]);

  const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;
  const now = Date.now();

  // 1. LIQUIDATION ALERTS (>$1M in recent liquidations)
  const liqData = val(liquidations);
  if (Array.isArray(liqData) && liqData.length > 0) {
    const totalLiqUsd = liqData.reduce((s: number, l: any) => s + parseFloat(l.price) * parseFloat(l.origQty), 0);
    if (totalLiqUsd > 1_000_000) {
      const longLiqs = liqData.filter((l: any) => l.side === 'SELL');
      const shortLiqs = liqData.filter((l: any) => l.side === 'BUY');
      alerts.push({
        id: `liq-${now}`, type: 'liquidation', severity: totalLiqUsd > 5_000_000 ? 'critical' : 'warning',
        title: `BTC Liquidation Cascade: $${(totalLiqUsd / 1e6).toFixed(1)}M`,
        description: `${longLiqs.length} long liquidations ($${(longLiqs.reduce((s: number, l: any) => s + parseFloat(l.price) * parseFloat(l.origQty), 0) / 1e6).toFixed(1)}M) and ${shortLiqs.length} short liquidations in recent window.`,
        value: `$${(totalLiqUsd / 1e6).toFixed(1)}M`, timestamp: now, source: 'Binance Futures',
      });
    }
  }

  // 2. FUNDING RATE ALERTS (extreme positive or negative)
  const fundData = val(funding);
  if (Array.isArray(fundData) && fundData.length >= 2) {
    const currentRate = parseFloat(fundData[0].fundingRate);
    const prevRate = parseFloat(fundData[1].fundingRate);
    if (Math.abs(currentRate) > 0.001) {
      alerts.push({
        id: `fund-${now}`, type: 'funding', severity: Math.abs(currentRate) > 0.003 ? 'critical' : 'warning',
        title: `BTC Funding Rate ${currentRate > 0 ? 'Elevated' : 'Negative'}: ${(currentRate * 100).toFixed(4)}%`,
        description: currentRate > 0 ? 'Longs paying shorts — market overheated. Watch for potential long squeeze.' : 'Shorts paying longs — capitulation signal. Historically precedes relief rally.',
        value: `${(currentRate * 100).toFixed(4)}%`, timestamp: now, source: 'Binance Futures',
      });
    }
    // Funding rate flip detection
    if ((currentRate > 0 && prevRate < 0) || (currentRate < 0 && prevRate > 0)) {
      alerts.push({
        id: `fund-flip-${now}`, type: 'funding', severity: 'critical',
        title: 'Funding Rate Flip Detected',
        description: `BTC funding flipped from ${prevRate > 0 ? 'positive' : 'negative'} to ${currentRate > 0 ? 'positive' : 'negative'}. Major sentiment shift in derivatives market.`,
        value: `${(prevRate * 100).toFixed(4)}% → ${(currentRate * 100).toFixed(4)}%`, timestamp: now, source: 'Binance Futures',
      });
    }
  }

  // 3. FEAR & GREED EXTREMES
  const fngResult = val(fng);
  if (fngResult?.data?.[0]) {
    const current = parseInt(fngResult.data[0].value);
    if (current <= 20 || current >= 80) {
      alerts.push({
        id: `fng-${now}`, type: 'sentiment', severity: 'warning',
        title: `Extreme ${current <= 20 ? 'Fear' : 'Greed'}: ${current}/100`,
        description: current <= 20 ? 'Market in extreme fear — historically a strong contrarian buy signal within 30-90 day horizon.' : 'Market in extreme greed — increased correction risk. Consider reducing leveraged positions.',
        value: `${current}/100`, timestamp: now, source: 'Alternative.me',
      });
    }
  }

  // 4. PRICE ALERTS (>5% 24h move on majors)
  const priceData = val(prices);
  if (Array.isArray(priceData)) {
    for (const coin of priceData) {
      const change = coin.price_change_percentage_24h || 0;
      if (Math.abs(change) > 5) {
        alerts.push({
          id: `price-${coin.symbol}-${now}`, type: 'price', severity: Math.abs(change) > 10 ? 'critical' : 'warning',
          title: `${coin.symbol.toUpperCase()} ${change > 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}% in 24h`,
          description: `${coin.name} trading at $${coin.current_price?.toLocaleString()} — ${change > 0 ? 'major rally' : 'significant selloff'}. Volume: $${(coin.total_volume / 1e9).toFixed(1)}B.`,
          value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`, timestamp: now, source: 'CoinGecko',
        });
      }
    }
  }

  // 5. REGULATORY ALERTS (new items in last 24h)
  const regItems = val(regData);
  if (Array.isArray(regItems)) {
    const recent = regItems.filter((r: any) => {
      const pub = new Date(r.date_published);
      return now - pub.getTime() < 86400_000;
    });
    if (recent.length > 0) {
      alerts.push({
        id: `reg-${now}`, type: 'regulatory', severity: 'info',
        title: `${recent.length} New Regulatory Update${recent.length > 1 ? 's' : ''}`,
        description: recent[0]?.title || 'New regulatory development detected.',
        value: `${recent.length} items`, timestamp: now, source: 'ChainIntel Regulatory DB',
      });
    }
  }

  // 6. ETF FLOW STREAK ALERTS
  const etfItems = val(etfData);
  if (Array.isArray(etfItems) && etfItems.length > 0) {
    const byDate: Record<string, number> = {};
    for (const row of etfItems) byDate[row.date] = (byDate[row.date] || 0) + (row.flow_usd_millions || 0);
    const sortedDates = Object.keys(byDate).sort().reverse();
    if (sortedDates.length > 0) {
      const latestFlow = byDate[sortedDates[0]];
      const dir = latestFlow > 0 ? 1 : -1;
      let streak = 0;
      for (const d of sortedDates) {
        if ((byDate[d] > 0 && dir > 0) || (byDate[d] < 0 && dir < 0)) streak++;
        else break;
      }
      if (streak >= 5 || Math.abs(latestFlow) > 500) {
        alerts.push({
          id: `etf-${now}`, type: 'etf', severity: streak >= 7 ? 'critical' : 'warning',
          title: `ETF ${latestFlow > 0 ? 'Inflow' : 'Outflow'} Streak: ${streak} Days`,
          description: `Net flow: $${latestFlow.toFixed(0)}M on latest day. ${streak}-day consecutive ${latestFlow > 0 ? 'inflow' : 'outflow'} streak.`,
          value: `$${latestFlow.toFixed(0)}M · ${streak}d streak`, timestamp: now, source: 'ChainIntel ETF DB',
        });
      }
    }
  }

  // Sort by severity then timestamp
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

  return NextResponse.json({
    alerts,
    count: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warnings: alerts.filter(a => a.severity === 'warning').length,
    sources: ['binance-liquidation', 'binance-funding', 'fng-index', 'coingecko-markets', 'supabase-reg', 'supabase-etf'],
    sourceCount: 6,
    timestamp: now,
  });
}
