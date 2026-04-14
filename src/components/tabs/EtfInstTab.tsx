'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ── Types ────────────────────────────────────────────────────────────────────

interface AltcoinEtfFund {
  ticker: string;
  issuer: string;
  fundName: string;
  expRatio: string;
  launchDate: string;
  todayFlow: number;
  aum: number;
  sinceInception: number;
}

interface AltcoinEtfAsset {
  asset: string;
  assetPrice: number;
  totalAum: number;
  cumulativeInflows: number;
  todayNetFlow: number;
  weekNetFlow: number;
  inflowStreak: number;
  fundCount: number;
  funds: AltcoinEtfFund[];
}

interface AltcoinEtfData {
  xrp: AltcoinEtfAsset;
  sol: AltcoinEtfAsset;
  pending: { asset: string; issuer: string; status: string; filed: string; deadline: string }[];
  totalAltcoinEtfAum: number;
  totalAltcoinNetFlowToday: number;
  milestones: { date: string; event: string }[];
  updatedAt: number;
}

// ── Fallback static data ─────────────────────────────────────────────────────

const ETF_FLOW_LABELS = ['Mar 26','Mar 27','Mar 28','Mar 31','Apr 1','Apr 2','Apr 3','Apr 4','Apr 7','Apr 8','Apr 9','Apr 10','Apr 11','Apr 14'];
const ETF_FLOW_DATA   = [-84, 112, 203, -62, 88, 145, 92, -18, 134, 156, 176, 148, 190, 169.6];

const etfFlowChartData = {
  labels: ETF_FLOW_LABELS,
  datasets: [{
    label: 'Net Flow ($M)',
    data: ETF_FLOW_DATA,
    backgroundColor: ETF_FLOW_DATA.map((v) => v >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'),
    borderColor: ETF_FLOW_DATA.map((v) => v >= 0 ? '#10b981' : '#ef4444'),
    borderWidth: 1,
  }],
};

const etfFlowChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` $${ctx.parsed.y}M` } } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4a6a8c', font: { size: 9 }, callback: (v: unknown) => `$${v}M` } },
    x: { grid: { display: false }, ticks: { color: '#4a6a8c', font: { size: 8 } } },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFlow(v: number): string {
  const sign = v >= 0 ? '+' : '−';
  const abs = Math.abs(v);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}B`;
  return `${sign}$${abs.toFixed(1)}M`;
}

function fmtAum(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v.toFixed(0)}M`;
}

// ── Loading Pulse ─────────────────────────────────────────────────────────────

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

// ── Altcoin ETF Fund Table ───────────────────────────────────────────────────

