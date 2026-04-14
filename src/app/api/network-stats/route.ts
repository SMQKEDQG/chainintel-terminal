import { NextResponse } from 'next/server';

// Aggregates 8 network/mining sources:
// Mempool (mining pools, mempool stats), Etherscan (gas, supply),
// Blockchain.com (hashrate dist), Ethernodes, Beaconcha.in, ultrasound.money

interface CacheEntry { data: any; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 60_000; // 60s

async function cachedFetch(key: string, url: string, headers?: Record<string, string>): Promise<any> {
  if (cache[key] && Date.now() - cache[key].ts < TTL) return cache[key].data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'ChainIntel Terminal', ...headers } });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch { return cache[key]?.data || null; }
}

export async function GET() {
  const etherscanKey = process.env.ETHERSCAN_API_KEY || '';

  const [mempoolPools, mempoolStats, ethGas, ethSupply, beaconValidators, blockchairBtc, blockchairEth, blockchairSol] = await Promise.allSettled([
    // 1. Mempool Mining Pools
    cachedFetch('mp-pools', 'https://mempool.space/api/v1/mining/pools/1w'),
    // 2. Mempool Mempool Stats
    cachedFetch('mp-stats', 'https://mempool.space/api/mempool'),
    // 3. Etherscan Gas Oracle
    cachedFetch('eth-gas', `https://api.etherscan.io/api?module=gastracker&action=gasoracle${etherscanKey ? `&apikey=${etherscanKey}` : ''}`),
    // 4. Etherscan ETH Supply
    cachedFetch('eth-supply', `https://api.etherscan.io/api?module=stats&action=ethsupply2${etherscanKey ? `&apikey=${etherscanKey}` : ''}`),
    // 5. Beaconcha.in Validators (public endpoint)
    cachedFetch('beacon-val', 'https://beaconcha.in/api/v1/epoch/latest', { accept: 'application/json' }),
    // 6-8. Blockchair Multi-Chain Stats
    cachedFetch('bc-btc', 'https://api.blockchair.com/bitcoin/stats'),
    cachedFetch('bc-eth', 'https://api.blockchair.com/ethereum/stats'),
    cachedFetch('bc-sol', 'https://api.blockchair.com/solana/stats'),
  ]);

  const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

  // Parse mining pools
  const poolsData = val(mempoolPools);
  const parsedPools = poolsData?.pools ? poolsData.pools.slice(0, 10).map((p: any) => ({
    name: p.name,
    blockCount: p.blockCount,
    share: ((p.blockCount / (poolsData.blockCount || 1)) * 100).toFixed(1),
  })) : [];

  // Parse mempool stats
  const mpData = val(mempoolStats);
  const parsedMempool = mpData ? {
    count: mpData.count || 0,
    vsize: mpData.vsize || 0,
    totalFee: mpData.total_fee || 0,
    feeHistogram: mpData.fee_histogram?.slice(0, 5) || [],
  } : null;

  // Parse Etherscan gas
  const gasData = val(ethGas);
  const parsedGas = gasData?.result ? {
    low: parseFloat(gasData.result.SafeGasPrice || '0'),
    medium: parseFloat(gasData.result.ProposeGasPrice || '0'),
    fast: parseFloat(gasData.result.FastGasPrice || '0'),
    baseFee: parseFloat(gasData.result.suggestBaseFee || '0'),
  } : null;

  // Parse ETH supply
  const supplyData = val(ethSupply);
  const parsedSupply = supplyData?.result ? {
    ethSupply: parseFloat(supplyData.result.EthSupply || '0') / 1e18,
    eth2Staking: parseFloat(supplyData.result.Eth2Staking || '0') / 1e18,
    burntFees: parseFloat(supplyData.result.BurntFees || '0') / 1e18,
  } : null;

  // Parse Beaconcha.in validators
  const beaconData = val(beaconValidators);
  const parsedValidators = beaconData?.data ? {
    epoch: beaconData.data.epoch,
    validatorsCount: beaconData.data.validatorscount,
    activeValidators: beaconData.data.activevalidators || beaconData.data.validatorscount,
    participation: beaconData.data.globalparticipationrate,
    finalized: beaconData.data.finalized,
  } : null;

  // Parse Blockchair multi-chain
  const parseBlockchair = (d: any) => {
    const s = d?.data;
    if (!s) return null;
    return {
      blocks: s.blocks,
      transactions: s.transactions,
      marketCap: s.market_cap_usd,
      difficulty: s.difficulty,
      hashrate: s.hashrate_24h,
      mempool: s.mempool_transactions,
      bestBlockHeight: s.best_block_height,
    };
  };

  return NextResponse.json({
    miningPools: parsedPools,
    mempool: parsedMempool,
    ethGas: parsedGas,
    ethSupply: parsedSupply,
    validators: parsedValidators,
    blockchair: {
      bitcoin: parseBlockchair(val(blockchairBtc)),
      ethereum: parseBlockchair(val(blockchairEth)),
      solana: parseBlockchair(val(blockchairSol)),
    },
    sources: ['mempool-mining-pools', 'mempool-mempool', 'etherscan-gas', 'etherscan-supply', 'beaconcha-validators', 'blockchair-btc', 'blockchair-eth', 'blockchair-sol'],
    sourceCount: 8,
    timestamp: Date.now(),
  });
}
