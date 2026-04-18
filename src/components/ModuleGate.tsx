'use client';

import { type ReactNode } from 'react';
import { type SubscriptionTier } from '@/lib/use-subscription';
import InlineUpgradePrompt from './InlineUpgradePrompt';

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

interface ModuleGateProps {
  requiredTier: 'pro' | 'enterprise';
  currentTier: SubscriptionTier;
  feature: string;
  previewLines?: number;
  children: ReactNode;
}

export default function ModuleGate({
  requiredTier,
  currentTier,
  feature,
  previewLines = 3,
  children,
}: ModuleGateProps) {
  if (TIER_RANK[currentTier] >= TIER_RANK[requiredTier]) {
    return <>{children}</>;
  }

  // Calculate approximate max-height based on preview lines
  // Each "line" roughly corresponds to a row in these modules (~40px)
  const maxHeight = previewLines * 40;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        maxHeight,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {children}
        {/* Gradient fade at bottom of preview */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(180deg, transparent 0%, var(--bg) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
      <InlineUpgradePrompt tier={requiredTier} feature={feature} />
    </div>
  );
}
