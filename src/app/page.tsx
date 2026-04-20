'use client';

import { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import TerminalLayout from '@/components/TerminalLayout';
import SplashScreen, { hasSplashBeenShown, markSplashShown } from '@/components/SplashScreen';
import { type TabId } from '@/lib/constants';
import OverviewTab from '@/components/tabs/OverviewTab';
import UpgradeGate from '@/components/UpgradeGate';
import { useSubscription } from '@/lib/use-subscription';

// Lazy-load all tabs except Overview (always visible first)
const MarketsTab = lazy(() => import('@/components/tabs/MarketsTab'));
const OnChainTab = lazy(() => import('@/components/tabs/OnChainTab'));
const DefiTab = lazy(() => import('@/components/tabs/DefiTab'));
const EtfInstTab = lazy(() => import('@/components/tabs/EtfInstTab'));
const RegulatoryTab = lazy(() => import('@/components/tabs/RegulatoryTab'));
const IsoTab = lazy(() => import('@/components/tabs/IsoTab'));
const SentimentTab = lazy(() => import('@/components/tabs/SentimentTab'));
const DerivativesTab = lazy(() => import('@/components/tabs/DerivativesTab'));
const WhalesTab = lazy(() => import('@/components/tabs/WhalesTab'));
const PortfolioTab = lazy(() => import('@/components/tabs/PortfolioTab'));
const PricingTab = lazy(() => import('@/components/tabs/PricingTab'));

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  mktovr: OverviewTab,
  markets: MarketsTab,
  onchain: OnChainTab,
  defi: DefiTab,
  etfinst: EtfInstTab,
  reg: RegulatoryTab,
  iso: IsoTab,
  sentiment: SentimentTab,
  derivatives: DerivativesTab,
  alerts: WhalesTab,
  portfolio: PortfolioTab,
  pricing: PricingTab,
};

// Tabs that require Pro tier
const PRO_TABS = new Set<TabId>(['onchain', 'defi', 'sentiment', 'portfolio']);

// Tabs that require Enterprise tier
const ENTERPRISE_TABS = new Set<TabId>(['derivatives', 'alerts']);

// Human-readable tab names for the gate prompt
const TAB_NAMES: Record<TabId, string> = {
  mktovr: 'Overview',
  markets: 'Markets',
  onchain: 'On-Chain',
  defi: 'DeFi',
  etfinst: 'ETF & INST',
  reg: 'Regulatory',
  iso: 'ISO 20022',
  sentiment: 'Sentiment',
  derivatives: 'Derivatives',
  alerts: 'Whales',
  portfolio: 'Portfolio',
  pricing: 'Pricing',
};

function TabLoadingFallback() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '8px' }}>
        LOADING MODULE...
      </div>
      <div style={{ width: '120px', height: '2px', background: 'var(--b2)', margin: '0 auto', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{ width: '40%', height: '100%', background: 'var(--accent)', borderRadius: '1px', animation: 'shimmer 1.5s infinite ease-in-out' }} />
      </div>
    </div>
  );
}

function CheckoutBanner() {
  const searchParams = useSearchParams();
  const checkout = searchParams.get('checkout');
  const [visible, setVisible] = useState(false);
  const [bannerTier, setBannerTier] = useState<string>('Pro');

  useEffect(() => {
    if (checkout === 'success') {
      setVisible(true);
      // Clean URL without reload
      window.history.replaceState({}, '', '/');

      // Check if user tier was updated (may take a moment for webhook)
      let attempts = 0;
      const checkTier = async () => {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data } = await supabase
              .from('users')
              .select('subscription_tier')
              .eq('id', session.user.id)
              .single();
            if (data?.subscription_tier && data.subscription_tier !== 'free') {
              setBannerTier(data.subscription_tier === 'enterprise' ? 'Enterprise' : 'Pro');
              return; // Success
            }
          }
        } catch { /* ignore */ }
        // Retry up to 5 times over ~15 seconds
        attempts++;
        if (attempts < 5) {
          setTimeout(checkTier, 3000);
        }
      };
      checkTier();

      const timer = setTimeout(() => setVisible(false), 12000);
      return () => clearTimeout(timer);
    }
  }, [checkout]);

  if (!visible) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(52,211,153,0.12), rgba(232,165,52,0.08))',
      border: '1px solid rgba(52,211,153,0.3)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14 }}>✓</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)', letterSpacing: '0.08em', fontWeight: 700 }}>
          SUBSCRIPTION ACTIVATED
        </span>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)' }}>
          Welcome to ChainIntel {bannerTier}. All {bannerTier === 'Enterprise' ? 'modules and API access' : 'Pro modules'} are now unlocked.
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}
      >
        ×
      </button>
    </div>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(() => !hasSplashBeenShown());
  const [activeTab, setActiveTab] = useState<TabId>('mktovr');
  const tier = useSubscription();
  const ActiveComponent = TAB_COMPONENTS[activeTab] || TAB_COMPONENTS['mktovr'];

  // Listen for goPage events from UpgradeGate and PricingTab CTAs
  const handleGoPage = useCallback((e: Event) => {
    const tabId = (e as CustomEvent).detail as TabId;
    if (tabId && TAB_COMPONENTS[tabId]) {
      setActiveTab(tabId);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('goPage', handleGoPage);
    return () => window.removeEventListener('goPage', handleGoPage);
  }, [handleGoPage]);

  const renderTab = () => {
    const tabContent = activeTab === 'mktovr' ? (
      <ActiveComponent />
    ) : (
      <Suspense fallback={<TabLoadingFallback />}>
        <ActiveComponent />
      </Suspense>
    );

    let gatedContent = tabContent;

    if (ENTERPRISE_TABS.has(activeTab)) {
      gatedContent = (
        <UpgradeGate requiredTier="enterprise" currentTier={tier} tabName={TAB_NAMES[activeTab]}>
          {tabContent}
        </UpgradeGate>
      );
    } else if (PRO_TABS.has(activeTab)) {
      gatedContent = (
        <UpgradeGate requiredTier="pro" currentTier={tier} tabName={TAB_NAMES[activeTab]}>
          {tabContent}
        </UpgradeGate>
      );
    }

    return (
      <div
        key={activeTab}
        style={{
          animation: 'tabFadeIn 200ms ease-out',
        }}
      >
        {gatedContent}
      </div>
    );
  };

  const handleSplashComplete = useCallback(() => {
    markSplashShown();
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    <TerminalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <Suspense fallback={null}>
        <CheckoutBanner />
      </Suspense>
      {renderTab()}
    </TerminalLayout>
    </>
  );
}
