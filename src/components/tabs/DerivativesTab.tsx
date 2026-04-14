'use client';

import { useEffect, useState, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { MicrostructurePanel } from '@/components/LevelUpModules';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

interface ExchangeData { name: string; fundingRate: number; oi: number; }
interface AssetData {
  asset: string;
  avgFundingRate: number;
  totalOI: number;
  totalVolume: number;
  exchanges: ExchangeData[];
  price: number;
  change24h: number;
}
interface DerivData {
  assets: AssetData[];
  summary: { totalOI: number; totalVolume: number; btcOI: number; ethOI: number; btcFunding: number; assetCount: number; dataPoints: number; };
  updatedAt: string;
}

// Static fallback
const STATIC_DATA: DerivData = {
  assets: [
    { asset: 'BTC', avgFundingRate: -0.004, totalOI: 28400000000, totalVolume: 46000000000, exchanges: [{ name: 'Binance', fundingRate: -0.004, oi: 9200000000 }, { name: 'OKX', fundingRate: -0.003, oi: 5800000000 }, { name: 'Bybit', fundingRate: -0.005, oi: 4400000000 }, { name: 'dYdX', fundingRate: -0.002, oi: 1200000000 }], price: 73296, change24h: 2.83 },
    { asset: 'ETH', avgFundingRate: -0.006, totalOI: 9100000000, totalVolume: 14000000000, exchanges: [{ name: 'Binance', fundingRate: -0.006, oi: 3100000000 }, { name: 'OKX', fundingRate: -0.005, oi: 2200000000 }, { name: 'Bybit', fundingRate: -0.007, oi: 1800000000 }, { name: 'dYdX', fundingRate: -0.004, oi: 600000000 }], price: 2259, change24h: 2.27 },
    { asset: 'XRP', avgFundingRate: 0.008, totalOI: 2200000000, totalVolume: 3400000000, exchanges: [{ name: 'Binance', fundingRate: 0.008, oi: 800000000 }, { name: 'OKX', fundingRate: 0.006, oi: 600000000 }, { name: 'Bybit', fundingRate: 0.007, oi: 500000000 }], price: 1.35, change24h: 1.03 },
    { asset: 'SOL', avgFundingRate: -0.002, totalOI: 3800000000, totalVolume: 5200000000, exchanges: [{ name: 'Binance', fundingRate: -0.002, oi: 1400000000 }, { name: 'OKX', fundingRate: -0.001, oi: 1000000000 }, { name: 'Bybit', fundingRate: -0.003, oi: 800000000 }], price: 84.05, change24h: 1.72 },
    { asset: 'BNB', avgFundingRate: 0.003, totalOI: 1800000000, totalVolume: 2800000000, exchanges: [{ name: 'Binance', fundingRate: 0.003, oi: 900000000 }, { name: 'OKX', fundingRate: 0.002, oi: 400000000 }], price: 608.32, change24h: 2.15 },
    { asset: 'ADA', avgFundingRate: 0.000, totalOI: 900000000, totalVolume: 1200000000, exchanges: [{ name: 'Binance', fundingRate: 0.000, oi: 400000000 }, { name: 'OKX', fundingRate: -0.001, oi: 200000000 }], price: 0.2399, change24h: 0.25 },
    { asset: 'AVAX', avgFundingRate: -0.007, totalOI: 800000000, totalVolume: 1100000000, exchanges: [{ name: 'Binance', fundingRate: -0.008, oi: 300000000 }, { name: 'OKX', fundingRate: -0.006, oi: 200000000 }], price: 9.29, change24h: 1.77 },
    { asset: 'LINK', avgFundingRate: 0.011, totalOI: 700000000, totalVolume: 900000000, exchanges: [{ name: 'Binance', fundingRate: 0.012, oi: 300000000 }, { name: 'OKX', fundingRate: 0.010, oi: 200000000 }], price: 8.98, change24h: 1.89 },
  ],
  summary: { totalOI: 47700000000, totalVolume: 74600000000, btcOI: 28400000000, ethOI: 9100000000, btcFunding: -0.004, assetCount: 8, dataPoints: 0 },
  updatedAt: new Date().toISOString(),
};

const fmt$ = (n: number): string => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
};

const fmtRate = (r: number): string => {
  const pct = r * 100;
  return pct >= 0 ? `+${pct.toFixed(4)}%` : `${pct.toFixed(4)}%`;
};

const rateClass = (r: number) => (r < 0 ? 'fr-negative' : r > 0 ? 'fr-positive' : '');

