import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';
import staticMarketData from '@/data/market-static.json';

type MarketDataSource = 'coinpaprika' | 'coingecko-fallback' | 'static-fallback';

interface MarketCoin {
  id: string;
  name: string;
  symbol: string;
  slug: string;
  rank: number;
  price: number;
  market_cap: number;
  volume_24h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  image: string;
}

interface MarketGlobal {
  total_market_cap: number;
  total_volume_24h: number;
  btc_dominance: number;
  eth_dominance: number;
  active_cryptocurrencies: number;
  total_market_cap_yesterday_percentage_change: number;
}

interface MarketDataPayload {
  coins: MarketCoin[];
  global: MarketGlobal;
  source: MarketDataSource;
  cachedAt: number;
  stale: boolean;
}

const COINPAPRIKA_BASE = 'https://api.coinpaprika.com/v1';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_TTL = 300_000;
const STABLECOIN_SYMBOLS = new Set([
  'USDT', 'USDC', 'DAI', 'USDS', 'USDE', 'TUSD', 'FDUSD', 'BUSD', 'PYUSD', 'USDD', 'FRAX', 'GUSD',
]);

let cache: { data: MarketDataPayload; ts: number } | null = null;

function slugFromId(id: string): string {
  const parts = id.split('-');
  return parts.length > 1 ? parts.slice(1).join('-') : id;
}

function logoUrl(id: string): string {
  return `https://static.coinpaprika.com/coin/${id}/logo.png`;
}

function createStaticPayload(): MarketDataPayload {
  return {
    coins: staticMarketData.coins as MarketCoin[],
    global: staticMarketData.global as MarketGlobal,
    source: 'static-fallback',
    cachedAt: Date.now(),
    stale: false,
  };
}

function applyFilters(payload: MarketDataPayload, limit: number, symbols: Set<string>, excludeStablecoins: boolean): MarketDataPayload {
  const filteredCoins = payload.coins
    .filter((coin) => !excludeStablecoins || !STABLECOIN_SYMBOLS.has(coin.symbol))
    .filter((coin) => symbols.size === 0 || symbols.has(coin.symbol))
    .slice(0, limit);

  return {
    ...payload,
    coins: filteredCoins,
  };
}

function parseSymbols(raw: string | null): Set<string> {
  if (!raw) return new Set();

  return new Set(
    raw
      .split(',')
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean)
  );
}

function mapCoinPaprikaCoin(item: any): MarketCoin {
  const usd = item?.quotes?.USD || {};

  return {
    id: item.id,
    name: item.name || '',
    symbol: (item.symbol || '').toUpperCase(),
    slug: slugFromId(item.id || ''),
    rank: item.rank || 0,
    price: usd.price || 0,
    market_cap: usd.market_cap || 0,
    volume_24h: usd.volume_24h || 0,
    percent_change_24h: usd.percent_change_24h || 0,
    percent_change_7d: usd.percent_change_7d || 0,
    image: logoUrl(item.id || ''),
  };
}

async function fetchCoinPaprikaMarketData(): Promise<MarketDataPayload> {
  const [tickersRes, globalRes] = await Promise.all([
    fetchWithRetry(`${COINPAPRIKA_BASE}/tickers?quotes=USD`, { next: { revalidate: 300 } } as any, 1, 15000),
    fetchWithRetry(`${COINPAPRIKA_BASE}/global`, { next: { revalidate: 300 } } as any, 1, 10000),
  ]);

  const tickersJson = await tickersRes.json();
  const globalJson = await globalRes.json();
  const coins = (Array.isArray(tickersJson) ? tickersJson : [])
    .filter((item) => typeof item?.rank === 'number' && item.rank > 0)
    .sort((a, b) => a.rank - b.rank)
    .map(mapCoinPaprikaCoin);

  if (coins.length === 0) {
    throw new Error('CoinPaprika returned no market data');
  }

  const eth = coins.find((coin) => coin.symbol === 'ETH');
  const totalMarketCap = globalJson?.market_cap_usd || 0;

  return {
    coins,
    global: {
      total_market_cap: totalMarketCap,
      total_volume_24h: globalJson?.volume_24h_usd || 0,
      btc_dominance: globalJson?.bitcoin_dominance_percentage || 0,
      eth_dominance: totalMarketCap > 0 && eth ? (eth.market_cap / totalMarketCap) * 100 : 0,
      active_cryptocurrencies: globalJson?.cryptocurrencies_number || 0,
      total_market_cap_yesterday_percentage_change: globalJson?.market_cap_change_24h || 0,
    },
    source: 'coinpaprika',
    cachedAt: Date.now(),
    stale: false,
  };
}

