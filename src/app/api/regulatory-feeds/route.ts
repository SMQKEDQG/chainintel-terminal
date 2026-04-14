import { NextResponse } from 'next/server';

const RSS_FEEDS = [
  { name: 'CFTC Press Releases', url: 'https://www.cftc.gov/PressRoom/PressRelease/RSS', region: 'US', body: 'CFTC' },
  { name: 'CFTC Enforcement', url: 'https://www.cftc.gov/PressRoom/EnforcementActions/RSS', region: 'US', body: 'CFTC' },
  { name: 'CoinDesk Regulation', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', region: 'Global', body: 'CoinDesk' },
  { name: 'The Block', url: 'https://www.theblock.co/rss.xml', region: 'Global', body: 'The Block' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed', region: 'Global', body: 'Decrypt' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', region: 'Global', body: 'CoinTelegraph' },
];

const CRYPTO_KEYWORDS = ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'digital asset', 'stablecoin', 'defi',
  'token', 'virtual asset', 'cbdc', 'mica', 'sec ', 'cftc', 'custody', 'etf', 'spot bitcoin',
  'regulation', 'enforcement', 'compliance', 'aml', 'sanctions'];

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  region: string;
  body: string;
  snippet: string;
}

let feedCache: { items: FeedItem[]; timestamp: number } | null = null;
const CACHE_TTL = 120_000; // 2 min

function isCryptoRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return CRYPTO_KEYWORDS.some(k => lower.includes(k));
}

function extractTag(xml: string, tag: string): string {
  const open = xml.indexOf(`<${tag}`);
  if (open === -1) return '';
  const contentStart = xml.indexOf('>', open) + 1;
  const close = xml.indexOf(`</${tag}>`, contentStart);
  if (close === -1) return '';
  let content = xml.substring(contentStart, close).trim();
  // Handle CDATA
  if (content.startsWith('<![CDATA[')) {
    content = content.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
  }
  // Strip HTML tags for description
  content = content.replace(/<[^>]*>/g, '').trim();
  return content;
}

function parseRSSItems(xml: string, source: string, region: string, body: string): FeedItem[] {
  const items: FeedItem[] = [];
  let searchIdx = 0;
  while (true) {
    const itemStart = xml.indexOf('<item', searchIdx);
    if (itemStart === -1) break;
    const itemEnd = xml.indexOf('</item>', itemStart);
    if (itemEnd === -1) break;
    const itemXml = xml.substring(itemStart, itemEnd + 7);

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const description = extractTag(itemXml, 'description');

    if (title) {
      items.push({
        title,
        link,
        pubDate,
        source,
        region,
        body,
        snippet: description.substring(0, 200),
      });
    }
    searchIdx = itemEnd + 7;
  }
  return items;
}

async function fetchFeed(feed: typeof RSS_FEEDS[0]): Promise<FeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ChainIntel Terminal RSS Reader' },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRSSItems(xml, feed.name, feed.region, feed.body);
    // Filter crypto-related items (for general news feeds)
    if (['CoinDesk', 'The Block', 'Decrypt', 'CoinTelegraph'].includes(feed.body)) {
      return items.filter(i => isCryptoRelated(i.title + ' ' + i.snippet)).slice(0, 10);
    }
    // For regulatory feeds (CFTC, etc.), take all
    return items.slice(0, 10);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Return cache if fresh
    if (feedCache && Date.now() - feedCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ items: feedCache.items, cached: true, count: feedCache.items.length });
    }

    const results = await Promise.allSettled(RSS_FEEDS.map(f => fetchFeed(f)));
    const allItems: FeedItem[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') allItems.push(...r.value);
    }

    // Sort by date, most recent first
    allItems.sort((a, b) => {
      const da = new Date(a.pubDate).getTime() || 0;
      const db = new Date(b.pubDate).getTime() || 0;
      return db - da;
    });

    // Deduplicate by title similarity
    const seen = new Set<string>();
    const deduped = allItems.filter(item => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const limited = deduped.slice(0, 40);
    feedCache = { items: limited, timestamp: Date.now() };

    return NextResponse.json({ items: limited, cached: false, count: limited.length, feeds_checked: RSS_FEEDS.length });
  } catch (err) {
    console.error('RSS feed error:', err);
    return NextResponse.json({ items: [], error: 'Feed aggregation failed' }, { status: 200 });
  }
}