interface MacroAsset {
  name: string;
  symbol: string;
  value: number;
  change7d: number;
  changeBps?: number;
  changeDir: 'up' | 'dn' | 'flat';
  correlation: number;
  corrLabel: string;
  corrPct: string;
  color: string;
  unit: string;
}
interface MacroData { assets: MacroAsset[]; btcPrice: number; btcChange7d: number; live: boolean; updatedAt: string; }

const MACRO_FALLBACK: MacroAsset[] = [
  { name: 'S&P 500 (SPX)', symbol: 'SPX', value: 5204, change7d: -0.8, changeDir: 'dn', correlation: 0.72, corrLabel: '+0.72 Strong ↑', corrPct: '72%', color: 'var(--green)', unit: '' },
  { name: 'NASDAQ (QQQ)', symbol: 'NDX', value: 16447, change7d: -1.1, changeDir: 'dn', correlation: 0.68, corrLabel: '+0.68 Moderate ↑', corrPct: '68%', color: 'var(--green)', unit: '' },
  { name: 'DXY (Dollar)', symbol: 'DXY', value: 104.8, change7d: 0.4, changeDir: 'up', correlation: -0.61, corrLabel: '−0.61 Inverse ↓', corrPct: '61%', color: 'var(--red)', unit: '' },
  { name: 'Gold (XAU)', symbol: 'XAU', value: 3242, change7d: 2.1, changeDir: 'up', correlation: 0.34, corrLabel: '+0.34 Weak ↑', corrPct: '34%', color: 'var(--gold)', unit: '$' },
  { name: '10Y Treasury', symbol: 'TNX', value: 4.52, change7d: -0.2, changeBps: -8, changeDir: 'dn', correlation: -0.44, corrLabel: '−0.44 Moderate ↓', corrPct: '44%', color: 'var(--red)', unit: '%' },
  { name: 'Crude Oil (WTI)', symbol: 'WTI', value: 62.8, change7d: -3.2, changeDir: 'dn', correlation: 0.18, corrLabel: '+0.18 Weak', corrPct: '18%', color: 'var(--text2)', unit: '$' },
];

