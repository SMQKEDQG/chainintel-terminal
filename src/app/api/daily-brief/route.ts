import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// LEVEL UP 5: Daily Intelligence Brief in Terminal
// Surfaces the cron-generated daily brief directly inside the Overview tab

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let briefCache: { data: any; ts: number } | null = null;
const TTL = 300_000; // 5 min

export async function GET() {
  // Return cache if fresh
  if (briefCache && Date.now() - briefCache.ts < TTL) {
    return NextResponse.json(briefCache.data);
  }

  try {
    if (!supabaseKey) {
      return NextResponse.json({ brief: null, source: 'unavailable' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the most recent daily brief
    const { data: briefs, error } = await supabase
      .from('daily_briefs')
      .select('*')
      .order('date', { ascending: false })
      .limit(3);

    if (error || !briefs || briefs.length === 0) {
      return NextResponse.json({ brief: null, source: 'no-data' });
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
    return NextResponse.json({ brief: null, source: 'error' }, { status: 200 });
  }
}
