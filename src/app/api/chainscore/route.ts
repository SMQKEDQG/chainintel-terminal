import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * GET /api/chainscore
 * Public API endpoint for ChainIntel's proprietary ChainScore ratings.
 * 
 * Query params:
 *   ?asset=BTC       — single asset lookup
 *   ?all=true        — return all rated assets
 * 
 * Response format:
 * {
 *   "asset": "BTC",
 *   "score": 87,
 *   "grade": "A",
 *   "signal": "BUY",
 *   "factors": { "onchain": 91, "regulatory": 82, "etf_momentum": 89 },
 *   "updated": "2026-04-13T22:00:00Z"
 * }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const asset = searchParams.get('asset')?.toUpperCase() ?? null;
  const all = searchParams.get('all') === 'true';

  // CORS headers for public API
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  };

  if (!asset && !all) {
    return NextResponse.json(
      {
        error: 'Missing parameter. Use ?asset=BTC for single lookup or ?all=true for all assets.',
        docs: 'https://chainintelterminal.com/api/chainscore?all=true',
        example: 'https://chainintelterminal.com/api/chainscore?asset=BTC',
      },
      { status: 400, headers }
    );
  }

  if (!supabaseKey) {
    const fallback = getFallbackRatings(asset, all);
    if (asset && !all) {
      return NextResponse.json(
        fallback ? { ...fallback, source: 'cached' } : { error: `Asset ${asset} not found.` },
        { status: fallback ? 200 : 404, headers }
      );
    }
    return NextResponse.json(
      { count: (fallback as any[]).length, ratings: fallback, source: 'cached' },
      { status: 200, headers }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from('chainscore_ratings').select('*');
    if (asset && !all) {
      query = query.eq('asset_symbol', asset);
    }

    const { data, error } = await query;

    if (error) {
      const fallback = getFallbackRatings(asset, all);
      if (asset && !all) {
        return NextResponse.json(
          fallback ? { ...fallback, source: 'cached' } : { error: `Asset ${asset} not found.` },
          { status: fallback ? 200 : 404, headers }
        );
      }
      return NextResponse.json(
        { count: (fallback as any[]).length, ratings: fallback, source: 'cached' },
        { status: 200, headers }
      );
    }

    if (!data || data.length === 0) {
      if (asset) {
        return NextResponse.json(
          { error: `Asset ${asset} not found. Use ?all=true to see available assets.` },
          { status: 404, headers }
        );
      }
      return NextResponse.json({ ratings: getFallbackRatings(asset, all) }, { status: 200, headers });
    }

    // Map actual Supabase columns to public API format
    // Columns: asset_symbol, asset_name, total_score, score_band,
    //   regulatory_clarity, adoption_velocity, decentralization, liquidity_depth, network_fundamentals
    const ratings = data.map((r: Record<string, unknown>) => ({
      asset: r.asset_symbol,
      name: r.asset_name,
      score: Number(r.total_score),
      grade: r.score_band || getGrade(Number(r.total_score)),
      signal: getSignal(Number(r.total_score)),
      factors: {
        regulatory_clarity: Number(r.regulatory_clarity) || 0,
        adoption_velocity: Number(r.adoption_velocity) || 0,
        decentralization: Number(r.decentralization) || 0,
        liquidity_depth: Number(r.liquidity_depth) || 0,
        network_fundamentals: Number(r.network_fundamentals) || 0,
      },
      notes: {
        regulatory: r.regulatory_notes || null,
        adoption: r.adoption_notes || null,
        decentralization: r.decentralization_notes || null,
        liquidity: r.liquidity_notes || null,
        fundamentals: r.fundamentals_notes || null,
      },
      methodology: r.methodology_version || '1.0',
      updated: r.scored_at || r.updated_at || new Date().toISOString(),
    }));

    return NextResponse.json(
      asset && !all ? { ...ratings[0], source: 'live' } : { count: ratings.length, ratings, source: 'live' },
      { status: 200, headers }
    );
  } catch {
    const fallback = getFallbackRatings(asset, all);
    if (asset && !all) {
      return NextResponse.json(
        fallback ? { ...fallback, source: 'cached' } : { error: `Asset ${asset} not found.` },
        { status: fallback ? 200 : 404, headers }
      );
    }
    return NextResponse.json(
      { count: (fallback as any[]).length, ratings: fallback, source: 'cached' },
      { status: 200, headers }
    );
  }
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

function getSignal(score: number): string {
  if (score >= 75) return 'BUY';
  if (score >= 50) return 'HOLD';
  return 'WATCH';
}

function getFallbackRatings(asset: string | null | undefined, all: boolean) {
  const ratings = [
    { asset: 'BTC', name: 'Bitcoin', score: 87, grade: 'A', signal: 'BUY' },
    { asset: 'ETH', name: 'Ethereum', score: 79, grade: 'B+', signal: 'BUY' },
    { asset: 'XRP', name: 'Ripple', score: 82, grade: 'A', signal: 'BUY' },
    { asset: 'SOL', name: 'Solana', score: 74, grade: 'B+', signal: 'HOLD' },
    { asset: 'HBAR', name: 'Hedera', score: 71, grade: 'B+', signal: 'HOLD' },
    { asset: 'QNT', name: 'Quant', score: 68, grade: 'B', signal: 'HOLD' },
    { asset: 'XLM', name: 'Stellar', score: 73, grade: 'B+', signal: 'HOLD' },
    { asset: 'ADA', name: 'Cardano', score: 65, grade: 'B', signal: 'HOLD' },
    { asset: 'IOTA', name: 'IOTA', score: 58, grade: 'C', signal: 'WATCH' },
    { asset: 'AVAX', name: 'Avalanche', score: 70, grade: 'B+', signal: 'HOLD' },
    { asset: 'LINK', name: 'Chainlink', score: 76, grade: 'A', signal: 'BUY' },
    { asset: 'DOT', name: 'Polkadot', score: 62, grade: 'B', signal: 'HOLD' },
    { asset: 'ALGO', name: 'Algorand', score: 60, grade: 'B', signal: 'HOLD' },
    { asset: 'XDC', name: 'XDC Network', score: 64, grade: 'B', signal: 'HOLD' },
  ];

  if (asset && !all) {
    return ratings.find(r => r.asset === asset) || null;
  }
  return ratings;
}
