import { NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';

interface CacheEntry {
  data: unknown;
  ts: number;
}

interface AltcoinEtfFund {
  ticker: string;
  issuer: string;
  fundName: string;
  expRatio: string;
  launchDate: string;
  staking?: string;
  todayFlow: number | null;
  aum: number | null;
  sinceInception: number | null;
  volume24h: number | null;
}

interface AltcoinEtfAsset {
  asset: string;
  assetPrice: number;
  priceChange24h: number;
  totalAum: number | null;
  cumulativeInflows: number | null;
  todayNetFlow: number | null;
  weekNetFlow: number | null;
  inflowStreak: number | null;
  fundCount: number;
  funds: AltcoinEtfFund[];
  live: boolean;
  sourceLabel: string;
  feedNote?: string;
  asOf?: string | null;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 300_000; // 5 min

const COINPAPRIKA_BASE = 'https://api.coinpaprika.com/v1';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const SOLANA_FLOOR_URL = 'https://solanafloor.com/etf-tracker';

const XRP_ETF_FUNDS: AltcoinEtfFund[] = [
  { ticker: 'CANARY', issuer: 'Canary Capital', fundName: 'Canary XRP Trust', expRatio: '0.60%', launchDate: '2025-11-18', todayFlow: null, aum: null, sinceInception: null, volume24h: null },
  { ticker: 'BXRP', issuer: 'Bitwise', fundName: 'Bitwise XRP ETF', expRatio: '0.35%', launchDate: '2025-11-18', todayFlow: null, aum: null, sinceInception: null, volume24h: null },
  { ticker: 'FTXRP', issuer: 'Franklin Templeton', fundName: 'Franklin XRP Fund', expRatio: '0.19%', launchDate: '2025-11-18', todayFlow: null, aum: null, sinceInception: null, volume24h: null },
  { ticker: 'GXRP', issuer: 'Grayscale', fundName: 'Grayscale XRP Trust', expRatio: '1.50%', launchDate: '2025-11-18', todayFlow: null, aum: null, sinceInception: null, volume24h: null },
  { ticker: 'XXRP', issuer: '21Shares', fundName: '21Shares Core XRP Trust', expRatio: '0.25%', launchDate: '2025-12-03', todayFlow: null, aum: null, sinceInception: null, volume24h: null },
  { ticker: 'HSOL', issuer: 'Hashdex', fundName: 'Hashdex Nasdaq XRP', expRatio: '0.50%', launchDate: '2025-12-15', todayFlow: null, aum: null, sinceInception: null, volume24h: null },
  { ticker: 'VXRP', issuer: 'Volatility Shares', fundName: 'Volatility Shares XRP', expRatio: '0.95%', launchDate: '2025-12-15', todayFlow: null, aum: null, sinceInception: null, volume24h: null },
];

const PENDING_ETFS = [
  { asset: 'DOGE', issuer: 'Bitwise', status: 'PENDING', filed: 'Feb 2026', deadline: 'Aug 2026' },
  { asset: 'LTC', issuer: 'Grayscale', status: 'PENDING', filed: 'Dec 2025', deadline: 'Jun 2026' },
  { asset: 'ADA', issuer: 'Grayscale', status: 'FILED', filed: 'Mar 2026', deadline: 'Sep 2026' },
  { asset: 'AVAX', issuer: '21Shares', status: 'FILED', filed: 'Mar 2026', deadline: 'Sep 2026' },
  { asset: 'DOT', issuer: 'Canary Capital', status: 'FILED', filed: 'Apr 2026', deadline: 'Oct 2026' },
];

const MILESTONES = [
  { date: '2025-11-18', event: 'First wave of spot XRP ETF products launched in the US.' },
  { date: '2026-01-22', event: 'Spot SOL ETF lineup expanded beyond the initial issuers.' },
  { date: '2026-03-31', event: 'US BTC and ETH ETF flows continued to normalize after Q1 volatility.' },
  { date: '2026-04-15', event: 'Solana ETF tracker showed live positive daily net flow across all issuers.' },
];

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '--') return null;
  const negative = cleaned.startsWith('-');
  const normalized = cleaned.replace(/^[+-]/, '');
  const suffix = normalized.slice(-1).toUpperCase();
  const amount = Number.parseFloat(normalized.replace(/[KMB]/i, ''));
  if (!Number.isFinite(amount)) return null;

  let value = amount;
  if (suffix === 'K') value *= 1e6 / 1e3;
  if (suffix === 'M') value *= 1e6;
  if (suffix === 'B') value *= 1e9;
  return negative ? -value : value;
}

