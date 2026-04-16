import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';

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

let cache: { data: MarketDataPayload; ts: number } | null = null;

const STATIC_COINS: MarketCoin[] = [
  { id: 'btc-bitcoin', name: 'Bitcoin', symbol: 'BTC', slug: 'bitcoin', rank: 1, price: 73000, market_cap: 1.44e12, volume_24h: 38.4e9, percent_change_24h: 0.82, percent_change_7d: -3.14, image: 'https://static.coinpaprika.com/coin/btc-bitcoin/logo.png' },
  { id: 'eth-ethereum', name: 'Ethereum', symbol: 'ETH', slug: 'ethereum', rank: 2, price: 2210, market_cap: 2.7e11, volume_24h: 14.8e9, percent_change_24h: -1.24, percent_change_7d: -8.32, image: 'https://static.coinpaprika.com/coin/eth-ethereum/logo.png' },
  { id: 'xrp-xrp', name: 'XRP', symbol: 'XRP', slug: 'xrp', rank: 3, price: 1.32, market_cap: 1.21e11, volume_24h: 7.8e9, percent_change_24h: 1.87, percent_change_7d: -4.2, image: 'https://static.coinpaprika.com/coin/xrp-xrp/logo.png' },
  { id: 'sol-solana', name: 'Solana', symbol: 'SOL', slug: 'solana', rank: 4, price: 81, market_cap: 6.72e10, volume_24h: 4.2e9, percent_change_24h: -0.41, percent_change_7d: -5.8, image: 'https://static.coinpaprika.com/coin/sol-solana/logo.png' },
  { id: 'bnb-binance-coin', name: 'BNB', symbol: 'BNB', slug: 'binance-coin', rank: 5, price: 560, market_cap: 8.2e10, volume_24h: 1.8e9, percent_change_24h: 0.34, percent_change_7d: -1.2, image: 'https://static.coinpaprika.com/coin/bnb-binance-coin/logo.png' },
  { id: 'doge-dogecoin', name: 'Dogecoin', symbol: 'DOGE', slug: 'dogecoin', rank: 6, price: 0.082, market_cap: 1.2e10, volume_24h: 0.8e9, percent_change_24h: -0.9, percent_change_7d: -6.1, image: 'https://static.coinpaprika.com/coin/doge-dogecoin/logo.png' },
  { id: 'ada-cardano', name: 'Cardano', symbol: 'ADA', slug: 'cardano', rank: 7, price: 0.41, market_cap: 1.5e10, volume_24h: 0.5e9, percent_change_24h: -2.1, percent_change_7d: -5.4, image: 'https://static.coinpaprika.com/coin/ada-cardano/logo.png' },
  { id: 'hbar-hedera', name: 'Hedera', symbol: 'HBAR', slug: 'hedera', rank: 8, price: 0.17, market_cap: 6.7e9, volume_24h: 0.3e9, percent_change_24h: 1.44, percent_change_7d: 2.1, image: 'https://static.coinpaprika.com/coin/hbar-hedera/logo.png' },
  { id: 'link-chainlink', name: 'Chainlink', symbol: 'LINK', slug: 'chainlink', rank: 9, price: 12.5, market_cap: 7.8e9, volume_24h: 0.6e9, percent_change_24h: 0.92, percent_change_7d: -2.1, image: 'https://static.coinpaprika.com/coin/link-chainlink/logo.png' },
  { id: 'avax-avalanche', name: 'Avalanche', symbol: 'AVAX', slug: 'avalanche', rank: 10, price: 22, market_cap: 9e9, volume_24h: 0.4e9, percent_change_24h: -3.8, percent_change_7d: -7.2, image: 'https://static.coinpaprika.com/coin/avax-avalanche/logo.png' },
  { id: 'dot-polkadot', name: 'Polkadot', symbol: 'DOT', slug: 'polkadot', rank: 11, price: 4.2, market_cap: 5.9e9, volume_24h: 0.3e9, percent_change_24h: -1.5, percent_change_7d: -4.8, image: 'https://static.coinpaprika.com/coin/dot-polkadot/logo.png' },
  { id: 'qnt-quant', name: 'Quant', symbol: 'QNT', slug: 'quant', rank: 12, price: 88, market_cap: 1.1e9, volume_24h: 44e6, percent_change_24h: 2.31, percent_change_7d: 1.8, image: 'https://static.coinpaprika.com/coin/qnt-quant/logo.png' },
  { id: 'xlm-stellar', name: 'Stellar', symbol: 'XLM', slug: 'stellar', rank: 13, price: 0.27, market_cap: 8.3e9, volume_24h: 0.5e9, percent_change_24h: -0.62, percent_change_7d: -2.8, image: 'https://static.coinpaprika.com/coin/xlm-stellar/logo.png' },
  { id: 'algo-algorand', name: 'Algorand', symbol: 'ALGO', slug: 'algorand', rank: 14, price: 0.18, market_cap: 1.3e9, volume_24h: 60e6, percent_change_24h: -0.8, percent_change_7d: -3.2, image: 'https://static.coinpaprika.com/coin/algo-algorand/logo.png' },
  { id: 'miota-iota', name: 'IOTA', symbol: 'IOTA', slug: 'iota', rank: 15, price: 0.21, market_cap: 0.58e9, volume_24h: 24e6, percent_change_24h: 1.14, percent_change_7d: 0.8, image: 'https://static.coinpaprika.com/coin/miota-iota/logo.png' },
  { id: 'xdc-xdc-network', name: 'XDC Network', symbol: 'XDC', slug: 'xdc-network', rank: 16, price: 0.038, market_cap: 1.1e9, volume_24h: 18e6, percent_change_24h: 0.54, percent_change_7d: 1.2, image: 'https://static.coinpaprika.com/coin/xdc-xdc-network/logo.png' },
];

