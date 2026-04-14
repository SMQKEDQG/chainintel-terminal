import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, referrer, screen, ts } = body;

    // Fire-and-forget to Supabase page_views table
    if (SUPABASE_KEY) {
      fetch(`${SUPABASE_URL}/rest/v1/page_views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          path: path || '/',
          referrer: (referrer || 'direct').substring(0, 500),
          screen_size: screen || 'unknown',
          created_at: ts || new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// GET endpoint for basic stats
export async function GET() {
  try {
    if (!SUPABASE_KEY) {
      return NextResponse.json({ total: 0, today: 0 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/page_views?select=id&limit=1&order=id.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: 'count=exact',
        },
        next: { revalidate: 60 },
      }
    );

    const total = parseInt(res.headers.get('content-range')?.split('/')[1] || '0', 10);
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}
