import { NextResponse } from 'next/server';

// Source Status API — pings a representative subset of all 80 sources
// to show live connectivity status on the Source Map

interface SourceCheck {
  id: string;
  name: string;
  status: 'up' | 'down' | 'slow';
  latencyMs: number;
}

let statusCache: { checks: SourceCheck[]; ts: number } | null = null;
const TTL = 120_000; // 2 min

async function pingSource(id: string, name: string, url: string, headers?: Record<string, string>): Promise<SourceCheck> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      method: 'GET',
      headers: { 'User-Agent': 'ChainIntel-Terminal/5.18', ...headers },
    });
    clearTimeout(t);
    const latency = Date.now() - start;
    // Accept 200-299 and also 403/401 with valid JSON body (rate-limited but reachable)
    const reachable = res.ok || res.status === 403 || res.status === 401;
    return { id, name, status: reachable ? (latency > 4000 ? 'slow' : 'up') : 'down', latencyMs: latency };
  } catch {
    return { id, name, status: 'down', latencyMs: Date.now() - start };
  }
}

// Representative sources from each category (one per category minimum)
const SOURCES_TO_CHECK: { id: string; name: string; url: string; headers?: Record<string, string> }[] = [
  { id: 'cmc', name: 'CoinMarketCap', url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=1&convert=USD', headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY || '' } },
  { id: 'coingecko', name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/ping' },
  { id: 'binance', name: 'Binance', url: 'https://data-api.binance.vision/api/v3/ping' },
  { id: 'binance-futures', name: 'Binance Futures', url: 'https://fapi.binance.com/fapi/v1/time' },
  { id: 'kraken', name: 'Kraken', url: 'https://api.kraken.com/0/public/SystemStatus' },
  { id: 'mempool', name: 'Mempool.space', url: 'https://mempool.space/api/v1/fees/recommended' },
  { id: 'blockchain', name: 'Blockchain.com', url: 'https://blockchain.info/q/getblockcount' },
  { id: 'defillama', name: 'DefiLlama', url: 'https://api.llama.fi/v2/chains' },
  { id: 'fng', name: 'Fear & Greed', url: 'https://api.alternative.me/fng/?limit=1' },
  { id: 'reddit', name: 'Reddit', url: 'https://www.reddit.com/r/cryptocurrency/hot.json?limit=1' },
  { id: 'deribit', name: 'Deribit', url: 'https://www.deribit.com/api/v2/public/get_index_price?index_name=btc_usd' },
  { id: 'blockchair', name: 'Blockchair', url: 'https://api.blockchair.com/bitcoin/stats' },
  { id: 'etherscan', name: 'Etherscan', url: 'https://api.etherscan.io/api?module=proxy&action=eth_blockNumber' },
  { id: 'fed-register', name: 'Federal Register', url: 'https://www.federalregister.gov/api/v1/documents?per_page=1' },
  { id: 'beaconchain', name: 'Beacon Chain (Etherscan)', url: 'https://api.etherscan.io/api?module=stats&action=ethsupply2' },
];

export async function GET() {
  if (statusCache && Date.now() - statusCache.ts < TTL) {
    const up = statusCache.checks.filter(s => s.status === 'up').length;
    return NextResponse.json({ checks: statusCache.checks, summary: { up, down: statusCache.checks.length - up, total: statusCache.checks.length }, cached: true });
  }

  const results = await Promise.allSettled(
    SOURCES_TO_CHECK.map(s => pingSource(s.id, s.name, s.url, s.headers))
  );

  const checks = results.map(r => r.status === 'fulfilled' ? r.value : { id: 'unknown', name: 'Unknown', status: 'down' as const, latencyMs: 0 });
  statusCache = { checks, ts: Date.now() };

  const up = checks.filter(s => s.status === 'up').length;
  const slow = checks.filter(s => s.status === 'slow').length;

  return NextResponse.json({
    checks,
    summary: { up, slow, down: checks.length - up - slow, total: checks.length },
    allSourcesRegistered: 80,
    timestamp: Date.now(),
  });
}