const STATIC_GLOBAL: MarketGlobal = {
  total_market_cap: 2.65e12,
  total_volume_24h: 98.4e9,
  btc_dominance: 63.0,
  eth_dominance: 10.2,
  active_cryptocurrencies: 10200,
  total_market_cap_yesterday_percentage_change: 0.64,
};

function slugFromId(id: string): string {
  const parts = id.split('-');
  return parts.length > 1 ? parts.slice(1).join('-') : id;
}

function logoUrl(id: string): string {
  return `https://static.coinpaprika.com/coin/${id}/logo.png`;
}

function createStaticPayload(): MarketDataPayload {
  return {
    coins: STATIC_COINS,
    global: STATIC_GLOBAL,
    source: 'static-fallback',
    cachedAt: Date.now(),
    stale: false,
  };
}

function applyFilters(payload: MarketDataPayload, limit: number, symbols: Set<string>): MarketDataPayload {
  const filteredCoins = payload.coins
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

  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(applyFilters(cache.data, limit, symbols));
  }

  try {
    const paprikaData = await fetchCoinPaprikaMarketData();
    cache = { data: paprikaData, ts: Date.now() };
    return NextResponse.json(applyFilters(paprikaData, limit, symbols));
  } catch (paprikaError) {
    console.error('[market-data] CoinPaprika failed:', paprikaError);
  }

  try {
    const geckoData = await fetchCoinGeckoFallback();
    cache = { data: geckoData, ts: Date.now() };
    return NextResponse.json(applyFilters(geckoData, limit, symbols));
  } catch (geckoError) {
    console.error('[market-data] CoinGecko fallback failed:', geckoError);
  }

  if (cache) {
    return NextResponse.json(applyFilters({ ...cache.data, stale: true }, limit, symbols));
  }

  const staticPayload = createStaticPayload();
  return NextResponse.json(applyFilters(staticPayload, limit, symbols), { status: 503 });
}
