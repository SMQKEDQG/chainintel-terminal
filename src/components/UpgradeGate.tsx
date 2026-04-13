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

const TIER_META: Record<'pro' | 'enterprise', { icon: string; label: string; price: string; value: string }> = {
  pro: {
    icon: '⚡',
    label: 'Pro',
    price: '$49/mo',
    value:
      'Get real-time on-chain intelligence, DeFi analytics, derivatives flow, whale tracking, and sentiment signals — everything a professional crypto desk needs in one terminal.',
  },
  enterprise: {
    icon: '🔒',
    label: 'Enterprise',
    price: '$499/mo',
    value:
      'Unlock institutional-grade access: custom data feeds, dedicated API limits, priority support, and multi-seat licensing for your trading desk.',
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

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Top rule */}
        <div style={styles.rule} />

        {/* Header row */}
        <div style={styles.header}>
          <span style={styles.icon}>{meta.icon}</span>
          <div>
            <div style={styles.label}>ACCESS RESTRICTED</div>
            <div style={styles.title}>
              Unlock <span style={styles.accent}>{tabName}</span> with {meta.label}
            </div>
          </div>
        </div>

        {/* Value prop */}
        <p style={styles.body}>{meta.value}</p>

        {/* Tier badge + CTA row */}
        <div style={styles.footer}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            {meta.label} — {meta.price}
          </div>
          <a href="/pricing" style={styles.cta}>
            View Plans →
          </a>
        </div>

        {/* Bottom rule */}
        <div style={styles.rule} />
      </div>
    </div>
  );
}

// ─── Inline styles using CSS vars ────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '420px',
    padding: '32px 24px',
  },
  card: {
    maxWidth: '560px',
    width: '100%',
    background: 'var(--s1)',
    border: '1px solid var(--b2)',
    padding: '32px 36px',
    position: 'relative',
  },
  rule: {
    height: '1px',
    background: 'linear-gradient(90deg, var(--cyan) 0%, var(--b2) 60%, transparent 100%)',
    marginBottom: '0',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    marginTop: '28px',
    marginBottom: '20px',
  },
  icon: {
    fontSize: '28px',
    lineHeight: '1',
    marginTop: '2px',
    flexShrink: 0,
  },
  label: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '0.12em',
    color: 'var(--cyan)',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
  },
  title: {
    fontFamily: 'var(--mono)',
    fontSize: '18px',
    color: 'var(--text)',
    fontWeight: 600,
    lineHeight: '1.3',
  },
  accent: {
    color: 'var(--cyan)',
  },
  body: {
    fontFamily: 'var(--sans)',
    fontSize: '13px',
    color: 'var(--text2)',
    lineHeight: '1.65',
    margin: '0 0 28px 0',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '28px',
  },
  badge: {
    fontFamily: 'var(--mono)',
    fontSize: '11px',
    color: 'var(--text2)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    letterSpacing: '0.06em',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--cyan)',
    display: 'inline-block',
    flexShrink: 0,
  },
  cta: {
    fontFamily: 'var(--mono)',
    fontSize: '12px',
    letterSpacing: '0.08em',
    color: 'var(--bg)',
    background: 'var(--cyan)',
    padding: '9px 20px',
    textDecoration: 'none',
    fontWeight: 700,
    transition: 'opacity 0.15s',
    whiteSpace: 'nowrap' as const,
  },
};
