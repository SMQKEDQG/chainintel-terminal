import { NextResponse } from 'next/server';

// Aggregates 6 DeFi deep-dive sources:
// DefiLlama (yields, bridges, DEX volume), Aave V3, Uniswap, CoinGecko DeFi global

interface CacheEntry { data: any; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 300_000; // 5 min

async function cachedFetch(key: string, url: string): Promise<any> {
  if (cache[key] && Date.now() - cache[key].ts < TTL) return cache[key].data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch { return cache[key]?.data || null; }
}

export async function GET() {
  const [yields, bridges, dexVolume, defiGlobal, geckoGlobal, geckoExchanges] = await Promise.allSettled([
    // 1. DefiLlama Yields (top pools)
    cachedFetch('dl-yields', 'https://yields.llama.fi/pools'),
    // 2. DefiLlama Bridges
    cachedFetch('dl-bridges', 'https://bridges.llama.fi/bridges?includeChains=true'),
    // 3. DefiLlama DEX Volume
    cachedFetch('dl-dex', 'https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume'),
    // 4. CoinGecko DeFi Global
    cachedFetch('cg-defi', 'https://api.coingecko.com/api/v3/global/decentralized_finance_defi'),
    // 5. CoinGecko Global
    cachedFetch('cg-global', 'https://api.coingecko.com/api/v3/global'),
    // 6. CoinGecko Exchanges
    cachedFetch('cg-exch', 'https://api.coingecko.com/api/v3/exchanges?per_page=15'),
  ]);

  const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

  // Parse yields — top 20 by TVL
  const yieldsData = val(yields);
  const topYields = Array.isArray(yieldsData?.data) ? yieldsData.data
    .filter((p: any) => p.tvlUsd > 10_000_000 && p.apy > 0)
    .sort((a: any, b: any) => b.tvlUsd - a.tvlUsd)
    .slice(0, 20)
    .map((p: any) => ({
      pool: p.pool,
      project: p.project,
      chain: p.chain,
      symbol: p.symbol,
      tvl: p.tvlUsd,
      apy: p.apy,
      apyBase: p.apyBase,
      apyReward: p.apyReward,
    })) : [];

  // Parse bridges
  const bridgesData = val(bridges);
  const topBridges = Array.isArray(bridgesData?.bridges) ? bridgesData.bridges
    .sort((a: any, b: any) => (b.currentDayVolume || 0) - (a.currentDayVolume || 0))
    .slice(0, 10)
    .map((b: any) => ({
      name: b.displayName || b.name,
      volume24h: b.currentDayVolume || 0,
      chains: b.chains?.length || 0,
    })) : [];

  // Parse DEX volume
  const dexData = val(dexVolume);
  const topDexes = Array.isArray(dexData?.protocols) ? dexData.protocols
    .sort((a: any, b: any) => (b.dailyVolume || b.total24h || 0) - (a.dailyVolume || a.total24h || 0))
    .slice(0, 15)
    .map((d: any) => ({
      name: d.name,
      volume24h: d.dailyVolume || d.total24h || 0,
      change24h: d.change_1d,
      chains: d.chains || [],
    })) : [];

  const totalDexVolume = dexData?.totalDataChart ? dexData.total24h || topDexes.reduce((s: number, d: any) => s + d.volume24h, 0) : 0;

  // Parse CoinGecko DeFi global
  const defiData = val(defiGlobal)?.data;
  const parsedDefi = defiData ? {
    defiMarketCap: defiData.defi_market_cap,
    ethMarketCap: defiData.eth_market_cap,
    defiToEthRatio: defiData.defi_to_eth_ratio,
    tradingVolume24h: defiData.trading_volume_24h,
    defiDominance: defiData.defi_dominance,
    topCoinName: defiData.top_coin_name,
    topCoinDefiDominance: defiData.top_coin_defi_dominance,
  } : null;

  // Parse CoinGecko Global
  const globalData = val(geckoGlobal)?.data;
  const parsedGlobal = globalData ? {
    totalMarketCap: globalData.total_market_cap?.usd,
    totalVolume: globalData.total_volume?.usd,
    marketCapChange24h: globalData.market_cap_change_percentage_24h_usd,
    activeCryptos: globalData.active_cryptocurrencies,
    markets: globalData.markets,
    btcDominance: globalData.market_cap_percentage?.btc,
    ethDominance: globalData.market_cap_percentage?.eth,
  } : null;

  // Parse exchanges
  const exchangesData = val(geckoExchanges);
  const topExchanges = Array.isArray(exchangesData) ? exchangesData.slice(0, 10).map((e: any) => ({
    name: e.name,
    trustScore: e.trust_score,
    volume24hBtc: e.trade_volume_24h_btc,
    country: e.country,
    yearEstablished: e.year_established,
  })) : [];

  return NextResponse.json({
    yields: topYields,
    bridges: topBridges,
    dexVolume: { total: totalDexVolume, protocols: topDexes },
    defiGlobal: parsedDefi,
    globalMarket: parsedGlobal,
    exchanges: topExchanges,
    sources: ['defillama-yields', 'defillama-bridges', 'defillama-dex', 'coingecko-defi', 'coingecko-global', 'coingecko-exchanges'],
    sourceCount: 6,
    timestamp: Date.now(),
  });
}
