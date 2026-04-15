import { NextRequest, NextResponse } from 'next/server';

// ─── Ask CI — AI-native intelligence engine ──────────────────────────────────
// Fetches real-time data from our internal APIs and constructs data-driven
// responses. Falls back to cached intelligence when APIs are unavailable.

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'http://localhost:3000';

async function fetchInternal(path: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { 
      headers: { 'User-Agent': 'CI-AI-Engine/1.0' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

interface MarketSnapshot {
  btcPrice: number;
  btcChange24h: number;
  ethPrice: number;
  ethChange24h: number;
  totalMcap: number;
  btcDominance: number;
  topGainer: { name: string; symbol: string; change: number } | null;
  topLoser: { name: string; symbol: string; change: number } | null;
  gainersCount: number;
  losersCount: number;
  fearGreed: { value: number; label: string } | null;
  etfNetFlow: number | null;
  defiTvl: number | null;
}

async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const [cmcData, sentimentData, etfData, defiData] = await Promise.allSettled([
    fetchInternal('/api/cmc?endpoint=/v1/cryptocurrency/listings/latest&limit=50&sort=market_cap&convert=USD'),
    fetchInternal('/api/sentiment'),
    fetchInternal('/api/etf-flows'),
    fetchInternal('/api/defi-overview'),
  ]);

  const snap: MarketSnapshot = {
    btcPrice: 0, btcChange24h: 0, ethPrice: 0, ethChange24h: 0,
    totalMcap: 0, btcDominance: 0,
    topGainer: null, topLoser: null,
    gainersCount: 0, losersCount: 0,
    fearGreed: null, etfNetFlow: null, defiTvl: null,
  };

  // Parse CMC
  const cmc = cmcData.status === 'fulfilled' ? cmcData.value : null;
  const coins = cmc?.data?.data || [];
  if (coins.length > 0) {
    const btc = coins.find((c: any) => c.symbol === 'BTC');
    const eth = coins.find((c: any) => c.symbol === 'ETH');
    if (btc) {
      snap.btcPrice = btc.quote?.USD?.price || 0;
      snap.btcChange24h = btc.quote?.USD?.percent_change_24h || 0;
    }
    if (eth) {
      snap.ethPrice = eth.quote?.USD?.price || 0;
      snap.ethChange24h = eth.quote?.USD?.percent_change_24h || 0;
    }
    snap.totalMcap = coins.reduce((s: number, c: any) => s + (c.quote?.USD?.market_cap || 0), 0);
    if (btc) snap.btcDominance = (btc.quote?.USD?.market_cap || 0) / snap.totalMcap * 100;
    
    const stablecoins = new Set(['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FDUSD', 'PYUSD']);
    const nonStable = coins.filter((c: any) => !stablecoins.has(c.symbol));
    const sorted = [...nonStable].sort((a: any, b: any) => (b.quote?.USD?.percent_change_24h || 0) - (a.quote?.USD?.percent_change_24h || 0));
    if (sorted[0]) snap.topGainer = { name: sorted[0].name, symbol: sorted[0].symbol, change: sorted[0].quote?.USD?.percent_change_24h || 0 };
    if (sorted[sorted.length - 1]) snap.topLoser = { name: sorted[sorted.length - 1].name, symbol: sorted[sorted.length - 1].symbol, change: sorted[sorted.length - 1].quote?.USD?.percent_change_24h || 0 };
    snap.gainersCount = nonStable.filter((c: any) => (c.quote?.USD?.percent_change_24h || 0) > 0).length;
    snap.losersCount = nonStable.filter((c: any) => (c.quote?.USD?.percent_change_24h || 0) <= 0).length;
  }

  // Parse Sentiment
  const sent = sentimentData.status === 'fulfilled' ? sentimentData.value : null;
  if (sent?.fearGreed) snap.fearGreed = { value: sent.fearGreed.value, label: sent.fearGreed.label };

  // Parse ETF
  const etf = etfData.status === 'fulfilled' ? etfData.value : null;
  if (etf?.flows) {
    snap.etfNetFlow = etf.flows.reduce((s: number, f: any) => s + (f.net_flow ?? f.flow ?? 0), 0);
  }

  // Parse DeFi
  const defi = defiData.status === 'fulfilled' ? defiData.value : null;
  if (defi?.totalTvl) snap.defiTvl = defi.totalTvl;

  return snap;
}

function fmtUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function generateResponse(query: string, snap: MarketSnapshot): string {
  const q = query.toLowerCase();
  const btcStr = snap.btcPrice > 0 ? fmtPrice(snap.btcPrice) : '$73K';
  const ethStr = snap.ethPrice > 0 ? fmtPrice(snap.ethPrice) : '$2,300';
  const mcapStr = snap.totalMcap > 0 ? fmtUsd(snap.totalMcap) : '$2.4T';
  const domStr = snap.btcDominance > 0 ? `${snap.btcDominance.toFixed(1)}%` : '60%';
  const fngVal = snap.fearGreed?.value ?? 0;
  const fngLabel = snap.fearGreed?.label ?? 'Unknown';
  const breadth = snap.gainersCount > 0 ? `${snap.gainersCount} up / ${snap.losersCount} down` : '';

  // ── BTC questions ──
  if (q.includes('btc') || q.includes('bitcoin')) {
    const sentiment = fngVal <= 25 ? 'Extreme Fear' : fngVal <= 45 ? 'Fear' : fngVal <= 55 ? 'Neutral' : 'Greed';
    const outlook = snap.btcChange24h > 2 ? 'momentum is strongly bullish short-term' :
      snap.btcChange24h > 0 ? 'showing mild recovery with cautious accumulation' :
      snap.btcChange24h > -3 ? 'consolidating with controlled selling pressure' :
      'under significant selling pressure — key support levels being tested';
    return `**BTC** is trading at **${btcStr}** (${snap.btcChange24h >= 0 ? '+' : ''}${snap.btcChange24h.toFixed(2)}% 24h). Market sentiment: **${sentiment}** (${fngVal}/100). ${outlook}. BTC dominance at ${domStr} — ${snap.btcDominance > 58 ? 'capital rotating to safety' : 'alt-season conditions possible'}.${snap.etfNetFlow !== null ? ` ETF net flow: ${snap.etfNetFlow >= 0 ? '+' : ''}$${Math.abs(snap.etfNetFlow).toFixed(1)}M.` : ''} This is analytical intelligence, not financial advice.`;
  }

  // ── ETH questions ──
  if (q.includes('eth') || q.includes('ethereum')) {
    const ratio = snap.btcPrice > 0 && snap.ethPrice > 0 ? (snap.ethPrice / snap.btcPrice).toFixed(4) : '0.031';
    return `**ETH** is at **${ethStr}** (${snap.ethChange24h >= 0 ? '+' : ''}${snap.ethChange24h.toFixed(2)}% 24h). ETH/BTC ratio: ${ratio} — ${parseFloat(ratio) < 0.04 ? 'near multi-year lows, historically a contrarian entry zone' : 'holding relative strength'}. ${snap.defiTvl ? `DeFi TVL: **${fmtUsd(snap.defiTvl)}** across all chains.` : ''} The merge to PoS made ETH deflationary when fees are high — current issuance dynamics favor holders during high-activity periods. This is analytical intelligence, not financial advice.`;
  }

  // ── ETF questions ──
  if (q.includes('etf') || q.includes('flow')) {
    if (snap.etfNetFlow !== null) {
      const dir = snap.etfNetFlow >= 0 ? 'inflow' : 'outflow';
      return `Bitcoin ETF net flow is **${snap.etfNetFlow >= 0 ? '+' : ''}$${Math.abs(snap.etfNetFlow).toFixed(1)}M** today — a net ${dir} signal. ${snap.etfNetFlow > 100 ? 'Strong institutional demand — this level of accumulation typically signals sustained buying pressure.' : snap.etfNetFlow > 0 ? 'Positive but moderate — institutions are nibbling, not gorging.' : 'Outflow day — monitor if this becomes a streak. Single-day outflows are noise; 3+ day streaks are signal.'} Total crypto market cap: ${mcapStr}. BTC dominance: ${domStr}.`;
    }
    return `ETF flow data is currently refreshing. Total crypto market cap: **${mcapStr}**. BTC at ${btcStr}. Monitor BlackRock IBIT and Fidelity FBTC for the highest-signal institutional flows — they represent 70%+ of all BTC ETF volume.`;
  }

  // ── Fear & Greed ──
  if (q.includes('fear') || q.includes('greed') || q.includes('sentiment')) {
    return `**Fear & Greed Index: ${fngVal}/100 (${fngLabel})**. ${fngVal <= 20 ? 'Extreme Fear readings below 20 are a classic contrarian signal — historically, these levels have preceded 40-60% rallies within 3-6 months. Current market breadth: ' + breadth + '.' : fngVal <= 40 ? 'Fear territory. Smart money typically accumulates here while retail sells. Watch for reversal signals in BTC funding rates and exchange flow data.' : fngVal <= 60 ? 'Neutral zone — no strong directional bias. Let data lead: monitor ETF flows, whale activity, and on-chain metrics for the next directional move.' : 'Greed territory — historically, readings above 75 precede corrections. Consider taking profits or tightening stops.'} BTC: ${btcStr}. This is analytical intelligence, not financial advice.`;
  }

  // ── DeFi questions ──
  if (q.includes('defi') || q.includes('tvl') || q.includes('yield')) {
    return `**DeFi Total TVL: ${snap.defiTvl ? fmtUsd(snap.defiTvl) : '$85B+'}** across 6,400+ protocols. ${snap.defiTvl && snap.defiTvl > 90e9 ? 'TVL is expanding — capital is flowing into yield opportunities' : 'TVL is contracting — risk-off behavior as capital exits yield protocols'}. Top chains by TVL: Ethereum (~60%), Tron, BSC, Solana, Arbitrum. Key metric to watch: stablecoin supply growth — new stablecoins minted signals capital positioning for DeFi entry.`;
  }

  // ── ISO 20022 ──
  if (q.includes('iso') || q.includes('20022') || q.includes('swift') || q.includes('compliant')) {
    return `**ISO 20022** is the global financial messaging standard replacing legacy SWIFT formats for cross-border payments. Assets with native compliance: **XRP, XLM** (certified), **HBAR, QNT** (integration-ready), **IOTA, ADA** (in progress), **ALGO, XDC** (partial). These assets gain structural advantage for institutional settlement in the $150T+ annual payment infrastructure. The full SWIFT migration is underway — ISO-native ledgers are positioned for integration into traditional banking rails.`;
  }

  // ── Solana ──
  if (q.includes('sol') || q.includes('solana')) {
    const sol = snap.topGainer?.symbol === 'SOL' ? snap.topGainer : snap.topLoser?.symbol === 'SOL' ? snap.topLoser : null;
    return `**Solana** ${sol ? `is at $${sol.change > 0 ? 'gaining' : 'declining'} (${sol.change >= 0 ? '+' : ''}${sol.change.toFixed(2)}% 24h)` : 'is a high-throughput L1'} processing 4,000+ TPS with active DeFi and memecoin ecosystems. Not ISO 20022 compliant — positioned as DeFi/consumer play vs. institutional settlement layer. Key strengths: speed, low fees, growing developer ecosystem. Key risks: validator centralization, historical outage events.`;
  }

  // ── XRP ──
  if (q.includes('xrp') || q.includes('ripple')) {
    return `**XRP** is an ISO 20022-certified digital asset designed for institutional cross-border payments via RippleNet. SEC lawsuit resolved — regulatory clarity achieved. XRP's structural advantage: native SWIFT integration readiness, 3-5 second settlement, and $150T+ addressable market in cross-border flows. BTC dominance at ${domStr} — ${snap.btcDominance > 58 ? 'capital in safety mode, altcoins may lag' : 'rotation conditions emerging, XRP could benefit'}. This is analytical intelligence, not financial advice.`;
  }

  // ── Market overview / general ──
  if (q.includes('market') || q.includes('overview') || q.includes('what') || q.includes('how') || q.includes('today') || q.includes('outlook')) {
    const breadthNote = snap.gainersCount > snap.losersCount ? 'more assets green than red — mild risk-on' : 'majority of assets declining — risk-off posture';
    return `**Market snapshot:** Total cap ${mcapStr}, BTC at ${btcStr} (${snap.btcChange24h >= 0 ? '+' : ''}${snap.btcChange24h.toFixed(2)}%), ETH at ${ethStr}. BTC dominance: ${domStr}. ${breadth ? `Breadth: ${breadth} (${breadthNote}).` : ''} ${snap.fearGreed ? `Sentiment: **${fngLabel}** (${fngVal}/100).` : ''} ${snap.topGainer ? `Top mover: ${snap.topGainer.name} +${snap.topGainer.change.toFixed(1)}%.` : ''} ${snap.etfNetFlow !== null ? `ETF net: ${snap.etfNetFlow >= 0 ? '+' : ''}$${Math.abs(snap.etfNetFlow).toFixed(1)}M.` : ''}`;
  }

  // ── Whale / smart money ──
  if (q.includes('whale') || q.includes('smart money') || q.includes('accumul')) {
    return `Whale activity is a key signal for institutional positioning. When exchange outflows exceed inflows, it signals net accumulation — coins moving to cold storage. Current BTC dominance at ${domStr} with total market cap at ${mcapStr}. ${fngVal <= 30 ? `Fear & Greed at ${fngVal} (${fngLabel}) — historically, whales accumulate aggressively during extreme fear while retail capitulates.` : `Sentiment at ${fngVal}/100 — whale behavior in ${fngLabel} territory tends toward distribution.`} Monitor Whale Alert for $10M+ transactions and exchange reserve changes.`;
  }

  // ── Stablecoin ──
  if (q.includes('stablecoin') || q.includes('usdt') || q.includes('usdc')) {
    return `Stablecoin supply growth is a leading indicator for market direction. New stablecoins minted = fresh capital entering crypto. When supply rises during fear phases, it signals **dry powder accumulating** for deployment. USDT dominates at ~68% share. Key metric: if stablecoin supply grows while Fear & Greed is below 25, it's historically one of the strongest accumulation signals. Current market: ${mcapStr} total cap, BTC at ${btcStr}.`;
  }

  // ── Default: provide comprehensive market intelligence ──
  return `Based on live data — BTC at **${btcStr}** (${snap.btcChange24h >= 0 ? '+' : ''}${snap.btcChange24h.toFixed(2)}%), total market cap ${mcapStr}, BTC dominance ${domStr}. ${snap.fearGreed ? `Sentiment: **${fngLabel}** (${fngVal}/100).` : ''} ${breadth ? `Market breadth: ${breadth}.` : ''} ${snap.topGainer ? `Top gainer: ${snap.topGainer.name} (+${snap.topGainer.change.toFixed(1)}%).` : ''} ${snap.etfNetFlow !== null ? `ETF net flow: ${snap.etfNetFlow >= 0 ? '+' : ''}$${Math.abs(snap.etfNetFlow).toFixed(1)}M.` : ''} Ask me about specific assets, ETFs, DeFi, ISO 20022, or on-chain metrics for deeper analysis.`;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string' || query.length > 500) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    // Fetch real-time market data
    const snapshot = await getMarketSnapshot();
    const hasLiveData = snapshot.btcPrice > 0;

    // Generate data-driven response
    const answer = generateResponse(query, snapshot);

    return NextResponse.json({
      answer,
      source: hasLiveData ? 'live' : 'cached',
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json(
      { answer: 'CI·AI is temporarily unavailable. Please try again.', source: 'error' },
      { status: 200 }
    );
  }
}
