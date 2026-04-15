'use client';

import { useState, useEffect, useRef } from 'react';
import '../../styles/terminal.css';

const STRIPE_PRO = 'https://buy.stripe.com/dRm6oI94hf428Sq7pgbwk01';
const STRIPE_ENT = 'https://buy.stripe.com/dRm6oI94hf428Sq7pgbwk02';

const MODULES = [
  { id: 'OVERVIEW', icon: '◈', color: 'var(--accent)', desc: 'AI-synthesized market briefings, Fear & Greed, macro signals.' },
  { id: 'MARKETS', icon: '◉', color: 'var(--blue)', desc: 'Top 500 assets ranked by cap, volume, dominance, 24h change.' },
  { id: 'ON-CHAIN', icon: '⬡', color: 'var(--green)', desc: 'MVRV, NVT, exchange flows, miner reserve, hash rate trends.' },
  { id: 'DeFi', icon: '◫', color: 'var(--purple)', desc: '50+ protocols. TVL rankings, yields, stablecoin supply monitor.' },
  { id: 'ETF & INST', icon: '◧', color: 'var(--gold)', desc: 'Spot ETF inflows, institutional holdings, fund comparison.' },
  { id: 'REGULATORY', icon: '◩', color: 'var(--orange)', desc: 'SEC, CFTC, EU MiCA, GENIUS Act — live regulatory feed.' },
  { id: 'ISO 20022', icon: '⬢', color: 'var(--accent)', desc: 'SWIFT banking standard: XRP, XLM, HBAR, QNT, ADA, IOTA.' },
  { id: 'SENTIMENT', icon: '◌', color: 'var(--blue)', desc: 'Social volume, Twitter trends, GitHub developer activity.' },
  { id: 'DERIVATIVES', icon: '◎', color: 'var(--green)', desc: 'Funding rates, open interest, liquidation maps, basis trades.' },
  { id: 'WHALES', icon: '◕', color: 'var(--red)', desc: '$10M+ on-chain movements scored by ChainIntel AI.' },
  { id: 'PORTFOLIO', icon: '◑', color: 'var(--purple)', desc: 'Live P&L tracking, AI morning briefs, custom watchlists.' },
  { id: 'PRICING', icon: '◐', color: 'var(--muted)', desc: 'Free, Pro, Enterprise — transparent, no hidden costs.' },
];

const SOURCES = [
  'CoinGecko', 'Glassnode', 'DefiLlama', 'Santiment', 'Nansen', 'CoinMarketCap',
  'Alternative.me', 'CryptoQuant', 'Messari', 'The Block', 'DeFi Pulse', 'Dune Analytics',
  'IntoTheBlock', 'LunarCrush', 'Whale Alert', 'Etherscan', 'BscScan', 'SEC EDGAR',
  'CFTC', 'BitMEX Research', 'Coinglass', 'FRED', 'CoinShares', 'Galaxy Digital',
];

const STATS = [
  { value: '89', label: 'Verified Sources', icon: '◈' },
  { value: '500+', label: 'Assets Covered', icon: '◉' },
  { value: '12', label: 'Intel Modules', icon: '⬡' },
  { value: '$0', label: 'To Start', icon: '◫' },
];

