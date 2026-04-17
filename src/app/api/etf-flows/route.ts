import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 300_000; // 5 min

type EtfAsset = 'btc' | 'eth';

const ETF_TICKER_GROUPS: Record<EtfAsset, Set<string>> = {
  btc: new Set(['IBIT', 'FBTC', 'BITB', 'ARKB', 'BTCO', 'EZBC', 'BRRR', 'HODL', 'BTCW', 'MSBT', 'GBTC', 'BTC']),
  eth: new Set(['ETHA', 'ETHB', 'FETH', 'ETHW', 'TETH', 'ETHV', 'QETH', 'EZET', 'ETHE', 'ETH', 'CETH']),
};

function classifyTicker(ticker: string): EtfAsset | null {
  const normalized = ticker.toUpperCase();
  if (ETF_TICKER_GROUPS.btc.has(normalized)) return 'btc';
  if (ETF_TICKER_GROUPS.eth.has(normalized)) return 'eth';
  return null;
}

function buildAssetAggregate(flows: any[]) {
  const dailyNet = new Map<string, number>();

  for (const f of flows) {
    const date = f.date;
    const flow = parseFloat(f.flow_usd_millions) || 0;
    dailyNet.set(date, (dailyNet.get(date) || 0) + flow);
  }

  const dailyFlows = [...dailyNet.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, net]) => ({ date, net: Math.round(net * 10) / 10 }));

  const latestDate = dailyFlows.length > 0 ? dailyFlows[dailyFlows.length - 1].date : null;
  const fundBreakdown = latestDate
    ? flows
        .filter((f) => f.date === latestDate)
        .map((f) => ({
          ticker: f.ticker,
          issuer: f.issuer,
          fund_name: f.fund_name,
          flow: parseFloat(f.flow_usd_millions) || 0,
          aum: parseFloat(f.aum_usd) || 0,
        }))
        .sort((a, b) => b.flow - a.flow)
    : [];

  let streak = 0;
  if (dailyFlows.length > 0) {
    const latestDirection = Math.sign(dailyFlows[dailyFlows.length - 1].net);
    if (latestDirection !== 0) {
      for (let i = dailyFlows.length - 1; i >= 0; i--) {
        if (Math.sign(dailyFlows[i].net) === latestDirection) streak++;
        else break;
      }
    }
  }

  const last7 = dailyFlows.slice(-7);
  const sevenDayNet = last7.reduce((sum, item) => sum + item.net, 0);
  const totalAum = fundBreakdown.reduce((sum, item) => sum + item.aum, 0);
  const latestNetFlow = latestDate ? fundBreakdown.reduce((sum, item) => sum + item.flow, 0) : 0;

  return {
    dailyFlows,
    fundBreakdown,
    latestDate,
    streak,
    sevenDayNet: Math.round(sevenDayNet * 10) / 10,
    totalAum,
    latestNetFlow: Math.round(latestNetFlow * 10) / 10,
    totalRows: flows.length,
  };
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all ETF rows and classify into supported assets
    const { data: flows, error } = await supabase
      .from('etf_flows')
      .select('date, ticker, issuer, fund_name, flow_usd_millions, aum_usd')
      .order('date', { ascending: true });

    if (error) throw error;
    const grouped = {
      btc: [] as any[],
      eth: [] as any[],
    };

    for (const flow of flows || []) {
      const asset = classifyTicker(flow.ticker || '');
      if (asset) grouped[asset].push(flow);
    }

    const btc = buildAssetAggregate(grouped.btc);
    const eth = buildAssetAggregate(grouped.eth);

    const result = {
      dailyFlows: btc.dailyFlows,
      fundBreakdown: btc.fundBreakdown,
      latestDate: btc.latestDate,
      streak: btc.streak,
      sevenDayNet: btc.sevenDayNet,
      totalRows: btc.totalRows,
      totalAum: btc.totalAum,
      latestNetFlow: btc.latestNetFlow,
      assets: {
        btc,
        eth,
      },
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result, { headers: { 'X-Cache': 'MISS' } });
  } catch (err: any) {
    if (cache) {
      return NextResponse.json(cache.data, { headers: { 'X-Cache': 'STALE' } });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