function coinGeckoHeaders(): HeadersInit {
  const demoApiKey = process.env.COINGECKO_DEMO_API_KEY;
  return demoApiKey
    ? { Accept: 'application/json', 'x-cg-demo-api-key': demoApiKey }
    : { Accept: 'application/json' };
}

async function fetchCoinGeckoFallback(): Promise<MarketDataPayload> {
  const [coinsRes, globalRes] = await Promise.all([
    fetchWithRetry(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=7d`,
      { headers: coinGeckoHeaders(), next: { revalidate: 300 } } as any,
      1,
      12000
    ),
    fetchWithRetry(
      `${COINGECKO_BASE}/global`,
      { headers: coinGeckoHeaders(), next: { revalidate: 300 } } as any,
      1,
      8000
    ),
  ]);

  const coinsJson = await coinsRes.json();
  const globalJson = await globalRes.json();
  const globalData = globalJson?.data || {};

  const coins = (Array.isArray(coinsJson) ? coinsJson : []).map((item: any, index: number) => ({
    id: item.id,
    name: item.name || '',
    symbol: (item.symbol || '').toUpperCase(),
    slug: item.id || '',
    rank: item.market_cap_rank || index + 1,
    price: item.current_price || 0,
    market_cap: item.market_cap || 0,
    volume_24h: item.total_volume || 0,
    percent_change_24h: item.price_change_percentage_24h || 0,
    percent_change_7d: item.price_change_percentage_7d_in_currency || 0,
    image: item.image || '',
  }));

  if (coins.length === 0) {
    throw new Error('CoinGecko returned no fallback data');
  }

  return {
    coins,
    global: {
      total_market_cap: globalData?.total_market_cap?.usd || 0,
      total_volume_24h: globalData?.total_volume?.usd || 0,
      btc_dominance: globalData?.market_cap_percentage?.btc || 0,
      eth_dominance: globalData?.market_cap_percentage?.eth || 0,
      active_cryptocurrencies: globalData?.active_cryptocurrencies || 0,
      total_market_cap_yesterday_percentage_change: globalData?.market_cap_change_percentage_24h_usd || 0,
    },
    source: 'coingecko-fallback',
    cachedAt: Date.now(),
    stale: false,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limitParam = Number.parseInt(searchParams.get('limit') || '100', 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 250) : 100;
  const symbols = parseSymbols(searchParams.get('symbols'));
  const excludeStablecoins = searchParams.get('exclude_stablecoins') === '1';

  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(applyFilters(cache.data, limit, symbols, excludeStablecoins));
  }

  try {
    const paprikaData = await fetchCoinPaprikaMarketData();
    cache = { data: paprikaData, ts: Date.now() };
    return NextResponse.json(applyFilters(paprikaData, limit, symbols, excludeStablecoins));
  } catch (paprikaError) {
    console.error('[market-data] CoinPaprika failed:', paprikaError);
  }

  try {
    const geckoData = await fetchCoinGeckoFallback();
    cache = { data: geckoData, ts: Date.now() };
    return NextResponse.json(applyFilters(geckoData, limit, symbols, excludeStablecoins));
  } catch (geckoError) {
    console.error('[market-data] CoinGecko fallback failed:', geckoError);
  }

  if (cache) {
    return NextResponse.json(applyFilters({ ...cache.data, stale: true }, limit, symbols, excludeStablecoins));
  }

  const staticPayload = createStaticPayload();
  return NextResponse.json(applyFilters(staticPayload, limit, symbols, excludeStablecoins), { status: 503 });
}
