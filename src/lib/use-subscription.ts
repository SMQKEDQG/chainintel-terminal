'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

interface SubscriptionData {
  tier: SubscriptionTier;
  isVip: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export function useSubscription(): SubscriptionTier {
  const { user, loading } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');

  const fetchTier = useCallback(async () => {
    if (!user) {
      setTier('free');
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('subscription_tier, vip_access, vip_tier')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      setTier('free');
      return;
    }

    // VIP users get their vip_tier (defaults to 'enterprise' if not specified)
    if (data.vip_access) {
      const vipTier = (data.vip_tier as string) || 'enterprise';
      if (vipTier === 'enterprise') {
        setTier('enterprise');
      } else if (vipTier === 'pro') {
        setTier('pro');
      } else {
        setTier('enterprise'); // VIP defaults to enterprise
      }
      return;
    }

    // Regular subscription tier
    const raw = data.subscription_tier as string | null;
    if (raw === 'enterprise') {
      setTier('enterprise');
    } else if (raw === 'pro') {
      setTier('pro');
    } else {
      setTier('free');
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    fetchTier();

    // Re-check tier every 30s in case webhook just fired
    const interval = setInterval(fetchTier, 30000);
    return () => clearInterval(interval);
  }, [loading, fetchTier]);

  // Also re-fetch when window regains focus (user coming back from Stripe)
  useEffect(() => {
    const handler = () => fetchTier();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [fetchTier]);

  return tier;
}

// Extended hook for admin/settings pages
export function useSubscriptionFull(): SubscriptionData & { loading: boolean; refetch: () => void } {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<SubscriptionData>({
    tier: 'free',
    isVip: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) {
      setData({ tier: 'free', isVip: false, stripeCustomerId: null, stripeSubscriptionId: null });
      setLoading(false);
      return;
    }

    const { data: row, error } = await supabase
      .from('users')
      .select('subscription_tier, vip_access, vip_tier, stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (error || !row) {
      setData({ tier: 'free', isVip: false, stripeCustomerId: null, stripeSubscriptionId: null });
    } else {
      const isVip = !!row.vip_access;
      let tier: SubscriptionTier = 'free';
      
      if (isVip) {
        tier = (row.vip_tier === 'pro' ? 'pro' : 'enterprise') as SubscriptionTier;
      } else {
        tier = (['pro', 'enterprise'].includes(row.subscription_tier) ? row.subscription_tier : 'free') as SubscriptionTier;
      }

      setData({
        tier,
        isVip,
        stripeCustomerId: row.stripe_customer_id || null,
        stripeSubscriptionId: row.stripe_subscription_id || null,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetch();
  }, [authLoading, fetch]);

  return { ...data, loading: loading || authLoading, refetch: fetch };
}
