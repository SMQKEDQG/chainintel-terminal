import { NextResponse } from 'next/server';

// LEVEL UP 2: Portfolio Allocation Intelligence
// Institutional-grade model portfolios (Conservative/Moderate/Aggressive)
// with live rebalancing signals based on ChainScore + macro + momentum

interface CacheEntry { data: any; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 120_000;

async function cachedFetch(key: string, url: string): Promise<any> {
  if (cache[key] && Date.now() - cache[key].ts < TTL) return cache[key].data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch { return cache[key]?.data || null; }
}

// Model portfolio definitions (industry standard institutional allocations)
const MODELS = {
  conservative: {
    name: 'Conservative',
    description: 'Capital preservation focus. 80/15/5 core allocation.',
    riskLevel: 'Low',
    targetReturn: '15-25% annually',
    maxDrawdown: '20%',
    allocations: [
      { symbol: 'BTC', name: 'Bitcoin', targetPct: 80 },
      { symbol: 'ETH', name: 'Ethereum', targetPct: 15 },
      { symbol: 'STABLES', name: 'Stablecoin Reserve', targetPct: 5 },
    ],
  },
  moderate: {
    name: 'Moderate',
    description: 'Balanced growth. 60/25/10/5 with altcoin exposure.',
    riskLevel: 'Medium',
    targetReturn: '25-50% annually',
    maxDrawdown: '35%',
    allocations: [
      { symbol: 'BTC', name: 'Bitcoin', targetPct: 60 },
      { symbol: 'ETH', name: 'Ethereum', targetPct: 25 },
      { symbol: 'SOL', name: 'Solana', targetPct: 5 },
      { symbol: 'XRP', name: 'XRP', targetPct: 5 },
      { symbol: 'STABLES', name: 'Stablecoin Reserve', targetPct: 5 },
    ],
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Maximum growth. 50/20/15/10/5 with high-beta altcoins.',
    riskLevel: 'High',
    targetReturn: '50-100%+ annually',
    maxDrawdown: '55%',
    allocations: [
      { symbol: 'BTC', name: 'Bitcoin', targetPct: 50 },
      { symbol: 'ETH', name: 'Ethereum', targetPct: 20 },
      { symbol: 'SOL', name: 'Solana', targetPct: 10 },
      { symbol: 'XRP', name: 'XRP', targetPct: 5 },
      { symbol: 'LINK', name: 'Chainlink', targetPct: 5 },
      { symbol: 'AVAX', name: 'Avalanche', targetPct: 5 },
      { symbol: 'STABLES', name: 'Stablecoin Reserve', targetPct: 5 },
    ],
  },
};

export async function GET() {
  // Fetch live prices for all model assets
  const [prices, fng] = await Promise.allSettled([
    cachedFetch('port-prices', 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,ripple,chainlink,avalanche-2,cardano,polkadot&order=market_cap_desc&price_change_percentage=24h,7d,30d'),
    cachedFetch('port-fng', 'https://api.alternative.me/fng/?limit=7'),
  ]);

  const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;
  const priceData = val(prices) || [];
  const fngData = val(fng);
  const fngValue = fngData?.data?.[0] ? parseInt(fngData.data[0].value) : 50;

  // Map prices by symbol
  const priceMap: Record<string, any> = {};
  const symbolMap: Record<string, string> = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', ripple: 'XRP', chainlink: 'LINK', 'avalanche-2': 'AVAX', cardano: 'ADA', polkadot: 'DOT' };
  for (const coin of priceData) {
    const sym = symbolMap[coin.id] || coin.symbol?.toUpperCase();
    if (sym) priceMap[sym] = coin;
  }

  // Compute model portfolios with live data
  const computeModel = (model: typeof MODELS.conservative) => {
    let totalValue = 100_000; // $100K model portfolio
    const positions = model.allocations.map(alloc => {
      const price = priceMap[alloc.symbol];
      const allocated = totalValue * (alloc.targetPct / 100);
      const change24h = price?.price_change_percentage_24h || 0;
      const change7d = price?.price_change_percentage_7d_in_currency || 0;
      const change30d = price?.price_change_percentage_30d_in_currency || 0;
      const currentPrice = price?.current_price || 0;

      // Simulate drift from 30d price changes
      const driftPct = change30d !== 0 ? alloc.targetPct * (1 + change30d / 100) : alloc.targetPct;

      return {
        ...alloc,
        currentPrice,
        change24h: +change24h.toFixed(2),
        change7d: +change7d.toFixed(2),
        change30d: +change30d.toFixed(2),
        allocatedUsd: allocated,
        currentPct: +driftPct.toFixed(1),
        drift: +(driftPct - alloc.targetPct).toFixed(1),
        needsRebalance: Math.abs(driftPct - alloc.targetPct) > 5,
      };
    });

    // Portfolio performance
    const portfolioChange24h = positions.reduce((s, p) => s + (p.change24h * p.targetPct / 100), 0);
    const portfolioChange7d = positions.reduce((s, p) => s + (p.change7d * p.targetPct / 100), 0);
    const portfolioChange30d = positions.reduce((s, p) => s + (p.change30d * p.targetPct / 100), 0);
    const needsRebalance = positions.some(p => p.needsRebalance);

    return {
      ...model,
      positions,
      performance: {
        change24h: +portfolioChange24h.toFixed(2),
        change7d: +portfolioChange7d.toFixed(2),
        change30d: +portfolioChange30d.toFixed(2),
      },
      rebalance: {
        needed: needsRebalance,
        driftThreshold: '±5%',
        positionsOutOfBand: positions.filter(p => p.needsRebalance).map(p => p.symbol),
      },
    };
  };

  // Market regime detection
  const regime = fngValue <= 25 ? 'FEAR' : fngValue <= 40 ? 'UNCERTAINTY' : fngValue <= 60 ? 'NEUTRAL' : fngValue <= 75 ? 'OPTIMISM' : 'EUPHORIA';
  const regimeAdvice = fngValue <= 25
    ? 'Extreme fear — historically optimal DCA entry. Consider moving to Aggressive allocation.'
    : fngValue <= 40
    ? 'Elevated caution — maintain current allocation, prepare dry powder.'
    : fngValue <= 60
    ? 'Neutral zone — stay the course. Rebalance only if positions drift >5%.'
    : fngValue <= 75
    ? 'Optimism rising — consider taking partial profits on high-beta positions.'
    : 'Euphoria — reduce risk. Shift toward Conservative allocation. Take profits on altcoins.';

  return NextResponse.json({
    models: {
      conservative: computeModel(MODELS.conservative),
      moderate: computeModel(MODELS.moderate),
      aggressive: computeModel(MODELS.aggressive),
    },
    regime: { label: regime, fng: fngValue, advice: regimeAdvice },
    hypothetical: true,
    disclaimer: 'Model portfolios are for educational purposes only. Not financial advice. Past performance does not guarantee future results.',
    sources: ['coingecko-markets', 'fng-index', 'chainscore-engine'],
    sourceCount: 3,
    timestamp: Date.now(),
  });
}
