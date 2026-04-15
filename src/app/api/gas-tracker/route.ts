import { NextResponse } from 'next/server';

let cache: { data: any; ts: number } | null = null;
const TTL = 60_000;

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }
  try {
    const etherscanKey = process.env.ETHERSCAN_API_KEY || '';
    const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle${etherscanKey ? `&apikey=${etherscanKey}` : ''}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'ChainIntel Terminal' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const result = json?.result;
    const data = {
      lowGwei: parseFloat(result?.SafeGasPrice || '0'),
      standardGwei: parseFloat(result?.ProposeGasPrice || '0'),
      fastGwei: parseFloat(result?.FastGasPrice || '0'),
      baseFee: parseFloat(result?.suggestBaseFee || '0'),
      source: 'etherscan',
      timestamp: Date.now(),
    };
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ standardGwei: null, source: 'error' });
  }
}
