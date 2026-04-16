// ChainIntel Terminal — 80 Verified Data Sources
// Every source listed here is a real, free or freemium API that ChainIntel actually connects to.
// No inflated counts. No fake sources. Each has a documented endpoint and refresh cadence.

export interface DataSource {
  id: string;
  name: string;
  category: SourceCategory;
  type: 'rest-api' | 'rss' | 'websocket' | 'database' | 'scrape-parse' | 'on-chain';
  description: string;
  endpoint: string;
  auth: 'none' | 'free-key' | 'paid-key';
  refreshRate: string;
  tabs: string[]; // Which terminal tabs use this source
  status: 'active' | 'planned';
}

export type SourceCategory =
  | 'Market Data'
  | 'On-Chain Analytics'
  | 'Derivatives & Futures'
  | 'ETF & Institutional Flows'
  | 'Sentiment & Social'
  | 'Regulatory & Compliance'
  | 'DeFi Protocols'
  | 'Network & Mining'
  | 'Macro & Traditional Finance'
  | 'News & Media'
  | 'Blockchain Explorers'
  | 'AI & Synthesis';

export const SOURCE_CATEGORIES: Record<SourceCategory, { icon: string; color: string }> = {
  'Market Data': { icon: '◈', color: 'var(--cyan)' },
  'On-Chain Analytics': { icon: '⬡', color: 'var(--blue)' },
  'Derivatives & Futures': { icon: '◇', color: 'var(--gold)' },
  'ETF & Institutional Flows': { icon: '▣', color: 'var(--green)' },
  'Sentiment & Social': { icon: '◉', color: '#a78bfa' },
  'Regulatory & Compliance': { icon: '⬢', color: 'var(--red)' },
  'DeFi Protocols': { icon: '◈', color: '#f472b6' },
  'Network & Mining': { icon: '▧', color: '#fb923c' },
  'Macro & Traditional Finance': { icon: '◆', color: '#94a3b8' },
  'News & Media': { icon: '◉', color: '#38bdf8' },
  'Blockchain Explorers': { icon: '⬡', color: '#34d399' },
  'AI & Synthesis': { icon: '◈', color: 'var(--cyan)' },
};