export default function PromoPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
  const [count, setCount] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveModule(m => (m + 1) % MODULES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const end = 89;
    let start = 0;
    const timer = setInterval(() => {
      start += 2;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 25);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  const bgParallax = scrollY * 0.4;

  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100vh',
      fontFamily: 'var(--sans)',
      color: 'var(--text)',
      overflowX: 'hidden',
    }}>

      {/* ── Sticky Nav ── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(8,13,22,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(232,165,52,0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        height: '56px',
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
          transition: 'color 0.2s',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 1L3 7L9 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Terminal
        </a>

        {/* Logo center */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="ChainIntel">
            <polygon points="12,2 22,7.5 22,16.5 12,22 2,16.5 2,7.5" stroke="var(--accent)" strokeWidth="1.5" fill="rgba(232,165,52,0.07)"/>
            <circle cx="12" cy="12" r="3.5" fill="var(--accent)"/>
            <line x1="12" y1="5.5" x2="12" y2="8.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.4"/>
            <line x1="12" y1="15.5" x2="12" y2="18.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.4"/>
            <line x1="5.5" y1="8.5" x2="8.5" y2="10" stroke="var(--accent)" strokeWidth="1.2" opacity="0.4"/>
            <line x1="15.5" y1="14" x2="18.5" y2="15.5" stroke="var(--accent)" strokeWidth="1.2" opacity="0.4"/>
          </svg>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '15px', fontWeight: 600, letterSpacing: '0.08em', color: '#fff' }}>
            CHAIN<span style={{ color: 'var(--accent)' }}>INTEL</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <a href="/why-chainintel" style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            color: 'var(--muted)',
            textDecoration: 'none',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Why Us</a>
          <a href={STRIPE_PRO} target="_blank" rel="noopener" style={{
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'var(--bg)',
            background: 'var(--accent)',
            textDecoration: 'none',
            padding: '8px 20px',
            borderRadius: '3px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            Get Pro — $49
          </a>
        </div>
      </nav>

      {/* ══ HERO SECTION ══ */}
      <section ref={heroRef} style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '100px 24px 80px',
        overflow: 'hidden',
      }}>
        {/* Background layers */}
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${bgParallax}px)`,
          pointerEvents: 'none',
        }}>
          {/* Large glow */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '500px',
            background: 'radial-gradient(ellipse, rgba(232,165,52,0.12) 0%, transparent 70%)',
          }} />
          {/* Blue accent */}
          <div style={{
            position: 'absolute',
            top: '30%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(ellipse, rgba(107,138,255,0.08) 0%, transparent 70%)',
          }} />
          {/* Grid */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(232,165,52,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(232,165,52,0.035) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }} />
          {/* Gradient fade top/bottom */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to bottom, var(--bg), transparent)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to top, var(--bg), transparent)',
          }} />
        </div>

        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          letterSpacing: '0.18em',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          marginBottom: '28px',
          padding: '7px 18px',
          border: '1px solid var(--cyan-border)',
          borderRadius: '2px',
          background: 'var(--cyan-dim)',
          position: 'relative',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
          AI-Native Financial Intelligence
        </div>

        {/* Hero headline */}
        <h1 style={{
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(40px, 8vw, 100px)',
          fontWeight: 700,
          lineHeight: 0.95,
          letterSpacing: '-0.03em',
          textAlign: 'center',
          color: '#fff',
          marginBottom: '28px',
          position: 'relative',
          maxWidth: '1000px',
        }}>
          The Bloomberg Terminal
          <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--blue) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Has Arrived.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          color: 'var(--text2)',
          textAlign: 'center',
          lineHeight: 1.55,
          maxWidth: '640px',
          marginBottom: '48px',
          position: 'relative',
        }}>
          ChainIntel is the AI-native Bloomberg Terminal for digital assets —
          built from scratch for on-chain intelligence, DeFi analytics, and crypto-native institutions.
        </p>

        {/* Price comparison callout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          marginBottom: '48px',
          position: 'relative',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <div style={{
            padding: '18px 28px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '4px 0 0 4px',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '28px', fontWeight: 700, color: 'var(--red)', letterSpacing: '-0.02em', lineHeight: 1 }}>$24,000</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>Bloomberg / year</div>
          </div>
          <div style={{
            padding: '10px 16px',
            background: 'var(--s2)',
            border: '1px solid var(--b3)',
            borderLeft: 'none',
            borderRight: 'none',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            color: 'var(--muted)',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
          }}>VS</div>
          <div style={{
            padding: '18px 28px',
            background: 'rgba(232,165,52,0.08)',
            border: '1px solid rgba(232,165,52,0.25)',
            borderRadius: '0 4px 4px 0',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '28px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1 }}>$0</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' }}>ChainIntel (Free)</div>
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
          <a href="/" style={{
            display: 'inline-block',
            padding: '18px 44px',
            background: 'linear-gradient(135deg, var(--accent) 0%, #00b896 100%)',
            color: 'var(--bg)',
            textDecoration: 'none',
            borderRadius: '4px',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            boxShadow: '0 0 40px rgba(232,165,52,0.2), 0 0 80px rgba(232,165,52,0.08)',
          }}>
            Launch Terminal — Free
          </a>
          <a href={STRIPE_PRO} target="_blank" rel="noopener" style={{
            display: 'inline-block',
            padding: '18px 44px',
            background: 'transparent',
            color: 'var(--accent)',
            textDecoration: 'none',
            borderRadius: '4px',
            fontFamily: 'var(--mono)',
            fontSize: '13px',
            fontWeight: 400,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            border: '1px solid var(--cyan-border)',
          }}>
            Go Pro — $49/mo
          </a>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          opacity: 0.5,
        }}>
          <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom, transparent, var(--accent))' }} />
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 4L6 9L11 4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* ══ STATS BAND ══ */}
      <section style={{
        borderTop: '1px solid var(--b2)',
        borderBottom: '1px solid var(--b2)',
        background: 'var(--s1)',
        padding: '40px 24px',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '32px',
          textAlign: 'center',
        }}>
          {STATS.map((stat, i) => (
            <div key={i}>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 'clamp(40px, 6vw, 64px)',
                fontWeight: 700,
                color: 'var(--accent)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: '8px',
              }}>
                {stat.value === '89' ? count : stat.value}
              </div>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                color: 'var(--muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ MODULE SHOWCASE ══ */}
      <section style={{
        padding: 'clamp(60px, 10vw, 120px) 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{
              display: 'inline-block',
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              color: 'var(--accent)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}>12 Intelligence Modules</div>
            <h2 style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(28px, 5vw, 56px)',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '16px',
            }}>
              Every signal. One terminal.
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
              No more switching between 12 different tools. ChainIntel consolidates all your intelligence needs.
            </p>
          </div>

          {/* Active module highlight */}
          <div style={{
            padding: '28px 32px',
            border: `1px solid ${MODULES[activeModule].color}40`,
            borderRadius: '6px',
            background: `${MODULES[activeModule].color}08`,
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'all 0.4s ease',
            minHeight: '88px',
          }}>
            <span style={{ fontSize: '36px', lineHeight: 1, color: MODULES[activeModule].color, transition: 'color 0.4s' }}>
              {MODULES[activeModule].icon}
            </span>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: MODULES[activeModule].color, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', transition: 'color 0.4s' }}>
                {MODULES[activeModule].id}
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text)', lineHeight: 1.5 }}>
                {MODULES[activeModule].desc}
              </div>
            </div>
          </div>

          {/* Module grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
          }}>
            {MODULES.map((mod, i) => (
              <button
                key={i}
                onMouseEnter={() => setActiveModule(i)}
                onClick={() => setActiveModule(i)}
                style={{
                  padding: '16px 18px',
                  border: `1px solid ${i === activeModule ? mod.color + '50' : 'var(--b2)'}`,
                  borderRadius: '4px',
                  background: i === activeModule ? `${mod.color}0a` : 'var(--s1)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '18px', color: i === activeModule ? mod.color : 'var(--muted)', transition: 'color 0.2s' }}>{mod.icon}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: i === activeModule ? mod.color : 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'color 0.2s' }}>
                  {mod.id}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DATA SOURCES ══ */}
      <section style={{
        padding: 'clamp(60px, 10vw, 120px) 24px',
        borderTop: '1px solid var(--b2)',
        background: 'var(--s1)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Verified Data Infrastructure
            </div>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent)' }}>89</span> verified sources.<br />
              Zero black boxes.
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
              Every data point in ChainIntel is sourced from a named, verified provider. Bloomberg hides its sources. We publish ours.
            </p>
          </div>

          {/* Source pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '40px',
          }}>
            {SOURCES.map((source, i) => (
              <div key={i} style={{
                padding: '8px 16px',
                border: '1px solid var(--b3)',
                borderRadius: '3px',
                background: 'var(--s2)',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                color: 'var(--text2)',
                letterSpacing: '0.06em',
                transition: 'border-color 0.2s, color 0.2s',
              }}>
                {source}
              </div>
            ))}
            <div style={{
              padding: '8px 16px',
              border: '1px solid var(--cyan-border)',
              borderRadius: '3px',
              background: 'var(--cyan-dim)',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              color: 'var(--accent)',
              letterSpacing: '0.06em',
            }}>
              +65 more verified sources
            </div>
          </div>

          <div style={{
            padding: '24px 32px',
            border: '1px solid var(--b3)',
            borderRadius: '4px',
            background: 'var(--s2)',
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L25 8.5V14C25 19.5 20.5 24.5 14 26C7.5 24.5 3 19.5 3 14V8.5L14 3Z" stroke="var(--accent)" strokeWidth="1.5" fill="rgba(232,165,52,0.08)"/>
              <path d="M9 14L12.5 17.5L19 11" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                Our Verification Standard
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.5 }}>
                Every source undergoes API reliability testing, latency benchmarking, and data accuracy auditing before going live. Sources are reviewed quarterly.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURE COMPARISON ══ */}
      <section style={{
        padding: 'clamp(60px, 10vw, 120px) 24px',
        borderTop: '1px solid var(--b2)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Why Switch
            </div>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Built for crypto.<br />
              <span style={{ color: 'var(--accent)' }}>Not retrofitted</span> for it.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              {
                label: 'Bloomberg Terminal',
                color: 'var(--red)',
                bgColor: 'rgba(239,68,68,0.04)',
                borderColor: 'rgba(239,68,68,0.2)',
                items: [
                  '$24,000/year minimum per seat',
                  'No native on-chain data layer',
                  'No DeFi protocol analytics',
                  'No ISO 20022 crypto tracking',
                  'No whale movement alerts',
                  'No AI synthesis or NLP query',
                  'Legacy UI from the 1980s',
                  'Proprietary black-box data',
                  'Enterprise-only access',
                ],
                prefix: '✗',
              },
              {
                label: 'ChainIntel Terminal',
                color: 'var(--accent)',
                bgColor: 'rgba(232,165,52,0.04)',
                borderColor: 'rgba(232,165,52,0.2)',
                items: [
                  'Free to start — Pro at $49/month',
                  'Full on-chain suite (MVRV, NVT, flows)',
                  '50+ DeFi protocols with TVL tracking',
                  'ISO 20022 banking tracker (6 assets)',
                  'Whale tracking with ChainScore AI',
                  'AI-native synthesis layer (89 sources)',
                  'Modern terminal UI — built 2026',
                  '89 verified, transparent data sources',
                  'Free tier for builders & developers',
                ],
                prefix: '✓',
              },
            ].map(col => (
              <div key={col.label} style={{
                padding: '32px',
                border: `1px solid ${col.borderColor}`,
                borderRadius: '6px',
                background: col.bgColor,
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600, color: col.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  {col.label}
                </div>
                {col.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '9px 0',
                    borderBottom: i < col.items.length - 1 ? `1px solid ${col.borderColor}` : 'none',
                    fontSize: '14px',
                    color: col.prefix === '✓' ? 'var(--text)' : 'var(--text2)',
                  }}>
                    <span style={{ color: col.color, fontWeight: 600, flexShrink: 0, fontSize: '12px' }}>{col.prefix}</span>
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING SUMMARY ══ */}
      <section style={{
        padding: 'clamp(60px, 10vw, 120px) 24px',
        borderTop: '1px solid var(--b2)',
        background: 'var(--s1)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Transparent Pricing
            </div>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '16px' }}>
              Start free. Scale when ready.
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
              No hidden fees. No annual contracts. No enterprise sales calls required.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              {
                tier: 'FREE',
                price: '$0',
                period: 'forever',
                color: 'var(--muted)',
                highlight: false,
                items: ['Market overview', 'Basic DeFi data', 'Public reg feeds', 'Community access'],
                cta: 'Start Free',
                href: '/',
              },
              {
                tier: 'PRO',
                price: '$49',
                period: '/month',
                color: 'var(--accent)',
                highlight: true,
                items: ['All Free features', 'Full on-chain suite', 'Whale tracking', 'ISO 20022 monitor', 'AI morning briefs', 'Full derivatives'],
                cta: 'Subscribe Now',
                href: STRIPE_PRO,
              },
              {
                tier: 'ENTERPRISE',
                price: '$499',
                period: '/month',
                color: 'var(--blue)',
                highlight: false,
                items: ['All Pro features', 'Multi-seat access', 'API access', 'Custom integrations', 'SLA + support'],
                cta: 'Contact Sales',
                href: STRIPE_ENT,
              },
            ].map(plan => (
              <div key={plan.tier} style={{
                padding: '32px 24px',
                border: `1px solid ${plan.highlight ? 'var(--cyan-border)' : 'var(--b3)'}`,
                borderRadius: '6px',
                background: plan.highlight ? 'rgba(232,165,52,0.04)' : 'var(--s2)',
                position: 'relative',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {plan.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-1px',
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, var(--accent), var(--blue))',
                    borderRadius: '6px 6px 0 0',
                  }} />
                )}
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: plan.color, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '16px' }}>{plan.tier}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '48px', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '4px' }}>{plan.price}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', marginBottom: '24px' }}>{plan.period}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  {plan.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid var(--b1)', fontSize: '13px', color: 'var(--text2)' }}>
                      <span style={{ color: plan.color, fontSize: '10px' }}>✓</span> {item}
                    </div>
                  ))}
                </div>
                <a href={plan.href} target={plan.href.startsWith('http') ? '_blank' : undefined} rel="noopener" style={{
                  display: 'block',
                  marginTop: '24px',
                  padding: '14px',
                  textAlign: 'center',
                  borderRadius: '3px',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                  fontWeight: plan.highlight ? 700 : 400,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  background: plan.highlight ? 'var(--accent)' : 'transparent',
                  color: plan.highlight ? 'var(--bg)' : plan.color,
                  border: plan.highlight ? 'none' : `1px solid ${plan.color}50`,
                }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '32px',
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'var(--muted)',
            letterSpacing: '0.06em',
          }}>
            Bloomberg Terminal costs $24,000/year. ChainIntel Pro: $588/year.{' '}
            <span style={{ color: 'var(--accent)' }}>Save $23,412 annually.</span>
          </div>
        </div>
      </section>

      {/* ══ WAITLIST / NEWSLETTER ══ */}
      <section style={{
        padding: 'clamp(80px, 12vw, 140px) 24px',
        borderTop: '1px solid var(--b2)',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(232,165,52,0.07) 0%, transparent 70%)',
      }}>
        {/* Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(232,165,52,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,165,52,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Join the Waitlist
          </div>
          <h2 style={{
            fontFamily: 'var(--sans)',
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '16px',
          }}>
            Be first when<br />
            <span style={{ color: 'var(--accent)' }}>Pro features drop.</span>
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '40px' }}>
            Get notified when new intelligence modules, AI features, and institutional tools go live. No spam — only signal.
          </p>

          {submitted ? (
            <div style={{
              padding: '28px 32px',
              border: '1px solid var(--cyan-border)',
              borderRadius: '6px',
              background: 'var(--cyan-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="1.5"/>
                <path d="M8 12L11 15L16 9" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--accent)', marginBottom: '4px' }}>You&apos;re on the list.</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)' }}>We&apos;ll notify you at <strong>{email}</strong> when new features drop.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '16px 20px',
                    background: 'var(--s2)',
                    border: '1px solid var(--b3)',
                    borderRadius: '4px',
                    fontFamily: 'var(--mono)',
                    fontSize: '13px',
                    color: 'var(--text)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--cyan-border)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--b3)')}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '16px 32px',
                    background: loading ? 'var(--s3)' : 'var(--accent)',
                    color: 'var(--bg)',
                    border: 'none',
                    borderRadius: '4px',
                    fontFamily: 'var(--mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? 'Submitting...' : 'Join Waitlist'}
                </button>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '12px', letterSpacing: '0.06em' }}>
                No spam. Unsubscribe anytime. We send about 2 emails/month.
              </div>
            </form>
          )}

          <div style={{ marginTop: '48px', display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={STRIPE_PRO} target="_blank" rel="noopener" style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, var(--accent), #00b896)',
              color: 'var(--bg)',
              textDecoration: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Subscribe Pro — $49/mo
            </a>
            <a href={STRIPE_ENT} target="_blank" rel="noopener" style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'transparent',
              color: 'var(--blue)',
              textDecoration: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: '1px solid rgba(107,138,255,0.3)',
            }}>
              Enterprise — $499/mo
            </a>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{
        borderTop: '1px solid var(--b2)',
        padding: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.06em' }}>
          © 2026 ChainIntel Inc. · chainintelterminal.com
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="mailto:support@chainintelterminal.com" style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            SUPPORT@CHAININTELTERMINAL.COM
          </a>
          {[['Terminal', '/'], ['Deck', '/deck'], ['Why ChainIntel', '/why-chainintel']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {label}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
