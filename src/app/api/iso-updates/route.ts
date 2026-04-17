import { NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetch-utils';
import { ISO_ASSETS, type IsoUpdate } from '@/data/iso-assets';

const CACHE_TTL = 900_000;

let cache: { data: Record<string, IsoUpdate>; ts: number } | null = null;

function decodeHtml(text: string): string {
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8230;/g, '...');
}

function stripHtml(text: string): string {
  return decodeHtml(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarize(text: string, max = 180): string {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function formatDate(raw: string): { label: string; timestamp: number | null } {
  const ts = Date.parse(raw);
  if (Number.isNaN(ts)) return { label: raw, timestamp: null };
  return {
    label: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timestamp: ts,
  };
}

function parseRssFirstItem(xml: string, sourceLabel: string): IsoUpdate | null {
  const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/i);
  if (!itemMatch) return null;
  const block = itemMatch[1];
  const title = block.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1];
  const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1];
  const description = block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || '';
  if (!title || !link || !pubDate) return null;
  const { label, timestamp } = formatDate(pubDate);
  return {
    title: stripHtml(title),
    date: label,
    summary: summarize(description),
    url: stripHtml(link),
    sourceLabel,
    live: true,
    timestamp,
  };
}

async function fetchText(url: string): Promise<string> {
  const res = await fetchWithRetry(url, { headers: { 'User-Agent': 'Mozilla/5.0 ChainIntel/1.0' }, next: { revalidate: 900 } } as any, 1, 15000);
  return res.text();
}

async function fetchRippleLatest(): Promise<IsoUpdate | null> {
  const listing = await fetchText('https://ripple.com/insights/');
  const articlePath = listing
    .match(/\/insights\/(?!page\/)[^"'\\\s<>]+/g)
    ?.find((path) => !path.endsWith('/\\'));
  if (!articlePath) return null;
  const url = `https://ripple.com${articlePath.replace(/\\+$/, '')}`;
  const article = await fetchText(url);
  const title = article.match(/<title>([^<]+)\s+\|\s+Ripple<\/title>/i)?.[1];
  const description = article.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
  const publishedRaw = article.match(/"datePublished":"([^"]+)"/i)?.[1];
  if (!title) return null;
  const { label, timestamp } = publishedRaw ? formatDate(publishedRaw) : { label: 'Live official post', timestamp: null };
  return {
    title: stripHtml(title),
    date: label,
    summary: summarize(description || 'Recent Ripple insight post.'),
    url,
    sourceLabel: 'Ripple official',
    live: true,
    timestamp,
  };
}

async function loadUpdates() {
  const fallbackEntries = Object.fromEntries(ISO_ASSETS.map((asset) => [asset.sym, asset.fallbackUpdate]));

  const tasks: Array<Promise<[string, IsoUpdate | null]>> = [
    fetchRippleLatest().then((update) => ['XRP', update]),
    fetchText('https://stellar.org/blog/rss.xml').then((xml) => ['XLM', parseRssFirstItem(xml, 'Stellar RSS')]),
    fetchText('https://hedera.com/blog/rss.xml').then((xml) => ['HBAR', parseRssFirstItem(xml, 'Hedera RSS')]),
    fetchText('https://cardano.org/news/rss.xml').then((xml) => ['ADA', parseRssFirstItem(xml, 'Cardano RSS')]),
    fetchText('https://algorand.co/blog/rss.xml').then((xml) => ['ALGO', parseRssFirstItem(xml, 'Algorand RSS')]),
  ];

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const [sym, update] = result.value;
    if (update) fallbackEntries[sym] = update;
  }

  return fallbackEntries;
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ updates: cache.data }, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const updates = await loadUpdates();
    cache = { data: updates, ts: Date.now() };
    return NextResponse.json({ updates }, { headers: { 'X-Cache': 'MISS' } });
  } catch (err) {
    console.error('[iso-updates]', err);
    if (cache) {
      return NextResponse.json({ updates: cache.data }, { headers: { 'X-Cache': 'STALE' } });
    }
    const fallback = Object.fromEntries(ISO_ASSETS.map((asset) => [asset.sym, asset.fallbackUpdate]));
    return NextResponse.json({ updates: fallback }, { headers: { 'X-Cache': 'FALLBACK' } });
  }
}
