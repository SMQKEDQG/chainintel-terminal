// ─── ChainIntel Email Service ─────────────────────────────────────────────────
// Uses Resend API to send transactional emails.
// Domain: chainintelterminal.com (verified in Resend)
// Fallback: onboarding@resend.dev if domain not yet verified

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM || 'ChainIntel <support@chainintelterminal.com>';
const FALLBACK_FROM = 'ChainIntel <onboarding@resend.dev>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  // Try verified domain first, fallback to resend.dev
  for (const from of [FROM_EMAIL, FALLBACK_FROM]) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          reply_to: replyTo || 'support@chainintelterminal.com',
        }),
      });

      const data = await res.json();

      if (res.ok && data.id) {
        console.log(`[email] Sent to ${to} from ${from} — id: ${data.id}`);
        return { success: true, id: data.id };
      }

      // If domain not verified error, try fallback
      if (data?.message?.includes('not verified') || data?.message?.includes('not allowed')) {
        console.warn(`[email] Domain not verified for ${from}, trying fallback...`);
        continue;
      }

      console.error(`[email] Failed from ${from}:`, data);
      return { success: false, error: data?.message || 'Unknown error' };
    } catch (err) {
      console.error(`[email] Error sending from ${from}:`, err);
      continue;
    }
  }

  return { success: false, error: 'All send attempts failed' };
}

// ─── Welcome Email Templates ──────────────────────────────────────────────────

