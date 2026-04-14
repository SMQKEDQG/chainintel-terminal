import { NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';

// Free APIs: mempool.space (no key), blockchain.info (no key)
export async function GET() {
  try {
    const [hashrate, difficulty, mempoolFees, blockTip, bcInfo] = await Promise.allSettled([
      fetch('https://mempool.space/api/v1/mining/hashrate/1w', { next: { revalidate: 300 } }),
      fetch('https://mempool.space/api/v1/mining/difficulty-adjustments/1m', { next: { revalidate: 300 } }),
      fetch('https://mempool.space/api/v1/fees/recommended', { next: { revalidate: 60 } }),
      fetch('https://mempool.space/api/blocks/tip/height', { next: { revalidate: 60 } }),
      fetch('https://blockchain.info/q/totalbc', { next: { revalidate: 300 } }),
    ]);

    // Parse hashrate — mempool returns { hashrates: [{ timestamp, avgHashrate }], difficulty: [...] }
    let hashrateEH = 0;
    let difficultyVal = 0;
    if (hashrate.status === 'fulfilled' && hashrate.value.ok) {
      const data = await hashrate.value.json();
      if (data.currentHashrate) {
        hashrateEH = data.currentHashrate / 1e18; // convert H/s to EH/s
      } else if (data.hashrates?.length) {
        const latest = data.hashrates[data.hashrates.length - 1];
        hashrateEH = (latest.avgHashrate || 0) / 1e18;
      }
      if (data.currentDifficulty) {
        difficultyVal = data.currentDifficulty / 1e12; // to trillions
      } else if (data.difficulty?.length) {
        difficultyVal = (data.difficulty[data.difficulty.length - 1]?.difficulty || 0) / 1e12;
      }
    }

    // Parse difficulty adjustments
    let nextAdjustment = '';
    if (difficulty.status === 'fulfilled' && difficulty.value.ok) {
      const adjData = await difficulty.value.json();
      if (adjData?.length > 0) {
        const latest = adjData[0];
        const change = latest.difficultyChange;
        nextAdjustment = `${change >= 0 ? '+' : ''}${change?.toFixed(2) || '0'}%`;
      }
    }

    // Parse fees
    let feesFast = 0, feesNormal = 0, feesEcon = 0;
    if (mempoolFees.status === 'fulfilled' && mempoolFees.value.ok) {
      const fees = await mempoolFees.value.json();
      feesFast = fees.fastestFee || 0;
      feesNormal = fees.halfHourFee || 0;
      feesEcon = fees.economyFee || 0;
    }

    // Block height
    let blockHeight = 0;
    if (blockTip.status === 'fulfilled' && blockTip.value.ok) {
      blockHeight = parseInt(await blockTip.value.text(), 10) || 0;
    }

    // Total BTC in circulation (in satoshis from blockchain.info)
    let totalBtc = 0;
    if (bcInfo.status === 'fulfilled' && bcInfo.value.ok) {
      totalBtc = parseInt(await bcInfo.value.text(), 10) / 1e8 || 0;
    }

    return NextResponse.json({
      hashrate: Math.round(hashrateEH * 10) / 10,
      difficulty: Math.round(difficultyVal * 100) / 100,
      nextDiffAdj: nextAdjustment,
      fees: { fast: feesFast, normal: feesNormal, economy: feesEcon },
      blockHeight,
      totalBtc: Math.round(totalBtc),
      source: 'live',
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('On-chain API error:', err);
    return NextResponse.json({ error: 'Failed to fetch on-chain data' }, { status: 500 });
  }
}
