import { NextRequest, NextResponse } from 'next/server';

// Vercel cron calls GET. This wrapper invokes the POST /api/alerts/check handler.
export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;

  try {
    const res = await fetch(`${origin}/api/alerts/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