export function getWelcomeEmailHtml(tier: 'pro' | 'enterprise', email: string): string {
  const isPro = tier === 'pro';
  const tierLabel = isPro ? 'Pro' : 'Enterprise';
  const price = isPro ? '$49/mo' : '$499/mo';
  const accentColor = isPro ? '#E8A534' : '#A78BFA';

  const proFeatures = [
    { icon: '◈', label: 'Full On-Chain Analytics', desc: 'MVRV, NVT, exchange flows, hash rate, miner reserves' },
    { icon: '◉', label: 'DeFi Intelligence', desc: '6,400+ protocols, TVL rankings, yield tracking, stablecoin monitor' },
    { icon: '◎', label: 'Derivatives Suite', desc: 'Funding rates, open interest, liquidation maps, options flow' },
    { icon: '◕', label: 'Whale & Smart Money Tracker', desc: 'Real-time $10M+ transaction alerts with AI scoring' },
    { icon: '◌', label: 'Sentiment Engine', desc: 'Social volume, Twitter trends, Reddit pulse, crowd vs. smart money' },
    { icon: '⬢', label: 'ISO 20022 Intelligence', desc: 'XRP, XLM, HBAR, QNT, ADA, IOTA — institutional compliance tracking' },
    { icon: '◈', label: 'Ask CI — AI Queries', desc: 'Natural language questions across all market data' },
    { icon: '◆', label: 'ChainScore™ Ratings', desc: '50 digital assets scored across 5 dimensions' },
  ];

  const enterpriseExtras = [
    { icon: '⚡', label: 'REST API Access', desc: 'Programmatic access to all ChainIntel data feeds' },
    { icon: '🛡', label: 'AML / Compliance Layer', desc: 'Institutional-grade compliance and audit tools' },
    { icon: '📊', label: 'Dedicated Research Reports', desc: 'Custom analysis and market intelligence reports' },
    { icon: '🏷', label: 'White-Label Option', desc: 'Brand ChainIntel data under your own identity' },
    { icon: '📞', label: 'Priority Support + Onboarding', desc: 'Direct line to the ChainIntel team' },
    { icon: '◆', label: 'ChainScore™ — 150 Assets', desc: 'Expanded coverage for institutional portfolios' },
  ];

  const features = isPro ? proFeatures : [...proFeatures, ...enterpriseExtras];

  const featuresHtml = features.map(f => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1E1E1E">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <span style="font-size:14px;color:${accentColor};flex-shrink:0;line-height:1.4">${f.icon}</span>
          <div>
            <div style="font-family:'Courier New',monospace;font-size:13px;color:#E8E6E3;font-weight:600;letter-spacing:0.03em">${f.label}</div>
            <div style="font-family:-apple-system,Helvetica,sans-serif;font-size:12px;color:#A09D98;margin-top:2px;line-height:1.5">${f.desc}</div>
          </div>
        </div>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050505;font-family:-apple-system,Helvetica,Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:0">

    <!-- Header -->
    <div style="background:#0A0A0A;padding:32px 24px;text-align:center;border-bottom:2px solid ${accentColor}">
      <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:700;letter-spacing:0.1em;color:#E8E6E3">
        CHAIN<span style="color:${accentColor}">INTEL</span>
      </div>
      <div style="font-family:'Courier New',monospace;font-size:9px;color:#5C5955;letter-spacing:0.14em;margin-top:6px">
        DIGITAL ASSET INTELLIGENCE
      </div>
    </div>

    <!-- Welcome Banner -->
    <div style="background:linear-gradient(180deg,#111111 0%,#0A0A0A 100%);padding:40px 32px;text-align:center">
      <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.14em;color:${accentColor};margin-bottom:12px;border:1px solid ${accentColor};display:inline-block;padding:4px 14px">
        ${tierLabel.toUpperCase()} — ${price}
      </div>
      <h1 style="font-family:'Courier New',monospace;font-size:24px;color:#E8E6E3;margin:16px 0 12px;font-weight:600;line-height:1.3">
        Welcome to ChainIntel ${tierLabel}
      </h1>
      <p style="font-family:-apple-system,Helvetica,sans-serif;font-size:14px;color:#A09D98;line-height:1.7;margin:0 auto;max-width:440px">
        Your subscription is active. Every intelligence module is now unlocked — the same data institutional desks pay thousands for, at a fraction of the cost.
      </p>
    </div>

    <!-- What's Unlocked -->
    <div style="background:#0A0A0A;padding:32px 24px">
      <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.12em;color:${accentColor};margin-bottom:20px;font-weight:700">
        WHAT'S NOW UNLOCKED
      </div>
      <table style="width:100%;border-collapse:collapse;background:#111111;border:1px solid #1E1E1E">
        ${featuresHtml}
      </table>
    </div>

    <!-- Quick Start -->
    <div style="background:#111111;padding:32px 24px;border-top:1px solid #1E1E1E">
      <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.12em;color:${accentColor};margin-bottom:20px;font-weight:700">
        GET STARTED IN 30 SECONDS
      </div>

      <div style="margin-bottom:16px;padding:14px 16px;background:#161616;border:1px solid #1E1E1E;border-left:3px solid ${accentColor}">
        <div style="font-family:'Courier New',monospace;font-size:12px;color:#E8E6E3;font-weight:600">Step 1 — Open the Terminal</div>
        <div style="font-family:-apple-system,Helvetica,sans-serif;font-size:12px;color:#A09D98;margin-top:4px;line-height:1.5">
          Go to <a href="https://chainintelterminal.com" style="color:${accentColor};text-decoration:none">chainintelterminal.com</a> and sign in. All ${tierLabel} tabs are now unlocked.
        </div>
      </div>

      <div style="margin-bottom:16px;padding:14px 16px;background:#161616;border:1px solid #1E1E1E;border-left:3px solid ${accentColor}">
        <div style="font-family:'Courier New',monospace;font-size:12px;color:#E8E6E3;font-weight:600">Step 2 — Explore Intelligence Modules</div>
        <div style="font-family:-apple-system,Helvetica,sans-serif;font-size:12px;color:#A09D98;margin-top:4px;line-height:1.5">
          Click the <strong style="color:#E8E6E3">ON-CHAIN</strong>, <strong style="color:#E8E6E3">DEFI</strong>, <strong style="color:#E8E6E3">DERIVATIVES</strong>, <strong style="color:#E8E6E3">WHALES</strong>, and <strong style="color:#E8E6E3">SENTIMENT</strong> tabs — previously locked, now fully live.
        </div>
      </div>

      <div style="margin-bottom:16px;padding:14px 16px;background:#161616;border:1px solid #1E1E1E;border-left:3px solid ${accentColor}">
        <div style="font-family:'Courier New',monospace;font-size:12px;color:#E8E6E3;font-weight:600">Step 3 — Ask CI Anything</div>
        <div style="font-family:-apple-system,Helvetica,sans-serif;font-size:12px;color:#A09D98;margin-top:4px;line-height:1.5">
          Use the AI query bar on the Overview tab. Try: <em>"What's the whale activity on BTC today?"</em> or <em>"Show me DeFi TVL trends."</em>
        </div>
      </div>

      <div style="padding:14px 16px;background:#161616;border:1px solid #1E1E1E;border-left:3px solid ${accentColor}">
        <div style="font-family:'Courier New',monospace;font-size:12px;color:#E8E6E3;font-weight:600">Step 4 — Set Up Alerts</div>
        <div style="font-family:-apple-system,Helvetica,sans-serif;font-size:12px;color:#A09D98;margin-top:4px;line-height:1.5">
          Click the 🔔 <strong style="color:#E8E6E3">ALERTS</strong> button in the top bar to configure whale alerts, price triggers, and regulatory notifications.
        </div>
      </div>
    </div>

    <!-- CTA Button -->
    <div style="background:#0A0A0A;padding:32px 24px;text-align:center">
      <a href="https://chainintelterminal.com" style="display:inline-block;background:${accentColor};color:#000;font-family:'Courier New',monospace;font-size:12px;font-weight:700;letter-spacing:0.1em;padding:14px 36px;text-decoration:none">
        OPEN YOUR TERMINAL →
      </a>
    </div>

    <!-- Account Details -->
    <div style="background:#111111;padding:24px;border-top:1px solid #1E1E1E">
      <div style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.12em;color:#5C5955;margin-bottom:12px">
        YOUR ACCOUNT
      </div>
      <table style="width:100%;font-family:'Courier New',monospace;font-size:11px">
        <tr><td style="padding:4px 0;color:#5C5955">Email</td><td style="padding:4px 0;color:#A09D98;text-align:right">${email}</td></tr>
        <tr><td style="padding:4px 0;color:#5C5955">Plan</td><td style="padding:4px 0;color:${accentColor};text-align:right;font-weight:700">${tierLabel} — ${price}</td></tr>
        <tr><td style="padding:4px 0;color:#5C5955">Billing</td><td style="padding:4px 0;color:#A09D98;text-align:right">Monthly · Cancel anytime</td></tr>
        <tr><td style="padding:4px 0;color:#5C5955">Support</td><td style="padding:4px 0;color:#A09D98;text-align:right">support@chainintelterminal.com</td></tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background:#050505;padding:24px;text-align:center;border-top:1px solid #1E1E1E">
      <div style="font-family:'Courier New',monospace;font-size:9px;color:#5C5955;letter-spacing:0.08em;line-height:1.8">
        ChainIntel · Digital Asset Intelligence<br>
        <a href="https://chainintelterminal.com" style="color:#5C5955;text-decoration:none">chainintelterminal.com</a> ·
        <a href="https://chainintelterminal.com/tos" style="color:#5C5955;text-decoration:none">Terms</a> ·
        <a href="https://chainintelterminal.com/privacy" style="color:#5C5955;text-decoration:none">Privacy</a><br>
        <span style="color:#333">You received this because you subscribed to ChainIntel ${tierLabel}.</span>
      </div>
    </div>

  </div>
</body>
</html>`;
}
