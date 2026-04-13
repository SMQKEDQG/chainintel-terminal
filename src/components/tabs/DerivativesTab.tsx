'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const oiLabels = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});

const oiData = {
  labels: oiLabels,
  datasets: [
    {
      label: 'BTC OI ($B)',
      data: [32.1, 31.8, 33.2, 34.1, 32.8, 31.4, 30.8, 31.2, 32.4, 33.8, 34.2, 33.1, 32.4, 31.8, 30.8, 30.2, 29.8, 29.4, 28.8, 29.2, 29.8, 30.2, 29.8, 29.2, 28.8, 28.4, 28.8, 29.2, 28.8, 28.4],
      backgroundColor: 'rgba(0,212,170,0.5)',
      borderColor: '#00d4aa',
      borderWidth: 1,
    },
  ],
};

const oiOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: { color: '#4a6a8c', font: { size: 7 }, maxTicksLimit: 6 },
      grid: { color: 'rgba(255,255,255,0.04)' },
    },
    y: {
      ticks: { color: '#4a6a8c', font: { size: 7 } },
      grid: { color: 'rgba(255,255,255,0.04)' },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: { titleFont: { size: 8 }, bodyFont: { size: 8 } },
  },
};

export default function DerivativesTab() {
  return (
    <div className="page" id="page-derivatives">
      <div className="ai-context-strip" id="acs-derivatives">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-derivatives">
          Perpetual funding rates across BTC/ETH turning negative — short bias in derivatives while spot accumulation continues. OI at $28.4B (−8% 7d).{' '}
          <strong>Funding negativity + spot inflows = historically asymmetric long setup.</strong>
        </span>
        <span className="acs-ts" id="acs-ts-derivatives"></span>
      </div>
      <div className="section-h">
        <div className="section-h-label">Derivatives Intelligence</div>
        <div className="section-h-line"></div>
        <div className="tag tag-live">Coinalyze · Laevitas · Bybt</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--gold)', letterSpacing: '0.08em', marginTop: '4px' }}>⚠ DEMO DATA — Live feed in Pro</div>

      {/* KPI row */}
      <div className="g4">
        <div className="deriv-card"><div className="deriv-label">BTC Open Interest</div><div className="deriv-metric" style={{ color: 'var(--cyan)' }}>$28.4B</div><div className="deriv-sub">−8.2% vs 7d · Coinalyze</div></div>
        <div className="deriv-card"><div className="deriv-label">ETH Open Interest</div><div className="deriv-metric" style={{ color: 'var(--blue)' }}>$9.1B</div><div className="deriv-sub">−4.6% vs 7d · Laevitas</div></div>
        <div className="deriv-card"><div className="deriv-label">24h Liquidations</div><div className="deriv-metric" style={{ color: 'var(--red)' }}>$284M</div><div className="deriv-sub">Longs $198M · Shorts $86M</div></div>
        <div className="deriv-card"><div className="deriv-label">Perp Funding (BTC)</div><div className="deriv-metric" style={{ color: 'var(--gold)' }}>−0.004%</div><div className="deriv-sub">8h rate · Slightly bearish bias</div></div>
      </div>

      <div className="g2">
        {/* Funding Rates Table */}
        <div className="panel">
          <div className="ph">
            <div className="pt">Perpetual Funding Rates · All Exchanges</div>
            <div className="tag tag-live">Coinalyze</div>
          </div>
          <table className="fr-table dt">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Asset</th>
                <th>Binance</th>
                <th>OKX</th>
                <th>Bybit</th>
                <th>dYdX</th>
                <th>8h Avg</th>
                <th>Predicted</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>BTC</td><td className="fr-negative">−0.004%</td><td className="fr-negative">−0.003%</td><td className="fr-negative">−0.005%</td><td className="fr-negative">−0.002%</td><td className="fr-negative">−0.004%</td><td className="fr-negative">−0.003%</td></tr>
              <tr><td>ETH</td><td className="fr-negative">−0.006%</td><td className="fr-negative">−0.005%</td><td className="fr-negative">−0.007%</td><td className="fr-negative">−0.004%</td><td className="fr-negative">−0.006%</td><td className="fr-negative">−0.005%</td></tr>
              <tr><td>XRP</td><td className="fr-positive">+0.008%</td><td className="fr-positive">+0.006%</td><td className="fr-positive">+0.007%</td><td>0.000%</td><td className="fr-positive">+0.007%</td><td className="fr-positive">+0.006%</td></tr>
              <tr><td>SOL</td><td className="fr-negative">−0.002%</td><td className="fr-negative">−0.001%</td><td className="fr-negative">−0.003%</td><td className="fr-negative">−0.002%</td><td className="fr-negative">−0.002%</td><td className="fr-negative">−0.002%</td></tr>
              <tr><td>BNB</td><td className="fr-positive">+0.003%</td><td className="fr-positive">+0.002%</td><td className="fr-positive">+0.004%</td><td>—</td><td className="fr-positive">+0.003%</td><td className="fr-positive">+0.002%</td></tr>
              <tr><td>ADA</td><td>0.000%</td><td className="fr-negative">−0.001%</td><td>0.000%</td><td>—</td><td>0.000%</td><td>0.000%</td></tr>
              <tr><td>AVAX</td><td className="fr-negative">−0.008%</td><td className="fr-negative">−0.006%</td><td className="fr-negative">−0.007%</td><td>—</td><td className="fr-negative">−0.007%</td><td className="fr-negative">−0.006%</td></tr>
              <tr><td>LINK</td><td className="fr-positive">+0.012%</td><td className="fr-positive">+0.010%</td><td className="fr-positive">+0.011%</td><td>—</td><td className="fr-positive">+0.011%</td><td className="fr-positive">+0.010%</td></tr>
            </tbody>
          </table>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '8px' }}>Negative rate = shorts pay longs. Extreme negative = potential short squeeze setup. Updates every 8h.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
          {/* Open Interest Chart */}
          <div className="panel">
            <div className="ph">
              <div className="pt">Open Interest — BTC 30 Day</div>
              <div className="tag tag-live">Coinalyze</div>
            </div>
            <div className="chart-wrap" style={{ height: '120px' }}>
              <Bar data={oiData} options={oiOptions} />
            </div>
          </div>

          {/* Liquidation Heatmap */}
          <div className="panel">
            <div className="ph">
              <div className="pt">24h Liquidation Breakdown</div>
              <div className="tag tag-live">Coinalyze · Bybt</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '8px', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text2)' }}>BTC</span>
                  <span><span style={{ color: 'var(--green)' }}>L $142M</span> · <span style={{ color: 'var(--red)' }}>S $38M</span></span>
                </div>
                <div className="liq-bar"><span className="liq-long" style={{ width: '79%' }}></span><span className="liq-short" style={{ width: '21%' }}></span></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '8px', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text2)' }}>ETH</span>
                  <span><span style={{ color: 'var(--green)' }}>L $28M</span> · <span style={{ color: 'var(--red)' }}>S $24M</span></span>
                </div>
                <div className="liq-bar"><span className="liq-long" style={{ width: '54%' }}></span><span className="liq-short" style={{ width: '46%' }}></span></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '8px', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text2)' }}>XRP</span>
                  <span><span style={{ color: 'var(--green)' }}>L $12M</span> · <span style={{ color: 'var(--red)' }}>S $8M</span></span>
                </div>
                <div className="liq-bar"><span className="liq-long" style={{ width: '60%' }}></span><span className="liq-short" style={{ width: '40%' }}></span></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '8px', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text2)' }}>SOL</span>
                  <span><span style={{ color: 'var(--green)' }}>L $9M</span> · <span style={{ color: 'var(--red)' }}>S $14M</span></span>
                </div>
                <div className="liq-bar"><span className="liq-long" style={{ width: '39%' }}></span><span className="liq-short" style={{ width: '61%' }}></span></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '8px', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--text2)' }}>Other</span>
                  <span><span style={{ color: 'var(--green)' }}>L $7M</span> · <span style={{ color: 'var(--red)' }}>S $2M</span></span>
                </div>
                <div className="liq-bar"><span className="liq-long" style={{ width: '78%' }}></span><span className="liq-short" style={{ width: '22%' }}></span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Macro Correlation + Stablecoin Supply */}
      <div className="g2" style={{ marginTop: '1px' }}>
        <div className="panel">
          <div className="ph">
            <div className="pt">Macro Correlation — BTC vs Traditional Markets</div>
            <div className="tag tag-ai">ChainIntel Research</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginLeft: '10px' }}>Updated <span id="macroTs"></span></div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>30-DAY ROLLING CORRELATION WITH BTC PRICE</div>
          <div className="macro-row">
            <div className="macro-asset">S&amp;P 500 (SPX)</div>
            <div className="macro-val">5,204</div>
            <div className="macro-chg dn">−0.8% 7d</div>
            <div className="macro-corr">
              <span style={{ color: 'var(--green)' }}>+0.72 Strong ↑</span>
              <div className="corr-bar" style={{ background: 'var(--b3)' }}><div style={{ width: '72%', height: '3px', background: 'var(--green)', borderRadius: '2px' }}></div></div>
            </div>
          </div>
          <div className="macro-row">
            <div className="macro-asset">NASDAQ (QQQ)</div>
            <div className="macro-val">447.2</div>
            <div className="macro-chg dn">−1.1% 7d</div>
            <div className="macro-corr">
              <span style={{ color: 'var(--green)' }}>+0.68 Moderate ↑</span>
              <div className="corr-bar" style={{ background: 'var(--b3)' }}><div style={{ width: '68%', height: '3px', background: 'var(--green)', borderRadius: '2px' }}></div></div>
            </div>
          </div>
          <div className="macro-row">
            <div className="macro-asset">DXY (Dollar)</div>
            <div className="macro-val">104.8</div>
            <div className="macro-chg up">+0.4% 7d</div>
            <div className="macro-corr">
              <span style={{ color: 'var(--red)' }}>−0.61 Inverse ↓</span>
              <div className="corr-bar" style={{ background: 'var(--b3)' }}><div style={{ width: '61%', height: '3px', background: 'var(--red)', borderRadius: '2px' }}></div></div>
            </div>
          </div>
          <div className="macro-row">
            <div className="macro-asset">Gold (XAU)</div>
            <div className="macro-val">$3,242</div>
            <div className="macro-chg up">+2.1% 7d</div>
            <div className="macro-corr">
              <span style={{ color: 'var(--gold)' }}>+0.34 Weak ↑</span>
              <div className="corr-bar" style={{ background: 'var(--b3)' }}><div style={{ width: '34%', height: '3px', background: 'var(--gold)', borderRadius: '2px' }}></div></div>
            </div>
          </div>
          <div className="macro-row">
            <div className="macro-asset">10Y Treasury</div>
            <div className="macro-val">4.52%</div>
            <div className="macro-chg dn">−8bps 7d</div>
            <div className="macro-corr">
              <span style={{ color: 'var(--red)' }}>−0.44 Moderate ↓</span>
              <div className="corr-bar" style={{ background: 'var(--b3)' }}><div style={{ width: '44%', height: '3px', background: 'var(--red)', borderRadius: '2px' }}></div></div>
            </div>
          </div>
          <div className="macro-row">
            <div className="macro-asset">Crude Oil (WTI)</div>
            <div className="macro-val">$62.8</div>
            <div className="macro-chg dn">−3.2% 7d</div>
            <div className="macro-corr">
              <span style={{ color: 'var(--text2)' }}>+0.18 Weak</span>
              <div className="corr-bar" style={{ background: 'var(--b3)' }}><div style={{ width: '18%', height: '3px', background: 'var(--text2)', borderRadius: '2px' }}></div></div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '8px' }}>Bloomberg cannot show this cross-asset view natively in their crypto module · ChainIntel exclusive</div>
        </div>

        <div className="panel">
          <div className="ph">
            <div className="pt">Stablecoin Supply — Liquidity Signal</div>
            <div className="tag tag-live">DefiLlama · CoinGecko</div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>STABLECOIN MARKET = SIDELINED CASH WAITING TO ENTER CRYPTO</div>
          <div className="g2" style={{ gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'var(--s1)', padding: '10px', border: '1px solid var(--b2)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '3px' }}>TOTAL STABLECOIN SUPPLY</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 700, color: 'var(--cyan)' }}>$243.2B</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--green)' }}>+$4.2B this month · BULLISH inflow</div>
            </div>
            <div style={{ background: 'var(--s1)', padding: '10px', border: '1px solid var(--b2)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '3px' }}>30D SUPPLY CHANGE</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 700, color: 'var(--green)' }}>+$4.2B</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text2)' }}>New USD entering crypto ecosystem</div>
            </div>
          </div>
          <table className="fr-table dt">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Stablecoin</th>
                <th>Supply</th>
                <th>30d Change</th>
                <th>Peg Stability</th>
                <th>Chain</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>USDT</td><td>$144.2B</td><td className="fr-positive">+$2.1B</td><td style={{ color: 'var(--green)' }}>✓ 1.000</td><td style={{ color: 'var(--text2)' }}>Multi</td></tr>
              <tr><td>USDC</td><td>$60.8B</td><td className="fr-positive">+$1.4B</td><td style={{ color: 'var(--green)' }}>✓ 1.000</td><td style={{ color: 'var(--text2)' }}>Multi</td></tr>
              <tr><td>USDS</td><td>$14.1B</td><td className="fr-positive">+$0.8B</td><td style={{ color: 'var(--green)' }}>✓ 1.001</td><td style={{ color: 'var(--text2)' }}>ETH</td></tr>
              <tr><td>DAI</td><td>$5.4B</td><td className="fr-negative">−$0.2B</td><td style={{ color: 'var(--green)' }}>✓ 0.999</td><td style={{ color: 'var(--text2)' }}>ETH</td></tr>
              <tr><td>FDUSD</td><td>$2.1B</td><td className="fr-negative">−$0.1B</td><td style={{ color: 'var(--green)' }}>✓ 1.000</td><td style={{ color: 'var(--text2)' }}>Multi</td></tr>
              <tr><td>PYUSD</td><td>$0.8B</td><td className="fr-positive">+$0.2B</td><td style={{ color: 'var(--green)' }}>✓ 1.000</td><td style={{ color: 'var(--text2)' }}>ETH</td></tr>
              <tr><td style={{ color: 'var(--cyan)', fontWeight: 600 }}>RLUSD</td><td>$1.4B</td><td className="fr-positive">+$0.3B</td><td style={{ color: 'var(--green)' }}>✓ 1.000</td><td style={{ color: 'var(--text2)' }}>XRP/ETH</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="ai-box">
        <div className="ai-label"><span className="ai-pulse"></span>Derivatives AI Synthesis · Coinalyze · Laevitas · Apr 11, 2026</div>
        <div className="ai-text">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--red)', flexShrink: 0 }}>▸</span>
              <span><strong>Negative funding across BTC/ETH/SOL/AVAX</strong> — derivatives traders are net short. When shorts dominate and spot shows accumulation, historically precedes short squeezes.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--cyan)', flexShrink: 0 }}>▸</span>
              <span><strong>OI down 8.2% in 7d</strong> — leverage being washed out. Reduced OI + negative funding = cleaner, less leveraged market structure. Lower crash risk from cascading liquidations.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span>
              <span><strong>Stablecoin supply +$4.2B this month</strong> — fresh USD entering the ecosystem. Historical precedent: stablecoin inflows of this magnitude precede meaningful rallies within 30–90 days.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--gold)', flexShrink: 0 }}>▸</span>
              <span><strong>BTC-SPX correlation +0.72</strong> — macro risk-off environment. Dollar strength (DXY +0.4%) creates headwind. Monitor 10Y yield: if yield drops further, expect BTC to decouple upward as in 2023 pattern.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
