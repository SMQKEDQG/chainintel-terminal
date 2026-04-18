'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface InlineUpgradePromptProps {
  tier: 'pro' | 'enterprise';
  feature: string;
  compact?: boolean;
}

const TIER_META: Record<'pro' | 'enterprise', { label: string; price: string; color: string; priceId: string; fallbackLink: string }> = {
  pro: {
    label: 'PRO',
    price: '$49/mo',
    color: 'var(--accent)',
    priceId: 'price_1TL36uLb8GrBRxdXWMHCqJrP',
    fallbackLink: 'https://buy.stripe.com/fZufZi0xL2hg0lUaBsbwk03',
  },
  enterprise: {
    label: 'ENTERPRISE',
    price: '$499/mo',
    color: 'var(--gold)',
    priceId: 'price_1TL36uLb8GrBRxdXz92Wem2T',
    fallbackLink: 'https://buy.stripe.com/dRmbJ2bcpg864Ca6lcbwk02',
  },
};

export default function InlineUpgradePrompt({ tier, feature, compact }: InlineUpgradePromptProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const meta = TIER_META[tier];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: meta.priceId,
          email: user?.email || undefined,
          returnUrl: window.location.origin,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch { /* fallback below */ }
    window.location.href = meta.fallbackLink;
    setLoading(false);
  };

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: 'rgba(232,165,52,0.04)',
        border: '1px solid var(--b2)',
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.06em' }}>
          🔒 {feature} requires {meta.label}
        </span>
        {!user ? (
          <a
            href="/signup"
            style={{
              fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.08em',
              color: '#000', background: meta.color, padding: '3px 10px',
              textDecoration: 'none', fontWeight: 700,
            }}
          >
            SIGN UP →
          </a>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.08em',
              color: '#000', background: meta.color, padding: '3px 10px',
              border: 'none', cursor: loading ? 'wait' : 'pointer',
              fontWeight: 700, opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '...' : `UNLOCK ${meta.label} →`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      padding: '14px 16px',
      background: 'linear-gradient(180deg, rgba(232,165,52,0.03) 0%, rgba(10,10,10,0.95) 100%)',
      border: '1px solid var(--b2)',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em',
        color: meta.color, marginBottom: 6,
      }}>
        {meta.label} — {meta.price}
      </div>
      <div style={{
        fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)',
        marginBottom: 10, lineHeight: 1.5,
      }}>
        Upgrade to {meta.label} for full {feature} access
      </div>
      {!user ? (
        <a
          href="/signup"
          style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
            color: '#000', background: meta.color, padding: '8px 22px',
            textDecoration: 'none', fontWeight: 700, display: 'inline-block',
          }}
        >
          CREATE ACCOUNT TO UPGRADE →
        </a>
      ) : (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
            color: '#000', background: meta.color, padding: '8px 22px',
            border: 'none', cursor: loading ? 'wait' : 'pointer',
            fontWeight: 700, opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'REDIRECTING...' : `UNLOCK WITH ${meta.label} →`}
        </button>
      )}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)',
        marginTop: 6, letterSpacing: '0.06em',
      }}>
        Cancel anytime · No contracts
      </div>
    </div>
  );
}
