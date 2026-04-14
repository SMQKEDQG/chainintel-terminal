import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 300_000; // 5 min

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get last 14 days of daily net flows (aggregate by date)
    const { data: flows, error } = await supabase
      .from('etf_flows')
      .select('date, ticker, issuer, fund_name, flow_usd_millions, aum_usd')
      .order('date', { ascending: true });

    if (error) throw error;

    // Aggregate net daily flows
    const dailyNet = new Map<string, number>();
    const latestByTicker = new Map<string, { ticker: string; issuer: string; fund_name: string; flow: number; aum: number }>();

    for (const f of flows || []) {
      const date = f.date;
      const flow = parseFloat(f.flow_usd_millions) || 0;
      dailyNet.set(date, (dailyNet.get(date) || 0) + flow);

      // Track latest entry per ticker
      const existing = latestByTicker.get(f.ticker);
      if (!existing || date > (existing as any).date) {
        latestByTicker.set(f.ticker, {
          ticker: f.ticker,
          issuer: f.issuer,
          fund_name: f.fund_name,
          flow: flow,
          aum: parseFloat(f.aum_usd) || 0,
        });
      }
    }

    // Sort by date
    const dailyFlows = [...dailyNet.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, net]) => ({ date, net: Math.round(net * 10) / 10 }));

    // Latest day breakdown by fund
    const latestDate = dailyFlows.length > 0 ? dailyFlows[dailyFlows.length - 1].date : null;
    const fundBreakdown = latestDate
      ? (flows || []).filter(f => f.date === latestDate).map(f => ({
          ticker: f.ticker,
          issuer: f.issuer,
          fund_name: f.fund_name,
          flow: parseFloat(f.flow_usd_millions) || 0,
          aum: parseFloat(f.aum_usd) || 0,
        }))
      : [];

    // Calculate streak
    let streak = 0;
    for (let i = dailyFlows.length - 1; i >= 0; i--) {
      if (dailyFlows[i].net > 0) streak++;
      else break;
    }

    // 7-day net
    const last7 = dailyFlows.slice(-7);
    const sevenDayNet = last7.reduce((s, d) => s + d.net, 0);

    const result = {
      dailyFlows,
      fundBreakdown: fundBreakdown.sort((a, b) => b.flow - a.flow),
      latestDate,
      streak,
      sevenDayNet: Math.round(sevenDayNet * 10) / 10,
      totalRows: (flows || []).length,
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
