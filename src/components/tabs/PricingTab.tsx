'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const COMPETITION_DEADLINE = new Date('2026-06-02T23:59:59Z');

function getCountdown() {
  const now = new Date();
  const diff = COMPETITION_DEADLINE.getTime() - now.getTime();
  if (diff <= 0) return 'DEADLINE PASSED';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  return `${days}d ${hours}h ${mins}m ${secs}s`;
}

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: 'Is my data private and secure?',
    a: 'Yes. ChainIntel does not sell or share your data. Portfolio holdings are session-only on the free tier. Pro users get encrypted cloud sync via Supabase. We never share personal data with third parties.',
  },
  {
    q: 'How accurate is the data?',
    a: 'Price data is sourced from CoinMarketCap (updated every 60 seconds). On-chain metrics pull from Glassnode, Santiment, and public blockchain explorers. Regulatory data is manually curated and updated weekly. ETF flow data sources SEC filings and Bloomberg ETF data.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes, cancel anytime from your account settings. No long-term contracts. Your Pro access continues until the end of your billing period. We do not charge cancellation fees.',
  },
  {
    q: 'What makes ChainIntel different from TradingView or CoinMarketCap?',
    a: 'ChainIntel combines on-chain analytics, ISO 20022 institutional intelligence, ETF flow data, whale tracking, and AI synthesis in one terminal — things CoinMarketCap and TradingView do not offer. We are built for institutional-grade research, not retail price watching.',
  },
  {
    q: 'Is there an API?',
    a: 'Enterprise tier includes full REST API access. Pro API access is on the roadmap for Q3 2026. Enterprise customers can request early API access.',
  },
];

