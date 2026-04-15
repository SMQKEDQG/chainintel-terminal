import { NextResponse } from 'next/server';

let cache: { data: any; ts: number } | null = null;
const TTL = 300_000; // 5 min

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }
  try {
    const etherscanKey = process.env.ETHERSCAN_API_KEY || '';
    // Use Etherscan ETH supply endpoint to derive validator count
    const res = await fetch(
      `https://api.etherscan.io/api?module=stats&action=ethsupply2${etherscanKey ? `&apikey=${etherscanKey}` : ''}`,
      { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'ChainIntel Terminal' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const result = json?.result;
    const ethStaking = parseFloat(result?.EthStaking || result?.Eth2Staking || '0');
    const ethStakingEther = ethStaking / 1e18;
    const validatorCount = ethStakingEther > 0 ? Math.floor(ethStakingEther / 32) : null;

    const data = {
      activeValidators: validatorCount,
      totalStaked: ethStakingEther > 0 ? ethStakingEther : null,
      ethSupply: result?.EthSupply ? parseFloat(result.EthSupply) / 1e18 : null,
      burntFees: result?.BurntFees ? parseFloat(result.BurntFees) / 1e18 : null,
      source: 'etherscan',
      timestamp: Date.now(),
    };
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ activeValidators: null, source: 'error' });
  }
}
