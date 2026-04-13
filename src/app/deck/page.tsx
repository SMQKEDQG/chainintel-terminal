'use client';

import { useState, useEffect } from 'react';
import '../../styles/terminal.css';

const STRIPE_PRO = 'https://buy.stripe.com/dRm6oI94hf428Sq7pgbwk01';
const STRIPE_ENT = 'https://buy.stripe.com/dRm6oI94hf428Sq7pgbwk02';

const slides = [
  { id: '01', label: 'OPENING', title: 'Cover' },
  { id: '02', label: 'PROBLEM', title: 'The Problem' },
  { id: '03', label: 'SOLUTION', title: 'Our Solution' },
  { id: '04', label: 'PRODUCT', title: 'Product' },
  { id: '05', label: 'MARKET', title: 'Market Size' },
  { id: '06', label: 'TRACTION', title: 'Traction' },
  { id: '07', label: 'BUSINESS MODEL', title: 'Business Model' },
  { id: '08', label: 'COMPETITION', title: 'Competition' },
  { id: '09', label: 'WHY NOW', title: 'Why Now' },
  { id: '10', label: 'TEAM', title: 'Team' },
  { id: '11', label: 'INVESTMENT', title: 'The Ask' },
];

export default function DeckPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = document.getElementById('deck-container');
    if (!container) return;
    const handleScroll = () => {
      const sections = container.querySelectorAll('[data-slide]');
      const scrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      setScrollProgress(maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0);
      sections.forEach((section, i) => {
        const el = section as HTMLElement;
        const top = el.offsetTop - container.offsetTop;
        if (scrollTop >= top - 200) setActiveSlide(i);
      });
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSlide = (index: number) => {
    const container = document.getElementById('deck-container');
    const section = document.querySelector(`[data-slide="${index}"]`) as HTMLElement;
    if (container && section) {
      container.scrollTo({ top: section.offsetTop - 60, behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--sans)',
      color: 'var(--text)',
    }}>

      {/* ── Top Navigation ── */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(8,13,22,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,212,170,0.12)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        height: '52px',
        gap: '24px',
      }}>
        <a href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
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

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', marginRight: 'auto' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-label="ChainIntel logo">
            <polygon points="11,2 20,7 20,15 11,20 2,15 2,7" stroke="var(--cyan)" strokeWidth="1.5" fill="rgba(0,212,170,0.06)"/>
            <circle cx="11" cy="11" r="3" fill="var(--cyan)" opacity="0.9"/>
            <line x1="11" y1="5" x2="11" y2="8" stroke="var(--cyan)" strokeWidth="1" opacity="0.5"/>
            <line x1="11" y1="14" x2="11" y2="17" stroke="var(--cyan)" strokeWidth="1" opacity="0.5"/>
          </svg>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', color: '#fff' }}>
            CHAIN<span style={{ color: 'var(--cyan)' }}>INTEL</span>
          </span>
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: '9px',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginLeft: '6px',
          }}>Investor Deck · 2026</span>
        </div>

        <a href={STRIPE_PRO} target="_blank" rel="noopener" style={{
          fontFamily: 'var(--mono)',
          fontSize: '10px',
          letterSpacing: '0.08em',
          color: 'var(--cyan)',
          textDecoration: 'none',
          border: '1px solid var(--cyan-border)',
          padding: '6px 14px',
          borderRadius: '3px',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          SUBSCRIBE
        </a>
      </nav>

      {/* ── Progress Bar ── */}
      <div style={{
        position: 'fixed',
        top: '52px',
        left: 0,
        right: 0,
        height: '2px',
        background: 'var(--b1)',
        zIndex: 99,
      }}>
        <div style={{
          height: '100%',
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, var(--cyan), var(--blue))',
          transition: 'width 0.1s',
        }} />
      </div>

      {/* ── Side Navigation ── */}
      <aside style={{
        position: 'fixed',
        top: '50%',
        right: '24px',
        transform: 'translateY(-50%)',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => scrollToSlide(i)}
            title={slide.title}
            style={{
              width: i === activeSlide ? '28px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === activeSlide ? 'var(--cyan)' : 'var(--b3)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.25s',
              padding: 0,
            }}
          />
        ))}
      </aside>

      {/* ── Main Content ── */}
      <div
        id="deck-container"
        style={{
          marginTop: '54px',
          overflowY: 'auto',
          height: 'calc(100vh - 54px)',
          scrollSnapType: 'none',
        }}
      >

        {/* ══ SLIDE 01 — COVER ══ */}
        <section data-slide="0" style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '80px 40px',
          overflow: 'hidden',
        }}>
          {/* Grid background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,212,170,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,170,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }} />
          {/* Radial glow */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,212,170,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', textAlign: 'center', maxWidth: '860px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--mono)',
              fontSize: '10px',
              letterSpacing: '0.18em',
              color: 'var(--cyan)',
              textTransform: 'uppercase',
              marginBottom: '32px',
              padding: '6px 16px',
              border: '1px solid var(--cyan-border)',
              borderRadius: '2px',
              background: 'var(--cyan-dim)',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }} />
              Perplexity Billion Dollar Build 2026
            </div>

            <h1 style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#fff',
              marginBottom: '24px',
            }}>
              ChainIntel —<br />
              <span style={{ color: 'var(--cyan)' }}>The AI-Native Bloomberg Terminal</span><br />
              for Digital Assets
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: 'var(--text2)',
              lineHeight: 1.6,
              maxWidth: '640px',
              margin: '0 auto 48px',
            }}>
              Professional-grade crypto intelligence for institutions, traders, and builders.
              89 verified data sources. 12 intelligence modules. Starting at $0/month.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Data Sources', value: '89' },
                { label: 'Asset Coverage', value: '500+' },
                { label: 'Bloomberg Cost', value: '$24K/yr' },
                { label: 'ChainIntel Cost', value: 'Free' },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: '20px 28px',
                  border: '1px solid var(--b3)',
                  borderRadius: '4px',
                  background: 'var(--s1)',
                  textAlign: 'center',
                  minWidth: '140px',
                }}>
                  <div style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '28px',
                    fontWeight: 600,
                    color: stat.label === 'ChainIntel Cost' ? 'var(--cyan)' : '#fff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}>{stat.value}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll to continue</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'bounce 2s ease-in-out infinite' }}>
              <path d="M3 6L8 11L13 6" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            fontFamily: 'var(--mono)',
            fontSize: '10px',
            color: 'var(--muted)',
            letterSpacing: '0.1em',
          }}>01 / {slides.length}</div>
        </section>

        {/* ══ SLIDE 02 — PROBLEM ══ */}
        <section data-slide="1" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
        }}>
          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>02 / {slides.length}</div>
          <div style={{ maxWidth: '1000px', width: '100%' }}>
            <SlideLabel>The Problem</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              Bloomberg charges <span style={{ color: 'var(--red)' }}>$24,000/year</span>.<br />
              And it doesn&apos;t even speak crypto.
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '48px', lineHeight: 1.6, maxWidth: '660px' }}>
              The Bloomberg Terminal is a legacy product built for traditional finance. Every attempt to use it for digital assets hits a wall.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[
                { icon: '⛔', title: 'No On-Chain Data', desc: 'MVRV, NVT, exchange flows, hash rate — Bloomberg has none of it.' },
                { icon: '⛔', title: 'No ISO 20022', desc: 'SWIFT\'s new messaging standard is reshaping settlement. Bloomberg is silent.' },
                { icon: '⛔', title: 'No DeFi Analytics', desc: 'TVL, protocol yields, liquidity pools — invisible to Bloomberg.' },
                { icon: '⛔', title: 'No Whale Tracking', desc: '$10M+ on-chain movements that move markets — not tracked.' },
                { icon: '⛔', title: 'No AI Synthesis', desc: 'Raw data dumps. No intelligence layer. No natural-language querying.' },
                { icon: '💀', title: '$24,000/Year', desc: 'Minimum. Per seat. For data that&apos;s missing half the picture.' },
              ].map(item => (
                <div key={item.title} style={{
                  padding: '24px',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '4px',
                  background: 'rgba(239,68,68,0.04)',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>{item.icon}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, color: '#fff', letterSpacing: '0.06em', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SLIDE 03 — SOLUTION ══ */}
        <section data-slide="2" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,212,170,0.04) 0%, transparent 70%)',
        }}>
          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>03 / {slides.length}</div>
          <div style={{ maxWidth: '1000px', width: '100%' }}>
            <SlideLabel>Our Solution</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              All-in-one crypto intelligence.<br />
              At <span style={{ color: 'var(--cyan)' }}>1/40th the price</span> of Bloomberg.
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '48px', lineHeight: 1.6, maxWidth: '660px' }}>
              ChainIntel is the first terminal purpose-built for digital assets — combining on-chain analytics, DeFi metrics, ETF flows, regulatory intelligence, ISO 20022 tracking, and AI synthesis in one professional interface.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
              <div>
                <ComparisonRow label="Price" bloomberg="$24,000/yr" chainintel="Free — $499/mo" win />
                <ComparisonRow label="On-Chain Data" bloomberg="None" chainintel="Full suite" win />
                <ComparisonRow label="DeFi Analytics" bloomberg="None" chainintel="50+ protocols" win />
                <ComparisonRow label="ISO 20022" bloomberg="None" chainintel="6 assets tracked" win />
                <ComparisonRow label="Whale Tracking" bloomberg="None" chainintel="Real-time alerts" win />
                <ComparisonRow label="AI Synthesis" bloomberg="None" chainintel="GPT-4 native" win />
                <ComparisonRow label="Sentiment" bloomberg="Limited" chainintel="Multi-source" win />
                <ComparisonRow label="Data Sources" bloomberg="Proprietary" chainintel="89 verified" win />
              </div>

              <div style={{
                padding: '32px',
                border: '1px solid var(--cyan-border)',
                borderRadius: '6px',
                background: 'var(--s1)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-1px',
                  left: '24px',
                  right: '24px',
                  height: '2px',
                  background: 'linear-gradient(90deg, var(--cyan), var(--blue))',
                  borderRadius: '0 0 2px 2px',
                }} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--cyan)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
                  CHAININTEL ADVANTAGE
                </div>
                {[
                  '12 intelligence modules in one terminal',
                  '89 verified, real-time data sources',
                  'On-chain + DeFi + ETF + Regulatory',
                  'ISO 20022 banking standard tracker',
                  'AI-native: natural language queries',
                  'Free tier — zero barrier to entry',
                  'Pro at $49/mo — 1/40th Bloomberg cost',
                  'Built for builders, traders & institutions',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: i < 7 ? '1px solid var(--b2)' : 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="7" cy="7" r="6" stroke="var(--cyan)" strokeWidth="1" fill="rgba(0,212,170,0.08)"/>
                      <path d="M4 7L6.5 9.5L10 5" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ SLIDE 04 — PRODUCT ══ */}
        <section data-slide="3" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
        }}>
          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>04 / {slides.length}</div>
          <div style={{ maxWidth: '1000px', width: '100%' }}>
            <SlideLabel>Product</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              12 Intelligence Modules.<br />
              One <span style={{ color: 'var(--cyan)' }}>Unified Terminal</span>.
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '660px' }}>
              Every module is purpose-built for the data type it serves — not bolted onto a legacy platform.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { id: 'OVERVIEW', desc: 'AI market synthesis, Fear & Greed, top movers', color: 'var(--cyan)' },
                { id: 'MARKETS', desc: 'Top 500 assets, sortable by cap, volume, change', color: 'var(--blue)' },
                { id: 'ON-CHAIN', desc: 'MVRV, NVT ratio, exchange flows, hash rate', color: 'var(--green)' },
                { id: 'DeFi', desc: 'TVL rankings, protocol yields, stablecoin monitor', color: 'var(--purple)' },
                { id: 'ETF & INST', desc: 'Spot ETF flows, institutional holdings, fund data', color: 'var(--gold)' },
                { id: 'REGULATORY', desc: 'SEC, CFTC, EU MiCA, GENIUS Act tracker', color: 'var(--orange)' },
                { id: 'ISO 20022', desc: 'SWIFT migration tracker: XRP, XLM, HBAR, QNT, ADA', color: 'var(--cyan)' },
                { id: 'SENTIMENT', desc: 'Social signals, Twitter trends, dev activity', color: 'var(--blue)' },
                { id: 'DERIVATIVES', desc: 'Funding rates, open interest, liquidations', color: 'var(--green)' },
                { id: 'WHALES', desc: '$10M+ on-chain transactions with ChainScore', color: 'var(--red)' },
                { id: 'PORTFOLIO', desc: 'Live P&L, AI morning briefs, personal tracking', color: 'var(--purple)' },
                { id: 'PRICING', desc: 'Free, Pro & Enterprise plan comparison', color: 'var(--muted)' },
              ].map((module, i) => (
                <div key={i} style={{
                  padding: '18px 20px',
                  border: `1px solid ${module.color}22`,
                  borderRadius: '4px',
                  background: `${module.color}06`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    background: module.color,
                    opacity: 0.7,
                  }} />
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, color: module.color, letterSpacing: '0.1em', marginBottom: '6px' }}>
                    {String(i + 1).padStart(2, '0')} {module.id}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.4 }}>{module.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SLIDE 05 — MARKET ══ */}
        <section data-slide="4" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
          background: 'radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59,130,246,0.06) 0%, transparent 70%)',
        }}>
          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>05 / {slides.length}</div>
          <div style={{ maxWidth: '1000px', width: '100%' }}>
            <SlideLabel>Market Opportunity</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '48px', lineHeight: 1.15 }}>
              A <span style={{ color: 'var(--blue)' }}>$36.8 trillion</span> opportunity<br />
              with no dominant crypto-native terminal.
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
              {[
                {
                  label: 'Financial Data Terminal Market',
                  value: '$33B',
                  subvalue: 'Bloomberg holds ~30% share at $10B ARR',
                  note: 'Source: MarketsandMarkets 2024',
                  color: 'var(--blue)',
                },
                {
                  label: 'Crypto Market Capitalization',
                  value: '$3.8T',
                  subvalue: 'All-time high. Institutional adoption accelerating.',
                  note: 'Source: CoinGecko 2025',
                  color: 'var(--cyan)',
                },
                {
                  label: 'Crypto Data & Analytics TAM',
                  value: '$4.2B',
                  subvalue: 'Growing 28% CAGR. Nascent, fragmented market.',
                  note: 'Source: Grand View Research 2024',
                  color: 'var(--green)',
                },
              ].map(market => (
                <div key={market.label} style={{
                  padding: '32px',
                  border: `1px solid ${market.color}30`,
                  borderRadius: '6px',
                  background: `${market.color}06`,
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: market.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    {market.label}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '48px', fontWeight: 700, color: market.color, lineHeight: 1, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                    {market.value}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.5, marginBottom: '12px' }}>{market.subvalue}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)' }}>{market.note}</div>
                </div>
              ))}
            </div>

            <div style={{
              padding: '24px 32px',
              border: '1px solid var(--b3)',
              borderRadius: '4px',
              background: 'var(--s1)',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Serviceable Market (SAM):
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                ~$400M
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text2)', flex: 1, minWidth: '200px' }}>
                10% capture of crypto-native terminal TAM — achievable with product-led growth and existing traction.
              </div>
            </div>
          </div>
        </section>

        {/* ══ SLIDE 06 — TRACTION ══ */}
        <section data-slide="5" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
        }}>
          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>06 / {slides.length}</div>
          <div style={{ maxWidth: '1000px', width: '100%' }}>
            <SlideLabel>Traction</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '48px', lineHeight: 1.15 }}>
              Built. Deployed. <span style={{ color: 'var(--cyan)' }}>Live.</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '48px' }}>
              {[
                { metric: '89', label: 'Verified Data Sources', sub: 'CoinGecko, Glassnode, DefiLlama, DeFiPulse, etc.' },
                { metric: '500+', label: 'Assets Covered', sub: 'Including all major DeFi & ISO 20022 assets' },
                { metric: '12', label: 'Intelligence Modules', sub: 'All built, deployed, and production-ready' },
                { metric: 'v5.18', label: 'Current Version', sub: 'Continuous releases since initial build' },
              ].map(t => (
                <div key={t.label} style={{
                  padding: '28px 24px',
                  border: '1px solid var(--b3)',
                  borderRadius: '4px',
                  background: 'var(--s1)',
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '42px', fontWeight: 700, color: 'var(--cyan)', lineHeight: 1, marginBottom: '8px', letterSpacing: '-0.02em' }}>
                    {t.metric}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: '#fff', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>{t.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ padding: '24px', border: '1px solid var(--b3)', borderRadius: '4px', background: 'var(--s1)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--cyan)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
                  DATA INFRASTRUCTURE
                </div>
                {['CoinGecko Pro API (real-time prices)', 'Glassnode (on-chain metrics)', 'DefiLlama (DeFi TVL)', 'CoinMarketCap (market data)', 'Santiment (sentiment & social)', 'FRED Economic Data', 'SEC EDGAR (regulatory filings)', 'Alternative.me (Fear & Greed)'].map(s => (
                  <div key={s} style={{ fontSize: '13px', color: 'var(--text2)', padding: '5px 0', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--cyan)', fontSize: '10px' }}>▶</span> {s}
                  </div>
                ))}
              </div>
              <div style={{ padding: '24px', border: '1px solid var(--b3)', borderRadius: '4px', background: 'var(--s1)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--blue)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
                  COMPETITION ENTRY
                </div>
                <div style={{
                  padding: '16px',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: '4px',
                  background: 'rgba(59,130,246,0.06)',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
                    Perplexity Billion Dollar Build 2026
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>
                    Entered as a full-stack AI-native financial terminal. ChainIntel uses Perplexity Sonar API for its AI synthesis layer, combining real-time web intelligence with on-chain data signals.
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                  TECH STACK: Next.js 16 · TypeScript · Supabase · Tailwind CSS · Perplexity Sonar API · Stripe
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SLIDE 07 — BUSINESS MODEL ══ */}
        <section data-slide="6" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
          background: 'radial-gradient(ellipse 60% 40% at 20% 50%, rgba(0,212,170,0.05) 0%, transparent 70%)',
        }}>
          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>07 / {slides.length}</div>
          <div style={{ maxWidth: '1000px', width: '100%' }}>
            <SlideLabel>Business Model</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              Three tiers. <span style={{ color: 'var(--cyan)' }}>Zero friction</span> to adoption.
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '48px', lineHeight: 1.6, maxWidth: '600px' }}>
              Free tier drives top-of-funnel. Pro converts power users. Enterprise serves institutions.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '48px' }}>
              {[
                {
                  tier: 'FREE',
                  price: '$0',
                  period: '/month',
                  desc: 'No credit card required',
                  features: ['Market overview & prices', 'Basic DeFi analytics', 'Public regulatory feeds', 'Community data access', 'Up to 5 portfolio assets'],
                  cta: 'Get Started',
                  href: '/',
                  color: 'var(--muted)',
                  highlight: false,
                },
                {
                  tier: 'PRO',
                  price: '$49',
                  period: '/month',
                  desc: 'Bloomberg alternative',
                  features: ['All Free features', 'Full on-chain suite', 'Whale tracking & alerts', 'ISO 20022 monitor', 'AI morning briefs', 'Full derivatives data', 'Priority support'],
                  cta: 'Start Pro',
                  href: STRIPE_PRO,
                  color: 'var(--cyan)',
                  highlight: true,
                },
                {
                  tier: 'ENTERPRISE',
                  price: '$499',
                  period: '/month',
                  desc: 'For institutions & funds',
                  features: ['All Pro features', 'Multi-seat access', 'Custom data integrations', 'API access', 'Dedicated support', 'White-label options', 'SLA guarantees'],
                  cta: 'Contact Sales',
                  href: 'mailto:enterprise@chainintelterminal.com',
                  color: 'var(--blue)',
                  highlight: false,
                },
              ].map(plan => (
                <div key={plan.tier} style={{
                  padding: '32px 28px',
                  border: `1px solid ${plan.highlight ? 'var(--cyan-border)' : 'var(--b3)'}`,
                  borderRadius: '6px',
                  background: plan.highlight ? 'rgba(0,212,170,0.04)' : 'var(--s1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {plan.highlight && (
                    <div style={{
                      position: 'absolute',
                      top: '-1px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, var(--cyan), var(--blue))',
                      borderRadius: '6px 6px 0 0',
                    }} />
                  )}
                  {plan.highlight && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '20px',
                      fontFamily: 'var(--mono)',
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      color: 'var(--bg)',
                      background: 'var(--cyan)',
                      padding: '3px 10px',
                      borderRadius: '2px',
                      textTransform: 'uppercase',
                    }}>Most Popular</div>
                  )}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: plan.color, letterSpacing: '0.14em', marginBottom: '16px', textTransform: 'uppercase' }}>{plan.tier}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '42px', fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>{plan.price}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--muted)' }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '24px' }}>{plan.desc}</div>
                  <div style={{ flex: 1 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--b1)', fontSize: '13px', color: 'var(--text2)' }}>
                        <span style={{ color: plan.color, fontSize: '10px' }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <a href={plan.href} target={plan.href.startsWith('http') ? '_blank' : undefined} rel="noopener" style={{
                    display: 'block',
                    marginTop: '24px',
                    padding: '12px',
                    textAlign: 'center',
                    border: `1px solid ${plan.color}50`,
                    borderRadius: '3px',
                    background: plan.highlight ? 'var(--cyan)' : 'transparent',
                    color: plan.highlight ? 'var(--bg)' : plan.color,
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    fontWeight: plan.highlight ? 700 : 400,
                    cursor: 'pointer',
                  }}>
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
              {[
                { label: 'Bloomberg at 10,000 users', value: '$240M/yr', note: 'Revenue ceiling at enterprise price' },
                { label: 'ChainIntel Pro at 10,000 users', value: '$5.9M/yr', note: 'At $49/mo — 40x lower barrier' },
                { label: 'Break-even at', value: '~200 Pro users', note: 'Low operational overhead, AI-first architecture' },
              ].map(item => (
                <div key={item.label} style={{ padding: '16px', border: '1px solid var(--b2)', borderRadius: '4px', background: 'var(--s1)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: '8px', textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '22px', fontWeight: 700, color: 'var(--cyan)', marginBottom: '6px', letterSpacing: '-0.02em' }}>{item.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{item.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SLIDE 08 — COMPETITION ══ */}
        <section data-slide="7" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
        }}>
          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>08 / {slides.length}</div>
          <div style={{ maxWidth: '1000px', width: '100%' }}>
            <SlideLabel>Competitive Landscape</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              No one else has built <span style={{ color: 'var(--cyan)' }}>this full stack.</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '660px' }}>
              Competitors either cost too much, cover too little, or lack the AI synthesis layer.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--b3)' }}>
                    {['Feature', 'Bloomberg', 'CoinGecko Pro', 'Messari', 'Nansen', 'ChainIntel'].map((h, i) => (
                      <th key={h} style={{
                        padding: '12px 16px',
                        textAlign: i === 0 ? 'left' : 'center',
                        color: i === 5 ? 'var(--cyan)' : 'var(--muted)',
                        fontWeight: i === 5 ? 700 : 400,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontSize: '10px',
                        background: i === 5 ? 'rgba(0,212,170,0.06)' : 'transparent',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Price', '$24,000/yr', '$129/mo', '$599/mo', '$3,000/mo', 'Free – $499/mo'],
                    ['On-Chain Analytics', '✗', '✓', '✓', '✓', '✓'],
                    ['DeFi TVL / Protocols', '✗', 'Partial', '✓', 'Partial', '✓'],
                    ['ISO 20022 Tracking', '✗', '✗', '✗', '✗', '✓'],
                    ['Regulatory Intelligence', 'TradFi only', '✗', 'Partial', '✗', '✓'],
                    ['Whale Tracking', '✗', '✗', '✗', '✓', '✓'],
                    ['AI Synthesis Layer', '✗', '✗', 'Limited', '✗', '✓'],
                    ['ETF & Institutional Flows', 'TradFi only', '✗', 'Limited', '✗', '✓'],
                    ['Sentiment + Social Data', '✗', '✓', 'Partial', '✗', '✓'],
                    ['Derivatives Analytics', 'TradFi only', 'Partial', 'Partial', '✗', '✓'],
                    ['Free Tier Available', '✗', 'Limited', '✗', '✗', '✓'],
                  ].map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--b1)' }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{
                          padding: '11px 16px',
                          textAlign: ci === 0 ? 'left' : 'center',
                          color: cell === '✗' ? 'var(--red)' : cell === '✓' ? 'var(--green)' : ci === 5 ? 'var(--cyan)' : 'var(--text2)',
                          fontWeight: ci === 5 ? 600 : 400,
                          background: ci === 5 ? 'rgba(0,212,170,0.03)' : 'transparent',
                          fontSize: ci === 0 ? '12px' : '13px',
                        }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ══ SLIDE 09 — WHY NOW ══ */}
        <section data-slide="8" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(155,111,255,0.05) 0%, transparent 70%)',
        }}>
          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>09 / {slides.length}</div>
          <div style={{ maxWidth: '1000px', width: '100%' }}>
            <SlideLabel>Why Now</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              Every macro signal is <span style={{ color: 'var(--purple)' }}>converging</span>.
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '48px', lineHeight: 1.6, maxWidth: '640px' }}>
              2024–2026 is the inflection point for institutional crypto adoption. We&apos;re already built.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                {
                  title: 'SWIFT ISO 20022 Migration Complete',
                  desc: 'The global banking messaging standard has migrated. XRP, XLM, HBAR, QNT, and ADA are officially compliant. Trillions in cross-border payments now speak the same language as crypto.',
                  color: 'var(--cyan)',
                },
                {
                  title: 'Spot Bitcoin & Ethereum ETFs Approved',
                  desc: 'BlackRock, Fidelity, and 10+ asset managers now offer spot crypto ETFs. Institutional capital is flowing in at record pace. ETF flow tracking is now essential infrastructure.',
                  color: 'var(--blue)',
                },
                {
                  title: 'Regulatory Clarity Emerging',
                  desc: 'GENIUS Act moving through Congress. EU MiCA framework live. SEC crypto task force active. For the first time, the rules of the game are being written — and we track every move.',
                  color: 'var(--green)',
                },
                {
                  title: 'AI-Native Infrastructure Ready',
                  desc: 'LLM APIs, real-time web search (Perplexity Sonar), and vector databases make it possible to build a terminal that synthesizes 89 sources in seconds. This wasn\'t possible 2 years ago.',
                  color: 'var(--purple)',
                },
                {
                  title: 'Crypto Market Cap at ATH',
                  desc: '$3.8T+ market cap. 500M+ global users. The asset class has arrived. Demand for professional-grade tooling has never been higher — yet the tooling remains fragmented.',
                  color: 'var(--gold)',
                },
                {
                  title: 'Bloomberg Has Not Responded',
                  desc: 'Despite the $3.8T crypto market, Bloomberg has made no meaningful product investment in on-chain data, DeFi analytics, or AI synthesis. The window is open.',
                  color: 'var(--orange)',
                },
              ].map(item => (
                <div key={item.title} style={{
                  padding: '24px',
                  border: `1px solid ${item.color}20`,
                  borderRadius: '4px',
                  background: `${item.color}05`,
                  borderLeft: `3px solid ${item.color}`,
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, color: item.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SLIDE 10 — TEAM ══ */}
        <section data-slide="9" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
        }}>
          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>10 / {slides.length}</div>
          <div style={{ maxWidth: '1000px', width: '100%' }}>
            <SlideLabel>Team</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              Lean. AI-first. <span style={{ color: 'var(--cyan)' }}>Execution-obsessed.</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--text2)', marginBottom: '48px', lineHeight: 1.6, maxWidth: '640px' }}>
              ChainIntel was built by a team that believes the best product wins — not the best pitch. We ship daily.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {[
                {
                  role: 'FOUNDER & CEO',
                  background: 'Full-stack engineer with deep roots in financial data infrastructure. Built ChainIntel from the ground up — product, engineering, and GTM.',
                  skills: ['Product architecture', 'AI/ML integration', 'Financial data systems'],
                },
                {
                  role: 'HEAD OF DATA',
                  background: 'On-chain analyst and data engineer. Responsible for verifying and integrating all 89 data sources, quality control, and API reliability.',
                  skills: ['On-chain analytics', 'API integration', 'Data reliability'],
                },
                {
                  role: 'HEAD OF GROWTH',
                  background: 'Crypto-native growth operator. Manages product-led growth loops, community, and institutional outreach.',
                  skills: ['PLG strategy', 'Community', 'Enterprise sales'],
                },
              ].map(member => (
                <div key={member.role} style={{
                  padding: '28px 24px',
                  border: '1px solid var(--b3)',
                  borderRadius: '4px',
                  background: 'var(--s1)',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--cyan), var(--blue))',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--mono)',
                    fontSize: '18px',
                    color: 'var(--bg)',
                    fontWeight: 700,
                  }}>
                    {member.role[0]}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--cyan)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {member.role}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '16px' }}>{member.background}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {member.skills.map(s => (
                      <span key={s} style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        color: 'var(--muted)',
                        border: '1px solid var(--b3)',
                        padding: '3px 8px',
                        borderRadius: '2px',
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              padding: '24px 32px',
              border: '1px solid var(--b3)',
              borderRadius: '4px',
              background: 'var(--s1)',
              display: 'flex',
              gap: '40px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Philosophy</div>
                <div style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.6, maxWidth: '500px' }}>
                  We believe the future of financial data is <strong style={{ color: 'var(--cyan)' }}>open, AI-native, and on-chain-aware</strong>. Legacy terminal vendors are building walls. We&apos;re tearing them down.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[['Remote-first', 'var(--cyan)'], ['Ship daily', 'var(--blue)'], ['AI-augmented', 'var(--green)']].map(([label, color]) => (
                  <div key={label as string} style={{ textAlign: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color as string, margin: '0 auto 6px' }} />
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label as string}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ SLIDE 11 — THE ASK / CTA ══ */}
        <section data-slide="10" style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px clamp(24px, 8vw, 120px)',
          position: 'relative',
          borderTop: '1px solid var(--b2)',
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,212,170,0.07) 0%, transparent 70%)',
          overflow: 'hidden',
        }}>
          {/* Grid overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,212,170,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,170,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'absolute', top: '40px', left: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>11 / {slides.length}</div>
          <div style={{ maxWidth: '860px', width: '100%', textAlign: 'center', position: 'relative' }}>
            <SlideLabel>The Opportunity</SlideLabel>
            <h2 style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '24px', lineHeight: 1.1 }}>
              Join us in building the<br />
              <span style={{ color: 'var(--cyan)' }}>Bloomberg Terminal for Web3</span>.
            </h2>
            <p style={{ fontSize: '20px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
              We&apos;re raising a seed round to scale data infrastructure, grow the team, and capture the institutional market.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px' }}>
              {[
                { label: 'Seed Round Target', value: '$2M', color: 'var(--cyan)' },
                { label: 'Revenue Target (Y1)', value: '$500K ARR', color: 'var(--blue)' },
                { label: 'User Target (Y1)', value: '10,000 users', color: 'var(--green)' },
              ].map(item => (
                <div key={item.label} style={{ padding: '24px', border: `1px solid ${item.color}30`, borderRadius: '4px', background: `${item.color}06` }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, color: item.color, marginBottom: '8px', letterSpacing: '-0.02em' }}>{item.value}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={STRIPE_PRO} target="_blank" rel="noopener" style={{
                padding: '16px 40px',
                background: 'var(--cyan)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'var(--mono)',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
              }}>
                Subscribe — $49/mo
              </a>
              <a href="mailto:invest@chainintelterminal.com" style={{
                padding: '16px 40px',
                background: 'transparent',
                color: 'var(--cyan)',
                border: '1px solid var(--cyan-border)',
                borderRadius: '4px',
                fontFamily: 'var(--mono)',
                fontSize: '13px',
                fontWeight: 400,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
              }}>
                Investor Inquiries
              </a>
            </div>

            <div style={{ marginTop: '48px', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Website', href: 'https://chainintelterminal.com', display: 'chainintelterminal.com' },
                { label: 'Email', href: 'mailto:invest@chainintelterminal.com', display: 'invest@chainintelterminal.com' },
              ].map(link => (
                <div key={link.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{link.label}</div>
                  <a href={link.href} style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--cyan)', textDecoration: 'none' }}>{link.display}</a>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '40px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.08em' }}>
              CONFIDENTIAL · CHAININTEL INC. · 2026 · ALL RIGHTS RESERVED
            </div>
          </div>
        </section>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}

function SlideLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--mono)',
      fontSize: '10px',
      letterSpacing: '0.18em',
      color: 'var(--cyan)',
      textTransform: 'uppercase',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <span style={{ display: 'inline-block', width: '24px', height: '1px', background: 'var(--cyan)', opacity: 0.5 }} />
      {children}
    </div>
  );
}

function ComparisonRow({ label, bloomberg, chainintel, win }: { label: string; bloomberg: string; chainintel: string; win?: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px',
      padding: '10px 0',
      borderBottom: '1px solid var(--b1)',
      alignItems: 'center',
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--red)', textAlign: 'center' }}>{bloomberg}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: win ? 'var(--cyan)' : 'var(--text)', textAlign: 'center', fontWeight: win ? 600 : 400 }}>{chainintel}</div>
    </div>
  );
}
