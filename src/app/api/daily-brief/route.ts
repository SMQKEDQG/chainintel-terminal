import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// LEVEL UP 5: Daily Intelligence Brief in Terminal
// Surfaces the cron-generated daily brief directly inside the Overview tab

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let briefCache: { data: any; ts: number } | null = null;
const TTL = 300_000; // 5 min
const GENERATED_TTL = 30 * 60_000; // 30 min cache for generated briefs
let generatedCache: { data: any; ts: number } | null = null;

/* ── On-the-fly brief generation ── */
async function generateBrief(): Promise<any> {
  // Return generated cache if still fresh (30 min)
  if (generatedCache && Date.now() - generatedCache.ts < GENERATED_TTL) {
    return generatedCache.data;
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch data in parallel
  const [fngResult, btcResult] = await Promise.allSettled([
    fetch('https://api.alternative.me/fng/?limit=1', { signal: AbortSignal.timeout(5000) }),
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true', { signal: AbortSignal.timeout(5000) }),
  ]);

  // Parse Fear & Greed
  let fngValue = 50;
  let fngLabel = 'Neutral';
  if (fngResult.status === 'fulfilled' && fngResult.value.ok) {
    try {
      const fngJson = await fngResult.value.json();
      const entry = fngJson?.data?.[0];
      if (entry) {
        fngValue = parseInt(entry.value, 10);
        fngLabel = entry.value_classification || 'Neutral';
      }
    } catch { /* use defaults */ }
  }

  // Parse BTC/ETH prices
  let btcPrice = 0;
  let btcChange = 0;
  let ethPrice = 0;
  let ethChange = 0;
  if (btcResult.status === 'fulfilled' && btcResult.value.ok) {
    try {
      const btcJson = await btcResult.value.json();
      btcPrice = btcJson?.bitcoin?.usd || 0;
      btcChange = btcJson?.bitcoin?.usd_24h_change || 0;
      ethPrice = btcJson?.ethereum?.usd || 0;
      ethChange = btcJson?.ethereum?.usd_24h_change || 0;
    } catch { /* use defaults */ }
  }

  // Determine signal from FNG + price action
  const bullishSignals = [
    fngValue > 55,
    btcChange > 1,
    ethChange > 1,
  ].filter(Boolean).length;
  const bearishSignals = [
    fngValue < 40,
    btcChange < -1,
    ethChange < -1,
  ].filter(Boolean).length;

  const signal = bullishSignals >= 2 ? 'BULLISH' : bearishSignals >= 2 ? 'BEARISH' : 'NEUTRAL';

  // Build signals array
  const signals: Array<{ type: string; text: string }> = [];
  if (btcPrice > 0) {
    signals.push({
      type: btcChange >= 0 ? 'bullish' : 'bearish',
      text: `BTC ${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(1)}% 24h — $${btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
    });
  }
  if (ethPrice > 0) {
    signals.push({
      type: ethChange >= 0 ? 'bullish' : 'bearish',
      text: `ETH ${ethChange >= 0 ? '+' : ''}${ethChange.toFixed(1)}% 24h — $${ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
    });
  }
  signals.push({
    type: fngValue < 40 ? 'bearish' : fngValue > 60 ? 'bullish' : 'neutral',
    text: `Fear & Greed Index: ${fngValue} (${fngLabel})`,
  });

  // Build summary
  const fngSentiment = fngValue <= 25 ? 'extreme fear' : fngValue <= 45 ? 'fear' : fngValue <= 55 ? 'neutral' : fngValue <= 75 ? 'greed' : 'extreme greed';
  const summary = [
    btcPrice > 0 ? `BTC trading at $${btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(1)}% 24h).` : '',
    ethPrice > 0 ? `ETH at $${ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${ethChange >= 0 ? '+' : ''}${ethChange.toFixed(1)}% 24h).` : '',
    `Sentiment index at ${fngValue} — ${fngSentiment}.`,
    signal === 'BULLISH' ? 'Risk-on conditions prevailing.' : signal === 'BEARISH' ? 'Risk-off positioning dominant.' : 'Mixed signals — consolidation likely.',
  ].filter(Boolean).join(' ');

  const brief = {
    date: today,
    text: summary,
    sections: {
      'MARKET SNAPSHOT': `BTC $${btcPrice > 0 ? btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'} (${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(1)}%) | ETH $${ethPrice > 0 ? ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'} (${ethChange >= 0 ? '+' : ''}${ethChange.toFixed(1)}%)`,
      'CI SIGNAL': signal,
    },
    marketData: { btcPrice, btcChange, ethPrice, ethChange },
    signal,
    signals,
    keyMetrics: {
      btcPrice,
      btcChange24h: btcChange,
      ethPrice,
      ethChange24h: ethChange,
      fearGreed: fngValue,
      fearGreedLabel: fngLabel,
    },
    generated: true,
  };

  const response = {
    brief,
    previous: null,
    source: 'generated',
    timestamp: Date.now(),
  };

  generatedCache = { data: response, ts: Date.now() };
  return response;
}

export async function GET() {
  // Return cache if fresh
  if (briefCache && Date.now() - briefCache.ts < TTL) {
    return NextResponse.json(briefCache.data);
  }

  try {
    if (!supabaseKey) {
      try {
        const generated = await generateBrief();
        briefCache = { data: generated, ts: Date.now() };
        return NextResponse.json(generated);
      } catch {
        return NextResponse.json({ brief: null, source: 'unavailable' });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the most recent daily brief
    const { data: briefs, error } = await supabase
      .from('daily_briefs')
      .select('*')
      .order('date', { ascending: false })
      .limit(3);

    if (error || !briefs || briefs.length === 0) {
      // Supabase table empty — generate brief on-the-fly
      try {
        const generated = await generateBrief();
        briefCache = { data: generated, ts: Date.now() };
        return NextResponse.json(generated);
      } catch {
        return NextResponse.json({ brief: null, source: 'no-data' });
      }
    }

    const latest = briefs[0];
    const previous = briefs[1] || null;

    // Parse the brief text into sections
    const briefText = latest.brief_text || '';
    const sections: Record<string, string> = {};
    const sectionHeaders = ['MARKET SNAPSHOT', 'OVERNIGHT WHALE ACTIVITY', 'ETF FLOWS', 'REGULATORY PULSE', 'CHAINSCORE SPOTLIGHT', 'CI SIGNAL'];

    for (let i = 0; i < sectionHeaders.length; i++) {
      const start = briefText.indexOf(sectionHeaders[i]);
      if (start === -1) continue;
      const contentStart = start + sectionHeaders[i].length;
      const nextHeader = sectionHeaders.slice(i + 1).find((h: string) => briefText.indexOf(h, contentStart) !== -1);
      const end = nextHeader ? briefText.indexOf(nextHeader, contentStart) : briefText.length;
      sections[sectionHeaders[i]] = briefText.substring(contentStart, end).trim();
    }

    const response = {
      brief: {
        date: latest.date,
        text: briefText,
        sections,
        marketData: latest.market_data || null,
        whaleData: latest.whale_data || null,
        etfData: latest.etf_data || null,
        regulatoryData: latest.regulatory_data || null,
        signal: latest.signal || null,
      },
      previous: previous ? {
        date: previous.date,
        signal: previous.signal || null,
      } : null,
      source: 'supabase',
      timestamp: Date.now(),
    };

    briefCache = { data: response, ts: Date.now() };
    return NextResponse.json(response);
  } catch (err) {
    console.error('Daily brief API error:', err);
    // Try fallback generation before returning error
    try {
      const generated = await generateBrief();
      return NextResponse.json(generated);
    } catch {
      return NextResponse.json({ brief: null, source: 'error' }, { status: 200 });
    }
  }
}
