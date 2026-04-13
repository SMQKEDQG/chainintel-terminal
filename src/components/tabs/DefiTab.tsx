'use client';

import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const TVL_LABELS = ['Jan 9','Jan 23','Feb 6','Feb 20','Mar 6','Mar 20','Apr 3','Apr 9'];
const TVL_DATA   = [104, 98, 95, 91, 88, 86, 84, 85];

const defiChartData = {
  labels: TVL_LABELS,
  datasets: [{
    label: 'DeFi TVL ($B)',
    data: TVL_DATA,
    borderColor: '#00d4aa',
    backgroundColor: 'rgba(0,212,170,0.1)',
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.4,
    fill: true,
  }],
};

const defiChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index' as const, intersect: false } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4a6a8c', font: { size: 9 }, callback: (v: unknown) => `$${v}B` } },
    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#4a6a8c', font: { size: 9 } } },
  },
};

const stableChartData = {
  labels: ['USDT', 'USDC', 'DAI', 'FDUSD', 'Others'],
  datasets: [{
    data: [116.2, 44.8, 5.3, 3.8, 11.2],
    backgroundColor: ['#00d4aa', '#3b82f6', '#f0c040', '#10b981', '#4a6a8c'],
    borderColor: '#0d1420',
    borderWidth: 2,
  }],
};

const stableChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' as const, labels: { color: '#94b3d0', font: { size: 9 }, boxWidth: 10, padding: 8 } },
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: $${ctx.parsed}B` } },
  },
};

export default function DefiTab() {
  const protocols = [
    { rank: 1, name: 'Lido Finance', cat: 'ETH · Liquid Staking', tvl: '$22.4B', chg: '−1.2%', pct: 100, up: false, url: 'https://defillama.com/protocol/lido' },
    { rank: 2, name: 'AAVE V3', cat: 'Multi-chain · Lending', tvl: '$16.8B', chg: '−2.8%', pct: 74, up: false, url: 'https://defillama.com/protocol/aave-v3' },
    { rank: 3, name: 'EigenLayer', cat: 'ETH · Restaking', tvl: '$12.9B', chg: '+8.4%', pct: 57, up: true, url: 'https://defillama.com/protocol/eigenlayer' },
    { rank: 4, name: 'Uniswap V3', cat: 'ETH · DEX', tvl: '$10.2B', chg: '−3.1%', pct: 45, up: false, url: 'https://defillama.com/protocol/uniswap-v3' },
    { rank: 5, name: 'MakerDAO / SKY', cat: 'ETH · CDP Stablecoin', tvl: '$8.1B', chg: '−0.8%', pct: 36, up: false, url: 'https://defillama.com/protocol/makerdao' },
    { rank: 6, name: 'Curve Finance', cat: 'Multi-chain · DEX', tvl: '$5.9B', chg: '−1.4%', pct: 26, up: false, url: 'https://defillama.com/protocol/curve-dex' },
    { rank: 7, name: 'Compound V3', cat: 'ETH · Lending', tvl: '$4.2B', chg: '+0.2%', pct: 19, up: true, url: 'https://defillama.com/protocol/compound-v3' },
  ];

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
    <div className="page" id="page-defi">
      <div className="ai-context-strip" id="acs-defi">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-defi">
          DeFi TVL at $85B reflects ETH price compression, not protocol deterioration. Lido&apos;s $22.4B dominance confirms liquid staking as the killer DeFi use case.{' '}
          <strong>EigenLayer restaking (+8.4%) shows institutional thesis gaining traction.</strong>
        </span>
        <span className="acs-ts" id="acs-ts-defi"></span>
      </div>

      <div className="section-h">
        <div className="section-h-label">DeFi &amp; Protocol Intelligence · 6,400+ Protocols · 469 Chains</div>
        <div className="section-h-line"></div>
        <div className="tag tag-live"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div>
      </div>

      <div className="g4">
        <div className="kpi"><div className="kpi-label">Total DeFi TVL</div><div className="kpi-val cyan">$85.0B</div><div className="kpi-chg dn">−2.1% in 24h</div><div className="kpi-src"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div></div>
        <div className="kpi"><div className="kpi-label">Ethereum TVL</div><div className="kpi-val" style={{ color: 'var(--text)' }}>$46.2B</div><div className="kpi-chg">54.4% share</div><div className="kpi-src"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div></div>
        <div className="kpi"><div className="kpi-label">Total Stablecoin Supply</div><div className="kpi-val gold">$243.2B</div><div className="kpi-chg up">+0.4% in 7d</div><div className="kpi-src"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a> · Circle</div></div>
        <div className="kpi"><div className="kpi-label">Protocol Fees · 24h</div><div className="kpi-val" style={{ color: 'var(--text)' }}>$4.8M</div><div className="kpi-chg dn">−8.2% vs yesterday</div><div className="kpi-src"><a className="src-link" href="https://tokenterminal.com" target="_blank" rel="noreferrer">Token Terminal</a></div></div>
      </div>

      <div className="g2">
        <div className="panel">
          <div className="ph"><div className="pt">Top DeFi Protocols by TVL</div><div className="tag tag-live"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div></div>
          <div className="defi-list">
            {protocols.map((p) => (
              <div key={p.rank} className="defi-row">
                <div className="defi-rank">{p.rank}</div>
                <div className="defi-name">
                  <div className="defi-pname"><a href={p.url} target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>{p.name}</a></div>
                  <div className="defi-pcat">{p.cat}</div>
                </div>
                <div className="defi-bar-wrap"><div className="defi-bar-fill" style={{ width: `${p.pct}%` }}></div></div>
                <div className="defi-tvl">{p.tvl}</div>
                <div className={`defi-chg ${p.up ? 'up' : 'dn'}`}>{p.chg}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
          <div className="panel">
            <div className="ph"><div className="pt">DeFi TVL — 90 Day</div><div className="tag tag-live"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a></div></div>
            <div className="chart-wrap" style={{ height: '130px' }}>
              <Line id="defiChart" data={defiChartData} options={defiChartOptions} />
            </div>
          </div>
          <div className="panel">
            <div className="ph"><div className="pt">Stablecoin Market Share</div><div className="tag tag-live"><a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a> · Circle</div></div>
            <div className="chart-wrap" style={{ height: '120px' }}>
              <Doughnut id="stableChart" data={stableChartData} options={stableChartOptions} />
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '4px' }}>* USDS, PYUSD, RLUSD excluded from chart — see Derivatives tab</div>
          </div>
        </div>
      </div>

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
        <div className="ai-label"><span className="ai-pulse"></span>DeFi AI Synthesis · <a className="src-link" href="https://defillama.com" target="_blank" rel="noreferrer">DefiLlama</a> · <a className="src-link" href="https://tokenterminal.com" target="_blank" rel="noreferrer">Token Terminal</a> · <span id="defiSynthDate">APR 11, 2026</span></div>
        <div className="ai-text"><strong>DeFi TVL at $85B reflects ETH price weakness compressing collateral values, not fundamental protocol deterioration.</strong> Lido&apos;s $22.4B dominance confirms liquid staking as the killer DeFi use case post-Merge. EigenLayer&apos;s $12.9B at +8.4% amid a down market shows restaking thesis gaining institutional traction. <strong>Stablecoin supply stability at $243.2B is the most bullish DeFi signal — it represents dry powder waiting to deploy.</strong></div>
      </div>
    </div>
  );
}
