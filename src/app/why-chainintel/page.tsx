'use client';

import { useState, useEffect, useRef } from 'react';
import '../../styles/terminal.css';

const STRIPE_PRO = 'https://buy.stripe.com/dRm6oI94hf428Sq7pgbwk01';

function useIntersection(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function FadeIn({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref as React.RefObject<HTMLElement>);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, color = 'var(--accent)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontFamily: 'var(--mono)',
      fontSize: '10px',
      letterSpacing: '0.18em',
      color,
      textTransform: 'uppercase',
      marginBottom: '20px',
    }}>
      <span style={{ display: 'inline-block', width: '32px', height: '1px', background: color, opacity: 0.5 }} />
      {children}
    </div>
  );
}

function PullQuote({ children, author }: { children: React.ReactNode; author?: string }) {
  return (
    <FadeIn>
      <blockquote style={{
        margin: '48px 0',
        padding: '28px 36px',
        borderLeft: '3px solid var(--accent)',
        background: 'rgba(232,165,52,0.04)',
        borderRadius: '0 4px 4px 0',
      }}>
        <p style={{
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          fontWeight: 500,
          color: '#fff',
          lineHeight: 1.5,
          letterSpacing: '-0.01em',
          margin: 0,
          marginBottom: author ? '12px' : 0,
        }}>
          {children}
        </p>
        {author && (
          <cite style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontStyle: 'normal',
          }}>
            — {author}
          </cite>
        )}
      </blockquote>
    </FadeIn>
  );
}

function DataCallout({ value, label, sub, color = 'var(--accent)' }: { value: string; label: string; sub?: string; color?: string }) {
  return (
    <FadeIn>
      <div style={{
        padding: '28px 32px',
        border: `1px solid ${color}25`,
        borderRadius: '4px',
        background: `${color}06`,
        marginBottom: '32px',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 'clamp(36px, 6vw, 56px)',
          fontWeight: 700,
          color,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          flexShrink: 0,
        }}>
          {value}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '6px', lineHeight: 1.3 }}>{label}</div>
          {sub && <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.5 }}>{sub}</div>}
        </div>
      </div>
    </FadeIn>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <FadeIn>
      <div style={{
        fontSize: '18px',
        lineHeight: 1.75,
        color: 'var(--text2)',
        marginBottom: '28px',
        fontFamily: 'var(--sans)',
      }}>
        {children}
      </div>
    </FadeIn>
  );
}

