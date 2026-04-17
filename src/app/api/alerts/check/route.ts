import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * /api/alerts/check — Evaluate all active alerts against current market conditions
 * Called by cron or on-demand. Triggers email delivery via Resend for matches.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;

export async function POST(req: Request) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const appOrigin = new URL(req.url).origin;

  try {
    // 1. Fetch all active alerts
    const { data: alerts, error: alertErr } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_active', true);

    if (alertErr) throw alertErr;
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ checked: 0, triggered: 0, message: 'No active alerts' });
    }

    // 2. Fetch current prices from our own market-data API
    const priceRes = await fetch(`${appOrigin}/api/market-data?limit=20`).catch(() => null);
    let prices: Record<string, number> = {};
    if (priceRes?.ok) {
      const pData = await priceRes.json();
      const listings = pData?.coins || [];
      for (const c of listings) {
        prices[c.symbol] = c.price ?? 0;
      }
    }

    // Also try CoinGecko as backup
    if (Object.keys(prices).length === 0) {
      try {
        const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,solana,cardano&vs_currencies=usd');
        if (cgRes.ok) {
          const cgData = await cgRes.json();
          prices = {
            BTC: cgData.bitcoin?.usd ?? 0,
            ETH: cgData.ethereum?.usd ?? 0,
            XRP: cgData.ripple?.usd ?? 0,
            SOL: cgData.solana?.usd ?? 0,
            ADA: cgData.cardano?.usd ?? 0,
          };
        }
      } catch { /* silent */ }
    }

    // 3. Fetch Fear & Greed
    let fngValue = 0;
    try {
      const fngRes = await fetch('https://api.alternative.me/fng/?limit=1');
      if (fngRes.ok) {
        const fngData = await fngRes.json();
        fngValue = Number(fngData?.data?.[0]?.value ?? 0);
      }
    } catch { /* silent */ }

    // 4. Evaluate each alert
    const triggered: string[] = [];
    const now = new Date();

    for (const alert of alerts) {
      // Cooldown check
      if (alert.last_triggered_at) {
        const lastTriggered = new Date(alert.last_triggered_at);
        const cooldownMs = (alert.cooldown_minutes || 60) * 60 * 1000;
        if (now.getTime() - lastTriggered.getTime() < cooldownMs) continue;
      }

      let shouldTrigger = false;
      let currentValue = 0;
      let message = '';

      switch (alert.alert_type) {
        case 'price_above':
          currentValue = prices[alert.asset || 'BTC'] || 0;
          if (currentValue > (alert.threshold || 0)) {
            shouldTrigger = true;
            message = `${alert.asset} price $${currentValue.toLocaleString()} is above your $${alert.threshold?.toLocaleString()} target`;
          }
          break;

        case 'price_below':
          currentValue = prices[alert.asset || 'BTC'] || 0;
          if (currentValue > 0 && currentValue < (alert.threshold || 0)) {
            shouldTrigger = true;
            message = `${alert.asset} price $${currentValue.toLocaleString()} dropped below your $${alert.threshold?.toLocaleString()} threshold`;
          }
          break;

        case 'fear_greed':
          currentValue = fngValue;
          if (alert.condition === 'below' && fngValue < (alert.threshold || 20)) {
            shouldTrigger = true;
            message = `Fear & Greed Index at ${fngValue} — below your ${alert.threshold} threshold`;
          } else if (alert.condition === 'above' && fngValue > (alert.threshold || 80)) {
            shouldTrigger = true;
            message = `Fear & Greed Index at ${fngValue} — above your ${alert.threshold} threshold`;
          }
          break;

        default:
          continue;
      }

      if (shouldTrigger) {
        triggered.push(alert.id);

        // Record trigger
        await supabase.from('alert_triggers').insert({
          alert_id: alert.id,
          user_id: alert.user_id,
          triggered_value: currentValue,
          threshold: alert.threshold,
          trigger_message: message,
        });

        // Update alert
        await supabase.from('alerts').update({
          last_triggered_at: now.toISOString(),
          trigger_count: (alert.trigger_count || 0) + 1,
          updated_at: now.toISOString(),
        }).eq('id', alert.id);

        // Send email if enabled and Resend is configured
        if (alert.delivery_email && resendKey) {
          try {
            // Get user email
            const { data: user } = await supabase
              .from('users')
              .select('email')
              .eq('id', alert.user_id)
              .single();

            if (user?.email) {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'ChainIntel Alerts <onboarding@resend.dev>',
                  to: user.email,
                  subject: `🔔 ChainIntel Alert: ${alert.label}`,
                  html: `
                    <div style="background:#080d16;color:#e4eaf4;padding:24px;font-family:monospace;">
                      <h2 style="color:#00d4aa;margin:0 0 12px;">⬡ ChainIntel Alert</h2>
                      <p style="font-size:16px;margin:0 0 8px;">${message}</p>
                      <p style="color:#94b3d0;font-size:12px;margin:0 0 16px;">Alert: ${alert.label}</p>
                      <a href="https://chainintelterminal.com" style="color:#00d4aa;">View Terminal →</a>
                    </div>
                  `,
                }),
              });

              // Mark email sent on trigger
              await supabase.from('alert_triggers')
                .update({ email_sent: true })
                .eq('alert_id', alert.id)
                .order('triggered_at', { ascending: false })
                .limit(1);
            }
          } catch (emailErr) {
            console.error('[alerts] Email delivery failed:', emailErr);
          }
        }
      }
    }

    return NextResponse.json({
      checked: alerts.length,
      triggered: triggered.length,
      triggeredIds: triggered,
      prices,
      fng: fngValue,
      timestamp: Date.now(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to check alerts', docs: '/api/alerts/check' });
}