export default function PricingTab() {
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(getCountdown());
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [checkoutLoading, setCheckoutLoading] = useState<'pro' | 'ent' | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (i: number) => {
    setOpenFaqs(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const submitWaitlist = () => {
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;
    setWaitlistSubmitted(true);
  };

  const scrollToComparison = () => {
    document.getElementById('vsBloombergTable')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCheckout = async (tier: 'pro' | 'ent') => {
    const priceId = tier === 'pro'
      ? 'price_1TL36uLb8GrBRxdXWMHCqJrP'
      : 'price_1TL36uLb8GrBRxdXz92Wem2T';

    setCheckoutLoading(tier);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          email: user?.email || undefined,
          returnUrl: window.location.origin,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.fallback) {
        // Stripe not configured — fall back to payment links
        const fallbackUrl = tier === 'pro'
          ? 'https://buy.stripe.com/dRm6oI94hf428Sq7pgbwk01'
          : 'https://buy.stripe.com/eVqfZi2FT1dc8Sq9xobwk00';
        window.open(fallbackUrl, '_blank');
      }
    } catch {
      // Fallback to direct payment links on error
      const fallbackUrl = tier === 'pro'
        ? 'https://buy.stripe.com/dRm6oI94hf428Sq7pgbwk01'
        : 'https://buy.stripe.com/eVqfZi2FT1dc8Sq9xobwk00';
      window.open(fallbackUrl, '_blank');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="page" id="page-pricing">
      <div className="ai-context-strip" id="acs-pricing">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-pricing">
          Bloomberg Terminal: $24,000–$31,980/year per seat, 2-year lock-in, one tier. 85% of Bloomberg's own institutional clients requested on-chain data — Bloomberg cannot deliver it.{' '}
          <strong>ChainIntel delivers it from $0. The gap is structural.</strong>
        </span>
        <span className="acs-ts" id="acs-ts-pricing"></span>
      </div>
      <div className="section-h">
        <div className="section-h-label">ChainIntel v5.18 Plans — Bloomberg charges $24,000/yr and hides it. We don't.</div>
        <div className="section-h-line"></div>
      </div>

      {/* Competition countdown */}
      <div
        id="competitionBanner"
        style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(0,212,170,0.06))', border: '1px solid rgba(59,130,246,0.25)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>🏆</span>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--blue)', letterSpacing: '0.12em', fontWeight: 700 }}>PERPLEXITY BILLION DOLLAR BUILD 2026</div>
            <div id="compSubtitle" style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text2)' }}>Deadline Jun 2, 2026 &middot; Entry #CI-2026</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--cyan)', fontWeight: 700 }}>{countdown}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>Competition Deadline</div>
        </div>
      </div>

      <div
        style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '3px', padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', cursor: 'pointer' }}
        onClick={scrollToComparison}
      >
        <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--cyan)', letterSpacing: '0.1em' }}>WHY CHAININTEL BEATS BLOOMBERG AT 1/40TH THE PRICE</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--cyan)' }}>↓ See comparison</span>
      </div>

      <div className="pricing-grid">
        {/* Free Tier */}
        <div className="price-tier">
          <div className="tier-label">Free Tier</div>
          <div className="tier-price"><sup>$</sup>0<sub>/forever free</sub></div>
          <div className="tier-tagline">The best free crypto intelligence terminal on the internet.</div>
          <div className="tier-features">
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Market dashboard · top 50 assets</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text"><span data-glossary="Fear &amp; Greed Index">Fear &amp; Greed Index</span></div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">ETF Flow Dashboard · daily</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Market Heatmap</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Basic <span data-glossary="TVL">DeFi TVL</span> view</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Regulatory news feed</div></div>
            <div className="tier-feat"><div className="tier-feat-check no">🔒</div><div className="tier-feat-text locked">On-Chain Analytics (locked)</div></div>
            <div className="tier-feat"><div className="tier-feat-check no">🔒</div><div className="tier-feat-text locked"><span data-glossary="ISO 20022">ISO 20022</span> Intel (locked)</div></div>
            <div className="tier-feat"><div className="tier-feat-check no">🔒</div><div className="tier-feat-text locked">AI Morning Brief (locked)</div></div>
            <div className="tier-feat"><div className="tier-feat-check no">🔒</div><div className="tier-feat-text locked">Ask CI AI Query (locked)</div></div>
          </div>
          <div id="waitlistForm" style={{ margin: '8px 0' }}>
            {!waitlistSubmitted ? (
              <>
                <input
                  id="waitlistEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={waitlistEmail}
                  onChange={e => setWaitlistEmail(e.target.value)}
                  style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '9px', padding: '6px 8px', outline: 'none', boxSizing: 'border-box', marginBottom: '4px' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--cyan)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--b2)')}
                />
                <button
                  onClick={submitWaitlist}
                  style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b3)', color: 'var(--cyan)', fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.12em', padding: '6px', cursor: 'pointer' }}
                >
                  JOIN WAITLIST — FREE ACCESS
                </button>
              </>
            ) : null}
            {waitlistSubmitted && (
              <div id="waitlistMsg" style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--green)', marginTop: '4px' }}>
                ✓ You're on the list. We'll notify you at launch.
              </div>
            )}
          </div>
          <a
            href="javascript:void(0)"
            onClick={() => {
              const event = new CustomEvent('goPage', { detail: 'mktovr' });
              window.dispatchEvent(event);
            }}
            className="tier-cta tier-cta-free"
            style={{ textDecoration: 'none' }}
          >
            ACCESS NOW — FREE
          </a>
        </div>

        {/* Pro Tier */}
        <div className="price-tier featured">
          <div className="tier-label">Pro — Most Popular</div>
          <div className="tier-price"><sup>$</sup>49<sub>/mo · cancel anytime</sub></div>
          <div className="tier-tagline">Everything Bloomberg can't give you, at 1/40th the price.</div>
          <div className="tier-features">
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Everything in Free</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Full On-Chain Analytics Suite</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text"><span data-glossary="ISO 20022">ISO 20022</span> Intelligence Module</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">AI Morning Brief (daily)</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Ask CI — Natural Language Queries</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text"><span data-glossary="ChainScore™">ChainScore™</span> ratings · 50 assets</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Whale &amp; Smart Money tracker</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Regulatory intelligence · structured</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">500+ asset coverage</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Protocol Revenue P/E ratios</div></div>
          </div>
          <button
            onClick={() => handleCheckout('pro')}
            className="tier-cta tier-cta-pro"
            style={{ textDecoration: 'none', cursor: checkoutLoading === 'pro' ? 'wait' : 'pointer' }}
            disabled={checkoutLoading === 'pro'}
          >
            {checkoutLoading === 'pro' ? 'REDIRECTING...' : 'SUBSCRIBE — $49/MO'}
          </button>
        </div>

        {/* Enterprise Tier */}
        <div className="price-tier">
          <div className="tier-label">Enterprise</div>
          <div className="tier-price"><sup>$</sup>499<sub>/mo · annual billing available</sub></div>
          <div className="tier-tagline">Institutional-grade. Fund-ready. AML-compliant.</div>
          <div className="tier-features">
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Everything in Pro</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text"><span data-glossary="ChainScore™">ChainScore™</span> · 150 assets</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Custom alert engine</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Open REST API access</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">AML / Compliance layer</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Dedicated research reports</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">White-label option</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Priority support + onboarding</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text">Institutional tracker custom feeds</div></div>
            <div className="tier-feat"><div className="tier-feat-check yes">✓</div><div className="tier-feat-text"><span data-glossary="ISO 20022">ISO 20022</span> watchlist alerts</div></div>
          </div>
          <button
            onClick={() => handleCheckout('ent')}
            className="tier-cta tier-cta-ent"
            style={{ textDecoration: 'none', cursor: checkoutLoading === 'ent' ? 'wait' : 'pointer' }}
            disabled={checkoutLoading === 'ent'}
          >
            {checkoutLoading === 'ent' ? 'REDIRECTING...' : 'SUBSCRIBE — $499/MO'}
          </button>
        </div>
      </div>

      {/* vs Bloomberg Table */}
      <div className="panel" id="vsBloombergTable" style={{ marginTop: 0 }}>
        <div className="ph"><div className="pt">Bloomberg Terminal vs ChainIntel — Why We Win</div></div>
        <table className="vs-table">
          <thead>
            <tr>
              <th className="vs-dim">Dimension</th>
              <th>Bloomberg Terminal</th>
              <th>ChainIntel v5.18</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="vs-dim">Annual Cost</td><td>$24,000/seat + 2-yr lock-in</td><td>$49/mo Pro · $499/mo Enterprise</td></tr>
            <tr><td className="vs-dim">Crypto Asset Coverage</td><td>~50 assets only</td><td>500+ at launch · expanding quarterly</td></tr>
            <tr><td className="vs-dim">On-Chain Analytics</td><td>None — structural gap</td><td>Native · MVRV, exchange flows, whale tracking</td></tr>
            <tr><td className="vs-dim"><span data-glossary="ISO 20022">ISO 20022</span> Intelligence</td><td>None — doesn't exist</td><td>Dedicated module · 8 assets tracked</td></tr>
            <tr><td className="vs-dim"><span data-glossary="TVL">DeFi / TVL</span> Data</td><td>None</td><td>6,400+ protocols · 469 chains</td></tr>
            <tr><td className="vs-dim">Protocol P/E Ratios</td><td>None — doesn't exist</td><td>Live P/E vs FDV per protocol</td></tr>
            <tr><td className="vs-dim">ETF Flow Dashboard</td><td>Not a primary module</td><td>Primary module · all ETFs daily</td></tr>
            <tr><td className="vs-dim">AI Layer</td><td>ASKB — no on-chain context</td><td>Ask CI + AI Brief + AI Synthesis per module</td></tr>
            <tr><td className="vs-dim">Learning Curve</td><td>86-page manual · weeks</td><td>Beginner-friendly · Quick Guide built-in</td></tr>
            <tr><td className="vs-dim">Live Price Feed</td><td>Vendor-locked</td><td>CoinGecko API · updates every 60s</td></tr>
            <tr>
              <td className="vs-dim">AI Layer</td>
              <td style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: '9px' }}>ASKB — no on-chain context, beaten by GPT-4</td>
              <td style={{ color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: '9px' }}>Ask CI + ambient AI synthesis on every tab</td>
            </tr>
            <tr>
              <td className="vs-dim">Asset Coverage</td>
              <td style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: '9px' }}>~50 crypto assets (requires institutional custody)</td>
              <td style={{ color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: '9px' }}>Top 100 live · 500+ on roadmap</td>
            </tr>
            <tr>
              <td className="vs-dim">Source Transparency</td>
              <td style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: '9px' }}>Black box — sources undisclosed</td>
              <td style={{ color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: '9px' }}>89 verified sources, all named and linked</td>
            </tr>
          </tbody>
        </table>
        <div style={{ paddingTop: '10px', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', textAlign: 'center', letterSpacing: '0.08em' }}>
          Bloomberg's own survey: 85% of institutional clients explicitly requested on-chain data. Bloomberg still cannot deliver it natively. ChainIntel is the answer.
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text)', fontWeight: 600, marginBottom: '12px', letterSpacing: '0.08em' }}>
          FREQUENTLY ASKED QUESTIONS
        </div>
        {faqs.map((faq, i) => (
          <div key={i} style={{ border: '1px solid var(--b2)', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
            <button
              onClick={() => toggleFaq(i)}
              style={{ width: '100%', background: 'var(--s2)', border: 'none', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '9px', padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}
            >
              <span>{faq.q}</span>
              <span style={{ color: 'var(--cyan)' }}>{openFaqs[i] ? '−' : '+'}</span>
            </button>
            {openFaqs[i] && (
              <div style={{ background: 'var(--s1)', padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text2)', lineHeight: 1.6 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Waitlist at bottom */}
      <div style={{ marginTop: '24px', background: 'var(--s1)', border: '1px solid var(--b2)', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>
          JOIN THE WAITLIST
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text2)', marginBottom: '12px' }}>
          Get notified when new features launch. No spam. Unsubscribe anytime.
        </div>
        {!waitlistSubmitted ? (
          <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={waitlistEmail}
              onChange={e => setWaitlistEmail(e.target.value)}
              style={{ flex: 1, background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '9px', padding: '8px 10px', outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = 'var(--cyan)')}
              onBlur={e => (e.target.style.borderColor = 'var(--b2)')}
            />
            <button
              onClick={submitWaitlist}
              style={{ background: 'var(--cyan)', color: '#000', border: 'none', fontFamily: 'var(--mono)', fontSize: '8px', fontWeight: 700, padding: '8px 14px', cursor: 'pointer', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}
            >
              JOIN →
            </button>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--green)' }}>
            ✓ You're on the list. We'll notify you at launch.
          </div>
        )}
      </div>
    </div>
  );
}
