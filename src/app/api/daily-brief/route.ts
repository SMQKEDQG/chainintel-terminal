import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════
// DAILY INTELLIGENCE BRIEF — Comprehensive Market Digest
// Aggregates: CoinGecko, DefiLlama, Mempool, Etherscan Gas,
//             CMC Global Metrics, Fear & Greed, Whale Activity
// ═══════════════════════════════════════════════════════════════════

let briefCache: { data: any; ts: number } | null = null;
const CACHE_TTL = 180_000; // 3 min cache

const CMC_KEY = process.env.CMC_API_KEY || '';

function fmt(n: number, decimals = 0): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: decimals })}`;
}

function pct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

async function safeFetch(url: string, opts?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), ...opts });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function GET() {
  if (briefCache && Date.now() - briefCache.ts < CACHE_TTL) {
    return NextResponse.json(briefCache.data);
  }

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });

  // ── Parallel data fetches from free APIs ──
  const [
    fngJson,
    cgPrices,
    cgGlobal,
    defiChains,
    stablecoins,
    mempoolData,
    gasData,
    cgTrending,
    cmcGlobal,
  ] = await Promise.all([
    safeFetch('https://api.alternative.me/fng/?limit=1'),
    safeFetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true'),
    safeFetch('https://api.coingecko.com/api/v3/global'),
    safeFetch('https://api.llama.fi/v2/chains'),
    safeFetch('https://stablecoins.llama.fi/stablecoins?includePrices=true'),
    safeFetch('https://mempool.space/api/mempool'),
    safeFetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle${process.env.ETHERSCAN_API_KEY ? `&apikey=${process.env.ETHERSCAN_API_KEY}` : ''}`),
    safeFetch('https://api.coingecko.com/api/v3/search/trending'),
    CMC_KEY ? safeFetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
      headers: { 'X-CMC_PRO_API_KEY': CMC_KEY, Accept: 'application/json' },
    }) : null,
  ]);

  // ── 1. MARKET SNAPSHOT ──
  const btc = cgPrices?.bitcoin || {};
  const eth = cgPrices?.ethereum || {};
  const sol = cgPrices?.solana || {};
  const bnb = cgPrices?.binancecoin || {};
  const xrp = cgPrices?.ripple || {};

  const btcPrice = btc.usd || 0;
  const btcChange = btc.usd_24h_change || 0;
  const btcMcap = btc.usd_market_cap || 0;
  const btcVol = btc.usd_24h_vol || 0;
  const ethPrice = eth.usd || 0;
  const ethChange = eth.usd_24h_change || 0;
  const solPrice = sol.usd || 0;
  const solChange = sol.usd_24h_change || 0;
  const bnbPrice = bnb.usd || 0;
  const bnbChange = bnb.usd_24h_change || 0;
  const xrpPrice = xrp.usd || 0;
  const xrpChange = xrp.usd_24h_change || 0;

  // Global metrics
  const globalData = cgGlobal?.data || {};
  const totalMcap = globalData.total_market_cap?.usd || 0;
  const totalVol24h = globalData.total_volume?.usd || 0;
  const mcapChange24h = globalData.market_cap_change_percentage_24h_usd || 0;
  const btcDominance = globalData.market_cap_percentage?.btc || 0;
  const ethDominance = globalData.market_cap_percentage?.eth || 0;
  const activeCryptos = globalData.active_cryptocurrencies || 0;

  const marketSnapshot = {
    assets: [
      { symbol: 'BTC', price: btcPrice, change24h: btcChange, mcap: btcMcap, vol24h: btcVol },
      { symbol: 'ETH', price: ethPrice, change24h: ethChange, mcap: eth.usd_market_cap || 0, vol24h: eth.usd_24h_vol || 0 },
      { symbol: 'SOL', price: solPrice, change24h: solChange, mcap: sol.usd_market_cap || 0, vol24h: sol.usd_24h_vol || 0 },
      { symbol: 'BNB', price: bnbPrice, change24h: bnbChange, mcap: bnb.usd_market_cap || 0, vol24h: bnb.usd_24h_vol || 0 },
      { symbol: 'XRP', price: xrpPrice, change24h: xrpChange, mcap: xrp.usd_market_cap || 0, vol24h: xrp.usd_24h_vol || 0 },
    ],
    totalMcap,
    totalVol24h,
    mcapChange24h,
    btcDominance,
    ethDominance,
    activeCryptos,
  };

  // ── 2. FEAR & GREED ──
  let fngValue = 50;
  let fngLabel = 'Neutral';
  const fngEntry = fngJson?.data?.[0];
  if (fngEntry) {
    fngValue = parseInt(fngEntry.value, 10) || 50;
    fngLabel = fngEntry.value_classification || 'Neutral';
  }

  // ── 3. DEFI & STABLECOINS ──
  let totalTvl = 0;
  let ethTvl = 0;
  let topChains: { name: string; tvl: number }[] = [];
  if (Array.isArray(defiChains)) {
    for (const c of defiChains) {
      totalTvl += c.tvl || 0;
      if (c.name === 'Ethereum') ethTvl = c.tvl || 0;
    }
    topChains = defiChains
      .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 5)
      .map((c: any) => ({ name: c.name, tvl: c.tvl || 0 }));
  }

  let stablecoinSupply = 0;
  const stableList = stablecoins?.peggedAssets || (Array.isArray(stablecoins) ? stablecoins : []);
  if (Array.isArray(stableList)) {
    stablecoinSupply = stableList.reduce((s: number, c: any) => s + (c.circulating?.peggedUSD || 0), 0);
  }

  const defiSection = {
    totalTvl,
    ethTvl,
    ethDominance: totalTvl > 0 ? (ethTvl / totalTvl * 100) : 0,
    stablecoinSupply,
    topChains,
  };

  // ── 4. NETWORK HEALTH ──
  const mempoolTxCount = mempoolData?.count ?? null;
  const mempoolVsize = mempoolData?.vsize ?? null;
  const mempoolTotalFee = mempoolData?.total_fee ?? null;

  const gasResult = gasData?.result;
  const gasLow = parseFloat(gasResult?.SafeGasPrice || '0');
  const gasStandard = parseFloat(gasResult?.ProposeGasPrice || '0');
  const gasFast = parseFloat(gasResult?.FastGasPrice || '0');
  const gasBaseFee = parseFloat(gasResult?.suggestBaseFee || '0');

  const networkHealth = {
    btcMempool: {
      pendingTxs: mempoolTxCount,
      vsizeMB: mempoolVsize ? (mempoolVsize / 1e6).toFixed(1) : null,
      totalFeeBTC: mempoolTotalFee ? (mempoolTotalFee / 1e8).toFixed(4) : null,
      congestion: mempoolTxCount !== null ? (mempoolTxCount > 100000 ? 'HIGH' : mempoolTxCount > 30000 ? 'MODERATE' : 'LOW') : null,
    },
    ethGas: {
      low: gasLow,
      standard: gasStandard,
      fast: gasFast,
      baseFee: gasBaseFee,
      level: gasStandard > 50 ? 'HIGH' : gasStandard > 15 ? 'MODERATE' : 'LOW',
    },
  };

  // ── 5. TRENDING & MOVERS ──
  const trendingCoins: { name: string; symbol: string; rank: number; change24h: number | null }[] = [];
  if (cgTrending?.coins) {
    for (const entry of cgTrending.coins.slice(0, 6)) {
      const item = entry.item || entry;
      trendingCoins.push({
        name: item.name || '',
        symbol: (item.symbol || '').toUpperCase(),
        rank: item.market_cap_rank || 0,
        change24h: item.data?.price_change_percentage_24h?.usd ?? null,
      });
    }
  }

  // ── 6. CMC GLOBAL (if available) ──
  let cmcMetrics: any = null;
  if (cmcGlobal?.data) {
    const d = cmcGlobal.data;
    const quote = d.quote?.USD || {};
    cmcMetrics = {
      totalMcap: quote.total_market_cap || 0,
      vol24h: quote.total_volume_24h || 0,
      defiVol24h: quote.defi_volume_24h || 0,
      defiMcap: quote.defi_market_cap || 0,
      stablecoinVol24h: quote.stablecoin_volume_24h || 0,
      derivativesVol24h: quote.derivatives_volume_24h || 0,
      btcDominance: d.btc_dominance || 0,
      ethDominance: d.eth_dominance || 0,
      activeCryptos: d.active_cryptocurrencies || 0,
      activeExchanges: d.active_exchanges || 0,
    };
  }

  // ── CI COMPOSITE SIGNAL ──
  const bullish: string[] = [];
  const bearish: string[] = [];

  if (fngValue > 55) bullish.push('Sentiment above 55'); else if (fngValue < 40) bearish.push('Sentiment below 40');
  if (btcChange > 2) bullish.push(`BTC ${pct(btcChange)}`); else if (btcChange < -2) bearish.push(`BTC ${pct(btcChange)}`);
  if (ethChange > 2) bullish.push(`ETH ${pct(ethChange)}`); else if (ethChange < -2) bearish.push(`ETH ${pct(ethChange)}`);
  if (mcapChange24h > 1.5) bullish.push('Market cap expanding'); else if (mcapChange24h < -1.5) bearish.push('Market cap contracting');
  if (gasStandard > 30) bullish.push('High ETH gas (demand)');
  if (mempoolTxCount && mempoolTxCount > 80000) bullish.push('High BTC mempool activity');

  const signal = bullish.length >= 3 ? 'BULLISH' : bearish.length >= 3 ? 'BEARISH' : bullish.length > bearish.length ? 'CAUTIOUSLY BULLISH' : bearish.length > bullish.length ? 'CAUTIOUSLY BEARISH' : 'NEUTRAL';
  const signalConfidence = Math.min(100, Math.max(20, (Math.abs(bullish.length - bearish.length) / 6) * 100 + 30));

  // ── Build narrative summary ──
  const lines: string[] = [];
  if (btcPrice > 0) lines.push(`Bitcoin is trading at ${fmt(btcPrice)} (${pct(btcChange)} 24h), with total crypto market cap at ${fmt(totalMcap)}.`);
  if (totalTvl > 0) lines.push(`DeFi TVL stands at ${fmt(totalTvl)} across ${topChains.length > 0 ? topChains.length : 'multiple'} major chains. Stablecoin supply: ${fmt(stablecoinSupply)}.`);
  if (mempoolTxCount !== null) lines.push(`Bitcoin mempool holds ${mempoolTxCount.toLocaleString()} pending transactions (${networkHealth.btcMempool.congestion} congestion).`);
  if (gasStandard > 0) lines.push(`Ethereum gas at ${gasStandard} gwei (${networkHealth.ethGas.level}).`);
  lines.push(`Fear & Greed Index: ${fngValue} (${fngLabel}). CI Signal: ${signal}.`);

  const response = {
    brief: {
      date: dateStr,
      time: timeStr,
      text: lines.join(' '),
      signal,
      signalConfidence: Math.round(signalConfidence),
      bullishFactors: bullish,
      bearishFactors: bearish,
      marketSnapshot,
      sentiment: { value: fngValue, label: fngLabel },
      defi: defiSection,
      networkHealth,
      trending: trendingCoins,
      cmcGlobal: cmcMetrics,
      keyMetrics: {
        btcPrice, btcChange24h: btcChange,
        ethPrice, ethChange24h: ethChange,
        solPrice, solChange24h: solChange,
        fearGreed: fngValue, fearGreedLabel: fngLabel,
        totalMcap, totalVol24h, btcDominance, ethDominance,
        totalTvl, stablecoinSupply,
        gasGwei: gasStandard,
        mempoolTxs: mempoolTxCount,
      },
      generated: true,
    },
    source: 'aggregated-live',
    timestamp: Date.now(),
  };

  briefCache = { data: response, ts: Date.now() };
  return NextResponse.json(response);
}
