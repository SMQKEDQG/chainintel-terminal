import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
  try {
    if (!supabaseKey) {
      return NextResponse.json({ items: [], source: 'fallback' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Supabase columns: title, summary, source_name, source_url, regulatory_body,
    //   date_published, credibility_tier, asset_tags, is_published
    const { data: rows, error } = await supabase
      .from('regulatory_cache')
      .select('*')
      .eq('is_published', true)
      .order('date_published', { ascending: false })
      .limit(20);

    if (error || !rows || rows.length === 0) {
      return NextResponse.json({ items: [], source: 'fallback' });
    }

    // Derive sentiment from summary + regulatory body heuristics
    function deriveSentiment(summary: string, body: string): string {
      const s = (summary || '').toLowerCase();
      const bullishKeywords = ['approved', 'cleared', 'advancing', 'dismissed', 'favorable', 'custody', 'commodity', 'classified as commodity'];
      const bearishKeywords = ['warns', 'risk', 'ban', 'restrict', 'enforcement', 'fine', 'penalty', 'systemic'];
      if (bullishKeywords.some(k => s.includes(k))) return 'bullish';
      if (bearishKeywords.some(k => s.includes(k))) return 'bearish';
      return 'neutral';
    }

    const items = rows.map(r => {
      const sentiment = deriveSentiment(r.summary || '', r.regulatory_body || '');
      return {
        headline: r.title || '',
        summary: r.summary || '',
        source: r.source_name || r.regulatory_body || 'Unknown',
        regulatory_body: r.regulatory_body || '',
        date: r.date_published ? new Date(r.date_published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        date_raw: r.date_published || '',
        sentiment,
        tier1: (r.credibility_tier || '').includes('Tier 1'),
        badges: [{ label: r.regulatory_body || 'REG', cls: `rb-${(r.regulatory_body || 'reg').toLowerCase()}` }],
        asset_tags: r.asset_tags || [],
        url: r.source_url || '',
      };
    });

    // AI context from live data
    const bullishCount = items.filter(i => i.sentiment === 'bullish').length;
    const bearishCount = items.filter(i => i.sentiment === 'bearish').length;
    const totalCount = items.length;
    const netSentiment = bullishCount > bearishCount ? 'constructive' : bearishCount > bullishCount ? 'cautious' : 'balanced';

    const aiContext = `Regulatory tracker: ${totalCount} updates monitored. ${bullishCount} bullish, ${bearishCount} bearish — net ${netSentiment} environment. ${items[0]?.headline ? `Latest: ${items[0].headline.substring(0, 80)}...` : ''}`;

    return NextResponse.json({
      items,
      stats: { total: totalCount, bullish: bullishCount, bearish: bearishCount, net: netSentiment },
      aiContext,
      source: 'live',
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Regulatory API error:', err);
    return NextResponse.json({ items: [], source: 'fallback' }, { status: 200 });
  }
}
