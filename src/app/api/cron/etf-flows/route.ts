import { NextRequest, NextResponse } from 'next/server';

// Triggers an ETF flow data refresh. Pings /api/etf-flows to warm the cache
// and verify Supabase connectivity on a nightly schedule (weeknights 11pm UTC).
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;

  try {
    const res = await fetch(`${origin}/api/etf-flows`);
    const data = await res.json();
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
