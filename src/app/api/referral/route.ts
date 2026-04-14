import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CI-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * POST /api/referral — Create a referral code (authenticated users)
 * Body: { email: string }
 * Returns: { code: string, max_uses: 5, trial_days: 7 }
 * 
 * GET /api/referral?code=CI-XXXXXX — Validate and redeem a referral code
 * Body (for redeem): { code: string, email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create a new referral code
    if (body.action === 'create' && body.email) {
      if (!supabaseKey) {
        return NextResponse.json({ code: generateCode(), source: 'demo' });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      const code = generateCode();

      const { error } = await supabase.from('referral_codes').insert({
        code,
        creator_email: body.email,
        max_uses: 5,
        trial_days: 7,
      });

      if (error) {
        console.error('Referral create error:', error);
        return NextResponse.json({ code: generateCode(), source: 'fallback' });
      }

      return NextResponse.json({ code, max_uses: 5, trial_days: 7, source: 'live' });
    }

    // Redeem a referral code
    if (body.action === 'redeem' && body.code && body.email) {
      if (!supabaseKey) {
        return NextResponse.json({ 
          valid: true, 
          trial_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'demo' 
        });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Look up the code
      const { data: codeData } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', body.code.toUpperCase())
        .eq('active', true)
        .single();

      if (!codeData) {
        return NextResponse.json({ valid: false, error: 'Invalid or expired referral code' }, { status: 400 });
      }

      if (codeData.uses >= codeData.max_uses) {
        return NextResponse.json({ valid: false, error: 'This referral code has reached its maximum uses' }, { status: 400 });
      }

      // Check if already redeemed by this email
      const { data: existing } = await supabase
        .from('referral_redemptions')
        .select('id')
        .eq('redeemed_by', body.email)
        .single();

      if (existing) {
        return NextResponse.json({ valid: false, error: 'You have already used a referral code' }, { status: 400 });
      }

      const trialExpires = new Date(Date.now() + codeData.trial_days * 24 * 60 * 60 * 1000);

      // Record redemption
      await supabase.from('referral_redemptions').insert({
        code: body.code.toUpperCase(),
        redeemed_by: body.email,
        trial_expires_at: trialExpires.toISOString(),
      });

      // Increment uses
      await supabase
        .from('referral_codes')
        .update({ uses: codeData.uses + 1 })
        .eq('code', body.code.toUpperCase());

      return NextResponse.json({
        valid: true,
        trial_days: codeData.trial_days,
        trial_expires: trialExpires.toISOString(),
        source: 'live',
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use action: "create" or "redeem"' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET — validate a code without redeeming
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.toUpperCase();

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
  }

  if (!supabaseKey) {
    return NextResponse.json({ valid: true, remaining_uses: 3, trial_days: 7, source: 'demo' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', code)
    .eq('active', true)
    .single();

  if (!data) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired code' }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    remaining_uses: data.max_uses - data.uses,
    trial_days: data.trial_days,
    source: 'live',
  });
}
