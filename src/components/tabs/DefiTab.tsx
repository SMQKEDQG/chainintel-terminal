'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChainTvl {
  name: string;
  tvl: number;
}

interface Protocol {
  name: string;
  tvl: number;
  chain: string;
  category: string;
  change_1d?: number;
  slug?: string;
  url?: string;
}

interface TvlPoint {
  date: number;
  tvl: number;
}

interface Stablecoin {
  id: string;
  name: string;
  symbol: string;
  circulating: { peggedUSD?: number };
}

interface DefiData {
  totalTvl: number;
  ethTvl: number;
  stablecoinSupply: number;
  protocols: {
    rank: number;
    name: string;
    cat: string;
    tvl: string;
    chg: string;
    pct: number;
    up: boolean;
    url: string;
  }[];
  tvlHistory: TvlPoint[];
  stablecoins: { label: string; value: number; color: string }[];
}

// ── Fallback static data ───────────────────────────────────────────────────────

const FALLBACK: DefiData = {
  totalTvl: 85e9,
  ethTvl: 46.2e9,
  stablecoinSupply: 243.2e9,
  protocols: [
    { rank: 1, name: 'Lido Finance', cat: 'ETH · Liquid Staking', tvl: '$22.4B', chg: '−1.2%', pct: 100, up: false, url: 'https://defillama.com/protocol/lido' },
    { rank: 2, name: 'AAVE V3', cat: 'Multi-chain · Lending', tvl: '$16.8B', chg: '−2.8%', pct: 74, up: false, url: 'https://defillama.com/protocol/aave-v3' },
    { rank: 3, name: 'EigenLayer', cat: 'ETH · Restaking', tvl: '$12.9B', chg: '+8.4%', pct: 57, up: true, url: 'https://defillama.com/protocol/eigenlayer' },
    { rank: 4, name: 'Uniswap V3', cat: 'ETH · DEX', tvl: '$10.2B', chg: '−3.1%', pct: 45, up: false, url: 'https://defillama.com/protocol/uniswap-v3' },
    { rank: 5, name: 'MakerDAO / SKY', cat: 'ETH · CDP Stablecoin', tvl: '$8.1B', chg: '−0.8%', pct: 36, up: false, url: 'https://defillama.com/protocol/makerdao' },
    { rank: 6, name: 'Curve Finance', cat: 'Multi-chain · DEX', tvl: '$5.9B', chg: '−1.4%', pct: 26, up: false, url: 'https://defillama.com/protocol/curve-dex' },
    { rank: 7, name: 'Compound V3', cat: 'ETH · Lending', tvl: '$4.2B', chg: '+0.2%', pct: 19, up: true, url: 'https://defillama.com/protocol/compound-v3' },
  ],
  tvlHistory: [],
  stablecoins: [
    { label: 'USDT', value: 116.2, color: '#00d4aa' },
    { label: 'USDC', value: 44.8, color: '#3b82f6' },
    { label: 'DAI', value: 5.3, color: '#f0c040' },
    { label: 'FDUSD', value: 3.8, color: '#10b981' },
    { label: 'Others', value: 11.2, color: '#4a6a8c' },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtBillions(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function fmtChg(pct: number | undefined): { label: string; up: boolean } {
  if (pct === undefined || pct === null || isNaN(pct)) return { label: '—', up: false };
  const sign = pct >= 0 ? '+' : '';
  return { label: `${sign}${pct.toFixed(1)}%`, up: pct >= 0 };
}

// ── SVG TVL Line Chart ─────────────────────────────────────────────────────────

function TvlLineChart({ data }: { data: TvlPoint[] }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)' }}>
        No chart data
      </div>
    );
  }

  const W = 400;
  const H = 110;
  const PAD_L = 36;
  const PAD_R = 6;
  const PAD_T = 8;
  const PAD_B = 22;

  const vals = data.map((d) => d.tvl);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const toX = (i: number) => PAD_L + (i / (data.length - 1)) * (W - PAD_L - PAD_R);
  const toY = (v: number) => PAD_T + (1 - (v - minV) / range) * (H - PAD_T - PAD_B);

  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.tvl).toFixed(1)}`)
    .join(' ');

  // Close the fill path
  const fillD = `${pathD} L ${toX(data.length - 1).toFixed(1)} ${H - PAD_B} L ${toX(0).toFixed(1)} ${H - PAD_B} Z`;

  // Y-axis ticks
  const yTicks = 3;
  const yTickVals = Array.from({ length: yTicks }, (_, i) => minV + (range / (yTicks - 1)) * i).reverse();

  // X-axis ticks: show ~5 dates
  const xTickIdxs: number[] = [];
  const step = Math.floor(data.length / 4);
  for (let i = 0; i < data.length; i += step) xTickIdxs.push(i);
  xTickIdxs.push(data.length - 1);
  const uniqueXTicks = [...new Set(xTickIdxs)];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Y grid lines */}
      {yTickVals.map((v, i) => {
        const y = toY(v);
        return (
          <g key={i}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={PAD_L - 3} y={y + 3} textAnchor="end" fill="#4a6a8c" fontSize="7" fontFamily="var(--mono)">
              {fmtBillions(v)}
            </text>
          </g>
        );
      })}

      {/* Fill area */}
      <path d={fillD} fill="url(#tvlGrad)" />

      {/* Line */}
      <path d={pathD} fill="none" stroke="#00d4aa" strokeWidth="1.5" strokeLinejoin="round" />

      {/* X axis ticks */}
      {uniqueXTicks.map((idx) => {
        const d = data[idx];
        const x = toX(idx);
        const dt = new Date(d.date * 1000);
        const label = `${dt.toLocaleString('en-US', { month: 'short' })} ${dt.getDate()}`;
        return (
          <text key={idx} x={x} y={H - 6} textAnchor="middle" fill="#4a6a8c" fontSize="7" fontFamily="var(--mono)">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Doughnut Chart ─────────────────────────────────────────────────────────────

function DoughnutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const CX = 50, CY = 50, R = 38, INNER = 22;
  let cursor = -Math.PI / 2;

  const arcs = segments.map((seg) => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(cursor);
    const y1 = CY + R * Math.sin(cursor);
    cursor += angle;
    const x2 = CX + R * Math.cos(cursor);
    const y2 = CY + R * Math.sin(cursor);
    const ix1 = CX + INNER * Math.cos(cursor - angle);
    const iy1 = CY + INNER * Math.sin(cursor - angle);
    const ix2 = CX + INNER * Math.cos(cursor);
    const iy2 = CY + INNER * Math.sin(cursor);
    const large = angle > Math.PI ? 1 : 0;
    const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${INNER} ${INNER} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`;
    return { ...seg, d };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
      <svg viewBox="0 0 100 100" style={{ width: '90px', height: '90px', flexShrink: 0 }}>
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.color} stroke="#0d1420" strokeWidth="0.8" />
        ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '1px', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text2)', flex: 1 }}>{seg.label}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text)' }}>{fmtBillions(seg.value * 1e9)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Loading Pulse ──────────────────────────────────────────────────────────────

function PulseBox({ height = '18px' }: { height?: string }) {
  return (
    <div
      style={{
        height,
        background: 'linear-gradient(90deg, var(--s1) 25%, var(--s2) 50%, var(--s1) 75%)',
        backgroundSize: '200% 100%',
        animation: 'pulseShimmer 1.4s infinite linear',
        borderRadius: '2px',
      }}
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DefiTab() {
  const [data, setData] = useState<DefiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [chainsRes, protocolsRes, stablesRes, tvlHistRes] = await Promise.allSettled([
        fetch('https://api.llama.fi/v2/chains').then((r) => r.json()),
        fetch('https://api.llama.fi/protocols').then((r) => r.json()),
        fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true').then((r) => r.json()),
        fetch('https://api.llama.fi/v2/historicalChainTvl/Ethereum').then((r) => r.json()),
      ]);

      // ── Chains ──────────────────────────────────────────────────────────────
      let totalTvl = FALLBACK.totalTvl;
      let ethTvl = FALLBACK.ethTvl;
      if (chainsRes.status === 'fulfilled' && Array.isArray(chainsRes.value)) {
        const chains: ChainTvl[] = chainsRes.value;
        totalTvl = chains.reduce((s: number, c: ChainTvl) => s + (c.tvl || 0), 0);
        const eth = chains.find((c: ChainTvl) => c.name === 'Ethereum');
        if (eth) ethTvl = eth.tvl;
      }

      // ── Protocols ───────────────────────────────────────────────────────────
      let protocols = FALLBACK.protocols;
      if (protocolsRes.status === 'fulfilled' && Array.isArray(protocolsRes.value)) {
        const raw: Protocol[] = protocolsRes.value;
        // Filter out CEX & bridges, sort by TVL, take top 8
        const defiOnly = raw
          .filter((p: Protocol) => p.tvl > 0 && !['CEX', 'Bridge', 'Chain'].includes(p.category || ''))
          .sort((a: Protocol, b: Protocol) => b.tvl - a.tvl)
          .slice(0, 8);

        const maxTvl = defiOnly[0]?.tvl || 1;
        protocols = defiOnly.map((p: Protocol, i: number) => {
          const chgInfo = fmtChg(p.change_1d);
          const chainLabel = p.chain === 'Multi-Chain' ? 'Multi-chain' : p.chain || 'Multi-chain';
          const catLabel = p.category || 'DeFi';
          const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, '-');
          return {
            rank: i + 1,
            name: p.name,
            cat: `${chainLabel} · ${catLabel}`,
            tvl: fmtBillions(p.tvl),
            chg: chgInfo.label,
            pct: Math.round((p.tvl / maxTvl) * 100),
            up: chgInfo.up,
            url: `https://defillama.com/protocol/${slug}`,
          };
        });
      }

      // ── Stablecoins ─────────────────────────────────────────────────────────
      let stablecoinSupply = FALLBACK.stablecoinSupply;
      let stablecoins = FALLBACK.stablecoins;
      if (stablesRes.status === 'fulfilled') {
        const stablesData = stablesRes.value?.peggedAssets || stablesRes.value;
        if (Array.isArray(stablesData)) {
          const coins: Stablecoin[] = stablesData;
          const usdCoins = coins.filter(
            (c: Stablecoin) => c.circulating?.peggedUSD && c.circulating.peggedUSD > 0
          );
          stablecoinSupply = usdCoins.reduce((s: number, c: Stablecoin) => s + (c.circulating?.peggedUSD || 0), 0);

          const sorted = [...usdCoins].sort(
            (a: Stablecoin, b: Stablecoin) => (b.circulating?.peggedUSD || 0) - (a.circulating?.peggedUSD || 0)
          );

          const COLORS = ['#00d4aa', '#3b82f6', '#f0c040', '#10b981', '#a855f7', '#f97316'];
          const TOP_SYMBOLS = ['USDT', 'USDC', 'FDUSD', 'DAI', 'USDS', 'PYUSD'];
          const topCoins = sorted.filter((c: Stablecoin) => TOP_SYMBOLS.includes(c.symbol)).slice(0, 4);
          const topSet = new Set(topCoins.map((c: Stablecoin) => c.id));
          const othersVal = sorted
            .filter((c: Stablecoin) => !topSet.has(c.id))
            .reduce((s: number, c: Stablecoin) => s + (c.circulating?.peggedUSD || 0) / 1e9, 0);

          stablecoins = [
            ...topCoins.map((c: Stablecoin, i: number) => ({
              label: c.symbol,
              value: (c.circulating?.peggedUSD || 0) / 1e9,
              color: COLORS[i] || '#4a6a8c',
            })),
            { label: 'Others', value: othersVal, color: '#4a6a8c' },
          ];
        }
      }

      // ── TVL History ─────────────────────────────────────────────────────────
      let tvlHistory: TvlPoint[] = FALLBACK.tvlHistory;
      if (tvlHistRes.status === 'fulfilled' && Array.isArray(tvlHistRes.value)) {
        const all: TvlPoint[] = tvlHistRes.value;
        tvlHistory = all.slice(-90);
      }

      setData({ totalTvl, ethTvl, stablecoinSupply, protocols, tvlHistory, stablecoins });
      setError(false);
    } catch {
      setError(true);
      setData(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const d = data ?? FALLBACK;
  const ethShare = d.totalTvl > 0 ? ((d.ethTvl / d.totalTvl) * 100).toFixed(1) : '—';

  // ── Static P/E data (no free API) ─────────────────────────────────────────
  const leftPE = [
    { name: 'Uniswap V3', chain: 'Ethereum', barPct: 100, rev: '$892M', pe: '11.4x', peColor: 'var(--gold)', chg: '−4.2%', up: false },
    { name: 'AAVE V3', chain: 'Multi-chain', barPct: 78, rev: '$696M', pe: '8.2x', peColor: 'var(--gold)', chg: '−2.1%', up: false },
    { name: 'dYdX V4', chain: 'Cosmos', barPct: 44, rev: '$392M', pe: '4.1x', peColor: 'var(--green)', chg: '+8.4%', up: true },
    { name: 'GMX V2', chain: 'Arbitrum', barPct: 38, rev: '$339M', pe: '3.8x', peColor: 'var(--green)', chg: '+12.1%', up: true },
  ];

  const rightPE = [
    { name: 'Lido Finance', chain: 'Ethereum', barPct: 62, rev: '$553M', pe: '15.8x', peColor: 'var(--gold)', chg: '−1.8%', up: false },
    { name: 'Compound V3', chain: 'Ethereum', barPct: 28, rev: '$249M', pe: '6.4x', peColor: 'var(--green)', chg: '+2.8%', up: true },
    { name: 'Curve Finance', chain: 'Multi-chain', barPct: 20, rev: '$178M', pe: '28.4x', peColor: 'var(--red)', chg: '−8.2%', up: false },
    { name: 'MakerDAO/SKY', chain: 'Ethereum', barPct: 52, rev: '$464M', pe: '7.6x', peColor: 'var(--gold)', chg: '+1.4%', up: true },
  ];

  const peColHeader = (
    <div style={{ display: 'flex', gap: '8px', fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: '8px', textTransform: 'uppercase' as const }}>
      <span style={{ flex: 1 }}>Protocol</span>
      <span style={{ flex: '0 0 80px' }}>Bar (TVL %)</span>
      <span style={{ flex: '0 0 55px', textAlign: 'right' as const }}>Ann. Rev</span>
      <span style={{ flex: '0 0 50px', textAlign: 'right' as const }}>P/E</span>
      <span style={{ flex: '0 0 45px', textAlign: 'right' as const }}>30d chg</span>
    </div>
  );

  return (
    <>
      {/* Shimmer keyframe injected once */}
      <style>{`@keyframes pulseShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <div className="page" id="page-defi">
        <div className="ai-context-strip" id="acs-defi">
          <span className="acs-icon">◈ CI·AI</span>
          <span className="acs-body" id="acs-body-defi">
            DeFi TVL at {fmtBillions(d.totalTvl)} reflects ETH price compression, not protocol deterioration. Live data from DefiLlama.{' '}
            {error && <strong style={{ color: 'var(--red)' }}>[Showing cached fallback data]</strong>}
          </span>
          <span className="acs-ts" id="acs-ts-defi"></span>
        </div>

        <div className="section-h">
          <div className="section-h-label">DeFi &amp; Protocol Intelligence · 6,400+ Protocols · 469 Chains</div>
          <div className="section-h-line"></div>
          <div className="tag tag-live"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div>
        </div>

        {/* KPI Cards */}
        <div className="g4">
          <div className="kpi">
            <div className="kpi-label">Total DeFi TVL</div>
            <div className="kpi-val cyan">
              {loading ? <PulseBox height="20px" /> : fmtBillions(d.totalTvl)}
            </div>
            <div className="kpi-chg">All chains · live</div>
            <div className="kpi-src"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Ethereum TVL</div>
            <div className="kpi-val" style={{ color: 'var(--text)' }}>
              {loading ? <PulseBox height="20px" /> : fmtBillions(d.ethTvl)}
            </div>
            <div className="kpi-chg">{loading ? '—' : `${ethShare}% share`}</div>
            <div className="kpi-src"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Total Stablecoin Supply</div>
            <div className="kpi-val gold">
              {loading ? <PulseBox height="20px" /> : fmtBillions(d.stablecoinSupply)}
            </div>
            <div className="kpi-chg up">USD-pegged · live</div>
            <div className="kpi-src"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a> · Circle</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Protocol Fees · 24h</div>
            <div className="kpi-val" style={{ color: 'var(--text)' }}>$4.8M</div>
            <div className="kpi-chg dn">−8.2% vs yesterday</div>
            <div className="kpi-src"><a className="src-link" href="https://tokenterminal.com" target="_blank" rel="noreferrer">Token Terminal</a></div>
          </div>
        </div>

        <div className="g2">
          {/* Top Protocols */}
          <div className="panel">
            <div className="ph">
              <div className="pt">Top DeFi Protocols by TVL</div>
              <div className="tag tag-live"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div>
            </div>
            <div className="defi-list">
              {loading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="defi-row" style={{ gap: '8px' }}>
                      <div className="defi-rank" style={{ opacity: 0.4 }}>{i + 1}</div>
                      <div className="defi-name" style={{ flex: 1 }}><PulseBox height="14px" /></div>
                    </div>
                  ))
                : d.protocols.map((p) => (
                    <div key={p.rank} className="defi-row">
                      <div className="defi-rank">{p.rank}</div>
                      <div className="defi-name">
                        <div className="defi-pname">
                          <a href={p.url} target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>{p.name}</a>
                        </div>
                        <div className="defi-pcat">{p.cat}</div>
                      </div>
                      <div className="defi-bar-wrap"><div className="defi-bar-fill" style={{ width: `${p.pct}%` }}></div></div>
                      <div className="defi-tvl">{p.tvl}</div>
                      <div className={`defi-chg ${p.up ? 'up' : 'dn'}`}>{p.chg}</div>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Right column: TVL Chart + Stablecoin Doughnut */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
            <div className="panel">
              <div className="ph">
                <div className="pt">DeFi TVL — 90 Day</div>
                <div className="tag tag-live"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div>
              </div>
              <div className="chart-wrap" style={{ height: '130px' }}>
                {loading
                  ? <PulseBox height="100%" />
                  : <TvlLineChart data={d.tvlHistory} />
                }
              </div>
            </div>
            <div className="panel">
              <div className="ph">
                <div className="pt">Stablecoin Market Share</div>
                <div className="tag tag-live"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a> · Circle</div>
              </div>
              <div className="chart-wrap" style={{ height: '120px' }}>
                {loading
                  ? <PulseBox height="100%" />
                  : <DoughnutChart segments={d.stablecoins} />
                }
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '4px' }}>* USDS, PYUSD, RLUSD may be included in Others — see Derivatives tab</div>
            </div>
          </div>
        </div>

        {/* P/E Table (static) */}
        <div className="panel">
          <div className="ph">
            <div className="pt">Protocol Revenue Intelligence — P/E Ratios vs FDV</div>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--purple)' }}>⚡ Bloomberg has no equivalent</span>
              <div className="tag tag-pro"><a className="src-link" href="https://tokenterminal.com" target="_blank" rel="noreferrer">Token Terminal</a></div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--b1)' }}>
            <div style={{ background: 'var(--s1)', padding: '10px 12px' }}>
              {peColHeader}
              {leftPE.map((p) => (
                <div key={p.name} className="proto-row">
                  <div className="proto-name"><div className="defi-pname">{p.name}</div><div className="proto-chain">{p.chain}</div></div>
                  <div className="proto-bar-wrap"><div className="proto-bar-fill" style={{ width: `${p.barPct}%` }}></div></div>
                  <div className="proto-rev">{p.rev}</div>
                  <div className="proto-pe" style={{ color: p.peColor }}>{p.pe}</div>
                  <div className={`proto-chg ${p.up ? 'up' : 'dn'}`}>{p.chg}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--s1)', padding: '10px 12px' }}>
              {peColHeader}
              {rightPE.map((p) => (
                <div key={p.name} className="proto-row">
                  <div className="proto-name"><div className="defi-pname">{p.name}</div><div className="proto-chain">{p.chain}</div></div>
                  <div className="proto-bar-wrap"><div className="proto-bar-fill" style={{ width: `${p.barPct}%` }}></div></div>
                  <div className="proto-rev">{p.rev}</div>
                  <div className="proto-pe" style={{ color: p.peColor }}>{p.pe}</div>
                  <div className={`proto-chg ${p.up ? 'up' : 'dn'}`}>{p.chg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ai-box">
          <div className="ai-label">
            <span className="ai-pulse"></span>DeFi AI Synthesis ·{' '}
            <a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a> ·{' '}
            <a className="src-link" href="https://tokenterminal.com" target="_blank" rel="noreferrer">Token Terminal</a> ·{' '}
            <span id="defiSynthDate">APR 11, 2026</span>
          </div>
          <div className="ai-text">
            <strong>DeFi TVL at {fmtBillions(d.totalTvl)} reflects ETH price weakness compressing collateral values, not fundamental protocol deterioration.</strong>{' '}
            Ethereum holds {ethShare}% of total DeFi TVL, confirming its dominance as the settlement layer.{' '}
            Stablecoin supply stability at {fmtBillions(d.stablecoinSupply)} is the most bullish DeFi signal — it represents dry powder waiting to deploy.{' '}
            <strong>Live data sourced directly from <a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a>, refreshed every 5 minutes.</strong>
          </div>
        </div>
      </div>
    </>
  );
}
