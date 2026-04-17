export interface IsoUpdate {
  title: string;
  date: string;
  summary: string;
  url: string;
  sourceLabel: string;
  live: boolean;
  timestamp: number | null;
}

export interface IsoAsset {
  sym: string;
  name: string;
  geckoId: string;
  network: string;
  score: number;
  banks: string;
  txSpeed: string;
  useCase: string;
  integrationFocus: string;
  fallbackUpdate: IsoUpdate;
}

export const ISO_ASSETS: IsoAsset[] = [
  {
    sym: 'XRP',
    name: 'XRP Ledger',
    geckoId: 'ripple',
    network: 'Ripple · Ripple Payments',
    score: 94,
    banks: '300+',
    txSpeed: '3-5s',
    useCase: 'Cross-border payments, remittances, liquidity bridging',
    integrationFocus: 'Institutional DeFi + treasury settlement rails',
    fallbackUpdate: {
      title: 'Institutional DeFi on XRPL',
      date: 'Apr 1, 2026',
      summary: 'Ripple shifted its enterprise messaging toward treasury and institutional DeFi flows on XRPL instead of generic partnership claims.',
      url: 'https://ripple.com/insights/',
      sourceLabel: 'Ripple',
      live: false,
      timestamp: Date.parse('2026-04-01T00:00:00Z'),
    },
  },
  {
    sym: 'XLM',
    name: 'Stellar Network',
    geckoId: 'stellar',
    network: 'SDF · MoneyGram',
    score: 88,
    banks: '150+',
    txSpeed: '5s',
    useCase: 'Remittances, CBDC infrastructure, asset tokenization',
    integrationFocus: 'Institution-grade payment and tokenization rails',
    fallbackUpdate: {
      title: 'Why most blockchains still fail institutions',
      date: 'Apr 9, 2026',
      summary: 'Stellar is framing product work around institution-ready rails, stable asset movement, and production payment reliability.',
      url: 'https://stellar.org/blog',
      sourceLabel: 'Stellar',
      live: false,
      timestamp: Date.parse('2026-04-09T00:00:00Z'),
    },
  },
  {
    sym: 'HBAR',
    name: 'Hedera Hashgraph',
    geckoId: 'hedera-hashgraph',
    network: 'Hedera Council',
    score: 86,
    banks: '50+',
    txSpeed: '3-5s',
    useCase: 'Enterprise DLT, tokenized assets, supply chain',
    integrationFocus: 'Council-backed tokenization and enterprise workflows',
    fallbackUpdate: {
      title: 'Enterprise workflow rollout updates',
      date: 'Apr 2026',
      summary: 'Hedera’s current signal remains enterprise workflow expansion through council and service-provider integrations rather than retail narratives.',
      url: 'https://hedera.com/blog',
      sourceLabel: 'Hedera',
      live: false,
      timestamp: Date.parse('2026-04-10T00:00:00Z'),
    },
  },
  {
    sym: 'QNT',
    name: 'Quant Network',
    geckoId: 'quant-network',
    network: 'Overledger',
    score: 82,
    banks: '40+',
    txSpeed: 'Bridge',
    useCase: 'Interoperability layer, multi-chain banking',
    integrationFocus: 'Interoperability middleware for financial networks',
    fallbackUpdate: {
      title: 'Enterprise interoperability releases',
      date: '2026',
      summary: 'Quant’s relevant edge is still middleware adoption for cross-network messaging, even if the public release cadence is less transparent than peers.',
      url: 'https://www.quant.network/news',
      sourceLabel: 'Quant',
      live: false,
      timestamp: Date.parse('2026-01-01T00:00:00Z'),
    },
  },
  {
    sym: 'IOTA',
    name: 'IOTA Foundation',
    geckoId: 'iota',
    network: 'IOTA Foundation',
    score: 68,
    banks: '10+',
    txSpeed: '10s',
    useCase: 'IoT payments, data integrity, feeless microtransactions',
    integrationFocus: 'Trade data integrity and machine-to-machine commerce',
    fallbackUpdate: {
      title: 'Orobo + IOTA trusted product data',
      date: 'Apr 2026',
      summary: 'IOTA’s latest integration signal is supply-chain grade product data and trade provenance rather than speculative banking language.',
      url: 'https://www.iota.org/blog',
      sourceLabel: 'IOTA',
      live: false,
      timestamp: Date.parse('2026-04-01T00:00:00Z'),
    },
  },
  {
    sym: 'ADA',
    name: 'Cardano',
    geckoId: 'cardano',
    network: 'EMURGO · IOG',
    score: 64,
    banks: '5+',
    txSpeed: '20s',
    useCase: 'Identity solutions, DeFi, governance',
    integrationFocus: 'Identity, interoperability, and Bitcoin-connected settlement',
    fallbackUpdate: {
      title: 'Community Digest highlights atomic swap progress',
      date: 'Mar 31, 2026',
      summary: 'Recent Cardano updates emphasized native Bitcoin-Cardano atomic swaps and Midnight readiness, which are more relevant than status labels.',
      url: 'https://cardano.org/news/',
      sourceLabel: 'Cardano',
      live: false,
      timestamp: Date.parse('2026-03-31T00:00:00Z'),
    },
  },
  {
    sym: 'ALGO',
    name: 'Algorand',
    geckoId: 'algorand',
    network: 'Algorand Foundation',
    score: 58,
    banks: '10+',
    txSpeed: '3.9s',
    useCase: 'CBDC pilots, green DeFi, carbon credits',
    integrationFocus: 'Institutional pilots, digital assets, and public-sector rails',
    fallbackUpdate: {
      title: 'March 2026 Algo Insights Report',
      date: 'Apr 15, 2026',
      summary: 'Algorand’s freshest signal is ecosystem reporting around institutional and public-sector deployment traction.',
      url: 'https://algorand.co/blog',
      sourceLabel: 'Algorand',
      live: false,
      timestamp: Date.parse('2026-04-15T00:00:00Z'),
    },
  },
  {
    sym: 'XDC',
    name: 'XDC Network',
    geckoId: 'xdce-crowd-sale',
    network: 'XDC Network · TradeFinex',
    score: 54,
    banks: '10+',
    txSpeed: '2s',
    useCase: 'Trade finance, supply chain, tokenized invoices',
    integrationFocus: 'Trade finance digitization and invoice tokenization',
    fallbackUpdate: {
      title: 'Trade finance integration watch',
      date: '2026',
      summary: 'XDC remains most useful when positioned around trade-finance workflow integrations and tokenized invoice throughput.',
      url: 'https://xdc.org/',
      sourceLabel: 'XDC',
      live: false,
      timestamp: Date.parse('2026-01-01T00:00:00Z'),
    },
  },
];
