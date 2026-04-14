'use client';

import { ReactNode } from 'react';
import { type SubscriptionTier } from '@/lib/use-subscription';

interface UpgradeGateProps {
  requiredTier: 'pro' | 'enterprise';
  currentTier: SubscriptionTier;
  children: ReactNode;
  tabName: string;
}

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

// Feature highlights per gated tab
const TAB_PREVIEWS: Record<string, string[]> = {
  'On-Chain': [
    'MVRV Ratio — real-time fair value assessment',
    'Exchange Flow Tracker — accumulation signals',
    'Long-Term Holder % — conviction metrics',
    'Hash Rate — network security health',
    'NVT Ratio — on-chain P/E equivalent',
  ],
  'DeFi': [
    'Live TVL across 6,400+ protocols',
    'Protocol revenue & P/E ratios',
    'Stablecoin supply distribution',
    'Yield farming opportunities',
    'Cross-chain liquidity analysis',
  ],
  'Derivatives': [
    'Funding rates — perpetual swap sentiment',
    'Open interest heatmap by exchange',
    'Liquidation cascade tracking',
    'Options flow & max pain analysis',
    'Futures basis arbitrage signals',
  ],
  'Whales': [
    'Real-time whale transaction alerts',
    'Smart money wallet tracking',
    'Exchange deposit/withdrawal spikes',
    'Dormant wallet reactivation alerts',
    'Top 100 wallet movement analysis',
  ],
  'Sentiment': [
    'Social volume & weighted sentiment',
    'Crypto Twitter trend analysis',
    'Reddit community pulse metrics',
    'News sentiment aggregation (NLP)',
    'Crowd vs. smart money divergence',
  ],
};

const TIER_META: Record<'pro' | 'enterprise', { label: string; price: string; color: string }> = {
  pro: {
    label: 'PRO',
    price: '$49/mo',
    color: 'var(--accent)',
  },
  enterprise: {
    label: 'ENTERPRISE',
    price: '$499/mo',
    color: 'var(--gold)',
  },
};

export default function UpgradeGate({
  requiredTier,
  currentTier,
  children,
  tabName,
}: UpgradeGateProps) {
  const hasAccess = TIER_RANK[currentTier] >= TIER_RANK[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  const meta = TIER_META[requiredTier];
  const features = TAB_PREVIEWS[tabName] || [
    'Premium analytics & intelligence',
    'Real-time data feeds',
    'Advanced charting & metrics',
    'AI-powered insights',
    'Professional-grade tools',
  ];

  return (
    <div style={{ position: 'relative', minHeight: '600px', overflow: 'hidden' }}>
      {/* Blurred sneak peek of actual tab content — clearly visible to tease */}
      <div
        style={{
          filter: 'blur(3px)',
          opacity: 0.85,
          pointerEvents: 'none',
          userSelect: 'none',
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Very subtle gradient — keeps data highly visible behind the gate */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(8,13,22,0.05) 0%, rgba(8,13,22,0.25) 40%, rgba(8,13,22,0.55) 100%)',
          zIndex: 1,
        }}
      />

      {/* Upgrade card */}
      <div style={styles.overlay}>
        <div style={styles.card}>
          {/* Top accent line */}
          <div style={{ ...styles.accentLine, background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />

          {/* Badge */}
          <div style={{ ...styles.badge, borderColor: meta.color, color: meta.color }}>
            {meta.label} — {meta.price}
          </div>

          {/* Title */}
          <h2 style={styles.title}>
            Unlock <span style={{ color: meta.color }}>{tabName}</span>
          </h2>

          {/* Description */}
          <p style={styles.description}>
            This module requires {meta.label} access. Upgrade to unlock real-time intelligence
            that institutional desks pay thousands for.
          </p>

          {/* Feature preview list */}
          <div style={styles.featureSection}>
            <div style={styles.featureLabel}>WHAT YOU GET</div>
            {features.map((feat, i) => (
              <div key={i} style={styles.featureRow}>
                <span style={{ ...styles.featureCheck, color: meta.color }}>◆</span>
                <span style={styles.featureText}>{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={styles.ctaRow}>
            <a
              href={requiredTier === 'pro' ? 'https://buy.stripe.com/fZufZi0xL2hg0lUaBsbwk03' : 'https://buy.stripe.com/dRmbJ2bcpg864Ca6lcbwk02'}
              style={{ ...styles.cta, background: meta.color }}
            >
              UPGRADE TO {meta.label} →
            </a>
            <span style={styles.ctaSub}>Cancel anytime · No contracts</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const event = new CustomEvent('goPage', { detail: 'pricing' });
                window.dispatchEvent(event);
              }}
              style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', marginTop: '8px', letterSpacing: '0.06em', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Compare plans →
            </a>
          </div>

          {/* Bottom accent line */}
          <div style={{ ...styles.accentLine, background: `linear-gradient(90deg, ${meta.color} 0%, transparent 60%)` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '60px',
    paddingBottom: '40px',
    minHeight: '500px',
  },
  card: {
    maxWidth: '440px',
    width: '100%',
    background: 'rgba(13,20,32,0.92)',
    border: '1px solid var(--b3)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
    padding: '0',
    borderRadius: '2px',
  },
  accentLine: {
    height: '2px',
    width: '100%',
  },
  badge: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '0.14em',
    border: '1px solid',
    display: 'inline-block',
    padding: '4px 12px',
    margin: '24px 28px 16px',
  },
  title: {
    fontFamily: 'var(--mono)',
    fontSize: '20px',
    color: 'var(--text)',
    fontWeight: 600,
    lineHeight: '1.3',
    margin: '0 28px 12px',
  },
  description: {
    fontFamily: 'var(--sans)',
    fontSize: '13px',
    color: 'var(--text2)',
    lineHeight: '1.65',
    margin: '0 28px 24px',
  },
  featureSection: {
    margin: '0 28px 24px',
    padding: '16px 0',
    borderTop: '1px solid var(--b1)',
  },
  featureLabel: {
    fontFamily: 'var(--mono)',
    fontSize: '9px',
    letterSpacing: '0.14em',
    color: 'var(--muted)',
    marginBottom: '12px',
  },
  featureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '5px 0',
  },
  featureCheck: {
    fontSize: '8px',
    flexShrink: 0,
  },
  featureText: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--text2)',
    letterSpacing: '0.04em',
  },
  ctaRow: {
    margin: '0 28px 24px',
    textAlign: 'center' as const,
  },
  cta: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    color: '#000',
    padding: '11px 28px',
    textDecoration: 'none',
    fontWeight: 700,
    display: 'inline-block',
    transition: 'opacity 0.15s',
  },
  ctaSub: {
    display: 'block',
    fontFamily: 'var(--mono)',
    fontSize: '8px',
    color: 'var(--muted)',
    marginTop: '8px',
    letterSpacing: '0.06em',
  },
};
