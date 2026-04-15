import { NextResponse } from 'next/server';

let cache: { data: any; ts: number } | null = null;
const TTL = 120_000; // 2 min

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }
  try {
    // Blockchair BTC stats
    const res = await fetch('https://api.blockchair.com/bitcoin/stats', {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'ChainIntel Terminal' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const s = json?.data;
    if (!s) throw new Error('No data');
    const data = {
      hashrate: s.hashrate_24h ?? null,
      difficulty: s.difficulty ?? null,
      blockHeight: s.best_block_height ?? null,
      blocks24h: s.blocks_24h ?? null,
      transactions24h: s.transactions_24h ?? null,
      avgFee: s.average_transaction_fee_usd_24h ?? null,
      mempoolTxs: s.mempool_transactions ?? null,
      mempoolSize: s.mempool_size ?? null,
      source: 'blockchair',
      timestamp: Date.now(),
    };
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch {
    // Fallback to mempool.space
    try {
      const res = await fetch('https://mempool.space/api/v1/mining/hashrate/1w', {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = await res.json();
        const latest = json?.currentHashrate;
        const data = {
          hashrate: latest ?? null,
          difficulty: json?.currentDifficulty ?? null,
          blockHeight: null,
          avgFee: null,
          source: 'mempool',
          timestamp: Date.now(),
        };
        cache = { data, ts: Date.now() };
        return NextResponse.json(data);
      }
    } catch {}
    return NextResponse.json({ hashrate: null, source: 'error' });
  }
}