function stripHtmlToLines(html: string): string[] {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function computeStreak(flows: number[]): number | null {
  if (flows.length === 0) return null;
  const latestDirection = Math.sign(flows[0]);
  if (latestDirection === 0) return 0;

  let streak = 0;
  for (const flow of flows) {
    if (Math.sign(flow) === latestDirection) streak++;
    else break;
  }
  return streak;
}

function parseSolanaFloor(html: string): AltcoinEtfAsset {
  const summaryLines = stripHtmlToLines(html.slice(html.indexOf('Solana ETFs'), html.indexOf('Historic ETF Flows')));
  const asOfIndex = summaryLines.indexOf('As of Apr 15, 2026') >= 0
    ? summaryLines.indexOf('As of Apr 15, 2026')
    : summaryLines.findIndex((line) => line.startsWith('As of '));
  const asOf = asOfIndex >= 0 ? summaryLines[asOfIndex].replace(/^As of\s+/, '') : null;

  const tableStart = summaryLines.indexOf('GSOL') >= 0 ? summaryLines.indexOf('GSOL') : 8;
  const rows: AltcoinEtfFund[] = [];
  let i = tableStart;

  while (i < summaryLines.length) {
    const ticker = summaryLines[i];
    if (ticker === 'All Issuers') break;

    rows.push({
      ticker,
      fundName: summaryLines[i + 1] || ticker,
      staking: summaryLines[i + 2] || 'Yes',
      aum: parseMoney(summaryLines[i + 3]),
      todayFlow: parseMoney(summaryLines[i + 4]),
      volume24h: parseMoney(summaryLines[i + 5]),
      sinceInception: parseMoney(summaryLines[i + 6]),
      issuer: (summaryLines[i + 1] || ticker).split(' ')[0],
      expRatio: '—',
      launchDate: 'Live',
    });
    i += 7;
  }

  const allIssuersIndex = summaryLines.indexOf('All Issuers');
  const totalAum = allIssuersIndex >= 0 ? parseMoney(summaryLines[allIssuersIndex + 1]) : null;
  const todayNetFlow = allIssuersIndex >= 0 ? parseMoney(summaryLines[allIssuersIndex + 2]) : null;
  const cumulativeInflows = allIssuersIndex >= 0 ? parseMoney(summaryLines[allIssuersIndex + 4]) : null;

  const historicalLines = stripHtmlToLines(html.slice(html.indexOf('Total Solana Spot ETF Net Inflow')));
  const dateHeaderIndex = historicalLines.indexOf('Date');
  const allIssuersHeaderIndex = historicalLines.indexOf('All Issuers');
  const columnCount = allIssuersHeaderIndex - dateHeaderIndex;
  const dataStart = allIssuersHeaderIndex + 1;
  const recentFlows: number[] = [];

  if (dateHeaderIndex >= 0 && allIssuersHeaderIndex > dateHeaderIndex) {
    for (let j = dataStart; j + columnCount < historicalLines.length; j += columnCount + 1) {
      const maybeDate = historicalLines[j];
      if (!/^[A-Z][a-z]{2}\s+\d{1,2}$/.test(maybeDate)) break;
      const allIssuersValue = historicalLines[j + columnCount];
      const parsedFlow = parseMoney(allIssuersValue);
      if (parsedFlow !== null) recentFlows.push(parsedFlow);
    }
  }

  return {
    asset: 'SOL',
    assetPrice: 0,
    priceChange24h: 0,
    totalAum,
    cumulativeInflows,
    todayNetFlow,
    weekNetFlow: recentFlows.slice(0, 7).reduce((sum, value) => sum + value, 0),
    inflowStreak: computeStreak(recentFlows),
    fundCount: rows.length,
    funds: rows,
    live: true,
    sourceLabel: 'SolanaFloor',
    asOf,
  };
}

async function fetchCoinPaprikaPrice(id: string) {
  const res = await fetchWithRetry(`${COINPAPRIKA_BASE}/tickers/${id}`, { next: { revalidate: 300 } } as any, 1, 12000);
  const json = await res.json();
  const usd = json?.quotes?.USD || {};
  return {
    price: usd.price || 0,
    change24h: usd.percent_change_24h || 0,
  };
}

async function fetchCoinGeckoPrice(id: string) {
  const res = await fetchWithRetry(
    `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
    { headers: { Accept: 'application/json' }, next: { revalidate: 300 } } as any,
    1,
    12000
  );
  const json = await res.json();
  const marketData = json?.market_data || {};
  return {
    price: marketData?.current_price?.usd || 0,
    change24h: marketData?.price_change_percentage_24h || 0,
  };
}

async function fetchAssetPrice(coinpaprikaId: string, coinGeckoId: string) {
  try {
    return { ...(await fetchCoinPaprikaPrice(coinpaprikaId)), source: 'coinpaprika' as const };
  } catch {
    return { ...(await fetchCoinGeckoPrice(coinGeckoId)), source: 'coingecko' as const };
  }
}

function createSolTrackerFallback(price: { price: number; change24h: number }, note: string): AltcoinEtfAsset {
  return {
    asset: 'SOL',
    assetPrice: price.price,
    priceChange24h: price.change24h,
    totalAum: null,
    cumulativeInflows: null,
    todayNetFlow: null,
    weekNetFlow: null,
    inflowStreak: null,
    fundCount: 0,
    funds: [],
    live: false,
    sourceLabel: 'Price live · tracker standby',
    feedNote: note,
    asOf: null,
  };
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const [xrpPriceResult, solPriceResult, solanaHtmlResult] = await Promise.allSettled([
      fetchAssetPrice('xrp-xrp', 'ripple'),
      fetchAssetPrice('sol-solana', 'solana'),
      fetchWithRetry(SOLANA_FLOOR_URL, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } } as any, 1, 15000),
    ]);

    if (xrpPriceResult.status !== 'fulfilled' || solPriceResult.status !== 'fulfilled') {
      throw new Error('Primary altcoin price feeds unavailable');
    }

    const xrpPrice = xrpPriceResult.value;
    const solPrice = solPriceResult.value;

    let sol: AltcoinEtfAsset;
    if (solanaHtmlResult.status === 'fulfilled') {
      try {
        const solanaHtml = await solanaHtmlResult.value.text();
        sol = parseSolanaFloor(solanaHtml);
        sol.assetPrice = solPrice.price;
        sol.priceChange24h = solPrice.change24h;
        sol.sourceLabel = `SolanaFloor · ${solPrice.source === 'coinpaprika' ? 'CoinPaprika price' : 'CoinGecko price'}`;
      } catch {
        sol = createSolTrackerFallback(solPrice, 'Solana ETF tracker parsing failed, so ChainIntel is holding the live SOL price and waiting for the tracker layout to recover.');
      }
    } else {
      sol = createSolTrackerFallback(solPrice, 'SolanaFloor was unavailable on this refresh, so ChainIntel kept the live SOL market price and suspended ETF flow metrics instead of fabricating them.');
    }

    const xrp: AltcoinEtfAsset = {
      asset: 'XRP',
      assetPrice: xrpPrice.price,
      priceChange24h: xrpPrice.change24h,
      totalAum: null,
      cumulativeInflows: null,
      todayNetFlow: null,
      weekNetFlow: null,
      inflowStreak: null,
      fundCount: XRP_ETF_FUNDS.length,
      funds: XRP_ETF_FUNDS,
      live: false,
      sourceLabel: `Official issuer watchlist · ${xrpPrice.source === 'coinpaprika' ? 'CoinPaprika price' : 'CoinGecko price'}`,
      feedNote: 'No reliable free public XRP ETF flow endpoint is available server-side in this stack, so ChainIntel shows the live XRP market price plus the active issuer roster instead of fabricated AUM/flow figures.',
      asOf: null,
    };

    const result = {
      xrp,
      sol,
      pending: PENDING_ETFS,
      totalAltcoinEtfAum: [xrp.totalAum, sol.totalAum].reduce<number>((sum, value) => sum + (value ?? 0), 0),
      totalAltcoinNetFlowToday: [xrp.todayNetFlow, sol.todayNetFlow].reduce<number>((sum, value) => sum + (value ?? 0), 0),
      milestones: MILESTONES,
      source: `xrp:${xrpPrice.source}+sol:${solPrice.source}+sol-tracker:${sol.live ? 'solanafloor' : 'standby'}`,
      updatedAt: Date.now(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result, { headers: { 'X-Cache': 'MISS' } });
  } catch (err: any) {
    console.error('[altcoin-etfs]', err.message);
    if (cache) {
      return NextResponse.json(cache.data, { headers: { 'X-Cache': 'STALE' } });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
