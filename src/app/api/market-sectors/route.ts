import { NextResponse } from 'next/server';

/**
 * /api/market-sectors — Top/worst performing crypto sectors via CoinGecko categories
 * Free API, no key needed. 2-min cache.
 */

interface CacheEntry { data: unknown; ts: number; }
let cache: CacheEntry | null = null;
const CACHE_TTL = 120_000;

// CoinGecko category IDs for key sectors
const SECTOR_IDS = [
  'decentralized-finance-defi',
  'layer-1',
  'layer-2',
  'real-world-assets-rwa',
  'artificial-intelligence',
  'gaming',
  'meme-token',
  'infrastructure',
];

const SECTOR_LABELS: Record<string, string> = {
  'decentralized-finance-defi': 'DeFi',
  'layer-1': 'Layer 1',
  'layer-2': 'Layer 2',
  'real-world-assets-rwa': 'RWA',
  'artificial-intelligence': 'AI',
  'gaming': 'Gaming',
  'meme-token': 'Meme',
  'infrastructure': 'Infra',
};

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ ...cache.data as Record<string, unknown>, source: 'cached' });
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/categories',
      { next: { revalidate: 120 } }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    
    const categories = await res.json();
    
    // Filter to our target sectors
    const sectors = categories
      .filter((c: { id: string }) => SECTOR_IDS.includes(c.id))
      .map((c: { id: string; name: string; market_cap_change_24h: number; market_cap: number; volume_24h: number }) => ({
        id: c.id,
        label: SECTOR_LABELS[c.id] || c.name,
        name: c.name,
        change24h: c.market_cap_change_24h ?? 0,
        marketCap: c.market_cap ?? 0,
        volume24h: c.volume_24h ?? 0,
      }))
      .sort((a: { change24h: number }, b: { change24h: number }) => b.change24h - a.change24h);

    const topSector = sectors[0];
    const worstSector = sectors[sectors.length - 1];

    const result = {
      sectors,
      topSector: topSector ? { label: topSector.label, change: topSector.change24h } : null,
      worstSector: worstSector ? { label: worstSector.label, change: worstSector.change24h } : null,
      source: 'live',
      timestamp: Date.now(),
    };

    cache = { data: result, ts: Date.now() };
    return NextResponse.json(result);
  } catch (err) {
    if (cache) {
      return NextResponse.json({ ...cache.data as Record<string, unknown>, source: 'stale-cache' });
    }
    return NextResponse.json({
      sectors: [],
      topSector: { label: 'RWA', change: 4.2 },
      worstSector: { label: 'DeFi', change: -3.1 },
      source: 'fallback',
    });
  }
}
