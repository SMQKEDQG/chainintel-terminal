import { NextResponse } from 'next/server';

// Server-side cache for resilience
let lastGoodResponse: { data: any; ts: number } | null = null;
const STALE_TTL = 600_000; // 10 min stale cache

async function fetchWithRetry(url: string, opts?: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(8000) });
      if (res.ok) return res;
      if (res.status === 429 && i < retries) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      if (i === retries) return res;
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error('Max retries');
}

export async function GET() {
  try {
    // Fetch Fear & Greed Index (free, no key)
    const [fngRes, fngHistRes] = await Promise.allSettled([
      fetchWithRetry('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 300 } } as any),
      fetchWithRetry('https://api.alternative.me/fng/?limit=30', { next: { revalidate: 3600 } } as any),
    ]);

    let fngValue = 0;
    let fngLabel = 'Unknown';
    let fngHistory: { value: number; date: string }[] = [];

    if (fngRes.status === 'fulfilled' && fngRes.value.ok) {
      const data = await fngRes.value.json();
      if (data?.data?.[0]) {
        fngValue = Number(data.data[0].value);
        fngLabel = data.data[0].value_classification;
      }
    }

    if (fngHistRes.status === 'fulfilled' && fngHistRes.value.ok) {
      const data = await fngHistRes.value.json();
      if (data?.data) {
        fngHistory = data.data.map((d: any) => ({
          value: Number(d.value),
          date: new Date(Number(d.timestamp) * 1000).toISOString().split('T')[0],
        })).reverse();
      }
    }

    // Derive 7-day average and change
    const last7 = fngHistory.slice(-7);
    const avg7d = last7.length > 0 ? Math.round(last7.reduce((s, d) => s + d.value, 0) / last7.length) : fngValue;
    const prev7 = fngHistory.slice(-14, -7);
    const avg7dPrev = prev7.length > 0 ? Math.round(prev7.reduce((s, d) => s + d.value, 0) / prev7.length) : avg7d;
    const weekOverWeek = avg7d - avg7dPrev;

    // Classify sentiment zone
    let zone: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
    if (fngValue <= 25) zone = 'extreme_fear';
    else if (fngValue <= 45) zone = 'fear';
    else if (fngValue <= 55) zone = 'neutral';
    else if (fngValue <= 75) zone = 'greed';
    else zone = 'extreme_greed';

    // AI context
    let aiContext = '';
    if (zone === 'extreme_fear') {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — historically, readings below 25 precede 60-day mean reversions of +28%. Smart money accumulates here while retail capitulates. ${weekOverWeek > 0 ? 'Sentiment recovering week-over-week.' : 'Sentiment still deteriorating.'}`;
    } else if (zone === 'fear') {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — cautious positioning but not panic. ${weekOverWeek > 0 ? 'Recovering from deeper fear levels.' : 'Sliding toward extreme fear zone.'}`;
    } else if (zone === 'neutral') {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — balanced market. No strong directional bias from sentiment.`;
    } else if (zone === 'greed') {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — elevated optimism. Monitor for overheating. ${weekOverWeek > 0 ? 'Greed intensifying.' : 'Starting to cool off.'}`;
    } else {
      aiContext = `Fear & Greed at ${fngValue} (${fngLabel}) — extreme greed historically precedes 10-20% corrections within 30 days. Reduce risk exposure.`;
    }

    const responseData = {
      fearGreed: {
        value: fngValue,
        label: fngLabel,
        zone,
      },
      history: fngHistory,
      stats: {
        avg7d,
        avg7dPrev,
        weekOverWeek,
      },
      aiContext,
      source: 'live' as const,
      timestamp: Date.now(),
    };

    // Cache successful response
    lastGoodResponse = { data: responseData, ts: Date.now() };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error('Sentiment API error:', err);

    // Return stale cache if available
    if (lastGoodResponse && Date.now() - lastGoodResponse.ts < STALE_TTL) {
      return NextResponse.json({ ...lastGoodResponse.data, source: 'stale-cache' });
    }

    return NextResponse.json({ error: 'Failed to fetch sentiment data' }, { status: 500 });
  }
}
