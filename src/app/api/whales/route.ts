import { NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';

// Fetch large recent BTC transactions from mempool.space
// This gives us real, verifiable whale-scale transactions
export async function GET() {
  try {
    // Get latest 10 blocks and find large transactions
    const blocksRes = await fetch('https://mempool.space/api/v1/blocks', { next: { revalidate: 120 } });

    if (!blocksRes.ok) {
      return NextResponse.json({ alerts: [], source: 'fallback' });
    }

    const blocks = await blocksRes.json();
    const recentBlocks = blocks.slice(0, 6); // Last ~6 blocks = ~1 hour

    // For each block, get the top transactions by value
    const whaleAlerts: any[] = [];

    for (const block of recentBlocks.slice(0, 3)) {
      try {
        const txRes = await fetch(`https://mempool.space/api/block/${block.id}/txs/0`, { next: { revalidate: 120 } });
        if (!txRes.ok) continue;
        const txs = await txRes.json();

        // Find transactions with total output > $1M equivalent
        // BTC price is approximate — we use a rough estimate
        for (const tx of txs.slice(0, 25)) {
          const totalOut = tx.vout?.reduce((s: number, v: any) => s + (v.value || 0), 0) || 0;
          const btcAmount = totalOut / 1e8;

          if (btcAmount >= 10) { // 10+ BTC transactions (likely >$700K)
            const inputCount = tx.vin?.length || 0;
            const outputCount = tx.vout?.length || 0;

            // Classify transaction type
            let type: 'buy' | 'sell' | 'transfer' = 'transfer';
            let direction = 'XFER';
            let route = '';

            if (outputCount === 1 || outputCount === 2) {
              // Simple transfer — likely consolidation or cold storage
              type = 'transfer';
              direction = 'XFER';
              route = inputCount > 3 ? 'Consolidation → Cold storage' : 'Wallet → Wallet';
            } else if (outputCount > 10) {
              // Many outputs — likely exchange distribution or payout
              type = 'sell';
              direction = 'DIST';
              route = 'Possible exchange distribution';
            } else {
              type = 'buy';
              direction = 'BUY';
              route = 'Acquisition → Custody';
            }

            const minsAgo = Math.round((Date.now() / 1000 - block.timestamp) / 60);

            whaleAlerts.push({
              type,
              dir: direction,
              amt: btcAmount >= 100 ? `${btcAmount.toFixed(0)} BTC` : `${btcAmount.toFixed(1)} BTC`,
              btcAmount,
              txid: tx.txid?.substring(0, 12) + '...',
              route,
              minsAgo: Math.max(1, minsAgo),
              blockHeight: block.height,
              confirmed: true,
            });
          }
        }
      } catch {
        // Skip this block on error
      }
    }

    // Sort by BTC amount descending, take top 10
    whaleAlerts.sort((a, b) => b.btcAmount - a.btcAmount);
    const top10 = whaleAlerts.slice(0, 10);

    // Calculate summary stats
    const totalVolume = top10.reduce((s, a) => s + a.btcAmount, 0);
    const buyCount = top10.filter(a => a.type === 'buy').length;
    const sellCount = top10.filter(a => a.type === 'sell').length;
    const xferCount = top10.filter(a => a.type === 'transfer').length;

    return NextResponse.json({
      alerts: top10,
      summary: {
        totalVolume: Math.round(totalVolume * 10) / 10,
        count: top10.length,
        buyCount,
        sellCount,
        xferCount,
        netDirection: buyCount > sellCount ? 'accumulation' : sellCount > buyCount ? 'distribution' : 'neutral',
      },
      source: top10.length > 0 ? 'live' : 'fallback',
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Whale API error:', err);
    return NextResponse.json({ alerts: [], summary: {}, source: 'fallback' }, { status: 200 });
  }
}
