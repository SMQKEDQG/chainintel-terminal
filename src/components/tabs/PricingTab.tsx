'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

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
    a: 'Price data is sourced from ChainIntel’s free market-data stack with CoinPaprika as the primary feed and CoinGecko fallback. On-chain metrics pull from Mempool.space, Blockchain.com, and Etherscan. Regulatory data is aggregated from the Federal Register, SEC EDGAR, and 10+ RSS feeds updated every 2 minutes. ETF flow data is sourced from Farside Investors and SEC filings.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes, cancel anytime from your account settings. No long-term contracts. Your Pro access continues until the end of your billing period. We do not charge cancellation fees.',
  },
  {
    q: 'What makes ChainIntel different from retail price trackers?',
    a: 'ChainIntel combines on-chain analytics, ISO 20022 institutional intelligence, ETF flow data, whale tracking, and AI synthesis in one terminal. We are built for institutional-grade research, not just price watching.',
  },
  {
    q: 'Is there an API?',
    a: 'Enterprise tier includes full REST API access today. Broader self-serve API access is planned, and Enterprise customers can request priority integrations immediately.',
  },
];

export default function PricingTab() {
  const { user } = useAuth();
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [checkoutLoading, setCheckoutLoading] = useState<'pro' | 'ent' | null>(null);

  const toggleFaq = (i: number) => {
    setOpenFaqs(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const submitWaitlist = async () => {
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });
    } catch {
      // Still show success to user even if API fails
    }
    setWaitlistSubmitted(true);
  };

  const scrollToComparison = () => {
    document.getElementById('vsBloombergTable')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Stripe Payment Links (direct — no server-side secret key needed)
  const PAYMENT_LINKS: Record<string, string> = {
    pro: 'https://buy.stripe.com/fZufZi0xL2hg0lUaBsbwk03',
    ent: 'https://buy.stripe.com/dRmbJ2bcpg864Ca6lcbwk02',
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
      } else {
        // Stripe session unavailable — redirect to payment link
        window.location.href = PAYMENT_LINKS[tier];
      }
    } catch {
      // Fallback to direct payment links on any error
      window.location.href = PAYMENT_LINKS[tier];
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



      <div
        style={{ background: 'rgba(232,165,52,0.06)', border: '1px solid rgba(232,165,52,0.2)', borderRadius: '3px', padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', cursor: 'pointer' }}
        onClick={scrollToComparison}
      >
        <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--accent)', letterSpacing: '0.1em' }}>WHY CHAININTEL BEATS BLOOMBERG AT 1/40TH THE PRICE</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--accent)' }}>↓ See comparison</span>
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
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--b2)')}
                />
                <button
                  onClick={submitWaitlist}
                  style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--b3)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.12em', padding: '6px', cursor: 'pointer' }}
                >
                  GET PRODUCT UPDATES
                </button>
              </>
            ) : null}
            {waitlistSubmitted && (
              <div id="waitlistMsg" style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--green)', marginTop: '4px' }}>
                ✓ Updates enabled. We&apos;ll send major releases and access announcements.
              </div>
            )}
          </div>
          <button
            onClick={() => {
              const event = new CustomEvent('goPage', { detail: 'mktovr' });
              window.dispatchEvent(event);
            }}
            className="tier-cta tier-cta-free"
            style={{ textDecoration: 'none', border: 'none', width: '100%' }}
          >
            ACCESS NOW — FREE
          </button>
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
          <a href="mailto:support@chainintelterminal.com" style={{ display: 'block', marginTop: '12px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text2)', textDecoration: 'none', letterSpacing: '0.06em' }}>
            Questions? support@chainintelterminal.com
          </a>
        </div>
      </div>

      {/* vs Bloomberg Table */}
      <div className="panel" id="vsBloombergTable" style={{ marginTop: 0 }}>
        <div className="ph"><div className="pt">Bloomberg Terminal vs ChainIntel — Feature-by-Feature</div></div>
        <table className="vs-table">
          <thead>
            <tr>
              <th className="vs-dim">Capability</th>
              <th style={{ color: 'var(--red)' }}>Bloomberg Terminal</th>
              <th style={{ color: 'var(--accent)' }}>ChainIntel</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="vs-dim">Annual Cost</td><td style={{ color: 'var(--red)' }}>$24,000–$31,980/seat · 2-yr lock-in</td><td style={{ color: 'var(--green)' }}>$0 Free · $588/yr Pro · $5,988/yr Enterprise</td></tr>
            <tr><td className="vs-dim">Crypto Coverage</td><td style={{ color: 'var(--red)' }}>~50 assets · institutional custody required</td><td style={{ color: 'var(--green)' }}>Top 100 live · 500+ planned</td></tr>
            <tr><td className="vs-dim">On-Chain Analytics</td><td style={{ color: 'var(--red)' }}>❌ None — structural gap</td><td style={{ color: 'var(--green)' }}>✓ MVRV, NVT, exchange flows, whale tracking</td></tr>
            <tr><td className="vs-dim">DeFi / TVL Data</td><td style={{ color: 'var(--red)' }}>❌ None</td><td style={{ color: 'var(--green)' }}>✓ 6,400+ protocols · 469 chains · DefiLlama</td></tr>
            <tr><td className="vs-dim">Derivatives Intelligence</td><td style={{ color: 'var(--text2)' }}>Basic futures data</td><td style={{ color: 'var(--green)' }}>✓ Live funding rates · OI · cross-exchange</td></tr>
            <tr><td className="vs-dim">ISO 20022 Intelligence</td><td style={{ color: 'var(--red)' }}>❌ Not available</td><td style={{ color: 'var(--green)' }}>✓ Dedicated module · 8 compliant assets tracked</td></tr>
            <tr><td className="vs-dim">ETF Flow Dashboard</td><td style={{ color: 'var(--text2)' }}>Secondary module</td><td style={{ color: 'var(--green)' }}>✓ Primary module · all US BTC/ETH ETFs daily</td></tr>
            <tr><td className="vs-dim">AI Analysis Layer</td><td style={{ color: 'var(--red)' }}>ASKB — no crypto context, beaten by GPT-4</td><td style={{ color: 'var(--green)' }}>✓ Ask CI + ambient AI synthesis on every tab</td></tr>
            <tr><td className="vs-dim">Whale / Smart Money</td><td style={{ color: 'var(--red)' }}>❌ Not available</td><td style={{ color: 'var(--green)' }}>✓ Real-time whale alerts + smart money tracking</td></tr>
            <tr><td className="vs-dim">Source Transparency</td><td style={{ color: 'var(--red)' }}>Black box — sources undisclosed</td><td style={{ color: 'var(--green)' }}>Named source registry · feed health checks built in</td></tr>
            <tr><td className="vs-dim">Learning Curve</td><td style={{ color: 'var(--red)' }}>86-page manual · weeks of training</td><td style={{ color: 'var(--green)' }}>Beginner-friendly · Quick Guide built-in</td></tr>
            <tr><td className="vs-dim">Live Price Feed</td><td style={{ color: 'var(--text2)' }}>Vendor-locked proprietary feed</td><td style={{ color: 'var(--green)' }}>CoinPaprika + CoinGecko fallback · auto refresh</td></tr>
          </tbody>
        </table>
        <div style={{ paddingTop: '10px', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', textAlign: 'center', letterSpacing: '0.08em' }}>
          Bloomberg surveyed institutional clients: 85% requested on-chain data. Bloomberg still cannot deliver it. ChainIntel is purpose-built for this gap.
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
              <span style={{ color: 'var(--accent)' }}>{openFaqs[i] ? '−' : '+'}</span>
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
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '6px' }}>
          GET PRODUCT UPDATES
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text2)', marginBottom: '12px' }}>
          Product releases, roadmap milestones, and access announcements. No spam. Unsubscribe anytime.
        </div>
        {!waitlistSubmitted ? (
          <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={waitlistEmail}
              onChange={e => setWaitlistEmail(e.target.value)}
              style={{ flex: 1, background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '9px', padding: '8px 10px', outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--b2)')}
            />
            <button
              onClick={submitWaitlist}
              style={{ background: 'var(--accent)', color: '#000', border: 'none', fontFamily: 'var(--mono)', fontSize: '8px', fontWeight: 700, padding: '8px 14px', cursor: 'pointer', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}
            >
              SUBSCRIBE →
            </button>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--green)' }}>
            ✓ Updates enabled. We&apos;ll send major releases and access changes.
          </div>
        )}
      </div>
    </div>
  );
}