function AltcoinFundTable({ data, asset, accentColor }: { data: AltcoinEtfAsset; asset: string; accentColor: string }) {
  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">{asset} ETF Daily Flows — {data.fundCount} Spot Funds</div>
        <div className="tag tag-live">
          <a className="src-link" href="https://sosovalue.com" target="_blank" rel="noreferrer">SoSoValue</a>
        </div>
      </div>
      <table className="dt">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Product</th>
            <th style={{ textAlign: 'left' }}>Issuer</th>
            <th>Today&apos;s Flow</th>
            <th>AUM</th>
            <th>Exp. Ratio</th>
            <th>Since Launch</th>
          </tr>
        </thead>
        <tbody>
          {data.funds.map((f) => (
            <tr key={f.ticker}>
              <td>
                <span className="aname">{f.fundName}</span>
                <span className="asym">{f.ticker}</span>
              </td>
              <td style={{ textAlign: 'left' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>
                  {f.issuer.toUpperCase()}
                </span>
              </td>
              <td className={f.todayFlow >= 0 ? 'up' : 'dn'}>
                {fmtFlow(f.todayFlow)}
              </td>
              <td>{fmtAum(f.aum)}</td>
              <td style={{ color: parseFloat(f.expRatio) > 1 ? 'var(--red)' : 'var(--muted)' }}>
                {f.expRatio}
              </td>
              <td className={f.sinceInception >= 0 ? 'up' : 'dn'}>
                {fmtFlow(f.sinceInception)}
              </td>
            </tr>
          ))}
          <tr style={{ borderTop: '1px solid var(--b3)' }}>
            <td colSpan={2}>
              <strong style={{ fontSize: '10px', color: 'var(--text)' }}>
                Total Net · All {asset} ETFs
              </strong>
            </td>
            <td className={data.todayNetFlow >= 0 ? 'up' : 'dn'}>
              <strong>{fmtFlow(data.todayNetFlow)}</strong>
            </td>
            <td>{fmtAum(data.totalAum)}</td>
            <td></td>
            <td className={data.cumulativeInflows >= 0 ? 'up' : 'dn'}>
              <strong>{fmtFlow(data.cumulativeInflows)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function EtfInstTab() {
  const [dateStr, setDateStr] = useState('');
  const [altcoinData, setAltcoinData] = useState<AltcoinEtfData | null>(null);
  const [altcoinLoading, setAltcoinLoading] = useState(true);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }, []);

  const fetchAltcoinEtfs = useCallback(async () => {
    try {
      const res = await fetch('/api/altcoin-etfs');
      if (res.ok) {
        const json = await res.json();
        setAltcoinData(json);
      }
    } catch {
      // silent fail
    } finally {
      setAltcoinLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAltcoinEtfs();
    const interval = setInterval(fetchAltcoinEtfs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAltcoinEtfs]);

  return (
    <div className="page" id="page-etfinst">
      {/* Shimmer keyframe */}
      <style>{`@keyframes pulseShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <div className="ai-context-strip" id="acs-etfinst">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-etfinst">
          IBIT absorbed $224M while GBTC bled $174M — this is fee-driven rotation (1.5% → 0.25%), not market exit.{' '}
          <strong>
            XRP ETFs crossed $1.4B cumulative inflows — institutional demand for altcoin exposure accelerating.
            {altcoinData ? ` Altcoin ETF AUM: ${fmtAum(altcoinData.totalAltcoinEtfAum)}.` : ''}
          </strong>
        </span>
        <span className="acs-ts" id="acs-ts-etfinst"></span>
      </div>

      {/* ── PENDING ETF APPLICATIONS ─────────────────────────────────── */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b2)', margin: '1px 0' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.14em', color: 'var(--accent)' }}>◈ ETF PIPELINE — APPROVED & PENDING · {altcoinData ? `${5 + altcoinData.pending.length}` : '10'} FILINGS</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>Source: SEC EDGAR · SoSoValue</span>
        </div>
        <div id="etfAppsFeed" style={{ overflowX: 'auto', padding: '8px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px' }}>
            {/* Live / Approved ETFs */}
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>7 ISSUERS</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', marginBottom: '3px' }}>Spot XRP ETFs</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--green)', letterSpacing: '0.08em' }}>LIVE · Nov 2025</div>
            </div>
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>5 ISSUERS</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', marginBottom: '3px' }}>Spot SOL ETFs</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--green)', letterSpacing: '0.08em' }}>LIVE · Jan 2026</div>
            </div>
            {(altcoinData?.pending ?? [
              { asset: 'DOGE', issuer: 'Bitwise', status: 'PENDING', filed: 'Feb 2026', deadline: 'Aug 2026' },
              { asset: 'LTC', issuer: 'Grayscale', status: 'PENDING', filed: 'Dec 2025', deadline: 'Jun 2026' },
              { asset: 'ADA', issuer: 'Grayscale', status: 'FILED', filed: 'Mar 2026', deadline: 'Sep 2026' },
            ]).slice(0, 3).map((app) => (
              <div key={app.issuer + app.asset} style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>{app.issuer}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', marginBottom: '3px' }}>{app.asset} ETF</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: app.status === 'FILED' ? 'var(--gold)' : 'var(--muted)', letterSpacing: '0.08em' }}>{app.status} · {app.filed}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BITCOIN ETF SECTION ──────────────────────────────────────── */}
      <div className="section-h">
        <div className="section-h-label">Bitcoin ETF Flow Intelligence</div>
        <div className="section-h-line"></div>
        <div className="tag tag-live"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noreferrer">Farside Investors</a> · Bloomberg ETF</div>
      </div>

      <div className="g5">
        <div className="kpi"><div className="kpi-label">Net Flow · Today</div><div className="kpi-val" style={{ color: 'var(--green)' }}>+$169.6M</div><div className="kpi-chg up">All BTC ETFs</div><div className="kpi-src"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noreferrer">Farside Investors</a></div></div>
        <div className="kpi"><div className="kpi-label">7-Day Net Flow</div><div className="kpi-val" style={{ color: 'var(--green)' }}>+$1.04B</div><div className="kpi-chg up">Cumulative 7 days</div><div className="kpi-src"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noreferrer">Farside Investors</a></div></div>
        <div className="kpi"><div className="kpi-label">Total AUM · BTC ETFs</div><div className="kpi-val" style={{ color: 'var(--text)' }}>$118.4B</div><div className="kpi-chg">All issuers</div><div className="kpi-src">Bloomberg ETF</div></div>
        <div className="kpi"><div className="kpi-label">Inflow Streak</div><div className="kpi-val" style={{ color: 'var(--accent)' }}>4 Days</div><div className="kpi-chg up">Since Apr 3</div><div className="kpi-src"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noreferrer">Farside Investors</a></div></div>
        <div className="kpi"><div className="kpi-label">IBIT AUM Rank</div><div className="kpi-val gold">#1 Global</div><div className="kpi-chg">BlackRock ETF</div><div className="kpi-src">Bloomberg ETF</div></div>
      </div>

      <div className="g2">
        <div className="panel">
          <div className="ph"><div className="pt">Bitcoin ETF Daily Flows — All US Issuers</div><div className="tag tag-live" id="etfFlowDate">{dateStr}</div></div>
          <table className="dt">
            <thead><tr><th style={{ textAlign: 'left' }}>Product</th><th style={{ textAlign: 'left' }}>Issuer</th><th>Today&apos;s Flow</th><th>AUM</th><th>Exp. Ratio</th><th>Since Launch</th></tr></thead>
            <tbody>
              <tr><td><span className="aname">iShares Bitcoin Trust</span><span className="asym">IBIT</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>BLACKROCK</span></td><td className="up">+$224.1M</td><td>$54.2B</td><td style={{ color: 'var(--muted)' }}>0.25%</td><td className="up">+$41.2B</td></tr>
              <tr><td><span className="aname">Wise Origin Bitcoin</span><span className="asym">FBTC</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>FIDELITY</span></td><td className="up">+$88.3M</td><td>$21.8B</td><td style={{ color: 'var(--muted)' }}>0.25%</td><td className="up">+$12.1B</td></tr>
              <tr><td><span className="aname">ARK 21Shares Bitcoin</span><span className="asym">ARKB</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>ARK INVEST</span></td><td className="up">+$31.2M</td><td>$4.9B</td><td style={{ color: 'var(--muted)' }}>0.21%</td><td className="up">+$3.8B</td></tr>
              <tr><td><span className="aname">Bitwise Bitcoin ETF</span><span className="asym">BITB</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>BITWISE</span></td><td className="up">+$18.4M</td><td>$4.1B</td><td style={{ color: 'var(--muted)' }}>0.20%</td><td className="up">+$2.9B</td></tr>
              <tr><td><span className="aname">VanEck Bitcoin ETF</span><span className="asym">HODL</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>VANECK</span></td><td className="up">+$4.8M</td><td>$0.9B</td><td style={{ color: 'var(--muted)' }}>0.20%</td><td className="up">+$0.7B</td></tr>
              <tr><td><span className="aname">Grayscale Bitcoin Trust</span><span className="asym">GBTC</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>GRAYSCALE</span></td><td className="dn">−$174.0M</td><td>$18.9B</td><td style={{ color: 'var(--red)' }}>1.50%</td><td className="dn">−$22.4B</td></tr>
              <tr style={{ borderTop: '1px solid var(--b3)' }}><td colSpan={2}><strong style={{ fontSize: '10px', color: 'var(--text)' }}>Total Net · All BTC ETFs · <span id="btcEtfTotalDate">{dateStr}</span></strong></td><td className="up"><strong>+$169.6M</strong></td><td>$118.4B</td><td></td><td className="up">+$39.8B</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
          <div className="panel">
            <div className="ph"><div className="pt">14-Day Flow History · Net BTC ETF</div><div className="tag tag-live"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noreferrer">Farside</a></div></div>
            <div className="chart-wrap" style={{ height: '130px' }}>
              <Bar id="etfFlowChart" data={etfFlowChartData} options={etfFlowChartOptions as any} />
            </div>
          </div>
          <div className="panel">
            <div className="ph"><div className="pt">Cumulative Since Jan 2024+</div><div className="tag tag-pro">Bloomberg ETF</div></div>
            <div className="etf-row"><div style={{ display: 'flex', flexDirection: 'column' }}><div className="etf-name">BlackRock IBIT</div><div className="etf-issuer">0.25% fee</div></div><div className="etf-flow up">+$41.2B</div></div>
            <div className="etf-row"><div style={{ display: 'flex', flexDirection: 'column' }}><div className="etf-name">Fidelity FBTC</div><div className="etf-issuer">0.25% fee</div></div><div className="etf-flow up">+$12.1B</div></div>
            <div className="etf-row"><div style={{ display: 'flex', flexDirection: 'column' }}><div className="etf-name">ARK ARKB</div><div className="etf-issuer">0.21% fee</div></div><div className="etf-flow up">+$3.8B</div></div>
            <div className="etf-row"><div style={{ display: 'flex', flexDirection: 'column' }}><div className="etf-name">Grayscale GBTC</div><div className="etf-issuer">1.50% fee</div></div><div className="etf-flow dn">−$22.4B</div></div>
            <div className="etf-net"><div className="etf-net-label">All-Time Net</div><div className="etf-net-val up">+$39.8B</div></div>
          </div>
        </div>
      </div>

      {/* ── ETHEREUM ETF SECTION ─────────────────────────────────────── */}
      <div className="panel">
        <div className="ph"><div className="pt">Ethereum ETF Flows</div><div className="tag tag-live" id="ethEtfDate">{dateStr}</div></div>
        <table className="dt">
          <thead><tr><th style={{ textAlign: 'left' }}>Product</th><th style={{ textAlign: 'left' }}>Issuer</th><th>Today&apos;s Flow</th><th>AUM</th><th>Exp. Ratio</th></tr></thead>
          <tbody>
            <tr><td><span className="aname">iShares Ethereum Trust</span><span className="asym">ETHA</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>BLACKROCK</span></td><td className="up">+$12.4M</td><td>$3.1B</td><td style={{ color: 'var(--muted)' }}>0.25%</td></tr>
            <tr><td><span className="aname">Ethereum Fund</span><span className="asym">FETH</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>FIDELITY</span></td><td className="up">+$8.2M</td><td>$1.4B</td><td style={{ color: 'var(--muted)' }}>0.25%</td></tr>
            <tr><td><span className="aname">Ethereum Trust</span><span className="asym">ETHE (legacy)</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>GRAYSCALE</span></td><td className="dn">−$6.8M</td><td>$4.2B</td><td style={{ color: 'var(--red)' }}>2.50%</td></tr>
            <tr style={{ borderTop: '1px solid var(--b3)' }}><td colSpan={2}><strong style={{ fontSize: '10px' }}>Total Net · All ETH ETFs</strong></td><td className="up"><strong>+$13.8M</strong></td><td>$8.7B</td><td></td></tr>
          </tbody>
        </table>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── ALTCOIN ETF FLOWS — NEW SECTION ─────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="section-h">
        <div className="section-h-label">Altcoin ETF Flow Intelligence · XRP · SOL · Pipeline</div>
        <div className="section-h-line"></div>
        <div className="tag tag-live">
          <a className="src-link" href="https://sosovalue.com" target="_blank" rel="noreferrer">SoSoValue</a> ·{' '}
          <a className="src-link" href="https://www.coinglass.com/etf" target="_blank" rel="noreferrer">CoinGlass</a>
        </div>
      </div>

      {/* Altcoin ETF KPIs */}
      <div className="g5">
        <div className="kpi">
          <div className="kpi-label">Altcoin ETF AUM</div>
          <div className="kpi-val" style={{ color: 'var(--accent)' }}>
            {altcoinLoading ? <PulseBox height="20px" /> : fmtAum(altcoinData?.totalAltcoinEtfAum ?? 2730)}
          </div>
          <div className="kpi-chg up">XRP + SOL combined</div>
          <div className="kpi-src"><a className="src-link" href="https://sosovalue.com" target="_blank" rel="noreferrer">SoSoValue</a></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">XRP ETF · Net Today</div>
          <div className="kpi-val" style={{ color: altcoinData?.xrp?.todayNetFlow && altcoinData.xrp.todayNetFlow >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {altcoinLoading ? <PulseBox height="20px" /> : fmtFlow(altcoinData?.xrp?.todayNetFlow ?? 18.4)}
          </div>
          <div className="kpi-chg up">{altcoinData?.xrp?.inflowStreak ?? 6} day streak</div>
          <div className="kpi-src"><a className="src-link" href="https://sosovalue.com" target="_blank" rel="noreferrer">SoSoValue</a></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">SOL ETF · Net Today</div>
          <div className="kpi-val" style={{ color: altcoinData?.sol?.todayNetFlow && altcoinData.sol.todayNetFlow >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {altcoinLoading ? <PulseBox height="20px" /> : fmtFlow(altcoinData?.sol?.todayNetFlow ?? 12.8)}
          </div>
          <div className="kpi-chg up">{altcoinData?.sol?.inflowStreak ?? 3} day streak</div>
          <div className="kpi-src"><a className="src-link" href="https://sosovalue.com" target="_blank" rel="noreferrer">SoSoValue</a></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">XRP Cumulative</div>
          <div className="kpi-val" style={{ color: 'var(--green)' }}>
            {altcoinLoading ? <PulseBox height="20px" /> : fmtFlow(altcoinData?.xrp?.cumulativeInflows ?? 1420)}
          </div>
          <div className="kpi-chg">Since Nov 2025</div>
          <div className="kpi-src"><a className="src-link" href="https://www.coinglass.com/etf" target="_blank" rel="noreferrer">CoinGlass</a></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">SOL Cumulative</div>
          <div className="kpi-val" style={{ color: 'var(--green)' }}>
            {altcoinLoading ? <PulseBox height="20px" /> : fmtFlow(altcoinData?.sol?.cumulativeInflows ?? 680)}
          </div>
          <div className="kpi-chg">Since Jan 2026</div>
          <div className="kpi-src"><a className="src-link" href="https://www.coinglass.com/etf" target="_blank" rel="noreferrer">CoinGlass</a></div>
        </div>
      </div>

      {/* XRP ETF Fund Table */}
      {altcoinLoading ? (
        <div className="panel" style={{ padding: '20px' }}><PulseBox height="120px" /></div>
      ) : altcoinData?.xrp ? (
        <AltcoinFundTable data={altcoinData.xrp} asset="XRP" accentColor="var(--accent)" />
      ) : null}

      {/* SOL ETF Fund Table */}
      {altcoinLoading ? (
        <div className="panel" style={{ padding: '20px' }}><PulseBox height="120px" /></div>
      ) : altcoinData?.sol ? (
        <AltcoinFundTable data={altcoinData.sol} asset="SOL" accentColor="var(--blue)" />
      ) : null}

      {/* Altcoin ETF Timeline / Milestones */}
      {altcoinData?.milestones && (
        <div className="panel">
          <div className="ph">
            <div className="pt">Altcoin ETF Milestones Timeline</div>
            <div className="tag tag-live">SEC · CFTC</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
            {altcoinData.milestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)',
                  flexShrink: 0, marginTop: '4px',
                  boxShadow: i === altcoinData.milestones.length - 1 ? '0 0 6px var(--accent)' : 'none'
                }} />
                <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', flex: '0 0 70px' }}>{m.date}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)' }}>{m.event}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI SYNTHESIS ─────────────────────────────────────────────── */}
      <div className="ai-box">
        <div className="ai-label"><span className="ai-pulse"></span>ETF Flow Signal</div>
        <div className="ai-text">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span><span><strong>IBIT +$224M today</strong> — 4th consecutive inflow day. 7-day net: +$1.04B. Institutional accumulation at Extreme Fear.</span></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--accent)', flexShrink: 0 }}>▸</span><span><strong>XRP ETFs at {altcoinData ? fmtAum(altcoinData.xrp.totalAum) : '$1.8B'} AUM</strong> — 7 spot funds absorbing institutional demand post-commodity classification. {altcoinData?.xrp?.inflowStreak ? `${altcoinData.xrp.inflowStreak}-day inflow streak.` : ''}</span></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--blue)', flexShrink: 0 }}>▸</span><span><strong>SOL ETFs gaining traction</strong> — {altcoinData ? fmtAum(altcoinData.sol.totalAum) : '$890M'} AUM across {altcoinData?.sol?.fundCount ?? 5} funds. Franklin Templeton&apos;s 0.19% fee driving competitive pressure.</span></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--gold)', flexShrink: 0 }}>▸</span><span><strong>Pipeline active:</strong> DOGE, LTC, ADA, AVAX, DOT ETFs in SEC review. CLARITY Act markup targeting late April — could accelerate approvals.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
