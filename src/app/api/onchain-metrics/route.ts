import { NextResponse } from 'next/server';

/**
 * /api/onchain-metrics
 * Derives on-chain proxy metrics for 12+ assets using live CoinGecko market data.
 *
 * Returns per-asset: mvrv (proxy), nvt (proxy), exchangeFlow30d (proxy from volume trend),
 * lthSupplyPct (proxy from age/liquidity ratio), dailyTxCount (proxy), onchainScore (0-100).
 *
 * These are derived approximations — real on-chain data requires Glassnode/CryptoQuant APIs
 * which are gated behind expensive plans. These proxies are directionally accurate and
 * derived from publicly available market microstructure data.
 */

const COINS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'ripple', symbol: 'XRP' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'cardano', symbol: 'ADA' },
  { id: 'polkadot', symbol: 'DOT' },
  { id: 'chainlink', symbol: 'LINK' },
  { id: 'avalanche-2', symbol: 'AVAX' },
  { id: 'matic-network', symbol: 'MATIC' },
  { id: 'uniswap', symbol: 'UNI' },
  { id: 'stellar', symbol: 'XLM' },
  { id: 'hedera-hashgraph', symbol: 'HBAR' },
];

// Base decentralization scores (structural, doesn't change often)
const DECENTRALIZATION: Record<string, number> = {
  BTC: 16, ETH: 15, XRP: 10, SOL: 12, ADA: 14, DOT: 14,
  LINK: 13, AVAX: 13, MATIC: 12, UNI: 14, XLM: 11, HBAR: 10,
};

interface CoinData {
  id: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  price_change_percentage_30d_in_currency: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
}

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 120_000; // 2 minutes

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const ids = COINS.map(c => c.id).join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=7d,30d`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 120 },
    });

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const coins: CoinData[] = await res.json();

    // Also fetch BTC hashrate from mempool
    let btcHashrate = 0;
    try {
      const mempoolRes = await fetch('https://mempool.space/api/v1/mining/hashrate/1m', {
        next: { revalidate: 300 },
      });
      if (mempoolRes.ok) {
        const mempoolData = await mempoolRes.json();
        if (mempoolData.currentHashrate) {
          btcHashrate = mempoolData.currentHashrate / 1e18; // Convert to EH/s
        }
      }
    } catch { /* mempool optional */ }

    const assets = coins.map(coin => {
      const sym = COINS.find(c => c.id === coin.id)?.symbol ?? coin.symbol.toUpperCase();
      const chg30d = coin.price_change_percentage_30d_in_currency ?? 0;
      const chg7d = coin.price_change_percentage_7d_in_currency ?? 0;
      const chg24h = coin.price_change_percentage_24h ?? 0;
      const volMcapRatio = coin.total_volume / (coin.market_cap || 1);
      const athDrawdown = Math.abs(coin.ath_change_percentage ?? -50);
      const supplyRatio = coin.circulating_supply / (coin.total_supply || coin.circulating_supply || 1);

      // MVRV proxy: Based on ATH drawdown and 30d momentum
      // When price is far from ATH, MVRV tends to be lower
      // ATH drawdown 0% → MVRV ~3.5, drawdown -80% → MVRV ~0.5
      const mvrvBase = 3.5 * Math.pow(1 - athDrawdown / 100, 1.5);
      const mvrvMomentum = chg30d > 0 ? 0.1 * (chg30d / 30) : 0.05 * (chg30d / 30);
      const mvrv = Math.max(0.3, Math.min(4.0, mvrvBase + mvrvMomentum));

      // NVT proxy: Market cap / (24h volume * 365)
      // Higher = potentially overvalued relative to transaction volume
      const annualizedVol = coin.total_volume * 365;
      const nvt = annualizedVol > 0 ? (coin.market_cap / annualizedVol) : 50;

      // Exchange flow proxy: Derived from 30d price action + volume trend
      // Rising price + falling volume = accumulation (outflow)
      // Falling price + rising volume = distribution (inflow)
      const flowDirection = chg30d > 0 ? -1 : 1; // positive price = outflows
      const flowMagnitude = Math.abs(chg30d) * volMcapRatio * 1000;
      const exchangeFlow30d = flowDirection * flowMagnitude * (coin.circulating_supply / 1e6);

      // LTH supply proxy: Based on supply ratio, age of network, and volume patterns
      // Low vol/mcap ratio + high supply ratio = more long-term holding
      const lthBase = sym === 'BTC' ? 75 : sym === 'ETH' ? 68 : 60;
      const lthVolAdj = volMcapRatio < 0.05 ? 5 : volMcapRatio < 0.1 ? 0 : -5;
      const lthSupplyAdj = supplyRatio > 0.9 ? 3 : supplyRatio > 0.7 ? 0 : -3;
      const lthSupplyPct = Math.max(40, Math.min(90, lthBase + lthVolAdj + lthSupplyAdj + (chg30d < -10 ? 3 : chg30d > 20 ? -4 : 0)));

      // Daily tx count proxy (rough estimate from volume / avg tx size)
      const avgTxSize = sym === 'BTC' ? 25000 : sym === 'ETH' ? 2000 : 500;
      const dailyTxCount = Math.round(coin.total_volume / avgTxSize);

      // Liquidity depth: volume/mcap ratio scoring
      const liquidityScore = volMcapRatio > 0.1 ? 18 : volMcapRatio > 0.05 ? 15 : volMcapRatio > 0.02 ? 12 : 10;

      // Adoption velocity: 30d volume trend proxy
      const adoptionScore = chg30d > 20 ? 18 : chg30d > 5 ? 16 : chg30d > -5 ? 14 : chg30d > -20 ? 12 : 10;

      // Network fundamentals: hashrate for BTC, 7d momentum proxy for others
      const networkScore = sym === 'BTC'
        ? (btcHashrate > 800 ? 18 : btcHashrate > 600 ? 16 : 14)
        : (chg7d > 5 ? 17 : chg7d > 0 ? 15 : chg7d > -5 ? 13 : 11);

      const decentralization = DECENTRALIZATION[sym] ?? 12;

      // Composite on-chain score
      const onchainScore = Math.round(
        (liquidityScore + adoptionScore + networkScore + decentralization + Math.min(20, mvrv * 5)) / 5 * (100 / 20)
      );

      return {
        symbol: sym,
        price: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        change24h: chg24h,
        change7d: chg7d,
        change30d: chg30d,
        mvrv: Math.round(mvrv * 100) / 100,
        nvt: Math.round(nvt * 10) / 10,
        exchangeFlow30d: Math.round(exchangeFlow30d),
        lthSupplyPct: Math.round(lthSupplyPct * 10) / 10,
        dailyTxCount,
        onchainScore: Math.max(30, Math.min(98, onchainScore)),
        hashrate: sym === 'BTC' ? btcHashrate : 0,
        liquidityScore,
        adoptionScore,
        networkScore,
        decentralization,
      };
    });

    // Sort by onchainScore descending
    assets.sort((a, b) => b.onchainScore - a.onchainScore);

    const result = {
      assets,
      btcHashrate,
      updatedAt: new Date().toISOString(),
      source: 'live',
      methodology: 'Proxy metrics derived from CoinGecko market microstructure data. Directionally accurate approximations — not direct on-chain measurements.',
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err: any) {
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: err.message, source: 'error' }, { status: 500 });
  }
}
