'use client';

import { useState, useEffect, useCallback } from 'react';
import TerminalLayout from '@/components/TerminalLayout';
import { type TabId } from '@/lib/constants';
import OverviewTab from '@/components/tabs/OverviewTab';
import MarketsTab from '@/components/tabs/MarketsTab';
import OnChainTab from '@/components/tabs/OnChainTab';
import DefiTab from '@/components/tabs/DefiTab';
import EtfInstTab from '@/components/tabs/EtfInstTab';
import RegulatoryTab from '@/components/tabs/RegulatoryTab';
import IsoTab from '@/components/tabs/IsoTab';
import SentimentTab from '@/components/tabs/SentimentTab';
import DerivativesTab from '@/components/tabs/DerivativesTab';
import WhalesTab from '@/components/tabs/WhalesTab';
import PortfolioTab from '@/components/tabs/PortfolioTab';
import PricingTab from '@/components/tabs/PricingTab';
import UpgradeGate from '@/components/UpgradeGate';
import { useSubscription } from '@/lib/use-subscription';

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
    if (ENTERPRISE_TABS.has(activeTab)) {
      return (
        <UpgradeGate requiredTier="enterprise" currentTier={tier} tabName={TAB_NAMES[activeTab]}>
          <ActiveComponent />
        </UpgradeGate>
      );
    }

    if (PRO_TABS.has(activeTab)) {
      return (
        <UpgradeGate requiredTier="pro" currentTier={tier} tabName={TAB_NAMES[activeTab]}>
          <ActiveComponent />
        </UpgradeGate>
      );
    }

    return <ActiveComponent />;
  };

  return (
    <TerminalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTab()}
    </TerminalLayout>
  );
}