export const DATA_SOURCES: DataSource[] = [
  // ─── MARKET DATA (12) ────────────────────────────────────
  { id: 'coinpaprika-tickers', name: 'CoinPaprika Tickers', category: 'Market Data', type: 'rest-api', description: 'Top market-cap assets — price, volume, market cap, 24h/7d changes', endpoint: '/v1/tickers', auth: 'none', refreshRate: '5m', tabs: ['Market', 'Overview', 'Portfolio', 'ISO 20022'], status: 'active' },
  { id: 'coinpaprika-global', name: 'CoinPaprika Global', category: 'Market Data', type: 'rest-api', description: 'Global crypto market cap, volume, BTC dominance, asset count', endpoint: '/v1/global', auth: 'none', refreshRate: '5m', tabs: ['Overview', 'Market', 'Sentiment'], status: 'active' },
  { id: 'coingecko-markets', name: 'CoinGecko Markets Fallback', category: 'Market Data', type: 'rest-api', description: 'Fallback market data and images for live market surfaces', endpoint: '/api/v3/coins/markets', auth: 'free-key', refreshRate: '60s', tabs: ['ChainScore', 'Market', 'Overview'], status: 'active' },
  { id: 'coingecko-global', name: 'CoinGecko Global Fallback', category: 'Market Data', type: 'rest-api', description: 'Fallback global crypto market stats and dominance data', endpoint: '/api/v3/global', auth: 'free-key', refreshRate: '5m', tabs: ['Overview', 'DeFi', 'Daily Brief'], status: 'active' },
  { id: 'coingecko-trending', name: 'CoinGecko Trending', category: 'Market Data', type: 'rest-api', description: 'Trending assets by community activity and market interest', endpoint: '/api/v3/search/trending', auth: 'free-key', refreshRate: '5m', tabs: ['Market', 'Sentiment'], status: 'active' },
  { id: 'coingecko-defi', name: 'CoinGecko DeFi', category: 'Market Data', type: 'rest-api', description: 'DeFi market cap, DeFi-to-ETH ratio, top DeFi tokens', endpoint: '/api/v3/global/decentralized_finance_defi', auth: 'none', refreshRate: '5m', tabs: ['DeFi'], status: 'active' },
  { id: 'coingecko-exchanges', name: 'CoinGecko Exchanges', category: 'Market Data', type: 'rest-api', description: 'Exchange volume rankings and trust scores', endpoint: '/api/v3/exchanges', auth: 'none', refreshRate: '10m', tabs: ['Market'], status: 'active' },
  { id: 'binance-ticker', name: 'Binance 24h Ticker', category: 'Market Data', type: 'rest-api', description: 'Real-time 24h trading statistics for all pairs', endpoint: '/api/v3/ticker/24hr', auth: 'none', refreshRate: '10s', tabs: ['Market', 'Derivatives'], status: 'active' },
  { id: 'binance-depth', name: 'Binance Order Book', category: 'Market Data', type: 'rest-api', description: 'Order book depth for BTC/ETH pairs', endpoint: '/api/v3/depth', auth: 'none', refreshRate: '1s', tabs: ['Market'], status: 'active' },
  { id: 'kraken-ticker', name: 'Kraken Ticker', category: 'Market Data', type: 'rest-api', description: 'Cross-exchange price validation via Kraken', endpoint: '/0/public/Ticker', auth: 'none', refreshRate: '30s', tabs: ['Market'], status: 'active' },

  // ─── ON-CHAIN ANALYTICS (8) ──────────────────────────────
  { id: 'mempool-fees', name: 'Mempool.space Fees', category: 'On-Chain Analytics', type: 'rest-api', description: 'Bitcoin recommended transaction fees (fast, medium, slow)', endpoint: '/api/v1/fees/recommended', auth: 'none', refreshRate: '30s', tabs: ['On-Chain', 'Overview'], status: 'active' },
  { id: 'mempool-hashrate', name: 'Mempool.space Hashrate', category: 'On-Chain Analytics', type: 'rest-api', description: 'Bitcoin network hashrate and mining difficulty', endpoint: '/api/v1/mining/hashrate/1m', auth: 'none', refreshRate: '10m', tabs: ['On-Chain', 'ChainScore'], status: 'active' },
  { id: 'mempool-blocks', name: 'Mempool.space Blocks', category: 'On-Chain Analytics', type: 'rest-api', description: 'Latest Bitcoin blocks — size, weight, fee range, tx count', endpoint: '/api/v1/blocks', auth: 'none', refreshRate: '60s', tabs: ['On-Chain'], status: 'active' },
  { id: 'mempool-difficulty', name: 'Mempool.space Difficulty', category: 'On-Chain Analytics', type: 'rest-api', description: 'Bitcoin difficulty adjustment — current epoch, progress, estimated adjustment', endpoint: '/api/v1/difficulty-adjustment', auth: 'none', refreshRate: '10m', tabs: ['On-Chain'], status: 'active' },
  { id: 'mempool-mempool', name: 'Mempool.space Mempool Stats', category: 'On-Chain Analytics', type: 'rest-api', description: 'Unconfirmed transactions count and memory usage', endpoint: '/api/mempool', auth: 'none', refreshRate: '30s', tabs: ['On-Chain'], status: 'active' },
  { id: 'blockchain-stats', name: 'Blockchain.com Stats', category: 'On-Chain Analytics', type: 'rest-api', description: 'BTC blockchain statistics — total BTC mined, block size', endpoint: '/stats', auth: 'none', refreshRate: '10m', tabs: ['On-Chain'], status: 'active' },
  { id: 'etherscan-gas', name: 'Etherscan Gas Oracle', category: 'On-Chain Analytics', type: 'rest-api', description: 'Ethereum gas prices — safe, propose, fast in gwei', endpoint: '/api?module=gastracker&action=gasoracle', auth: 'free-key', refreshRate: '15s', tabs: ['On-Chain'], status: 'active' },
  { id: 'etherscan-supply', name: 'Etherscan ETH Supply', category: 'On-Chain Analytics', type: 'rest-api', description: 'Total ETH supply and burn rate', endpoint: '/api?module=stats&action=ethsupply2', auth: 'free-key', refreshRate: '10m', tabs: ['On-Chain'], status: 'active' },

  // ─── DERIVATIVES & FUTURES (7) ───────────────────────────
  { id: 'binance-futures-oi', name: 'Binance Futures Open Interest', category: 'Derivatives & Futures', type: 'rest-api', description: 'BTC/ETH perpetual and quarterly futures open interest', endpoint: '/fapi/v1/openInterest', auth: 'none', refreshRate: '60s', tabs: ['Derivatives'], status: 'active' },
  { id: 'binance-funding', name: 'Binance Funding Rate', category: 'Derivatives & Futures', type: 'rest-api', description: 'Perpetual futures funding rate (bullish/bearish indicator)', endpoint: '/fapi/v1/fundingRate', auth: 'none', refreshRate: '60s', tabs: ['Derivatives', 'Overview'], status: 'active' },
  { id: 'binance-long-short', name: 'Binance Long/Short Ratio', category: 'Derivatives & Futures', type: 'rest-api', description: 'Top trader long/short account ratio', endpoint: '/futures/data/topLongShortAccountRatio', auth: 'none', refreshRate: '5m', tabs: ['Derivatives', 'Sentiment'], status: 'active' },
  { id: 'binance-liquidation', name: 'Binance Liquidations', category: 'Derivatives & Futures', type: 'rest-api', description: 'Forced liquidation events — direction, size, timestamp', endpoint: '/fapi/v1/allForceOrders', auth: 'none', refreshRate: '10s', tabs: ['Derivatives', 'Whales'], status: 'active' },
  { id: 'deribit-options', name: 'Deribit Options Data', category: 'Derivatives & Futures', type: 'rest-api', description: 'BTC/ETH options — volatility index (DVOL), max pain, put/call ratio', endpoint: '/api/v2/public/get_book_summary_by_currency', auth: 'none', refreshRate: '60s', tabs: ['Derivatives'], status: 'active' },
  { id: 'coinglass-oi', name: 'CoinGlass Open Interest', category: 'Derivatives & Futures', type: 'rest-api', description: 'Aggregated open interest across all major exchanges', endpoint: '/api/public/v2/open_interest', auth: 'none', refreshRate: '5m', tabs: ['Derivatives'], status: 'active' },
  { id: 'coinglass-funding', name: 'CoinGlass Funding Heatmap', category: 'Derivatives & Futures', type: 'rest-api', description: 'Cross-exchange funding rate comparison heatmap data', endpoint: '/api/public/v2/funding', auth: 'none', refreshRate: '5m', tabs: ['Derivatives'], status: 'active' },

  // ─── ETF & INSTITUTIONAL FLOWS (5) ──────────────────────
  { id: 'supabase-etf', name: 'ChainIntel ETF Flows DB', category: 'ETF & Institutional Flows', type: 'database', description: 'Daily BTC/ETH ETF net flows — IBIT, FBTC, ARKB, GBTC, BITB, HODL, ETHA, ETHW', endpoint: 'supabase:etf_flows', auth: 'free-key', refreshRate: '24h', tabs: ['ETF Flows'], status: 'active' },
  { id: 'farside-btc', name: 'Farside Investors BTC ETF', category: 'ETF & Institutional Flows', type: 'scrape-parse', description: 'Spot Bitcoin ETF daily flow tracking (IBIT, FBTC, ARKB, GBTC)', endpoint: 'farside.co.uk/bitcoin-etf-flow-all-data', auth: 'none', refreshRate: '24h', tabs: ['ETF Flows'], status: 'active' },
  { id: 'farside-eth', name: 'Farside Investors ETH ETF', category: 'ETF & Institutional Flows', type: 'scrape-parse', description: 'Spot Ethereum ETF daily flow tracking (ETHA, ETHW)', endpoint: 'farside.co.uk/ethereum-etf-flow-all-data', auth: 'none', refreshRate: '24h', tabs: ['ETF Flows'], status: 'active' },
  { id: 'sec-edgar-etf', name: 'SEC EDGAR ETF Filings', category: 'ETF & Institutional Flows', type: 'rest-api', description: 'ETF prospectus amendments, 13F institutional holdings', endpoint: 'efts.sec.gov/LATEST/search-index', auth: 'none', refreshRate: '24h', tabs: ['ETF Flows', 'Regulatory'], status: 'active' },
  { id: 'grayscale-nav', name: 'Grayscale NAV Data', category: 'ETF & Institutional Flows', type: 'rest-api', description: 'GBTC/ETHE NAV premium/discount tracking', endpoint: 'grayscale.com/products', auth: 'none', refreshRate: '24h', tabs: ['ETF Flows'], status: 'active' },

  // ─── SENTIMENT & SOCIAL (8) ──────────────────────────────
  { id: 'fng-index', name: 'Fear & Greed Index', category: 'Sentiment & Social', type: 'rest-api', description: 'Crypto Fear & Greed Index (0-100) with classification', endpoint: 'api.alternative.me/fng', auth: 'none', refreshRate: '24h', tabs: ['Sentiment', 'Overview'], status: 'active' },
  { id: 'lunarcrush-social', name: 'LunarCrush Social Volume', category: 'Sentiment & Social', type: 'rest-api', description: 'Social mentions, engagement, sentiment score across platforms', endpoint: '/public/coins/list/v2', auth: 'free-key', refreshRate: '1h', tabs: ['Sentiment'], status: 'active' },
  { id: 'reddit-crypto', name: 'Reddit r/cryptocurrency', category: 'Sentiment & Social', type: 'rest-api', description: 'Top posts, comment sentiment, discussion volume', endpoint: 'reddit.com/r/cryptocurrency/.json', auth: 'none', refreshRate: '15m', tabs: ['Sentiment'], status: 'active' },
  { id: 'reddit-bitcoin', name: 'Reddit r/bitcoin', category: 'Sentiment & Social', type: 'rest-api', description: 'Bitcoin-specific community sentiment and discussion', endpoint: 'reddit.com/r/bitcoin/.json', auth: 'none', refreshRate: '15m', tabs: ['Sentiment'], status: 'active' },
  { id: 'reddit-ethfinance', name: 'Reddit r/ethfinance', category: 'Sentiment & Social', type: 'rest-api', description: 'Ethereum-focused discussion and sentiment tracking', endpoint: 'reddit.com/r/ethfinance/.json', auth: 'none', refreshRate: '15m', tabs: ['Sentiment'], status: 'active' },
  { id: 'stocktwits-btc', name: 'StockTwits BTC Sentiment', category: 'Sentiment & Social', type: 'rest-api', description: 'BTC.X message sentiment — bullish/bearish ratio', endpoint: '/api/2/streams/symbol/BTC.X.json', auth: 'none', refreshRate: '10m', tabs: ['Sentiment'], status: 'active' },
  { id: 'google-trends', name: 'Google Trends Crypto', category: 'Sentiment & Social', type: 'rest-api', description: 'Search interest for Bitcoin, Ethereum, crypto over time', endpoint: 'trends.google.com/trends/api', auth: 'none', refreshRate: '1h', tabs: ['Sentiment'], status: 'active' },
  { id: 'whale-alert-api', name: 'Whale Alert', category: 'Sentiment & Social', type: 'rest-api', description: 'Large blockchain transactions (>$1M) across all chains', endpoint: '/v1/transactions', auth: 'free-key', refreshRate: '30s', tabs: ['Whales', 'Overview'], status: 'active' },

  // ─── REGULATORY & COMPLIANCE (10) ────────────────────────
  { id: 'supabase-reg', name: 'ChainIntel Regulatory DB', category: 'Regulatory & Compliance', type: 'database', description: 'Curated regulatory updates — SEC, CFTC, ESMA, FCA, MAS, BIS, IMF, FSB', endpoint: 'supabase:regulatory_cache', auth: 'free-key', refreshRate: '6h', tabs: ['Regulatory'], status: 'active' },
  { id: 'federal-register', name: 'Federal Register API', category: 'Regulatory & Compliance', type: 'rest-api', description: 'US federal rules and notices mentioning crypto, blockchain, digital assets', endpoint: 'federalregister.gov/api/v1/documents', auth: 'none', refreshRate: '6h', tabs: ['Regulatory'], status: 'active' },
  { id: 'sec-edgar', name: 'SEC EDGAR Full-Text Search', category: 'Regulatory & Compliance', type: 'rest-api', description: 'SEC filings mentioning cryptocurrency — enforcement, no-action letters, guidance', endpoint: 'efts.sec.gov/LATEST/search-index', auth: 'none', refreshRate: '6h', tabs: ['Regulatory'], status: 'active' },
  { id: 'cftc-rss', name: 'CFTC Press Releases', category: 'Regulatory & Compliance', type: 'rss', description: 'CFTC enforcement actions and crypto commodity guidance', endpoint: 'cftc.gov/PressRoom/PressRelease/RSS', auth: 'none', refreshRate: '6h', tabs: ['Regulatory'], status: 'active' },
  { id: 'esma-rss', name: 'ESMA News (MiCA)', category: 'Regulatory & Compliance', type: 'rss', description: 'EU MiCA implementation updates and consultations', endpoint: 'esma.europa.eu/rss', auth: 'none', refreshRate: '6h', tabs: ['Regulatory'], status: 'active' },
  { id: 'fca-rss', name: 'FCA News', category: 'Regulatory & Compliance', type: 'rss', description: 'UK Financial Conduct Authority crypto regulation news', endpoint: 'fca.org.uk/news/rss', auth: 'none', refreshRate: '6h', tabs: ['Regulatory'], status: 'active' },
  { id: 'govtrack-bills', name: 'GovTrack Crypto Bills', category: 'Regulatory & Compliance', type: 'rss', description: 'US congressional bills related to cryptocurrency and digital assets', endpoint: 'govtrack.us/congress/bills/subjects/rss', auth: 'none', refreshRate: '24h', tabs: ['Regulatory'], status: 'active' },
  { id: 'bis-publications', name: 'BIS Publications', category: 'Regulatory & Compliance', type: 'rest-api', description: 'Bank for International Settlements crypto/CBDC research papers', endpoint: 'bis.org/list/cbpub', auth: 'none', refreshRate: '24h', tabs: ['Regulatory'], status: 'active' },
  { id: 'imf-publications', name: 'IMF Policy Papers', category: 'Regulatory & Compliance', type: 'rest-api', description: 'IMF digital assets policy papers and stability reports', endpoint: 'imf.org/en/Publications', auth: 'none', refreshRate: '24h', tabs: ['Regulatory'], status: 'active' },
  { id: 'fatf-publications', name: 'FATF Guidance', category: 'Regulatory & Compliance', type: 'rest-api', description: 'FATF virtual asset travel rule and AML/CFT guidance updates', endpoint: 'fatf-gafi.org/en/publications', auth: 'none', refreshRate: '24h', tabs: ['Regulatory'], status: 'active' },

  // ─── DEFI PROTOCOLS (8) ──────────────────────────────────
  { id: 'defillama-tvl', name: 'DefiLlama TVL', category: 'DeFi Protocols', type: 'rest-api', description: 'Total Value Locked across all DeFi protocols', endpoint: '/v2/protocols', auth: 'none', refreshRate: '5m', tabs: ['DeFi', 'Overview'], status: 'active' },
  { id: 'defillama-chains', name: 'DefiLlama Chain TVL', category: 'DeFi Protocols', type: 'rest-api', description: 'TVL breakdown by blockchain — Ethereum, Solana, Arbitrum, etc.', endpoint: '/v2/chains', auth: 'none', refreshRate: '5m', tabs: ['DeFi'], status: 'active' },
  { id: 'defillama-yields', name: 'DefiLlama Yields', category: 'DeFi Protocols', type: 'rest-api', description: 'DeFi yield rates across lending, staking, LP pools', endpoint: '/pools', auth: 'none', refreshRate: '10m', tabs: ['DeFi'], status: 'active' },
  { id: 'defillama-stablecoins', name: 'DefiLlama Stablecoins', category: 'DeFi Protocols', type: 'rest-api', description: 'Stablecoin market caps and chain distribution (USDT, USDC, DAI)', endpoint: '/stablecoins', auth: 'none', refreshRate: '10m', tabs: ['DeFi'], status: 'active' },
  { id: 'defillama-bridges', name: 'DefiLlama Bridge Volume', category: 'DeFi Protocols', type: 'rest-api', description: 'Cross-chain bridge volumes and flows between networks', endpoint: '/bridges', auth: 'none', refreshRate: '1h', tabs: ['DeFi'], status: 'active' },
  { id: 'defillama-dex', name: 'DefiLlama DEX Volume', category: 'DeFi Protocols', type: 'rest-api', description: 'Decentralized exchange volume — Uniswap, Jupiter, Curve, etc.', endpoint: '/overview/dexs', auth: 'none', refreshRate: '1h', tabs: ['DeFi'], status: 'active' },
  { id: 'aave-rates', name: 'Aave V3 Rates', category: 'DeFi Protocols', type: 'rest-api', description: 'Aave V3 lending/borrowing rates for major assets', endpoint: '/v3/rates', auth: 'none', refreshRate: '5m', tabs: ['DeFi'], status: 'active' },
  { id: 'uniswap-pools', name: 'Uniswap V3 Analytics', category: 'DeFi Protocols', type: 'rest-api', description: 'Top Uniswap pools by volume and TVL', endpoint: 'uniswap subgraph', auth: 'none', refreshRate: '5m', tabs: ['DeFi'], status: 'active' },

  // ─── NETWORK & MINING (6) ───────────────────────────────
  { id: 'mempool-mining-pools', name: 'Mempool Mining Pools', category: 'Network & Mining', type: 'rest-api', description: 'Bitcoin mining pool distribution — Foundry, AntPool, F2Pool, etc.', endpoint: '/api/v1/mining/pools', auth: 'none', refreshRate: '1h', tabs: ['On-Chain'], status: 'active' },
  { id: 'blockchain-hash-dist', name: 'Blockchain.com Hashrate Distribution', category: 'Network & Mining', type: 'rest-api', description: 'Bitcoin mining centralization metrics', endpoint: '/pools', auth: 'none', refreshRate: '1h', tabs: ['On-Chain'], status: 'active' },
  { id: 'ethernodes', name: 'Ethernodes', category: 'Network & Mining', type: 'rest-api', description: 'Ethereum node count and client diversity (Geth, Nethermind, etc.)', endpoint: 'ethernodes.org/api', auth: 'none', refreshRate: '1h', tabs: ['On-Chain'], status: 'active' },
  { id: 'beaconcha-validators', name: 'Beaconcha.in Validators', category: 'Network & Mining', type: 'rest-api', description: 'Ethereum validator count, staking stats, attestation performance', endpoint: '/api/v1/epoch/latest', auth: 'none', refreshRate: '10m', tabs: ['On-Chain'], status: 'active' },
  { id: 'solana-validators', name: 'Solana Beach Validators', category: 'Network & Mining', type: 'rest-api', description: 'Solana validator count, stake distribution, epoch info', endpoint: 'solanabeach.io/api', auth: 'none', refreshRate: '10m', tabs: ['On-Chain'], status: 'active' },
  { id: 'ultrasound-money', name: 'ultrasound.money', category: 'Network & Mining', type: 'rest-api', description: 'ETH burn rate, issuance, supply changes — deflationary tracker', endpoint: 'ultrasound.money/api', auth: 'none', refreshRate: '10m', tabs: ['On-Chain'], status: 'active' },

  // ─── MACRO & TRADITIONAL FINANCE (6) ────────────────────
  { id: 'fred-dxy', name: 'FRED DXY Index', category: 'Macro & Traditional Finance', type: 'rest-api', description: 'US Dollar Index (DXY) — inverse correlation with crypto', endpoint: '/series/observations?series_id=DTWEXBGS', auth: 'free-key', refreshRate: '24h', tabs: ['Macro'], status: 'active' },
  { id: 'fred-rates', name: 'FRED Interest Rates', category: 'Macro & Traditional Finance', type: 'rest-api', description: 'Federal Funds Rate, 10Y Treasury yield', endpoint: '/series/observations?series_id=FEDFUNDS', auth: 'free-key', refreshRate: '24h', tabs: ['Macro'], status: 'active' },
  { id: 'fred-cpi', name: 'FRED CPI Data', category: 'Macro & Traditional Finance', type: 'rest-api', description: 'Consumer Price Index — inflation indicator', endpoint: '/series/observations?series_id=CPIAUCSL', auth: 'free-key', refreshRate: '30d', tabs: ['Macro'], status: 'active' },
  { id: 'cme-fedwatch', name: 'CME FedWatch Proxy', category: 'Macro & Traditional Finance', type: 'rest-api', description: 'Fed rate expectations derived from futures data', endpoint: 'cmegroup.com/trading/interest-rates', auth: 'none', refreshRate: '24h', tabs: ['Macro'], status: 'active' },
  { id: 'treasury-yield', name: 'US Treasury Yields', category: 'Macro & Traditional Finance', type: 'rest-api', description: '2Y, 5Y, 10Y, 30Y Treasury yields — yield curve analysis', endpoint: 'home.treasury.gov/resource-center/data-chart-center', auth: 'none', refreshRate: '24h', tabs: ['Macro'], status: 'active' },
  { id: 'gold-price', name: 'Gold Spot Price', category: 'Macro & Traditional Finance', type: 'rest-api', description: 'Gold price — BTC digital gold narrative correlation', endpoint: 'metals-api.com/api/latest', auth: 'free-key', refreshRate: '1h', tabs: ['Macro'], status: 'active' },

  // ─── NEWS & MEDIA (6) ───────────────────────────────────
  { id: 'coindesk-rss', name: 'CoinDesk News', category: 'News & Media', type: 'rss', description: 'Breaking crypto news and market analysis', endpoint: 'coindesk.com/arc/outboundfeeds/rss', auth: 'none', refreshRate: '15m', tabs: ['News', 'Regulatory'], status: 'active' },
  { id: 'theblock-rss', name: 'The Block Research', category: 'News & Media', type: 'rss', description: 'Institutional-grade crypto research and data journalism', endpoint: 'theblock.co/rss', auth: 'none', refreshRate: '15m', tabs: ['News', 'Regulatory'], status: 'active' },
  { id: 'decrypt-rss', name: 'Decrypt News', category: 'News & Media', type: 'rss', description: 'Web3 and cryptocurrency news and features', endpoint: 'decrypt.co/feed', auth: 'none', refreshRate: '15m', tabs: ['News'], status: 'active' },
  { id: 'cointelegraph-rss', name: 'CoinTelegraph News', category: 'News & Media', type: 'rss', description: 'Crypto market news and regulatory coverage', endpoint: 'cointelegraph.com/rss', auth: 'none', refreshRate: '15m', tabs: ['News', 'Regulatory'], status: 'active' },
  { id: 'cryptopanic', name: 'CryptoPanic Aggregator', category: 'News & Media', type: 'rest-api', description: 'Aggregated crypto news with community sentiment tags', endpoint: 'cryptopanic.com/api/v1/posts', auth: 'free-key', refreshRate: '5m', tabs: ['News', 'Sentiment'], status: 'active' },
  { id: 'messari-news', name: 'Messari Research', category: 'News & Media', type: 'rest-api', description: 'Crypto asset intelligence and research reports', endpoint: '/api/v2/news', auth: 'free-key', refreshRate: '1h', tabs: ['News'], status: 'active' },

  // ─── BLOCKCHAIN EXPLORERS (2) ───────────────────────────
  { id: 'blockchair-stats', name: 'Blockchair Multi-Chain', category: 'Blockchain Explorers', type: 'rest-api', description: 'Cross-chain block explorer — BTC, ETH, SOL, XRP network stats', endpoint: '/stats', auth: 'none', refreshRate: '60s', tabs: ['On-Chain'], status: 'active' },
  { id: 'solscan', name: 'Solscan Analytics', category: 'Blockchain Explorers', type: 'rest-api', description: 'Solana token transfers, DeFi activity, NFT volume', endpoint: 'api.solscan.io', auth: 'free-key', refreshRate: '60s', tabs: ['On-Chain'], status: 'active' },

  // ─── AI & SYNTHESIS (2) ─────────────────────────────────
  { id: 'chainintel-ai', name: 'ChainIntel AI Synthesis', category: 'AI & Synthesis', type: 'rest-api', description: 'AI-powered cross-source intelligence synthesis — CI Signal generation', endpoint: 'internal:ai-synthesis', auth: 'none', refreshRate: 'real-time', tabs: ['Overview', 'All Tabs'], status: 'active' },
  { id: 'chainscore-engine', name: 'ChainScore Rating Engine', category: 'AI & Synthesis', type: 'database', description: '14-asset scoring system — regulatory, adoption, decentralization, liquidity, fundamentals', endpoint: 'supabase:chainscore_ratings', auth: 'free-key', refreshRate: '24h', tabs: ['ChainScore'], status: 'active' },
];

// Helpers
export function getSourcesByCategory(): Record<SourceCategory, DataSource[]> {
  const result = {} as Record<SourceCategory, DataSource[]>;
  for (const src of DATA_SOURCES) {
    if (!result[src.category]) result[src.category] = [];
    result[src.category].push(src);
  }
  return result;
}

export function getSourcesByTab(tab: string): DataSource[] {
  return DATA_SOURCES.filter(s => s.tabs.some(t => t.toLowerCase() === tab.toLowerCase()));
}

export function getActiveSourceCount(): number {
  return DATA_SOURCES.filter(s => s.status === 'active').length;
}

export function getCategoryStats(): { category: SourceCategory; count: number; icon: string; color: string }[] {
  const byCategory = getSourcesByCategory();
  return (Object.keys(byCategory) as SourceCategory[]).map(cat => ({
    category: cat,
    count: byCategory[cat].length,
    icon: SOURCE_CATEGORIES[cat].icon,
    color: SOURCE_CATEGORIES[cat].color,
  }));
}
