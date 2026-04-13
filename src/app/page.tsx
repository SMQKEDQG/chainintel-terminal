'use client';

import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import TerminalLayout from '@/components/TerminalLayout';
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
const PRO_TABS = new Set<TabId>(['onchain', 'defi', 'derivatives', 'alerts', 'sentiment']);

// Tabs that require Enterprise tier
const ENTERPRISE_TABS = new Set<TabId>();

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
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--cyan)', letterSpacing: '0.1em', marginBottom: '8px' }}>
        LOADING MODULE...
      </div>
      <div style={{ width: '120px', height: '2px', background: 'var(--b2)', margin: '0 auto', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{ width: '40%', height: '100%', background: 'var(--cyan)', borderRadius: '1px', animation: 'shimmer 1.5s infinite ease-in-out' }} />
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('mktovr');
  const tier = useSubscription();
  const ActiveComponent = TAB_COMPONENTS[activeTab];

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

    if (ENTERPRISE_TABS.has(activeTab)) {
      return (
        <UpgradeGate requiredTier="enterprise" currentTier={tier} tabName={TAB_NAMES[activeTab]}>
          {tabContent}
        </UpgradeGate>
      );
    }

    if (PRO_TABS.has(activeTab)) {
      return (
        <UpgradeGate requiredTier="pro" currentTier={tier} tabName={TAB_NAMES[activeTab]}>
          {tabContent}
        </UpgradeGate>
      );
    }

    return tabContent;
  };

  return (
    <TerminalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTab()}
    </TerminalLayout>
  );
}