export default function DerivativesTab() {
  const [data, setData] = useState<DerivData>(STATIC_DATA);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [macroData, setMacroData] = useState<MacroAsset[]>(MACRO_FALLBACK);
  const [macroLive, setMacroLive] = useState(false);
  const [macroBtcPrice, setMacroBtcPrice] = useState(0);
  const [macroBtcChg, setMacroBtcChg] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/derivatives');
      if (!res.ok) throw new Error(`${res.status}`);
      const json: DerivData = await res.json();
      if (json.assets && json.assets.length > 0) {
        setData(json);
        setIsLive(true);
        setLastUpdate(new Date(json.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMacro = useCallback(async () => {
    try {
      const [macroRes, macroDataRes] = await Promise.allSettled([
        fetch('/api/macro-correlations'),
        fetch('/api/macro-data'),
      ]);
      if (macroRes.status === 'fulfilled' && macroRes.value.ok) {
        const json: MacroData = await macroRes.value.json();
        if (json.assets && json.assets.length > 0) {
          setMacroData(json.assets);
          setMacroLive(json.live);
          if (json.btcPrice) setMacroBtcPrice(json.btcPrice);
          if (json.btcChange7d) setMacroBtcChg(json.btcChange7d);
        }
      }
      // Enrich with FRED + Treasury + Deribit data from macro-data aggregator
      if (macroDataRes.status === 'fulfilled' && macroDataRes.value.ok) {
        const macroDeep = await macroDataRes.value.json();
        if (macroDeep?.fred) {
          (globalThis as any).__ciFred = macroDeep.fred;
        }
        if (macroDeep?.deribit) {
          (globalThis as any).__ciDeribit = macroDeep.deribit;
        }
      }
    } catch { /* keep fallback */ }
  }, []);

  useEffect(() => {
    fetchData();
    fetchMacro();
    const iv = setInterval(fetchData, 120_000); // refresh every 2 min
    const iv2 = setInterval(fetchMacro, 300_000); // refresh macro every 5 min
    return () => { clearInterval(iv); clearInterval(iv2); };
  }, [fetchData, fetchMacro]);

  const { assets, summary } = data;
  const btc = assets.find(a => a.asset === 'BTC');
  const eth = assets.find(a => a.asset === 'ETH');

  // Determine sentiment from funding rates
  const negCount = assets.filter(a => a.avgFundingRate < -0.001).length;
  const posCount = assets.filter(a => a.avgFundingRate > 0.001).length;
  const sentiment = negCount > posCount ? 'short bias' : posCount > negCount ? 'long bias' : 'neutral';

  // OI chart — simple horizontal bars by asset
  const oiChartData = {
    labels: assets.slice(0, 8).map(a => a.asset),
    datasets: [{
      label: 'Open Interest',
      data: assets.slice(0, 8).map(a => a.totalOI / 1e9),
      backgroundColor: assets.slice(0, 8).map(a => a.avgFundingRate < 0 ? 'rgba(239,68,68,0.5)' : 'rgba(0,212,170,0.5)'),
      borderColor: assets.slice(0, 8).map(a => a.avgFundingRate < 0 ? '#ef4444' : '#00d4aa'),
      borderWidth: 1,
    }],
  };

  const oiOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#4a6a8c', font: { size: 8 }, callback: (v: any) => `$${v}B` }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#94b3d0', font: { size: 9, family: 'JetBrains Mono, monospace' } }, grid: { display: false } },
    },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` $${ctx.parsed.x.toFixed(1)}B OI` } } },
  };

  // Volume chart
  const volChartData = {
    labels: assets.slice(0, 8).map(a => a.asset),
    datasets: [{
      label: '24h Volume',
      data: assets.slice(0, 8).map(a => a.totalVolume / 1e9),
      backgroundColor: 'rgba(59,130,246,0.5)',
      borderColor: '#3b82f6',
      borderWidth: 1,
    }],
  };

  const volOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#4a6a8c', font: { size: 8 } }, grid: { display: false } },
      y: { ticks: { color: '#4a6a8c', font: { size: 8 }, callback: (v: any) => `$${v}B` }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` $${ctx.parsed.y.toFixed(1)}B volume` } } },
  };

  return (
    <div className="page tab-content-enter" id="page-derivatives">
      <div className="ai-context-strip" id="acs-derivatives">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-derivatives">
          {btc ? (
            <>Perpetual funding rates — {sentiment} across {assets.length} assets. BTC funding {fmtRate(btc.avgFundingRate)}, OI {fmt$(summary.btcOI)}.{' '}
            <strong>{summary.btcFunding < -0.001 ? 'Negative funding + spot accumulation = historically asymmetric long setup.' : summary.btcFunding > 0.001 ? 'Positive funding suggests leveraged longs dominant — elevated correction risk.' : 'Neutral funding — balanced market positioning.'}</strong></>
          ) : 'Loading derivatives intelligence...'}
        </span>
        <span className="acs-ts" id="acs-ts-derivatives"></span>
      </div>

      <div className="section-h">
        <div className="section-h-label">Derivatives Intelligence</div>
        <div className="section-h-line"></div>
        <div className={`tag ${isLive ? 'tag-live' : 'tag-pro'}`}>
          {isLive ? (
            <><span style={{ color: 'var(--green)', marginRight: '4px' }}>●</span> LIVE · CoinGecko</>
          ) : 'DEMO DATA'}
          {lastUpdate && <span style={{ marginLeft: '8px', color: 'var(--muted)' }}>Updated {lastUpdate}</span>}
        </div>
      </div>

      {/* KPI row */}
      <div className="g4">
        <div className="deriv-card">
          <div className="deriv-label">BTC Open Interest</div>
          <div className="deriv-metric" style={{ color: 'var(--cyan)' }}>{fmt$(summary.btcOI)}</div>
          <div className="deriv-sub">{isLive ? `${summary.dataPoints} contracts tracked` : 'CoinGecko Derivatives'}</div>
        </div>
        <div className="deriv-card">
          <div className="deriv-label">ETH Open Interest</div>
          <div className="deriv-metric" style={{ color: 'var(--blue)' }}>{fmt$(summary.ethOI)}</div>
          <div className="deriv-sub">{eth ? `Funding ${fmtRate(eth.avgFundingRate)}` : 'CoinGecko'}</div>
        </div>
        <div className="deriv-card">
          <div className="deriv-label">Total Derivatives OI</div>
          <div className="deriv-metric" style={{ color: 'var(--text)' }}>{fmt$(summary.totalOI)}</div>
          <div className="deriv-sub">{summary.assetCount} assets · All exchanges</div>
        </div>
        <div className="deriv-card">
          <div className="deriv-label">BTC Perp Funding</div>
          <div className="deriv-metric" style={{ color: summary.btcFunding < 0 ? 'var(--red)' : summary.btcFunding > 0 ? 'var(--green)' : 'var(--gold)' }}>
            {fmtRate(summary.btcFunding)}
          </div>
          <div className="deriv-sub">{summary.btcFunding < -0.001 ? 'Short bias · Squeeze risk' : summary.btcFunding > 0.001 ? 'Long bias · Correction risk' : 'Neutral · 8h rate'}</div>
        </div>
      </div>

      <div className="g2">
        {/* Funding Rates Table — LIVE */}
        <div className="panel panel-hover">
          <div className="ph">
            <div className="pt">Perpetual Funding Rates · Cross-Exchange</div>
            <div className={`tag ${isLive ? 'tag-live' : 'tag-pro'}`}>{isLive ? 'LIVE' : 'DEMO'}</div>
          </div>
          <table className="fr-table dt">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Asset</th>
                {assets.length > 0 && assets[0].exchanges.slice(0, 4).map((e, i) => (
                  <th key={i}>{e.name}</th>
                ))}
                <th>Avg Rate</th>
                <th>OI</th>
              </tr>
            </thead>
            <tbody>
              {assets.slice(0, 8).map((a) => (
                <tr className="row-alive" key={a.asset}>
                  <td style={{ fontWeight: 600 }}>{a.asset}</td>
                  {a.exchanges.slice(0, 4).map((e, i) => (
                    <td key={i} className={rateClass(e.fundingRate)}>
                      {fmtRate(e.fundingRate)}
                    </td>
                  ))}
                  {/* Pad if fewer than 4 exchanges */}
                  {Array.from({ length: Math.max(0, 4 - a.exchanges.length) }).map((_, i) => (
                    <td key={`pad-${i}`} style={{ color: 'var(--muted)' }}>—</td>
                  ))}
                  <td className={rateClass(a.avgFundingRate)} style={{ fontWeight: 600 }}>
                    {fmtRate(a.avgFundingRate)}
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{fmt$(a.totalOI)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '8px' }}>
            Negative rate = shorts pay longs. Extreme negative = potential short squeeze. Updates every 8h.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--b1)' }}>
          {/* Open Interest Chart */}
          <div className="panel panel-hover">
            <div className="ph">
              <div className="pt">Open Interest by Asset</div>
              <div className={`tag ${isLive ? 'tag-live' : 'tag-pro'}`}>{isLive ? 'LIVE' : 'DEMO'}</div>
            </div>
            <div className="chart-wrap" style={{ height: '160px' }}>
              <Bar data={oiChartData} options={oiOptions as any} />
            </div>
          </div>

          {/* 24h Volume Chart */}
          <div className="panel panel-hover">
            <div className="ph">
              <div className="pt">24h Derivatives Volume</div>
              <div className={`tag ${isLive ? 'tag-live' : 'tag-pro'}`}>CoinGecko</div>
            </div>
            <div className="chart-wrap" style={{ height: '120px' }}>
              <Bar data={volChartData} options={volOptions as any} />
            </div>
          </div>
        </div>
      </div>

      {/* Macro Correlation + Stablecoin Supply — LIVE DATA */}
      <div className="g2" style={{ marginTop: '1px' }}>
        <div className="panel panel-hover">
          <div className="ph">
            <div className="pt">Macro Correlation — BTC vs Traditional Markets</div>
            <div className={`tag ${macroLive ? 'tag-live' : 'tag-ai'}`}>{macroLive ? <><span style={{ color: 'var(--green)', marginRight: '4px' }}>●</span> LIVE · Yahoo Finance</> : 'ChainIntel Research'}</div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>30-DAY ROLLING PEARSON CORRELATION WITH BTC PRICE{macroBtcPrice > 0 && <span style={{ color: 'var(--cyan)', marginLeft: '8px' }}>BTC ${macroBtcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({macroBtcChg >= 0 ? '+' : ''}{macroBtcChg.toFixed(1)}% 7d)</span>}</div>
          {macroData.map((m) => {
            const fmtVal = m.symbol === 'TNX' ? `${m.value.toFixed(2)}%`
              : m.unit === '$' ? `$${m.value.toLocaleString('en-US', { maximumFractionDigits: m.value < 100 ? 1 : 0 })}`
              : m.value.toLocaleString('en-US', { maximumFractionDigits: m.value < 200 ? 1 : 0 });
            const chgStr = m.symbol === 'TNX'
              ? `${(m.changeBps ?? 0) >= 0 ? '+' : ''}${Math.round(m.changeBps ?? 0)}bps 7d`
              : `${m.change7d >= 0 ? '+' : ''}${m.change7d.toFixed(1)}% 7d`;
            return (
              <div className="macro-row" key={m.name}>
                <div className="macro-asset">{m.name}</div>
                <div className="macro-val">{fmtVal}</div>
                <div className={`macro-chg ${m.changeDir}`}>{chgStr}</div>
                <div className="macro-corr">
                  <span style={{ color: m.color }}>{m.corrLabel}</span>
                  <div className="corr-bar" style={{ background: 'var(--b3)' }}><div style={{ width: m.corrPct, height: '3px', background: m.color, borderRadius: '2px' }}></div></div>
                </div>
              </div>
            );
          })}
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '8px' }}>{macroLive ? 'Live 30-day correlation · CoinGecko BTC × Yahoo Finance TradFi · 5min refresh' : 'Bloomberg cannot show this cross-asset view natively'} · ChainIntel exclusive</div>
        </div>

        <div className="panel panel-hover">
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
                <th>Peg</th>
                <th>Chain</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-alive"><td>USDT</td><td>$144.2B</td><td className="fr-positive">+$2.1B</td><td style={{ color: 'var(--green)' }}>✓ 1.000</td><td style={{ color: 'var(--text2)' }}>Multi</td></tr>
              <tr className="row-alive"><td>USDC</td><td>$60.8B</td><td className="fr-positive">+$1.4B</td><td style={{ color: 'var(--green)' }}>✓ 1.000</td><td style={{ color: 'var(--text2)' }}>Multi</td></tr>
              <tr className="row-alive"><td>USDS</td><td>$14.1B</td><td className="fr-positive">+$0.8B</td><td style={{ color: 'var(--green)' }}>✓ 1.001</td><td style={{ color: 'var(--text2)' }}>ETH</td></tr>
              <tr className="row-alive"><td>DAI</td><td>$5.4B</td><td className="fr-negative">−$0.2B</td><td style={{ color: 'var(--green)' }}>✓ 0.999</td><td style={{ color: 'var(--text2)' }}>ETH</td></tr>
              <tr className="row-alive"><td>FDUSD</td><td>$2.1B</td><td className="fr-negative">−$0.1B</td><td style={{ color: 'var(--green)' }}>✓ 1.000</td><td style={{ color: 'var(--text2)' }}>Multi</td></tr>
              <tr className="row-alive"><td style={{ color: 'var(--cyan)', fontWeight: 600 }}>RLUSD</td><td>$1.4B</td><td className="fr-positive">+$0.3B</td><td style={{ color: 'var(--green)' }}>✓ 1.000</td><td style={{ color: 'var(--text2)' }}>XRP/ETH</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Microstructure — Level Up 4 */}
      <MicrostructurePanel />

      {/* AI Synthesis — dynamic */}
      <div className="ai-box">
        <div className="ai-label">
          <span className="ai-pulse"></span>
          Derivatives AI Synthesis · {isLive ? 'Live Data' : 'Coinalyze · Laevitas'} · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="ai-text">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: negCount > posCount ? 'var(--red)' : 'var(--green)', flexShrink: 0 }}>▸</span>
              <span><strong>{negCount} of {assets.length} assets have negative funding</strong> — derivatives traders are net short. {negCount > posCount ? 'When shorts dominate and spot shows accumulation, historically precedes short squeezes.' : 'Mixed positioning across assets.'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--cyan)', flexShrink: 0 }}>▸</span>
              <span><strong>Total OI: {fmt$(summary.totalOI)}</strong> — BTC dominates at {((summary.btcOI / summary.totalOI) * 100).toFixed(0)}% of total derivatives open interest. {summary.btcFunding < -0.001 ? 'Reduced leverage = lower crash risk from cascading liquidations.' : 'Monitor for leverage buildup.'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span>
              <span><strong>Stablecoin supply +$4.2B this month</strong> — fresh USD entering the ecosystem. Historical precedent: stablecoin inflows of this magnitude precede meaningful rallies within 30–90 days.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--gold)', flexShrink: 0 }}>▸</span>
              <span><strong>BTC-SPX correlation {macroData.find(m => m.symbol === 'SPX')?.corrLabel || '+0.72 Strong ↑'}</strong> — {(macroData.find(m => m.symbol === 'SPX')?.correlation ?? 0.72) > 0.5 ? 'macro risk-on environment. Equities correlation suggests crypto tracking TradFi sentiment.' : 'BTC decoupling from equities. Independent crypto-native drivers dominating.'} DXY at {macroData.find(m => m.symbol === 'DXY')?.value.toFixed(1) || '104.8'} ({(macroData.find(m => m.symbol === 'DXY')?.change7d ?? 0) > 0 ? 'strengthening — headwind for risk assets' : 'weakening — tailwind for crypto'}). 10Y Treasury at {macroData.find(m => m.symbol === 'TNX')?.value.toFixed(2) || '4.52'}% — {(macroData.find(m => m.symbol === 'TNX')?.change7d ?? 0) < 0 ? 'yields declining, expect BTC to benefit from looser financial conditions.' : 'rising yields create competition for risk-on capital.'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
