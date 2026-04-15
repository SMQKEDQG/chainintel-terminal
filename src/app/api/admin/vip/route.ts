import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Admin VIP Management ────────────────────────────────────────────────────
// Grant or revoke VIP access for select users.
// Requires ADMIN_SECRET header for authorization.
//
// POST /api/admin/vip
// Headers: { "x-admin-secret": "<ADMIN_SECRET env var>" }
// Body: { "email": "user@example.com", "action": "grant" | "revoke", "tier": "pro" | "enterprise" }

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'chainintel-admin-2026';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  // Auth check
  const secret = req.headers.get('x-admin-secret');
  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { email, action, tier } = body as {
    email?: string;
    action?: 'grant' | 'revoke';
    tier?: 'pro' | 'enterprise';
  };

  if (!email || !action) {
    return NextResponse.json({ error: 'Missing email or action' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (action === 'grant') {
    const vipTier = tier || 'enterprise';
    const { error } = await supabase
      .from('users')
      .update({
        vip_access: true,
        vip_tier: vipTier,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: `VIP ${vipTier} access granted to ${email}` });
  }

  if (action === 'revoke') {
    const { error } = await supabase
      .from('users')
      .update({
        vip_access: false,
        vip_tier: null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: `VIP access revoked for ${email}` });
  }

  return NextResponse.json({ error: 'Invalid action. Use "grant" or "revoke".' }, { status: 400 });
}

// GET /api/admin/vip — list all VIP users
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('email, vip_access, vip_tier, subscription_tier, created_at')
    .eq('vip_access', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vip_users: data || [] });
}
