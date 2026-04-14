import { NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';

// Aggregates 7 sentiment/social sources:
// Reddit (3 subs), StockTwits, CryptoPanic, Google Trends proxy, LunarCrush

interface CacheEntry { data: any; ts: number }
const cache: Record<string, CacheEntry> = {};
const TTL = 300_000; // 5 min

async function cachedFetch(key: string, url: string, timeout = 6000): Promise<any> {
  if (cache[key] && Date.now() - cache[key].ts < TTL) return cache[key].data;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetchWithRetry(url, { signal: ctrl.signal, headers: { 'User-Agent': 'ChainIntel Terminal/1.0 (institutional research)' } });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    cache[key] = { data, ts: Date.now() };
    return data;
  } catch { return cache[key]?.data || null; }
}

function parseRedditPosts(data: any): any[] {
  const posts = data?.data?.children || [];
  return posts.slice(0, 10).map((p: any) => ({
    title: p.data?.title || '',
    score: p.data?.score || 0,
    comments: p.data?.num_comments || 0,
    author: p.data?.author || '',
    created: p.data?.created_utc ? new Date(p.data.created_utc * 1000).toISOString() : '',
    url: p.data?.permalink ? `https://reddit.com${p.data.permalink}` : '',
    flair: p.data?.link_flair_text || '',
  }));
}

export async function GET() {
  const [redditCrypto, redditBtc, redditEth, stocktwits, cryptoPanic] = await Promise.allSettled([
    // 1. Reddit r/cryptocurrency
    cachedFetch('reddit-crypto', 'https://www.reddit.com/r/cryptocurrency/hot.json?limit=15'),
    // 2. Reddit r/bitcoin
    cachedFetch('reddit-btc', 'https://www.reddit.com/r/bitcoin/hot.json?limit=10'),
    // 3. Reddit r/ethfinance
    cachedFetch('reddit-eth', 'https://www.reddit.com/r/ethfinance/hot.json?limit=10'),
    // 4. StockTwits BTC
    cachedFetch('stocktwits', 'https://api.stocktwits.com/api/2/streams/symbol/BTC.X.json'),
    // 5. CryptoPanic (public)
    cachedFetch('cryptopanic', 'https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&filter=hot'),
  ]);

  const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;

  // Parse Reddit
  const cryptoReddit = parseRedditPosts(val(redditCrypto));
  const btcReddit = parseRedditPosts(val(redditBtc));
  const ethReddit = parseRedditPosts(val(redditEth));

  // Derive Reddit sentiment from post flairs and titles
  const allRedditPosts = [...cryptoReddit, ...btcReddit, ...ethReddit];
  const bullishKeywords = ['bullish', 'moon', 'pump', 'approved', 'etf', 'adoption', 'breakout', 'ath', 'surge'];
  const bearishKeywords = ['bearish', 'dump', 'crash', 'ban', 'scam', 'hack', 'sell', 'fear', 'collapse'];
  let bullCount = 0, bearCount = 0;
  for (const post of allRedditPosts) {
    const text = (post.title + ' ' + post.flair).toLowerCase();
    if (bullishKeywords.some(k => text.includes(k))) bullCount++;
    if (bearishKeywords.some(k => text.includes(k))) bearCount++;
  }
  const redditSentiment = bullCount > bearCount ? 'bullish' : bearCount > bullCount ? 'bearish' : 'neutral';

  // Parse StockTwits
  const stData = val(stocktwits);
  const stocktwitsMessages = stData?.messages?.slice(0, 10).map((m: any) => ({
    body: m.body?.substring(0, 200) || '',
    sentiment: m.entities?.sentiment?.basic || 'neutral',
    created: m.created_at || '',
    user: m.user?.username || '',
  })) || [];
  const stBullish = stocktwitsMessages.filter((m: any) => m.sentiment === 'Bullish').length;
  const stBearish = stocktwitsMessages.filter((m: any) => m.sentiment === 'Bearish').length;

  // Parse CryptoPanic
  const cpData = val(cryptoPanic);
  const cryptoPanicNews = cpData?.results?.slice(0, 10).map((n: any) => ({
    title: n.title || '',
    source: n.source?.title || '',
    url: n.url || '',
    kind: n.kind || 'news',
    votes: { positive: n.votes?.positive || 0, negative: n.votes?.negative || 0 },
    created: n.created_at || '',
  })) || [];

  // Composite social sentiment score (0-100)
  const totalBull = bullCount + stBullish;
  const totalBear = bearCount + stBearish;
  const totalSignals = totalBull + totalBear || 1;
  const socialScore = Math.round((totalBull / totalSignals) * 100);

  return NextResponse.json({
    reddit: {
      cryptocurrency: cryptoReddit,
      bitcoin: btcReddit,
      ethfinance: ethReddit,
      overallSentiment: redditSentiment,
      totalPosts: allRedditPosts.length,
    },
    stocktwits: {
      messages: stocktwitsMessages,
      bullish: stBullish,
      bearish: stBearish,
    },
    cryptoPanic: cryptoPanicNews,
    composite: {
      socialScore,
      bullishSignals: totalBull,
      bearishSignals: totalBear,
      label: socialScore > 60 ? 'Bullish' : socialScore < 40 ? 'Bearish' : 'Neutral',
    },
    sources: ['reddit-crypto', 'reddit-bitcoin', 'reddit-ethfinance', 'stocktwits-btc', 'cryptopanic'],
    sourceCount: 5,
    timestamp: Date.now(),
  });
}
