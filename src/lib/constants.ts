// ChainIntel Design Tokens
export const VERSION = 'v5.22';

export const TABS = [
  { id: 'mktovr', label: 'OVERVIEW', title: 'Market Overview — real-time prices, AI synthesis, Fear & Greed' },
  { id: 'markets', label: 'MARKETS', title: 'Top 100 assets sortable by market cap, volume, 24h change' },
  { id: 'onchain', label: 'ON-CHAIN', title: 'On-chain intelligence: MVRV, NVT, exchange flows, hash rate' },
  { id: 'defi', label: 'DEFI', title: 'DeFi protocol rankings, TVL charts, stablecoin monitor' },
  { id: 'etfinst', label: 'ETF & INST', title: 'ETF flows, institutional holdings, fund comparison' },
  { id: 'reg', label: 'REGULATORY', title: 'Regulatory intelligence: SEC, CFTC, EU MiCA, GENIUS Act' },
  { id: 'iso', label: 'ISO 20022', title: 'ISO 20022 banking integration tracker for XRP, XLM, HBAR, QNT, ADA' },
  { id: 'sentiment', label: 'SENTIMENT', title: 'Social sentiment, Twitter trends, developer activity' },
  { id: 'derivatives', label: 'DERIVATIVES', title: 'Derivatives: funding rates, open interest, liquidations, basis trades' },
  { id: 'alerts', label: 'WHALES', title: 'Whale tracking: $10M+ on-chain transactions with ChainScore ratings' },
  { id: 'portfolio', label: 'PORTFOLIO', title: 'Track your holdings with live P&L and personalized AI morning briefs' },
  { id: 'pricing', label: 'PRICING', title: 'Compare Free, Pro ($49/mo), and Enterprise ($499/mo) plans' },
] as const;

export type TabId = typeof TABS[number]['id'];

export const STRIPE_LINKS = {
  pro: 'https://buy.stripe.com/dRm6oI94hf428Sq7pgbwk01',
  enterprise: 'https://buy.stripe.com/dRm6oI94hf428Sq7pgbwk02',
} as const;

export const COINGECKO_IDS = 'bitcoin,ethereum,ripple,solana,hedera-hashgraph,quant-network,stellar,iota,cardano,xdc-network,algorand,avalanche-2';

export const TICKER_ASSETS = [
  { sym: 'BTC', id: 'bitcoin' },
  { sym: 'ETH', id: 'ethereum' },
  { sym: 'XRP', id: 'ripple' },
  { sym: 'SOL', id: 'solana' },
  { sym: 'HBAR', id: 'hedera-hashgraph' },
  { sym: 'QNT', id: 'quant-network' },
  { sym: 'XLM', id: 'stellar' },
  { sym: 'IOTA', id: 'iota' },
  { sym: 'ADA', id: 'cardano' },
  { sym: 'XDC', id: 'xdc-network' },
  { sym: 'ALGO', id: 'algorand' },
  { sym: 'AVAX', id: 'avalanche-2' },
  { sym: 'LINK', id: 'chainlink' },
  { sym: 'DOT', id: 'polkadot' },
] as const;