export default function WhyChainIntelPage() {
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100vh',
      fontFamily: 'var(--sans)',
      color: 'var(--text)',
    }}>

      {/* ── Read Progress ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(232,165,52,0.1)',
        zIndex: 200,
      }}>
        <div style={{
          height: '100%',
          width: `${readProgress}%`,
          background: 'linear-gradient(90deg, var(--accent), var(--blue))',
          transition: 'width 0.1s',
        }} />
      </div>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed',
        top: '3px',
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(8,13,22,0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(232,165,52,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 clamp(16px, 4vw, 48px)',
        height: '52px',
        gap: '24px',
      }}>
        <a href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          textDecoration: 'none',
          color: 'var(--muted)',
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          flexShrink: 0,
          transition: 'color 0.2s',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 1L3 7L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Terminal
        </a>

        {/* Logo */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="ChainIntel">
            <polygon points="10,2 18,6.5 18,13.5 10,18 2,13.5 2,6.5" stroke="var(--accent)" strokeWidth="1.5" fill="rgba(232,165,52,0.07)"/>
            <circle cx="10" cy="10" r="3" fill="var(--accent)"/>
          </svg>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', color: '#fff' }}>
            CHAIN<span style={{ color: 'var(--accent)' }}>INTEL</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
          <a href="/promo" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Features
          </a>
          <a href={STRIPE_PRO} target="_blank" rel="noopener" style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'var(--accent)',
            textDecoration: 'none',
            border: '1px solid var(--cyan-border)',
            padding: '7px 16px',
            borderRadius: '3px',
            textTransform: 'uppercase',
          }}>
            Go Pro
          </a>
        </div>
      </nav>

      {/* ══ ARTICLE HEADER ══ */}
      <header style={{
        paddingTop: '120px',
        paddingBottom: '80px',
        padding: '120px clamp(24px, 8vw, 200px) 80px',
        maxWidth: '1200px',
        margin: '0 auto',
        borderBottom: '1px solid var(--b2)',
      }}>
        <div style={{ maxWidth: '760px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '0.18em',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            marginBottom: '28px',
            padding: '6px 14px',
            border: '1px solid var(--cyan-border)',
            borderRadius: '2px',
            background: 'var(--cyan-dim)',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            Editorial · ChainIntel Intelligence
          </div>

          <h1 style={{
            fontFamily: 'var(--sans)',
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#fff',
            marginBottom: '24px',
          }}>
            Why ChainIntel
          </h1>

          <p style={{
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            color: 'var(--text2)',
            lineHeight: 1.55,
            marginBottom: '36px',
            fontWeight: 400,
            maxWidth: '640px',
          }}>
            The Bloomberg Terminal was built for a world where crypto didn&apos;t exist. That world is gone.
            Here&apos;s why digital assets deserve a terminal built from scratch — not a retrofit.
          </p>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--blue))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--mono)',
                fontSize: '13px',
                color: 'var(--bg)',
                fontWeight: 700,
              }}>C</div>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text)', fontWeight: 600 }}>ChainIntel Research</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)' }}>2026</div>
              </div>
            </div>
            <div style={{ height: '20px', width: '1px', background: 'var(--b3)' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.06em' }}>12 min read</div>
            <div style={{ height: '20px', width: '1px', background: 'var(--b3)' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.06em' }}>
              <span style={{ color: 'var(--accent)' }}>v5.18</span> · terminal intelligence
            </div>
          </div>
        </div>
      </header>

      {/* ══ ARTICLE BODY ══ */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 clamp(24px, 8vw, 200px)',
        display: 'grid',
        gridTemplateColumns: '1fr clamp(240px, 25%, 300px)',
        gap: '80px',
        alignItems: 'start',
      }}>

        {/* Main content */}
        <main style={{ paddingTop: '64px', paddingBottom: '120px' }}>

          {/* ── Section 1: The Problem ── */}
          <FadeIn>
            <SectionLabel>01 — The Problem</SectionLabel>
            <h2 style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(24px, 3.5vw, 40px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#fff',
              lineHeight: 1.2,
              marginBottom: '24px',
            }}>
              Bloomberg was built for traditional finance.<br />
              Crypto deserves its own.
            </h2>
          </FadeIn>

          <Prose>
            The Bloomberg Terminal launched in 1982. At the time, it was revolutionary: real-time market data streamed directly to traders&apos; desks, replacing phone calls and paper tape. It became the gold standard for financial intelligence — and it still is, for traditional finance.
          </Prose>

          <Prose>
            But &quot;traditional finance&quot; is the key phrase. Bloomberg was architected around equity markets, bond prices, FX rates, and corporate fundamentals. The data structures, the interface paradigms, and the underlying APIs were built for those asset classes — and that architecture hasn&apos;t meaningfully changed in 40 years.
          </Prose>

          <DataCallout
            value="$24,000"
            label="Bloomberg Terminal cost per seat, per year"
            sub="The minimum. Many enterprise contracts run $50,000–$100,000/year for multiple seats with advanced data licenses."
            color="var(--red)"
          />

          <Prose>
            Crypto is not traditional finance. On-chain data doesn&apos;t exist in Bloomberg&apos;s world. When you need to know the MVRV ratio, the exchange inflow/outflow over the last 48 hours, the current TVL of Aave, or whether a $500M wallet just moved from cold storage — Bloomberg has nothing to offer you. Literally nothing.
          </Prose>

          <PullQuote author="ChainIntel Research, 2026">
            &ldquo;A $3.8 trillion asset class with no professional-grade native terminal is either an oversight or an opportunity. We think it&apos;s the latter.&rdquo;
          </PullQuote>

          {/* ── Section 2: The Gap ── */}
          <FadeIn>
            <SectionLabel color="var(--blue)">02 — The Gap</SectionLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2, marginBottom: '24px' }}>
              No single tool combines what crypto professionals actually need.
            </h2>
          </FadeIn>

          <Prose>
            The crypto data landscape is fragmented. There are excellent point solutions: Glassnode for on-chain analytics, DefiLlama for DeFi TVL, Nansen for wallet intelligence, Coinglass for derivatives. But using all of them means maintaining five subscriptions, five browser tabs, and a mental model that stitches them together in real time.
          </Prose>

          <Prose>
            More critically, none of them connect the dots. When Bitcoin exchange outflows spike, DeFi TVL surges, whale wallets go dark, and funding rates turn negative simultaneously — that&apos;s a signal. But you only see the signal if you can see all the data at once, in context, with an intelligence layer that understands the relationships.
          </Prose>

          <FadeIn>
            <div style={{
              padding: '28px',
              border: '1px solid var(--b3)',
              borderRadius: '4px',
              background: 'var(--s1)',
              marginBottom: '32px',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--blue)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
                The six data domains no single tool covers
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { domain: 'On-Chain Analytics', tools: 'Glassnode, CryptoQuant, IntoTheBlock', color: 'var(--accent)' },
                  { domain: 'DeFi Intelligence', tools: 'DefiLlama, DeFi Pulse, Dune Analytics', color: 'var(--purple)' },
                  { domain: 'ETF & Institutional', tools: 'CoinShares, Bloomberg (TradFi only)', color: 'var(--gold)' },
                  { domain: 'Regulatory Signals', tools: 'SEC EDGAR, CFTC (scattered)', color: 'var(--orange)' },
                  { domain: 'ISO 20022 Standards', tools: 'No dedicated tracker exists', color: 'var(--red)' },
                  { domain: 'AI Synthesis', tools: 'No existing terminal has this', color: 'var(--blue)' },
                ].map(item => (
                  <div key={item.domain} style={{
                    padding: '14px',
                    border: `1px solid ${item.color}20`,
                    borderRadius: '3px',
                    background: `${item.color}06`,
                    borderLeft: `3px solid ${item.color}`,
                  }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, color: item.color, marginBottom: '6px', letterSpacing: '0.06em' }}>
                      {item.domain}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>{item.tools}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.06em' }}>
                ChainIntel is the first terminal to unify all six domains in one interface.
              </div>
            </div>
          </FadeIn>

          <Prose>
            ChainIntel is the first terminal to integrate all six data domains — with an AI synthesis layer that connects signals across them in real time. When our Overview module surfaces a market briefing, it has seen the on-chain data, the DeFi flows, the whale movements, and the regulatory calendar before generating its analysis.
          </Prose>

          {/* ── Section 3: Why Now ── */}
          <FadeIn>
            <SectionLabel color="var(--green)">03 — Why Now</SectionLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2, marginBottom: '24px' }}>
              Three macro catalysts are converging right now.
            </h2>
          </FadeIn>

          <Prose>
            Timing matters. ChainIntel isn&apos;t just a good product in a vacuum — it&apos;s the right product at the right moment. Three macro-level events have occurred in 2024–2026 that make a crypto-native terminal not just useful but essential.
          </Prose>

          <FadeIn delay={100}>
            <div style={{
              padding: '28px 32px',
              border: '1px solid rgba(232,165,52,0.2)',
              borderRadius: '4px',
              background: 'rgba(232,165,52,0.04)',
              marginBottom: '24px',
              borderLeft: '3px solid var(--accent)',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Catalyst 01 — ISO 20022 Migration Complete
              </div>
              <p style={{ fontSize: '16px', color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>
                SWIFT&apos;s ISO 20022 migration is now live. The global banking messaging standard that governs how trillions of dollars move between financial institutions every day has been updated — and <strong style={{ color: 'var(--text)' }}>XRP, XLM, HBAR, QNT, ADA, and IOTA are all compliant</strong>. This isn&apos;t speculation. These assets are being positioned for real banking infrastructure integration. ChainIntel tracks their compliance status, institutional adoption signals, and banking partnership news in one unified module.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div style={{
              padding: '28px 32px',
              border: '1px solid rgba(107,138,255,0.2)',
              borderRadius: '4px',
              background: 'rgba(107,138,255,0.04)',
              marginBottom: '24px',
              borderLeft: '3px solid var(--blue)',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--blue)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Catalyst 02 — Spot Crypto ETFs Approved
              </div>
              <p style={{ fontSize: '16px', color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>
                The SEC approved spot Bitcoin and Ethereum ETFs. BlackRock&apos;s IBIT crossed $50B AUM. Fidelity, ARK, VanEck, Bitwise — all have products. <strong style={{ color: 'var(--text)' }}>Institutional capital is now required to track ETF flows as a first-class signal</strong>. Daily inflows and outflows from spot ETFs now move crypto markets. ChainIntel is one of the only terminals tracking this natively, in real time.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div style={{
              padding: '28px 32px',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '4px',
              background: 'rgba(16,185,129,0.04)',
              marginBottom: '32px',
              borderLeft: '3px solid var(--green)',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--green)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Catalyst 03 — Regulatory Clarity Emerging
              </div>
              <p style={{ fontSize: '16px', color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>
                The GENIUS Act is moving through Congress. EU MiCA is live. The SEC has formed a dedicated crypto task force. After years of enforcement-by-ambiguity, the rules of the game are being written. <strong style={{ color: 'var(--text)' }}>Professionals need a regulatory intelligence feed that tracks every development in real time</strong> — not a press release three days late.
              </p>
            </div>
          </FadeIn>

          <Prose>
            Each of these catalysts individually would justify a new category of tooling. Together, they represent a structural shift in how institutional capital engages with digital assets. The demand for professional-grade crypto intelligence has never been higher — and the supply of tools that can actually serve institutional-grade needs remains dangerously thin.
          </Prose>

          {/* ── Section 4: 89 Sources ── */}
          <FadeIn>
            <SectionLabel color="var(--purple)">04 — The Data</SectionLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2, marginBottom: '24px' }}>
              89 verified sources vs Bloomberg&apos;s black box.
            </h2>
          </FadeIn>

          <Prose>
            Bloomberg&apos;s data sourcing is proprietary and opaque. You pay $24,000 a year and trust that the data is good. There is no source list, no API documentation you can inspect, no transparency about methodology. For traditional finance, this has been acceptable — Bloomberg has a 40-year track record.
          </Prose>

          <Prose>
            For crypto, opacity is a liability. On-chain data has a ground truth: the blockchain itself. You can verify it. You can cross-reference it. Any intelligence product that can&apos;t explain where its data comes from should be treated with skepticism.
          </Prose>

          <DataCallout
            value="89"
            label="Verified, named data sources"
            sub="Every source is documented, tested for API reliability, and cross-referenced for data accuracy. Updated quarterly. No black boxes."
            color="var(--purple)"
          />

          <Prose>
            ChainIntel sources from CoinGecko, Glassnode, DefiLlama, Santiment, CryptoQuant, Nansen, Coinglass, Alternative.me, Messari, SEC EDGAR, CFTC, CoinShares, IntoTheBlock, LunarCrush, Whale Alert, and 74 additional verified providers. Every source is named. Every API is documented. Every data point is traceable to its origin.
          </Prose>

          <PullQuote author="ChainIntel Verification Standard">
            &ldquo;We believe you have the right to know where your intelligence comes from. If you can&apos;t verify your data source, you can&apos;t trust your data.&rdquo;
          </PullQuote>

          {/* ── Section 5: Free vs $24K ── */}
          <FadeIn>
            <SectionLabel color="var(--gold)">05 — The Price</SectionLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2, marginBottom: '24px' }}>
              Free vs $24,000/year: the access problem.
            </h2>
          </FadeIn>

          <Prose>
            The Bloomberg Terminal&apos;s pricing is a feature, not a bug — for Bloomberg. It creates a two-tier information market where only well-capitalized institutions can access professional-grade data. Individual investors, independent researchers, startup founders, and builders in developing markets are excluded by design.
          </Prose>

          <Prose>
            This isn&apos;t how it should work. Crypto was built on the premise that financial infrastructure should be open. ChainIntel takes that seriously. Our free tier provides genuine intelligence value — not a watered-down preview. Market overview, DeFi analytics, public regulatory feeds, and sentiment data are all free, forever.
          </Prose>

          <FadeIn>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '32px',
            }}>
              <div style={{
                padding: '24px',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '4px',
                background: 'rgba(239,68,68,0.04)',
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Bloomberg Access
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '28px', fontWeight: 700, color: 'var(--red)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  $24,000/yr
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>
                  Annual license. Per seat. No free tier. No trial. Enterprise sales process required.
                  Available to: hedge funds, banks, large institutions only.
                </div>
              </div>
              <div style={{
                padding: '24px',
                border: '1px solid var(--cyan-border)',
                borderRadius: '4px',
                background: 'var(--cyan-dim)',
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  ChainIntel Access
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '28px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                  $0 → $49/mo
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>
                  Free tier: real intelligence, no credit card. Pro at $49/mo. Enterprise at $499/mo.
                  Available to: everyone.
                </div>
              </div>
            </div>
          </FadeIn>

          <Prose>
            Pro at $49/month means a crypto-curious developer can afford genuine professional intelligence. A trader in Brazil, a researcher in Singapore, a DeFi founder in Kenya — all have access to the same data as a hedge fund portfolio manager. That&apos;s the world we&apos;re building toward.
          </Prose>

          {/* ── Section 6: AI-Native ── */}
          <FadeIn>
            <SectionLabel color="var(--blue)">06 — AI-Native</SectionLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2, marginBottom: '24px' }}>
              AI-native vs legacy UI: two different eras of software.
            </h2>
          </FadeIn>

          <Prose>
            Bloomberg&apos;s interface paradigm is command-line driven. You type four-letter mnemonics to navigate. It&apos;s a product of its era — and it shows. The interface requires weeks of training. There is an entire industry of Bloomberg certification courses. The complexity is a moat, but it&apos;s also a cost that users silently pay every day.
          </Prose>

          <Prose>
            ChainIntel was built AI-first, not AI-bolted-on. Advanced LLM reasoning is embedded at the intelligence layer — not as a chat widget sitting on top of a legacy data system. When ChainIntel synthesizes market conditions, it draws on 89 data sources in real time, applies language model reasoning, and surfaces insights in plain language. No mnemonics. No training course.
          </Prose>

          <FadeIn>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '32px',
            }}>
              {[
                { title: 'Market synthesis', desc: 'AI reads 89 sources simultaneously and produces a structured morning brief in natural language.' },
                { title: 'Whale context', desc: 'When a $500M wallet moves, AI cross-references the address history, destination, and market conditions.' },
                { title: 'Regulatory alerts', desc: 'SEC filings, Congressional testimony, and central bank statements are summarized and indexed in real time.' },
                { title: 'DeFi anomaly detection', desc: 'Unusual TVL movements or protocol yield changes are flagged with AI-generated context.' },
              ].map(item => (
                <div key={item.title} style={{
                  padding: '20px',
                  border: '1px solid var(--b3)',
                  borderRadius: '4px',
                  background: 'var(--s1)',
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--blue)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{item.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* ── Section 7: Built for Builders ── */}
          <FadeIn>
            <SectionLabel color="var(--orange)">07 — Built for Builders</SectionLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.2, marginBottom: '24px' }}>
              Not just traders. Built for the people building Web3.
            </h2>
          </FadeIn>

          <Prose>
            Bloomberg was built for traders. It assumes your job is to execute trades, not build products. ChainIntel was designed with a broader constituency in mind: protocol founders who need to understand market conditions for their token, researchers who need to cite reliable data sources, developers who need to understand blockchain state, and yes, traders who need execution-quality intelligence.
          </Prose>

          <Prose>
            The free tier exists specifically because we believe builders shouldn&apos;t pay Bloomberg prices to understand the markets their products operate in. DeFi protocol founders, DAO contributors, crypto researchers, and independent journalists all deserve professional-grade data access. Intelligence should not require a $24,000 per year credit card.
          </Prose>

          <DataCallout
            value="v5.18"
            label="Current terminal version — shipping continuously"
            sub="Built in public. Every module is production-ready. New features ship without fanfare. The best version of ChainIntel is always the next one."
            color="var(--orange)"
          />

          <Prose>
            ChainIntel is an opinionated product. We have a thesis about what matters in crypto — and it shows in every module. ISO 20022 matters because it bridges crypto and global banking infrastructure. Whale tracking matters because large wallet movements are one of the highest-signal indicators in the market. ETF flows matter because institutional capital allocation changes market structure. AI synthesis matters because the volume of data is too large for any human to synthesize manually.
          </Prose>

          {/* ── Closing CTA ── */}
          <FadeIn>
            <div style={{
              marginTop: '64px',
              padding: '40px',
              border: '1px solid var(--cyan-border)',
              borderRadius: '6px',
              background: 'rgba(232,165,52,0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: '-1px',
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, var(--accent), var(--blue))',
              }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Ready to Start
              </div>
              <h3 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>
                The Bloomberg Terminal for Web3 is live. Start free today.
              </h3>
              <p style={{ fontSize: '16px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '28px', maxWidth: '500px' }}>
                No credit card. No annual contract. No enterprise sales call. Open the terminal and see what professional crypto intelligence actually looks like.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a href="/" style={{
                  display: 'inline-block',
                  padding: '14px 32px',
                  background: 'var(--accent)',
                  color: 'var(--bg)',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  Open Terminal — Free
                </a>
                <a href={STRIPE_PRO} target="_blank" rel="noopener" style={{
                  display: 'inline-block',
                  padding: '14px 32px',
                  background: 'transparent',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  border: '1px solid var(--cyan-border)',
                }}>
                  Go Pro — $49/mo
                </a>
              </div>
            </div>
          </FadeIn>

        </main>

        {/* Sticky sidebar */}
        <aside style={{
          paddingTop: '64px',
          position: 'sticky',
          top: '80px',
        }}>
          {/* Table of contents */}
          <div style={{
            padding: '20px',
            border: '1px solid var(--b2)',
            borderRadius: '4px',
            background: 'var(--s1)',
            marginBottom: '20px',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Contents
            </div>
            {[
              ['01', 'The Problem'],
              ['02', 'The Gap'],
              ['03', 'Why Now'],
              ['04', 'The Data'],
              ['05', 'The Price'],
              ['06', 'AI-Native'],
              ['07', 'Built for Builders'],
            ].map(([num, label]) => (
              <div key={num} style={{
                display: 'flex',
                gap: '10px',
                padding: '7px 0',
                borderBottom: '1px solid var(--b1)',
                alignItems: 'center',
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.06em', flexShrink: 0 }}>{num}</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: '12px', color: 'var(--text2)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Key stats */}
          <div style={{
            padding: '20px',
            border: '1px solid var(--b2)',
            borderRadius: '4px',
            background: 'var(--s1)',
            marginBottom: '20px',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Key Numbers
            </div>
            {[
              { label: 'Data Sources', value: '89', color: 'var(--accent)' },
              { label: 'Asset Coverage', value: '500+', color: 'var(--blue)' },
              { label: 'Intel Modules', value: '12', color: 'var(--green)' },
              { label: 'Bloomberg Cost', value: '$24K/yr', color: 'var(--red)' },
              { label: 'ChainIntel Free', value: '$0/mo', color: 'var(--accent)' },
              { label: 'ChainIntel Pro', value: '$49/mo', color: 'var(--accent)' },
              { label: 'Price Difference', value: '40x', color: 'var(--gold)' },
            ].map(stat => (
              <div key={stat.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '7px 0',
                borderBottom: '1px solid var(--b1)',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{stat.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: stat.color, fontWeight: 600 }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Related reads */}
          <div style={{
            padding: '20px',
            border: '1px solid var(--b2)',
            borderRadius: '4px',
            background: 'var(--s1)',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Explore
            </div>
            {[
              { label: 'View Pitch Deck', href: '/deck', color: 'var(--accent)' },
              { label: 'See All Features', href: '/promo', color: 'var(--blue)' },
              { label: 'Launch Terminal', href: '/', color: 'var(--green)' },
              { label: 'Pro — $49/mo', href: STRIPE_PRO, color: 'var(--accent)', external: true },
            ].map(link => (
              <a key={link.label} href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener' : undefined} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                borderBottom: '1px solid var(--b1)',
                textDecoration: 'none',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                color: link.color,
                letterSpacing: '0.06em',
                transition: 'opacity 0.2s',
              }}>
                <span style={{ fontSize: '10px' }}>→</span>
                {link.label}
              </a>
            ))}
          </div>
        </aside>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--b2)',
        padding: '32px clamp(24px, 8vw, 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.06em' }}>
          © 2026 ChainIntel Inc. · All intelligence, no noise.
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[['Terminal', '/'], ['Deck', '/deck'], ['Promo', '/promo']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
