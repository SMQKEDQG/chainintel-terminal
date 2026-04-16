import { NextResponse } from 'next/server';

// ─── Trending Crypto API ─────────────────────────────────────────────────────
// Aggregates trending signals from:
// 1. CoinGecko trending
// 2. CryptoPanic hot news (extract mentioned coins)
// Returns a ranked list of trending assets with social buzz scores

interface CacheEntry { data: unknown; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 120_000; // 2 min

async function cachedFetch(key: string, url: string, headers?: Record<string, string>): Promise<any> {
  if (cache[key] && Date.now() - cache[key].ts < TTL) return cache[key].data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'ChainIntel Terminal/1.0', ...headers },
    });
    clearTimeout(t);
    if (!res.ok) return cache[key]?.data || null;
    const data = await res.json();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch {
    return cache[key]?.data || null;
  }
}

interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  buzz_score: number; // 0-100 composite social buzz
  buzz_sources: string[]; // which sources flagged it
  mentions_24h: number;
  trending_rank: number;
}

export async function GET() {
  const [cgTrending, cryptoPanic] = await Promise.allSettled([
    cachedFetch('cg-trending', 'https://api.coingecko.com/api/v3/search/trending'),
    cachedFetch(
      'cp-trending',
      'https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&filter=hot&kind=news'
    ),
  ]);

  const val = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' ? r.value : null);

  // ── Score tracking: symbol → aggregate data ──
  const scoreMap = new Map<
    string,
    {
      symbol: string;
      name: string;
      image: string;
      price: number;
      change24h: number;
      mcap: number;
      mcapRank: number;
      points: number;
      sources: Set<string>;
      mentions: number;
    }
  >();

  function upsert(
    symbol: string,
    name: string,
    image: string,
    price: number,
    change24h: number,
    mcap: number,
    mcapRank: number,
    points: number,
    source: string
  ) {
    const key = symbol.toLowerCase();
    const existing = scoreMap.get(key);
    if (existing) {
      existing.points += points;
      existing.sources.add(source);
      existing.mentions += 1;
      // Update price data if better (non-zero)
      if (price > 0 && existing.price === 0) existing.price = price;
      if (change24h !== 0 && existing.change24h === 0) existing.change24h = change24h;
      if (mcap > 0 && existing.mcap === 0) existing.mcap = mcap;
      if (mcapRank > 0 && existing.mcapRank === 0) existing.mcapRank = mcapRank;
    } else {
      scoreMap.set(key, {
        symbol: symbol.toUpperCase(),
        name,
        image,
        price,
        change24h,
        mcap,
        mcapRank,
        points,
        sources: new Set([source]),
        mentions: 1,
      });
    }
  }

  // ── Parse CoinGecko Trending ──
  const cgData = val(cgTrending);
  if (cgData?.coins) {
    cgData.coins.forEach((entry: any, i: number) => {
      const coin = entry.item || entry;
      upsert(
        coin.symbol || '',
        coin.name || '',
        coin.thumb || coin.small || coin.large || '',
        coin.data?.price || 0,
        coin.data?.price_change_percentage_24h?.usd || 0,
        coin.data?.market_cap ? parseFloat(String(coin.data.market_cap).replace(/[,$]/g, '')) : 0,
        coin.market_cap_rank || 0,
        15 - i,
        'CoinGecko Trending'
      );
    });
  }

  // ── Parse CryptoPanic — extract coin symbols mentioned in hot news ──
  const cpData = val(cryptoPanic);
  if (cpData?.results) {
    // Known crypto symbols to look for
    const knownSymbols = new Set([
      'BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','DOT','LINK',
      'MATIC','SHIB','UNI','LTC','ATOM','NEAR','ARB','OP','APT','SUI',
      'FIL','INJ','TIA','SEI','PEPE','WIF','BONK','JUP','STX','RENDER',
      'FET','RNDR','TAO','HBAR','ALGO','VET','MANA','SAND','AXS','ICP',
      'TON','TRX','LEO','OKB','CRO','MKR','AAVE','SNX','COMP','LDO',
    ]);

    const mentionCount = new Map<string, number>();
    cpData.results.forEach((article: any) => {
      // Check currencies array
      if (article.currencies) {
        article.currencies.forEach((c: any) => {
          const sym = (c.code || '').toUpperCase();
          if (sym) mentionCount.set(sym, (mentionCount.get(sym) || 0) + 1);
        });
      }
      // Also scan title for symbol mentions
      const title = (article.title || '').toUpperCase();
      knownSymbols.forEach((sym) => {
        if (title.includes(sym) || title.includes(`$${sym}`)) {
          mentionCount.set(sym, (mentionCount.get(sym) || 0) + 1);
        }
      });
    });

    mentionCount.forEach((count, sym) => {
      upsert(sym, sym, '', 0, 0, 0, 0, count * 5, 'Social/News Buzz');
    });
  }

  // ── Build ranked result ──
  const maxPoints = Math.max(...Array.from(scoreMap.values()).map((v) => v.points), 1);

  const trending: TrendingCoin[] = Array.from(scoreMap.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, 30)
    .map((v, i) => ({
      id: v.symbol.toLowerCase(),
      symbol: v.symbol.toLowerCase(),
      name: v.name || v.symbol,
      image: v.image || 'https://static.coinpaprika.com/coin/btc-bitcoin/logo.png',
      current_price: v.price,
      price_change_percentage_24h: v.change24h,
      market_cap: v.mcap,
      market_cap_rank: v.mcapRank,
      buzz_score: Math.round((v.points / maxPoints) * 100),
      buzz_sources: Array.from(v.sources),
      mentions_24h: v.mentions,
      trending_rank: i + 1,
    }));

  return NextResponse.json({
    trending,
    sources: ['CoinGecko Trending', 'CryptoPanic News'],
    sourceCount: 2,
    timestamp: Date.now(),
  });
}
