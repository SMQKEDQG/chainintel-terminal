'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export function useSubscription(): SubscriptionTier {
  const { user, loading } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');

  useEffect(() => {
    // Not logged in → free
    if (loading) return;
    if (!user) {
      setTier('free');
      return;
    }

    // Logged in → fetch from Supabase users table
    let cancelled = false;

    async function fetchTier() {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', user!.id)
        .single();

      if (cancelled) return;

      if (error || !data) {
        setTier('free');
        return;
      }

      const raw = data.subscription_tier as string | null;
      if (raw === 'enterprise') {
        setTier('enterprise');
      } else if (raw === 'pro') {
        setTier('pro');
      } else {
        setTier('free');
      }
    }

    fetchTier();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return tier;
}
