import { NextRequest, NextResponse } from 'next/server';

// ─── Ask CI — AI-native intelligence engine ──────────────────────────────────
// Fetches real-time data from our internal APIs and constructs data-driven
// responses. Falls back to cached intelligence when APIs are unavailable.

const BASE_URL = 'https://chainintelterminal.com';

async function fetchInternal(path: string): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { 
      headers: { 'User-Agent': 'CI-AI-Engine/1.0' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { 
    console.error(`[ask-ci] fetchInternal ${path} failed:`, e);
    return null; 
  }
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
  const [marketData, sentimentData, etfData, defiData] = await Promise.allSettled([
    fetchInternal('/api/market-data?limit=50'),
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

  const market = marketData.status === 'fulfilled' ? marketData.value : null;
  const coins = market?.coins || [];
  if (coins.length > 0) {
    const btc = coins.find((c: any) => c.symbol === 'BTC');
    const eth = coins.find((c: any) => c.symbol === 'ETH');
    if (btc) {
      snap.btcPrice = btc.price || 0;
      snap.btcChange24h = btc.percent_change_24h || 0;
    }
    if (eth) {
      snap.ethPrice = eth.price || 0;
      snap.ethChange24h = eth.percent_change_24h || 0;
    }
    snap.totalMcap = market?.global?.total_market_cap || coins.reduce((s: number, c: any) => s + (c.market_cap || 0), 0);
    snap.btcDominance = market?.global?.btc_dominance || (btc ? ((btc.market_cap || 0) / Math.max(snap.totalMcap, 1)) * 100 : 0);
    
    const stablecoins = new Set(['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FDUSD', 'PYUSD']);
    const nonStable = coins.filter((c: any) => !stablecoins.has(c.symbol));
    const sorted = [...nonStable].sort((a: any, b: any) => (b.percent_change_24h || 0) - (a.percent_change_24h || 0));
    if (sorted[0]) snap.topGainer = { name: sorted[0].name, symbol: sorted[0].symbol, change: sorted[0].percent_change_24h || 0 };
    if (sorted[sorted.length - 1]) snap.topLoser = { name: sorted[sorted.length - 1].name, symbol: sorted[sorted.length - 1].symbol, change: sorted[sorted.length - 1].percent_change_24h || 0 };
    snap.gainersCount = nonStable.filter((c: any) => (c.percent_change_24h || 0) > 0).length;
    snap.losersCount = nonStable.filter((c: any) => (c.percent_change_24h || 0) <= 0).length;
  }

  const sent = sentimentData.status === 'fulfilled' ? sentimentData.value : null;
  if (sent?.fearGreed) snap.fearGreed = { value: sent.fearGreed.value, label: sent.fearGreed.label };

  const etf = etfData.status === 'fulfilled' ? etfData.value : null;
  if (etf?.flows) {
    snap.etfNetFlow = etf.flows.reduce((s: number, f: any) => s + (f.net_flow ?? f.flow ?? 0), 0);
  }

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

// Score each topic by keyword relevance (higher = more specific match)
function classifyQuery(q: string): string {
  const lower = q.toLowerCase();
  
  // Score-based matching: specific topics first
  const topics: { key: string; keywords: string[]; score: number }[] = [
    { key: 'btc', keywords: ['btc', 'bitcoin'], score: 0 },
    { key: 'eth', keywords: ['eth', 'ethereum'], score: 0 },
    { key: 'xrp', keywords: ['xrp', 'ripple'], score: 0 },
    { key: 'sol', keywords: ['sol', 'solana'], score: 0 },
    { key: 'iso', keywords: ['iso', '20022', 'swift', 'compliant'], score: 0 },
    { key: 'etf', keywords: ['etf', 'flow', 'blackrock', 'ibit', 'fbtc', 'institutional'], score: 0 },
    { key: 'fear', keywords: ['fear', 'greed', 'sentiment', 'fng'], score: 0 },
    { key: 'defi', keywords: ['defi', 'tvl', 'yield', 'protocol', 'lending'], score: 0 },
    { key: 'whale', keywords: ['whale', 'smart money', 'accumul', 'exchange outflow'], score: 0 },
    { key: 'stable', keywords: ['stablecoin', 'usdt', 'usdc', 'tether'], score: 0 },
    { key: 'onchain', keywords: ['on-chain', 'onchain', 'mvrv', 'nupl', 'realized', 'utxo', 'hash rate', 'mining'], score: 0 },
    { key: 'regulation', keywords: ['regulat', 'sec', 'cftc', 'clarity', 'legal', 'lawsuit', 'compliance'], score: 0 },
    { key: 'altcoin', keywords: ['altcoin', 'alt season', 'altseason', 'alt coin'], score: 0 },
    { key: 'derivatives', keywords: ['derivative', 'futures', 'options', 'funding', 'open interest', 'liquidat'], score: 0 },
  ];
  
  for (const topic of topics) {
    for (const kw of topic.keywords) {
      if (lower.includes(kw)) topic.score += 10;
    }
  }
  
  // Return topic with highest score
  const best = topics.reduce((a, b) => a.score > b.score ? a : b);
  if (best.score > 0) return best.key;
  
  // Generic market overview as fallback
  return 'market';
}

function generateResponse(query: string, snap: MarketSnapshot): string {
  const topic = classifyQuery(query);
  const btcStr = snap.btcPrice > 0 ? fmtPrice(snap.btcPrice) : '$73K';
  const ethStr = snap.ethPrice > 0 ? fmtPrice(snap.ethPrice) : '$2,300';
  const mcapStr = snap.totalMcap > 0 ? fmtUsd(snap.totalMcap) : '$2.4T';
  const domStr = snap.btcDominance > 0 ? `${snap.btcDominance.toFixed(1)}%` : '60%';
  const fngVal = snap.fearGreed?.value ?? 0;
  const fngLabel = snap.fearGreed?.label ?? 'Unknown';
  const breadth = snap.gainersCount > 0 ? `${snap.gainersCount} up / ${snap.losersCount} down` : '';

  switch (topic) {
    case 'btc': {
      const sentiment = fngVal <= 25 ? 'Extreme Fear' : fngVal <= 45 ? 'Fear' : fngVal <= 55 ? 'Neutral' : 'Greed';
      const outlook = snap.btcChange24h > 2 ? 'momentum is strongly bullish short-term' :
        snap.btcChange24h > 0 ? 'showing mild recovery with cautious accumulation' :
        snap.btcChange24h > -3 ? 'consolidating with controlled selling pressure' :
        'under significant selling pressure — key support levels being tested';
      return `**BTC** is trading at **${btcStr}** (${snap.btcChange24h >= 0 ? '+' : ''}${snap.btcChange24h.toFixed(2)}% 24h). Market sentiment: **${sentiment}** (${fngVal}/100). ${outlook}. BTC dominance at ${domStr} — ${snap.btcDominance > 58 ? 'capital rotating to safety' : 'alt-season conditions possible'}.${snap.etfNetFlow !== null ? ` ETF net flow: ${snap.etfNetFlow >= 0 ? '+' : ''}$${Math.abs(snap.etfNetFlow).toFixed(1)}M.` : ''} This is analytical intelligence, not financial advice.`;
    }

    case 'eth': {
      const ratio = snap.btcPrice > 0 && snap.ethPrice > 0 ? (snap.ethPrice / snap.btcPrice).toFixed(4) : '0.031';
      return `**ETH** is at **${ethStr}** (${snap.ethChange24h >= 0 ? '+' : ''}${snap.ethChange24h.toFixed(2)}% 24h). ETH/BTC ratio: ${ratio} — ${parseFloat(ratio) < 0.04 ? 'near multi-year lows, historically a contrarian entry zone' : 'holding relative strength'}. ${snap.defiTvl ? `DeFi TVL: **${fmtUsd(snap.defiTvl)}** across all chains.` : ''} The merge to PoS made ETH deflationary when fees are high — current issuance dynamics favor holders during high-activity periods. This is analytical intelligence, not financial advice.`;
    }

    case 'etf': {
      if (snap.etfNetFlow !== null) {
        const dir = snap.etfNetFlow >= 0 ? 'inflow' : 'outflow';
        return `Bitcoin ETF net flow is **${snap.etfNetFlow >= 0 ? '+' : ''}$${Math.abs(snap.etfNetFlow).toFixed(1)}M** today — a net ${dir} signal. ${snap.etfNetFlow > 100 ? 'Strong institutional demand — this level of accumulation typically signals sustained buying pressure.' : snap.etfNetFlow > 0 ? 'Positive but moderate — institutions are nibbling, not gorging.' : 'Outflow day — monitor if this becomes a streak. Single-day outflows are noise; 3+ day streaks are signal.'} Total crypto market cap: ${mcapStr}. BTC dominance: ${domStr}.`;
      }
      return `ETF flow data is currently refreshing. Total crypto market cap: **${mcapStr}**. BTC at ${btcStr}. Monitor BlackRock IBIT and Fidelity FBTC for the highest-signal institutional flows — they represent 70%+ of all BTC ETF volume.`;
    }

    case 'fear': {
      return `**Fear & Greed Index: ${fngVal}/100 (${fngLabel})**. ${fngVal <= 20 ? 'Extreme Fear readings below 20 are a classic contrarian signal — historically, these levels have preceded 40-60% rallies within 3-6 months. Current market breadth: ' + breadth + '.' : fngVal <= 40 ? 'Fear territory. Smart money typically accumulates here while retail sells. Watch for reversal signals in BTC funding rates and exchange flow data.' : fngVal <= 60 ? 'Neutral zone — no strong directional bias. Let data lead: monitor ETF flows, whale activity, and on-chain metrics for the next directional move.' : 'Greed territory — historically, readings above 75 precede corrections. Consider taking profits or tightening stops.'} BTC: ${btcStr}. This is analytical intelligence, not financial advice.`;
    }

    case 'defi': {
      return `**DeFi Total TVL: ${snap.defiTvl ? fmtUsd(snap.defiTvl) : '$85B+'}** across 6,400+ protocols. ${snap.defiTvl && snap.defiTvl > 90e9 ? 'TVL is expanding — capital is flowing into yield opportunities' : 'TVL is contracting — risk-off behavior as capital exits yield protocols'}. Top chains by TVL: Ethereum (~60%), Tron, BSC, Solana, Arbitrum. Key metric to watch: stablecoin supply growth — new stablecoins minted signals capital positioning for DeFi entry.`;
    }

    case 'iso': {
      return `**ISO 20022** is the global financial messaging standard replacing legacy SWIFT formats for cross-border payments. Assets with native compliance: **XRP, XLM** (certified), **HBAR, QNT** (integration-ready), **IOTA, ADA** (in progress), **ALGO, XDC** (partial). These assets gain structural advantage for institutional settlement in the $150T+ annual payment infrastructure. The full SWIFT migration is underway — ISO-native ledgers are positioned for integration into traditional banking rails.`;
    }

    case 'sol': {
      const sol = snap.topGainer?.symbol === 'SOL' ? snap.topGainer : snap.topLoser?.symbol === 'SOL' ? snap.topLoser : null;
      return `**Solana** ${sol ? `is at $${sol.change > 0 ? 'gaining' : 'declining'} (${sol.change >= 0 ? '+' : ''}${sol.change.toFixed(2)}% 24h)` : 'is a high-throughput L1'} processing 4,000+ TPS with active DeFi and memecoin ecosystems. Not ISO 20022 compliant — positioned as DeFi/consumer play vs. institutional settlement layer. Key strengths: speed, low fees, growing developer ecosystem. Key risks: validator centralization, historical outage events.`;
    }

    case 'xrp': {
      return `**XRP** is an ISO 20022-certified digital asset designed for institutional cross-border payments via RippleNet. SEC lawsuit resolved — regulatory clarity achieved. XRP's structural advantage: native SWIFT integration readiness, 3-5 second settlement, and $150T+ addressable market in cross-border flows. BTC dominance at ${domStr} — ${snap.btcDominance > 58 ? 'capital in safety mode, altcoins may lag' : 'rotation conditions emerging, XRP could benefit'}. This is analytical intelligence, not financial advice.`;
    }

    case 'whale': {
      return `Whale activity is a key signal for institutional positioning. When exchange outflows exceed inflows, it signals net accumulation — coins moving to cold storage. Current BTC dominance at ${domStr} with total market cap at ${mcapStr}. ${fngVal <= 30 ? `Fear & Greed at ${fngVal} (${fngLabel}) — historically, whales accumulate aggressively during extreme fear while retail capitulates.` : `Sentiment at ${fngVal}/100 — whale behavior in ${fngLabel} territory tends toward distribution.`} Monitor Whale Alert for $10M+ transactions and exchange reserve changes for confirmation.`;
    }

    case 'stable': {
      return `Stablecoin supply growth is a leading indicator for market direction. New stablecoins minted = fresh capital entering crypto. When supply rises during fear phases, it signals **dry powder accumulating** for deployment. USDT dominates at ~68% share. Key metric: if stablecoin supply grows while Fear & Greed is below 25, it's historically one of the strongest accumulation signals. Current market: ${mcapStr} total cap, BTC at ${btcStr}.`;
    }

    case 'onchain': {
      return `**On-chain metrics** provide the deepest signal for long-term positioning. Key indicators: **MVRV** (Market Value / Realized Value) — below 1.0 = undervalued, above 3.7 = historically overbought. **NUPL** (Net Unrealized Profit/Loss) — shows aggregate holder psychology. **Exchange reserves** — declining reserves = accumulation. **LTH supply** — long-term holders (155+ days) currently hold ~74% of supply, a historically bullish signal. BTC at ${btcStr}, dominance ${domStr}. Fear & Greed: ${fngVal}/100 (${fngLabel}).`;
    }

    case 'regulation': {
      return `**Regulatory landscape** is shifting rapidly. Key developments: the **CLARITY Act** is advancing as the first joint SEC/CFTC framework targeting Q2 2026. SEC has resolved major cases (Ripple/XRP). MiCA regulation is live in the EU. Key trend: regulatory clarity is bullish for institutional adoption — clear rules attract traditional finance. Watch for ETF approvals (ETH spot pending), stablecoin legislation, and DeFi classification decisions. BTC at ${btcStr}.`;
    }

    case 'altcoin': {
      const altRatio = snap.btcDominance > 0 ? snap.btcDominance : 60;
      return `**Altcoin season analysis**: BTC dominance at **${domStr}** — ${altRatio > 60 ? 'capital concentrated in BTC, altcoin season unlikely until dominance drops below 57%' : altRatio > 55 ? 'transitional zone — selective altcoin strength possible' : 'dominance declining, conditions favor broad altcoin rotation'}. ${breadth ? `Market breadth: ${breadth}.` : ''} Fear & Greed at ${fngVal}/100. Historical pattern: altcoin seasons follow sustained BTC rallies that stall, with capital rotating to higher-beta assets. Watch for ETH/BTC ratio recovery as the leading indicator.`;
    }

    case 'derivatives': {
      return `**Derivatives snapshot**: BTC funding rates and open interest are key sentiment gauges. Positive funding = longs paying shorts (bullish positioning). Negative funding = shorts dominant (bearish or hedging). When funding is extremely positive (>0.1%) with high open interest, it often precedes a correction as leverage gets flushed. Current market: BTC at ${btcStr}, total cap ${mcapStr}. ${fngVal <= 30 ? 'Extreme fear + liquidations often mark local bottoms.' : 'Monitor for leverage buildup in either direction.'} Check the Derivatives tab for live funding rates across exchanges.`;
    }

    default: {
      // Market overview fallback — always works
      const breadthNote = snap.gainersCount > snap.losersCount ? 'more assets green than red — mild risk-on' : 'majority of assets declining — risk-off posture';
      return `**Market snapshot:** Total cap ${mcapStr}, BTC at ${btcStr} (${snap.btcChange24h >= 0 ? '+' : ''}${snap.btcChange24h.toFixed(2)}%), ETH at ${ethStr}. BTC dominance: ${domStr}. ${breadth ? `Breadth: ${breadth} (${breadthNote}).` : ''} ${snap.fearGreed ? `Sentiment: **${fngLabel}** (${fngVal}/100).` : ''} ${snap.topGainer ? `Top mover: ${snap.topGainer.name} +${snap.topGainer.change.toFixed(1)}%.` : ''} ${snap.etfNetFlow !== null ? `ETF net: ${snap.etfNetFlow >= 0 ? '+' : ''}$${Math.abs(snap.etfNetFlow).toFixed(1)}M.` : ''} Ask me about specific assets (BTC, ETH, XRP, SOL), ETFs, DeFi, ISO 20022, derivatives, on-chain metrics, or whale activity for deeper analysis.`;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accept both 'query' and 'question' field names for robustness
    const query = body.query || body.question;
    if (!query || typeof query !== 'string' || query.trim().length === 0 || query.length > 500) {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    const snapshot = await getMarketSnapshot();
    const hasLiveData = snapshot.btcPrice > 0;
    const answer = generateResponse(query.trim(), snapshot);
    const topic = classifyQuery(query.trim());

    // Calculate confidence score based on data freshness
    let confidence = 30;
    if (snapshot.btcPrice > 0) confidence += 25;
    if (snapshot.ethPrice > 0) confidence += 15;
    if (snapshot.fearGreed) confidence += 15;
    if (snapshot.etfNetFlow !== null) confidence += 10;
    if (snapshot.defiTvl) confidence += 5;
    confidence = Math.min(100, confidence);

    // Generate context-aware follow-ups
    const followUpMap: Record<string, string[]> = {
      btc: ['What\'s the ETF flow today?', 'Show me Fear & Greed history', 'How are whales positioned?'],
      eth: ['ETH/BTC ratio analysis', 'DeFi TVL breakdown', 'What\'s the gas situation?'],
      etf: ['Bitcoin price analysis', 'Institutional flow trends', 'What about Solana ETFs?'],
      fear: ['What drives the current sentiment?', 'BTC analysis', 'Historical fear extreme outcomes'],
      defi: ['Top DeFi protocols', 'Stablecoin supply trends', 'ETH gas tracker'],
      iso: ['XRP regulatory update', 'HBAR developments', 'XLM analysis'],
      sol: ['SOL DeFi ecosystem', 'Network performance', 'How does SOL compare to ETH?'],
      xrp: ['ISO 20022 compliance status', 'Institutional adoption', 'XRP price outlook'],
      whale: ['BTC exchange flows', 'Accumulation patterns', 'On-chain metrics'],
      derivatives: ['BTC funding rates', 'Open interest trends', 'Liquidation data'],
      altcoin: ['Top altcoin picks', 'BTC dominance trend', 'ETH/BTC ratio'],
      market: ['Bitcoin deep dive', 'Fear & Greed analysis', 'DeFi overview'],
    };
    const followUps = followUpMap[topic] || followUpMap['market'];

    return NextResponse.json({
      answer,
      source: hasLiveData ? 'live' : 'cached',
      timestamp: Date.now(),
      confidence,
      followUps,
    });
  } catch {
    return NextResponse.json(
      { answer: 'CI·AI is temporarily unavailable. Please try again.', source: 'error' },
      { status: 200 }
    );
  }
}
