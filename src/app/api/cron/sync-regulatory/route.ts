import { NextRequest, NextResponse } from 'next/server';

// Triggers a regulatory feed sync every 2 hours.
// Warms the /api/regulatory-feeds cache and ensures fresh data is available.
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;

  try {
    const res = await fetch(`${origin}/api/regulatory-feeds`);
    const data = await res.json();
    const count = Array.isArray(data?.items) ? data.items.length : 0;
    return NextResponse.json({ ok: true, itemsFetched: count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
