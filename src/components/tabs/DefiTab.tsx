'use client';

import { useState, useEffect, useCallback } from 'react';

// ── RLUSD Types ─────────────────────────────────────────────────────────────

interface RlusdData {
  symbol: string;
  name: string;
  price: number;
  pegDeviation: number;
  marketCap: number;
  circulatingSupply: number;
  totalVolume24h: number;
  change24h: number;
  chains: { name: string; share: number }[];
  reserves: {
    total: number;
    lastUpdated: string;
    composition: { type: string; pct: number }[];
  };
  sparkline7d: number[];
  source: string;
  updatedAt: number;
}

// ── RWA Types ────────────────────────────────────────────────────────────────

interface RwaProduct {
  name: string;
  ticker: string;
  issuer: string;
  value: number;
  apy: number;
  holders: number;
}

interface RwaAssetClass {
  name: string;
  value: number;
  change30d: number;
  holders: number;
  assets: number;
  avgApy: number;
  color: string;
  topProducts: RwaProduct[];
}

interface RwaChain {
  name: string;
  rwaValue: number;
  rwaCount: number;
  holders: number;
  share: number;
  stablecoinMcap: number;
}

interface RwaData {
  totalRwaValue: number;
  totalRwaChange30d: number;
  totalHolders: number;
  stablecoinMarketCap: number;
  stablecoinChange30d: number;
  assetClasses: RwaAssetClass[];
  chains: RwaChain[];
  treasuryAvgApy: number;
  treasuryApyChange7d: number;
  netFlows30d: number;
  projection2030: number;
  currentPenetration: number;
  milestones: { date: string; event: string }[];
  updatedAt: number;
}

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

// ── Loading state data — shown briefly while live data loads ──────────────────

