'use client';

import { useState } from 'react';
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('mktovr');
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <TerminalLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <ActiveComponent />
    </TerminalLayout>
  );
}
