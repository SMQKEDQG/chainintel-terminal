import { NextResponse } from 'next/server';

let cache: { data: any; ts: number } | null = null;
const TTL = 60_000; // 1 min

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }
  try {
    const res = await fetch('https://mempool.space/api/mempool', {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'ChainIntel Terminal' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = {
      txCount: json?.count ?? null,
      vsize: json?.vsize ?? null,
      totalFee: json?.total_fee ?? null,
      feeHistogram: json?.fee_histogram?.slice(0, 5) ?? [],
      source: 'mempool.space',
      timestamp: Date.now(),
    };
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ txCount: null, source: 'error' });
  }
}