const DEFI_LOADING_STATE: DefiData = {
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
    { label: 'USDT', value: 116.2, color: '#E8A534' },
    { label: 'USDC', value: 44.8, color: '#6B8AFF' },
    { label: 'DAI', value: 5.3, color: '#A78BFA' },
    { label: 'FDUSD', value: 3.8, color: '#34D399' },
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
          <stop offset="0%" stopColor="#E8A534" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#E8A534" stopOpacity="0.01" />
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
      <path d={pathD} fill="none" stroke="#E8A534" strokeWidth="1.5" strokeLinejoin="round" />

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

// ── RLUSD Peg Stability Chart ─────────────────────────────────────────────

function RlusdPegChart({ data }: { data: number[] }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)' }}>
        Loading peg data...
      </div>
    );
  }

  const W = 400;
  const H = 90;
  const PAD_L = 36;
  const PAD_R = 6;
  const PAD_T = 8;
  const PAD_B = 16;

  // Narrow Y range around $1.00 peg
  const minV = Math.min(...data, 0.995);
  const maxV = Math.max(...data, 1.005);
  const range = maxV - minV || 0.01;

  const toX = (i: number) => PAD_L + (i / (data.length - 1)) * (W - PAD_L - PAD_R);
  const toY = (v: number) => PAD_T + (1 - (v - minV) / range) * (H - PAD_T - PAD_B);

  const pathD = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(' ');

  // $1.00 peg reference line
  const pegY = toY(1.0);

  // Color: green if close to peg, yellow if deviation > 0.1%, red if > 0.5%
  const latestPrice = data[data.length - 1];
  const deviation = Math.abs(latestPrice - 1.0) * 100;
  const lineColor = deviation < 0.1 ? '#10b981' : deviation < 0.5 ? '#f0c040' : '#ef4444';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
      {/* $1.00 peg reference line */}
      <line x1={PAD_L} y1={pegY} x2={W - PAD_R} y2={pegY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 3" />
      <text x={PAD_L - 3} y={pegY + 3} textAnchor="end" fill="#4a6a8c" fontSize="7" fontFamily="var(--mono)">$1.00</text>

      {/* Y-axis labels */}
      <text x={PAD_L - 3} y={PAD_T + 4} textAnchor="end" fill="#4a6a8c" fontSize="7" fontFamily="var(--mono)">${maxV.toFixed(3)}</text>
      <text x={PAD_L - 3} y={H - PAD_B + 3} textAnchor="end" fill="#4a6a8c" fontSize="7" fontFamily="var(--mono)">${minV.toFixed(3)}</text>

      {/* Fill gradient under line */}
      <defs>
        <linearGradient id="rlusdGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${toX(data.length - 1).toFixed(1)} ${H - PAD_B} L ${toX(0).toFixed(1)} ${H - PAD_B} Z`} fill="url(#rlusdGrad)" />

      {/* Price line */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" />

      {/* Current price dot */}
      <circle cx={toX(data.length - 1)} cy={toY(latestPrice)} r="2.5" fill={lineColor} />
    </svg>
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
  const [rlusd, setRlusd] = useState<RlusdData | null>(null);
  const [rlusdLoading, setRlusdLoading] = useState(true);
  const [rwa, setRwa] = useState<RwaData | null>(null);
  const [rwaLoading, setRwaLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [chainsRes, protocolsRes, stablesRes, tvlHistRes, defiDeepRes] = await Promise.allSettled([
        fetch('https://api.llama.fi/v2/chains').then((r) => r.json()),
        fetch('https://api.llama.fi/protocols').then((r) => r.json()),
        fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true').then((r) => r.json()),
        fetch('https://api.llama.fi/v2/historicalChainTvl/Ethereum').then((r) => r.json()),
        fetch('/api/defi-deep').then((r) => r.json()),
      ]);

      // ── Chains ──────────────────────────────────────────────────────────────
      let totalTvl = DEFI_LOADING_STATE.totalTvl;
      let ethTvl = DEFI_LOADING_STATE.ethTvl;
      if (chainsRes.status === 'fulfilled' && Array.isArray(chainsRes.value)) {
        const chains: ChainTvl[] = chainsRes.value;
        totalTvl = chains.reduce((s: number, c: ChainTvl) => s + (c.tvl || 0), 0);
        const eth = chains.find((c: ChainTvl) => c.name === 'Ethereum');
        if (eth) ethTvl = eth.tvl;
      }

      // ── Protocols ───────────────────────────────────────────────────────────
      let protocols = DEFI_LOADING_STATE.protocols;
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
      let stablecoinSupply = DEFI_LOADING_STATE.stablecoinSupply;
      let stablecoins = DEFI_LOADING_STATE.stablecoins;
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

          const COLORS = ['#E8A534', '#6B8AFF', '#34D399', '#A78BFA', '#FB923C', '#F87171'];
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
      let tvlHistory: TvlPoint[] = DEFI_LOADING_STATE.tvlHistory;
      if (tvlHistRes.status === 'fulfilled' && Array.isArray(tvlHistRes.value)) {
        const all: TvlPoint[] = tvlHistRes.value;
        tvlHistory = all.slice(-90);
      }

      // Merge defi-deep aggregator data (DefiLlama yields/bridges/dex + CoinGecko defi)
      if (defiDeepRes.status === 'fulfilled' && defiDeepRes.value) {
        const deep = defiDeepRes.value;
        // Enrich with CoinGecko DeFi market cap if available
        if (deep.coingecko?.defiMcap) {
          // Store for display — accessible in render
          (globalThis as any).__ciDefiMcap = deep.coingecko.defiMcap;
          (globalThis as any).__ciDefiVolume = deep.coingecko.totalVolume;
        }
        // Bridge volume from DefiLlama
        if (deep.defiLlama?.bridges?.length > 0) {
          (globalThis as any).__ciBridges = deep.defiLlama.bridges.slice(0, 5);
        }
        // Top DEX volumes
        if (deep.defiLlama?.dexVolumes?.length > 0) {
          (globalThis as any).__ciDexVolumes = deep.defiLlama.dexVolumes.slice(0, 5);
        }
        // Top yields
        if (deep.defiLlama?.topYields?.length > 0) {
          (globalThis as any).__ciTopYields = deep.defiLlama.topYields.slice(0, 8);
        }
      }

      setData({ totalTvl, ethTvl, stablecoinSupply, protocols, tvlHistory, stablecoins });
      setError(false);
    } catch {
      setError(true);
      setData(DEFI_LOADING_STATE);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch RLUSD data ──────────────────────────────────────────────────────
  const fetchRlusd = useCallback(async () => {
    try {
      const res = await fetch('/api/rlusd');
      if (res.ok) {
        const json = await res.json();
        setRlusd(json);
      }
    } catch {
      // silent fail, will show fallback
    } finally {
      setRlusdLoading(false);
    }
  }, []);

  // ── Fetch RWA data ────────────────────────────────────────────────────────
  const fetchRwa = useCallback(async () => {
    try {
      const res = await fetch('/api/rwa');
      if (res.ok) {
        const json = await res.json();
        setRwa(json);
      }
    } catch {
      // silent fail
    } finally {
      setRwaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchRlusd();
    fetchRwa();
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    const rlusdInterval = setInterval(fetchRlusd, 2 * 60 * 1000);
    const rwaInterval = setInterval(fetchRwa, 10 * 60 * 1000);
    return () => { clearInterval(interval); clearInterval(rlusdInterval); clearInterval(rwaInterval); };
  }, [fetchAll, fetchRlusd, fetchRwa]);

  const d = data ?? DEFI_LOADING_STATE;
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
        {/* Loading indicator shown while initial fetch is pending */}
        {loading && !data && (
          <div className="connecting-indicator" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 6px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.12em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'connectingPulse 2s infinite' }} />
            CONNECTING...
          </div>
        )}
        <div className="ai-context-strip" id="acs-defi">
          <span className="acs-icon">◈ CI·AI</span>
          <span className="acs-body" id="acs-body-defi">
            {(() => {
              const topProto = d.protocols[0];
              const tvlNum = d.totalTvl;
              const tvlLevel = tvlNum > 100e9 ? 'elevated' : tvlNum > 80e9 ? 'healthy' : tvlNum > 50e9 ? 'compressed' : 'low';
              const rising = d.protocols.filter(p => p.up).length;
              return <>DeFi TVL at <strong>{fmtBillions(tvlNum)}</strong> — {tvlLevel} levels. {rising} of {d.protocols.length} top protocols trending up.{topProto ? ` ${topProto.name} leads at ${topProto.tvl}.` : ''} <strong>{tvlLevel === 'compressed' || tvlLevel === 'low' ? 'Compressed TVL + rising stablecoin supply = capital waiting on the sideline.' : 'Capital deployed across DeFi remains resilient.'}</strong>{error ? ' [Cached fallback]' : ''}</>;
            })()}
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
                          <a href={p.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{p.name}</a>
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
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '4px' }}>* USDS, PYUSD, RLUSD tracked separately below</div>
            </div>
          </div>
        </div>

        {/* ── RLUSD TRACKER ──────────────────────────────────────────────────── */}
        <div className="section-h">
          <div className="section-h-label">RLUSD Stablecoin Intelligence · Ripple USD</div>
          <div className="section-h-line"></div>
          <div className="tag tag-live"><a className="src-link" href="https://www.coingecko.com/en/coins/ripple-usd" target="_blank" rel="noreferrer">CoinGecko</a> · <a className="src-link" href="https://ripple.com/solutions/stablecoin/transparency/" target="_blank" rel="noreferrer">Ripple Transparency</a></div>
        </div>

        <div className="g5">
          <div className="kpi">
            <div className="kpi-label">RLUSD Price</div>
            <div className="kpi-val" style={{ color: 'var(--accent)' }}>
              {rlusdLoading ? <PulseBox height="20px" /> : `$${(rlusd?.price ?? 1.0).toFixed(4)}`}
            </div>
            <div className={`kpi-chg ${(rlusd?.pegDeviation ?? 0) < 0.1 ? 'up' : 'dn'}`}>
              {rlusdLoading ? '—' : `Peg Δ ${(rlusd?.pegDeviation ?? 0).toFixed(3)}%`}
            </div>
            <div className="kpi-src"><a className="src-link" href="https://www.coingecko.com/en/coins/ripple-usd" target="_blank" rel="noreferrer">CoinGecko</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Market Cap</div>
            <div className="kpi-val" style={{ color: 'var(--text)' }}>
              {rlusdLoading ? <PulseBox height="20px" /> : fmtBillions(rlusd?.marketCap ?? 0)}
            </div>
            <div className="kpi-chg up">CoinGecko rank snapshot</div>
            <div className="kpi-src"><a className="src-link" href="https://www.coingecko.com/en/coins/ripple-usd" target="_blank" rel="noreferrer">CoinGecko</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Circulating Supply</div>
            <div className="kpi-val" style={{ color: 'var(--text)' }}>
              {rlusdLoading ? <PulseBox height="20px" /> : `${((rlusd?.circulatingSupply ?? 0) / 1e9).toFixed(2)}B`}
            </div>
            <div className="kpi-chg">RLUSD tokens</div>
            <div className="kpi-src"><a className="src-link" href="https://ripple.com/solutions/stablecoin/transparency/" target="_blank" rel="noreferrer">Ripple</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">24h Volume</div>
            <div className="kpi-val" style={{ color: 'var(--gold)' }}>
              {rlusdLoading ? <PulseBox height="20px" /> : fmtBillions(rlusd?.totalVolume24h ?? 0)}
            </div>
            <div className={`kpi-chg ${(rlusd?.change24h ?? 0) >= 0 ? 'up' : 'dn'}`}>
              {rlusdLoading ? '—' : `${(rlusd?.change24h ?? 0) >= 0 ? '+' : ''}${(rlusd?.change24h ?? 0).toFixed(2)}%`}
            </div>
            <div className="kpi-src"><a className="src-link" href="https://www.coingecko.com/en/coins/ripple-usd" target="_blank" rel="noreferrer">CoinGecko</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Reserve Backing</div>
            <div className="kpi-val" style={{ color: 'var(--green)' }}>
              {rlusdLoading ? <PulseBox height="20px" /> : fmtBillions(rlusd?.reserves?.total ?? 1454100000)}
            </div>
            <div className="kpi-chg up">1:1 USD backed</div>
            <div className="kpi-src"><a className="src-link" href="https://ripple.com/solutions/stablecoin/transparency/" target="_blank" rel="noreferrer">Ripple Transparency</a></div>
          </div>
        </div>

        <div className="g2">
          {/* RLUSD Details Panel */}
          <div className="panel">
            <div className="ph">
              <div className="pt">RLUSD Reserve Composition & Chain Distribution</div>
              <div className="tag tag-live"><a className="src-link" href="https://ripple.com/solutions/stablecoin/transparency/" target="_blank" rel="noreferrer">Ripple Transparency</a></div>
            </div>
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: '8px', textTransform: 'uppercase' }}>RESERVE COMPOSITION</div>
              {(rlusd?.reserves?.composition ?? [
                { type: 'USD Deposits', pct: 78 },
                { type: 'US Treasury Bills', pct: 18 },
                { type: 'Other Cash Equivalents', pct: 4 },
              ]).map((r) => (
                <div key={r.type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text2)', flex: '0 0 160px' }}>{r.type}</span>
                  <div style={{ flex: 1, height: '8px', background: 'var(--s3)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ width: `${r.pct}%`, height: '100%', background: r.pct > 50 ? 'var(--accent)' : r.pct > 10 ? 'var(--blue)' : 'var(--gold)', borderRadius: '1px', transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', flex: '0 0 35px', textAlign: 'right' }}>{r.pct}%</span>
                </div>
              ))}

              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.08em', marginTop: '14px', marginBottom: '8px', textTransform: 'uppercase' }}>CHAIN DISTRIBUTION</div>
              {(rlusd?.chains ?? [
                { name: 'XRP Ledger', share: 62 },
                { name: 'Ethereum', share: 38 },
              ]).map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text2)', flex: '0 0 160px' }}>{c.name}</span>
                  <div style={{ flex: 1, height: '8px', background: 'var(--s3)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.share}%`, height: '100%', background: c.name === 'XRP Ledger' ? 'var(--accent)' : 'var(--blue)', borderRadius: '1px', transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', flex: '0 0 35px', textAlign: 'right' }}>{c.share}%</span>
                </div>
              ))}

              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '10px' }}>
                Last audit: {rlusd?.reserves?.lastUpdated ?? '2026-04-02'} · <a className="src-link" href="https://ripple.com/solutions/stablecoin/transparency/" target="_blank" rel="noreferrer">View full report ↗</a>
              </div>
            </div>
          </div>

          {/* RLUSD 7-Day Price Chart + Key Facts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
            <div className="panel">
              <div className="ph">
                <div className="pt">RLUSD Peg Stability — 7 Day</div>
                <div className="tag tag-live"><a className="src-link" href="https://www.coingecko.com/en/coins/ripple-usd" target="_blank" rel="noreferrer">CoinGecko</a></div>
              </div>
              <div className="chart-wrap" style={{ height: '100px' }}>
                {rlusdLoading ? (
                  <PulseBox height="100%" />
                ) : (
                  <RlusdPegChart data={rlusd?.sparkline7d ?? []} />
                )}
              </div>
            </div>
            <div className="panel">
              <div className="ph">
                <div className="pt">RLUSD Key Facts</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
                {[
                  { label: 'Issuer', value: 'Ripple Labs Inc.', color: 'var(--text)' },
                  { label: 'Backed By', value: '1:1 USD reserves (deposits + T-bills)', color: 'var(--green)' },
                  { label: 'Networks', value: 'XRP Ledger + Ethereum', color: 'var(--accent)' },
                  { label: 'Regulatory', value: 'NYDFS-regulated stablecoin', color: 'var(--gold)' },
                  { label: 'Launch', value: 'December 2024', color: 'var(--text2)' },
                  { label: 'Competitors', value: 'USDT, USDC, PYUSD', color: 'var(--text2)' },
                ].map((fact) => (
                  <div key={fact.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.05em' }}>{fact.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: fact.color }}>{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RWA TOKENIZATION DASHBOARD ──────────────────────────────── */}
        <div className="section-h">
          <div className="section-h-label">RWA Tokenization Intelligence · $29.25B Market</div>
          <div className="section-h-line"></div>
          <div className="tag tag-live"><a className="src-link" href="https://app.rwa.xyz" target="_blank" rel="noreferrer">RWA.xyz</a></div>
        </div>

        {/* RWA KPI Row */}
        <div className="g5">
          <div className="kpi">
            <div className="kpi-label">Total RWA Value</div>
            <div className="kpi-val" style={{ color: 'var(--accent)' }}>
              {rwaLoading ? <PulseBox height="20px" /> : fmtBillions(rwa?.totalRwaValue ?? 29250000000)}
            </div>
            <div className="kpi-chg up">{rwaLoading ? '—' : `+${(rwa?.totalRwaChange30d ?? 7.99).toFixed(1)}% 30d`}</div>
            <div className="kpi-src"><a className="src-link" href="https://app.rwa.xyz" target="_blank" rel="noreferrer">RWA.xyz</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Tokenized Treasuries</div>
            <div className="kpi-val" style={{ color: 'var(--green)' }}>
              {rwaLoading ? <PulseBox height="20px" /> : fmtBillions(rwa?.assetClasses?.[0]?.value ?? 13530000000)}
            </div>
            <div className="kpi-chg up">{rwaLoading ? '—' : `+${(rwa?.assetClasses?.[0]?.change30d ?? 17.51).toFixed(1)}% 30d`}</div>
            <div className="kpi-src"><a className="src-link" href="https://app.rwa.xyz/treasuries" target="_blank" rel="noreferrer">RWA.xyz</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Treasury Avg APY</div>
            <div className="kpi-val" style={{ color: 'var(--gold)' }}>
              {rwaLoading ? <PulseBox height="20px" /> : `${(rwa?.treasuryAvgApy ?? 3.34).toFixed(2)}%`}
            </div>
            <div className="kpi-chg up">{rwaLoading ? '—' : `+${(rwa?.treasuryApyChange7d ?? 0.98).toFixed(2)}% 7d`}</div>
            <div className="kpi-src"><a className="src-link" href="https://app.rwa.xyz/treasuries" target="_blank" rel="noreferrer">RWA.xyz</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Total Holders</div>
            <div className="kpi-val" style={{ color: 'var(--text)' }}>
              {rwaLoading ? <PulseBox height="20px" /> : `${((rwa?.totalHolders ?? 723233) / 1000).toFixed(1)}K`}
            </div>
            <div className="kpi-chg">Across all assets</div>
            <div className="kpi-src"><a className="src-link" href="https://app.rwa.xyz" target="_blank" rel="noreferrer">RWA.xyz</a></div>
          </div>
          <div className="kpi">
            <div className="kpi-label">30-Day Net Flows</div>
            <div className="kpi-val" style={{ color: 'var(--green)' }}>
              {rwaLoading ? <PulseBox height="20px" /> : fmtBillions(rwa?.netFlows30d ?? 210490000)}
            </div>
            <div className="kpi-chg up">Net inflows</div>
            <div className="kpi-src"><a className="src-link" href="https://app.rwa.xyz" target="_blank" rel="noreferrer">RWA.xyz</a></div>
          </div>
        </div>

        {/* RWA Asset Class Breakdown + Chain Distribution */}
        <div className="g2">
          {/* Asset Class Breakdown */}
          <div className="panel">
            <div className="ph">
              <div className="pt">RWA Market by Asset Class</div>
              <div className="tag tag-live"><a className="src-link" href="https://app.rwa.xyz" target="_blank" rel="noreferrer">RWA.xyz</a></div>
            </div>
            <div style={{ padding: '4px 0' }}>
              {rwaLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}><PulseBox height="24px" /></div>
                ))
              ) : (
                (rwa?.assetClasses ?? []).map((ac) => {
                  const maxVal = Math.max(...(rwa?.assetClasses ?? []).map(a => a.value));
                  const barPct = maxVal > 0 ? (ac.value / maxVal) * 100 : 0;
                  return (
                    <div key={ac.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: ac.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text2)', flex: '0 0 100px' }}>{ac.name}</span>
                      <div style={{ flex: 1, height: '10px', background: 'var(--s3)', borderRadius: '1px', overflow: 'hidden' }}>
                        <div style={{ width: `${barPct}%`, height: '100%', background: ac.color, borderRadius: '1px', transition: 'width 0.6s ease', opacity: 0.8 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', flex: '0 0 55px', textAlign: 'right' }}>{fmtBillions(ac.value)}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: ac.change30d >= 0 ? 'var(--green)' : 'var(--red)', flex: '0 0 50px', textAlign: 'right' }}>
                        {ac.change30d >= 0 ? '+' : ''}{ac.change30d.toFixed(1)}%
                      </span>
                    </div>
                  );
                })
              )}
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '8px' }}>
                Source: <a className="src-link" href="https://app.rwa.xyz" target="_blank" rel="noreferrer">RWA.xyz</a> · Excludes stablecoins · Updated {rwa ? new Date(rwa.updatedAt).toLocaleTimeString() : '—'}
              </div>
            </div>
          </div>

          {/* Chain Distribution + Treasury Leaders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
            <div className="panel">
              <div className="ph">
                <div className="pt">RWA Value by Chain</div>
                <div className="tag tag-live"><a className="src-link" href="https://app.rwa.xyz/networks" target="_blank" rel="noreferrer">RWA.xyz</a></div>
              </div>
              <div style={{ padding: '4px 0' }}>
                {rwaLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ marginBottom: '6px' }}><PulseBox height="18px" /></div>
                  ))
                ) : (
                  (rwa?.chains ?? []).slice(0, 7).map((ch) => (
                    <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text2)', flex: '0 0 80px' }}>{ch.name}</span>
                      <div style={{ flex: 1, height: '7px', background: 'var(--s3)', borderRadius: '1px', overflow: 'hidden' }}>
                        <div style={{ width: `${ch.share}%`, height: '100%', background: 'var(--accent)', borderRadius: '1px', opacity: Math.max(0.3, ch.share / 60), transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text)', flex: '0 0 50px', textAlign: 'right' }}>{fmtBillions(ch.rwaValue)}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', flex: '0 0 35px', textAlign: 'right' }}>{ch.share.toFixed(1)}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="panel">
              <div className="ph">
                <div className="pt">Top Treasury Products</div>
                <div className="tag tag-live"><a className="src-link" href="https://app.rwa.xyz/treasuries" target="_blank" rel="noreferrer">RWA.xyz</a></div>
              </div>
              <div style={{ padding: '2px 0' }}>
                {rwaLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ marginBottom: '6px' }}><PulseBox height="16px" /></div>
                  ))
                ) : (
                  (rwa?.assetClasses?.[0]?.topProducts ?? []).map((p, i) => (
                    <div key={p.ticker} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', padding: '3px 0', borderBottom: i < 4 ? '1px solid var(--b1)' : 'none' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', width: '14px' }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)' }}>{p.ticker}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>{p.issuer}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--accent)', textAlign: 'right' }}>{fmtBillions(p.value)}</span>
                      {p.apy > 0 && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--gold)', width: '40px', textAlign: 'right' }}>{p.apy.toFixed(2)}%</span>
                      )}
                    </div>
                  ))
                )}
              </div>
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
            <span className="ai-pulse"></span>DeFi &amp; RWA AI Synthesis ·{' '}
            <a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a> ·{' '}
            <a className="src-link" href="https://app.rwa.xyz" target="_blank" rel="noreferrer">RWA.xyz</a> ·{' '}
            <a className="src-link" href="https://tokenterminal.com" target="_blank" rel="noreferrer">Token Terminal</a>
          </div>
          <div className="ai-text">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--accent)', flexShrink: 0 }}>▸</span><span><strong>DeFi TVL at {fmtBillions(d.totalTvl)}</strong> — Ethereum holds {ethShare}% share. Stablecoin supply at {fmtBillions(d.stablecoinSupply)} represents dry powder waiting to deploy.</span></div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span><span><strong>RWA market at {fmtBillions(rwa?.totalRwaValue ?? 29250000000)} (+{(rwa?.totalRwaChange30d ?? 7.99).toFixed(1)}% 30d)</strong> — tokenized Treasuries dominate at {fmtBillions(rwa?.assetClasses?.[0]?.value ?? 13530000000)}, averaging {(rwa?.treasuryAvgApy ?? 3.34).toFixed(2)}% APY. BlackRock BUIDL + Circle USYC + Ondo USDY hold $7B combined.</span></div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--gold)', flexShrink: 0 }}>▸</span><span><strong>RLUSD at {fmtBillions(rlusd?.marketCap ?? 1440000000)}</strong> — Ripple&apos;s NYDFS-regulated stablecoin on XRPL + Ethereum. 1:1 USD reserve-backed. Growing challenger to USDT/USDC dominance.</span></div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--blue)', flexShrink: 0 }}>▸</span><span><strong>Keyrock/Securitize forecast: $400B tokenized RWA by 2030</strong> — currently &lt;0.01% of $400T global addressable market. Treasury yield on-chain outperformed DeFi stablecoin rates 98% of Q1 2026 days.</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
