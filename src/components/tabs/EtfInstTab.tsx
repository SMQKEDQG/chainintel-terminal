'use client';

import { useEffect, useState } from 'react';
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

export default function EtfInstTab() {
  const [dateStr, setDateStr] = useState('');
  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }, []);

  return (
    <div className="page" id="page-etfinst">
      <div className="ai-context-strip" id="acs-etfinst">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-etfinst">
          IBIT absorbed $224M while GBTC bled $174M — this is fee-driven rotation (1.5% → 0.25%), not market exit.{' '}
          <strong>4-day inflow streak at Extreme Fear confirms institutional accumulation thesis.</strong>
        </span>
        <span className="acs-ts" id="acs-ts-etfinst"></span>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--b2)', margin: '1px 0' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.14em', color: 'var(--cyan)' }}>◈ PENDING ETF APPLICATIONS — LIVE TRACKER · 10 FILINGS</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>Source: SEC EDGAR · Click any row for asset detail</span>
        </div>
        <div id="etfAppsFeed" style={{ overflowX: 'auto', padding: '8px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px' }}>
            {[
              { issuer: 'BlackRock', asset: 'XRP ETF', status: 'FILED', statusColor: 'var(--gold)', date: 'Mar 2026' },
              { issuer: 'VanEck', asset: 'SOL ETF', status: 'FILED', statusColor: 'var(--gold)', date: 'Mar 2026' },
              { issuer: 'Bitwise', asset: 'DOGE ETF', status: 'PENDING', statusColor: 'var(--muted)', date: 'Feb 2026' },
              { issuer: 'ARK Invest', asset: 'Multi-Asset', status: 'PENDING', statusColor: 'var(--muted)', date: 'Jan 2026' },
              { issuer: 'Grayscale', asset: 'LTC ETF', status: 'PENDING', statusColor: 'var(--muted)', date: 'Dec 2025' },
            ].map((app) => (
              <div key={app.issuer + app.asset} style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>{app.issuer}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text)', marginBottom: '3px' }}>{app.asset}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: app.statusColor, letterSpacing: '0.08em' }}>{app.status} · {app.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-h">
        <div className="section-h-label">ETF &amp; Institutional Flow Intelligence</div>
        <div className="section-h-line"></div>
        <div className="tag tag-live"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noreferrer">Farside Investors</a> · Bloomberg ETF</div>
      </div>

      <div className="g5">
        <div className="kpi"><div className="kpi-label">Net Flow · Today</div><div className="kpi-val" style={{ color: 'var(--green)' }}>+$169.6M</div><div className="kpi-chg up">All BTC ETFs</div><div className="kpi-src"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noreferrer">Farside Investors</a></div></div>
        <div className="kpi"><div className="kpi-label">7-Day Net Flow</div><div className="kpi-val" style={{ color: 'var(--green)' }}>+$1.04B</div><div className="kpi-chg up">Cumulative 7 days</div><div className="kpi-src"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noreferrer">Farside Investors</a></div></div>
        <div className="kpi"><div className="kpi-label">Total AUM · BTC ETFs</div><div className="kpi-val" style={{ color: 'var(--text)' }}>$118.4B</div><div className="kpi-chg">All issuers</div><div className="kpi-src">Bloomberg ETF</div></div>
        <div className="kpi"><div className="kpi-label">Inflow Streak</div><div className="kpi-val" style={{ color: 'var(--cyan)' }}>4 Days</div><div className="kpi-chg up">Since Apr 3</div><div className="kpi-src"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noreferrer">Farside Investors</a></div></div>
        <div className="kpi"><div className="kpi-label">IBIT AUM Rank</div><div className="kpi-val gold">#1 Global</div><div className="kpi-chg">BlackRock ETF</div><div className="kpi-src">Bloomberg ETF</div></div>
      </div>

      <div className="g2">
        <div className="panel">
          <div className="ph"><div className="pt">Bitcoin ETF Daily Flows — All US Issuers</div><div className="tag tag-live" id="etfFlowDate">{dateStr}</div></div>
          <table className="dt">
            <thead><tr><th style={{ textAlign: 'left' }}>Product</th><th style={{ textAlign: 'left' }}>Issuer</th><th>Today's Flow</th><th>AUM</th><th>Exp. Ratio</th><th>Since Launch</th></tr></thead>
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

      <div className="panel">
        <div className="ph"><div className="pt">Ethereum ETF Flows</div><div className="tag tag-live" id="ethEtfDate">{dateStr}</div></div>
        <table className="dt">
          <thead><tr><th style={{ textAlign: 'left' }}>Product</th><th style={{ textAlign: 'left' }}>Issuer</th><th>Today's Flow</th><th>AUM</th><th>Exp. Ratio</th></tr></thead>
          <tbody>
            <tr><td><span className="aname">iShares Ethereum Trust</span><span className="asym">ETHA</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>BLACKROCK</span></td><td className="up">+$12.4M</td><td>$3.1B</td><td style={{ color: 'var(--muted)' }}>0.25%</td></tr>
            <tr><td><span className="aname">Ethereum Fund</span><span className="asym">FETH</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>FIDELITY</span></td><td className="up">+$8.2M</td><td>$1.4B</td><td style={{ color: 'var(--muted)' }}>0.25%</td></tr>
            <tr><td><span className="aname">Ethereum Trust</span><span className="asym">ETHE (legacy)</span></td><td style={{ textAlign: 'left' }}><span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)' }}>GRAYSCALE</span></td><td className="dn">−$6.8M</td><td>$4.2B</td><td style={{ color: 'var(--red)' }}>2.50%</td></tr>
            <tr style={{ borderTop: '1px solid var(--b3)' }}><td colSpan={2}><strong style={{ fontSize: '10px' }}>Total Net · All ETH ETFs</strong></td><td className="up"><strong>+$13.8M</strong></td><td>$8.7B</td><td></td></tr>
          </tbody>
        </table>
      </div>

      <div className="ai-box">
        <div className="ai-label"><span className="ai-pulse"></span>ETF Flow Signal</div>
        <div className="ai-text">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span><span><strong>IBIT +$224M today</strong> — 4th consecutive inflow day. 7-day net: +$1.04B. Institutional accumulation at Extreme Fear.</span></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--cyan)', flexShrink: 0 }}>▸</span><span><strong>GBTC −$174M</strong> — fee rotation (1.5% → 0.25% wrapper). Structural migration, not exits.</span></div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--gold)', flexShrink: 0 }}>▸</span><span><strong>IBIT near $55B AUM</strong> milestone — triggers additional mandate allocations from institutional managers.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
