import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

async function sendWelcomeEmail(email: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ChainIntel <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to ChainIntel Terminal — You\'re on the list',
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#080d16;color:#e4eaf4;">
            <div style="border-bottom:1px solid #1a2d42;padding-bottom:20px;margin-bottom:24px;">
              <span style="font-family:monospace;font-size:14px;font-weight:600;color:#00d4aa;letter-spacing:0.05em;">CHAININTEL TERMINAL</span>
            </div>
            <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;color:#e4eaf4;">You're in.</h1>
            <p style="font-size:14px;line-height:1.6;color:#94b3d0;margin:0 0 20px;">
              Welcome to ChainIntel — the Bloomberg Terminal for digital assets. You now have early access to 12 intelligence modules, 89+ data sources, and AI-powered analysis.
            </p>
            <a href="https://chainintelterminal.com" style="display:inline-block;padding:10px 24px;background:#00d4aa;color:#080d16;font-family:monospace;font-size:12px;font-weight:600;letter-spacing:0.1em;border-radius:4px;text-decoration:none;">OPEN TERMINAL →</a>
            <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1a2d42;">
              <p style="font-size:12px;color:#4a6a8c;margin:0;">Free tier includes Overview, Markets, ETF & Institutional, Regulatory, ISO 20022, and Portfolio modules.</p>
              <p style="font-size:12px;color:#4a6a8c;margin:8px 0 0;">Upgrade to Pro ($49/mo) to unlock On-Chain, DeFi, Derivatives, Whales, and Sentiment.</p>
            </div>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error('Welcome email error:', err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email;
    const source = body.source || 'waitlist';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (!supabaseKey) {
      console.log('Waitlist signup (no DB):', email);
      sendWelcomeEmail(email);
      return NextResponse.json({ success: true, source: 'log-only' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert to avoid duplicates
    // Supabase columns: email (unique), source, referrer, converted, created_at (auto)
    const { error } = await supabase
      .from('waitlist')
      .upsert(
        { email, ...(source !== 'waitlist' ? { source } : {}) },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Waitlist insert error:', error);
      return NextResponse.json({ success: true, source: 'fallback' });
    }

    // Fire-and-forget welcome email
    sendWelcomeEmail(email);

    return NextResponse.json({ success: true, source: 'supabase' });
  } catch (err) {
    console.error('Waitlist API error:', err);
    return NextResponse.json({ success: true, source: 'fallback' });
  }
}

export async function GET() {
  try {
    if (!supabaseKey) {
      return NextResponse.json({ count: 0, source: 'unavailable' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ count: 0, source: 'error' });
    }

    return NextResponse.json({ count: count || 0, source: 'live' });
  } catch {
    return NextResponse.json({ count: 0, source: 'error' });
  }
}
