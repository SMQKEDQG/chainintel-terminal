'use client';

import { useEffect, useState, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar } from 'react-chartjs-2';

/* ── Macro Correlation types ── */
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
}
interface MacroData {
  assets: MacroAsset[];
  btcPrice: number;
  btcChange7d: number;
  live: boolean;
}

/* ── Stablecoin types ── */
interface StablecoinInfo {
  name: string;
  symbol: string;
  supply: number;
  change30d: number;
  peg: number;
  chain: string;
}
interface StablecoinData {
  stablecoins: StablecoinInfo[];
  totalSupply: number;
  totalChange30d: number;
  live: boolean;
}

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

// Empty initial state — shows loading skeleton until live data arrives
const EMPTY_DATA: DerivData = {
  assets: [],
  summary: { totalOI: 0, totalVolume: 0, btcOI: 0, ethOI: 0, btcFunding: 0, assetCount: 0, dataPoints: 0 },
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

export default function DerivativesTab() {
  const [data, setData] = useState<DerivData>(EMPTY_DATA);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

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

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 120_000); // refresh every 2 min
    return () => clearInterval(iv);
  }, [fetchData]);

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
    <div className="page" id="page-derivatives">
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
        <div className="panel">
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
                <tr key={a.asset}>
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
          <div className="panel">
            <div className="ph">
              <div className="pt">Open Interest by Asset</div>
              <div className={`tag ${isLive ? 'tag-live' : 'tag-pro'}`}>{isLive ? 'LIVE' : 'DEMO'}</div>
            </div>
            <div className="chart-wrap" style={{ height: '160px' }}>
              <Bar data={oiChartData} options={oiOptions as any} />
            </div>
          </div>

          {/* 24h Volume Chart */}
          <div className="panel">
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
        <MacroCorrelationPanel />
        <StablecoinSupplyPanel />
      </div>

      {/* AI Synthesis — dynamic */}
      <DerivativesAISynthesis assets={assets} summary={summary} isLive={isLive} negCount={negCount} posCount={posCount} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * MacroCorrelationPanel — live data from /api/macro-correlations
 * ═══════════════════════════════════════════════════════════════════ */
function MacroCorrelationPanel() {
  const [macroData, setMacroData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/macro-correlations')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: MacroData) => { setMacroData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmtVal = (a: MacroAsset) => {
    if (a.symbol === 'TNX') return `${a.value.toFixed(2)}%`;
    if (a.symbol === 'XAU' || a.symbol === 'WTI') return `$${a.value.toLocaleString('en-US', { maximumFractionDigits: a.symbol === 'WTI' ? 1 : 0 })}`;
    return a.value.toLocaleString('en-US', { maximumFractionDigits: a.value > 100 ? 0 : 1 });
  };

  const fmtChg = (a: MacroAsset) => {
    if (a.symbol === 'TNX' && a.changeBps !== undefined) {
      return `${a.changeBps >= 0 ? '+' : ''}${Math.round(a.changeBps)}bps 7d`;
    }
    return `${a.change7d >= 0 ? '+' : ''}${a.change7d.toFixed(1)}% 7d`;
  };

  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">Macro Correlation — BTC vs Traditional Markets</div>
        <div className={`tag ${macroData?.live ? 'tag-live' : 'tag-ai'}`}>
          {macroData?.live ? <><span style={{ color: 'var(--green)', marginRight: '4px' }}>●</span>LIVE · Yahoo Finance</> : 'ChainIntel Research'}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>30-DAY ROLLING CORRELATION WITH BTC PRICE</div>
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)' }}>Loading macro correlations...</div>
      ) : macroData?.assets && macroData.assets.length > 0 ? (
        macroData.assets.map((m) => (
          <div className="macro-row" key={m.symbol}>
            <div className="macro-asset">{m.name}</div>
            <div className="macro-val">{fmtVal(m)}</div>
            <div className={`macro-chg ${m.changeDir}`}>{fmtChg(m)}</div>
            <div className="macro-corr">
              <span style={{ color: m.color }}>{m.corrLabel}</span>
              <div className="corr-bar" style={{ background: 'var(--b3)' }}>
                <div style={{ width: m.corrPct, height: '3px', background: m.color, borderRadius: '2px' }}></div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: '10px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)' }}>Macro data unavailable — retrying on next cycle</div>
      )}
      <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '8px' }}>Bloomberg cannot show this cross-asset view natively · ChainIntel exclusive</div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
 * StablecoinSupplyPanel — live data from /api/stablecoin-supply
 * ═════════════════════════════════════════════════════════════════ */
function StablecoinSupplyPanel() {
  const [data, setData] = useState<StablecoinData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stablecoin-supply')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: StablecoinData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmtB = (n: number) => n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${(n / 1e6).toFixed(0)}M`;
  const fmtChg = (n: number) => {
    const abs = Math.abs(n);
    const str = abs >= 1e9 ? `$${(abs / 1e9).toFixed(1)}B` : `$${(abs / 1e6).toFixed(0)}M`;
    return n >= 0 ? `+${str}` : `−${str}`;
  };

  const totalSupply = data?.totalSupply ?? 0;
  const totalChange = data?.totalChange30d ?? 0;
  const stables = data?.stablecoins ?? [];

  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">Stablecoin Supply — Liquidity Signal</div>
        <div className={`tag ${data?.live ? 'tag-live' : 'tag-pro'}`}>
          {data?.live ? <><span style={{ color: 'var(--green)', marginRight: '4px' }}>●</span>LIVE · DefiLlama</> : 'DefiLlama · CoinGecko'}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>STABLECOIN MARKET = SIDELINED CASH WAITING TO ENTER CRYPTO</div>
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)' }}>Loading stablecoin data...</div>
      ) : (
        <>
          <div className="g2" style={{ gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'var(--s1)', padding: '10px', border: '1px solid var(--b2)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '3px' }}>TOTAL STABLECOIN SUPPLY</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 700, color: 'var(--cyan)' }}>{fmtB(totalSupply)}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: totalChange >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {fmtChg(totalChange)} this month · {totalChange >= 0 ? 'BULLISH inflow' : 'BEARISH outflow'}
              </div>
            </div>
            <div style={{ background: 'var(--s1)', padding: '10px', border: '1px solid var(--b2)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '3px' }}>30D SUPPLY CHANGE</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 700, color: totalChange >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtChg(totalChange)}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text2)' }}>{totalChange >= 0 ? 'New USD entering crypto ecosystem' : 'Capital rotating out of stablecoins'}</div>
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
              {stables.slice(0, 6).map((s) => (
                <tr key={s.symbol}>
                  <td style={s.symbol === 'RLUSD' ? { color: 'var(--cyan)', fontWeight: 600 } : undefined}>{s.symbol}</td>
                  <td>{fmtB(s.supply)}</td>
                  <td className={s.change30d >= 0 ? 'fr-positive' : 'fr-negative'}>{fmtChg(s.change30d)}</td>
                  <td style={{ color: Math.abs(s.peg - 1) < 0.01 ? 'var(--green)' : 'var(--red)' }}>
                    {Math.abs(s.peg - 1) < 0.01 ? '✓' : '✗'} {s.peg.toFixed(3)}
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{s.chain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
 * DerivativesAISynthesis — dynamic AI synthesis box
 * ═════════════════════════════════════════════════════════════════ */
function DerivativesAISynthesis({ assets, summary, isLive, negCount, posCount }: {
  assets: AssetData[];
  summary: DerivData['summary'];
  isLive: boolean;
  negCount: number;
  posCount: number;
}) {
  // Fetch live stablecoin + macro for synthesis text
  const [stableChange, setStableChange] = useState<string>('+$0');
  const [spxCorr, setSpxCorr] = useState<string>('+0.00');
  const [dxyChg, setDxyChg] = useState<string>('0.0%');

  useEffect(() => {
    fetch('/api/stablecoin-supply').then(r => r.json()).then((d: StablecoinData) => {
      const c = d.totalChange30d;
      setStableChange(c >= 1e9 ? `+$${(c / 1e9).toFixed(1)}B` : c >= 0 ? `+$${(c / 1e6).toFixed(0)}M` : `-$${(Math.abs(c) / 1e9).toFixed(1)}B`);
    }).catch(() => {});
    fetch('/api/macro-correlations').then(r => r.json()).then((d: MacroData) => {
      const spx = d.assets?.find((a: MacroAsset) => a.symbol === 'SPX');
      const dxy = d.assets?.find((a: MacroAsset) => a.symbol === 'DXY');
      if (spx) setSpxCorr(`${spx.correlation >= 0 ? '+' : ''}${spx.correlation.toFixed(2)}`);
      if (dxy) setDxyChg(`${dxy.change7d >= 0 ? '+' : ''}${dxy.change7d.toFixed(1)}%`);
    }).catch(() => {});
  }, []);

  return (
    <div className="ai-box">
      <div className="ai-label">
        <span className="ai-pulse"></span>
        Derivatives AI Synthesis · {isLive ? 'Live Data' : 'CoinGecko Derivatives'} · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
      <div className="ai-text">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: negCount > posCount ? 'var(--red)' : 'var(--green)', flexShrink: 0 }}>▸</span>
            <span><strong>{negCount} of {assets.length} assets have negative funding</strong> — derivatives traders are net short. {negCount > posCount ? 'When shorts dominate and spot shows accumulation, historically precedes short squeezes.' : 'Mixed positioning across assets.'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--cyan)', flexShrink: 0 }}>▸</span>
            <span><strong>Total OI: {fmt$(summary.totalOI)}</strong> — BTC dominates at {summary.totalOI > 0 ? ((summary.btcOI / summary.totalOI) * 100).toFixed(0) : '0'}% of total derivatives open interest. {summary.btcFunding < -0.001 ? 'Reduced leverage = lower crash risk from cascading liquidations.' : 'Monitor for leverage buildup.'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span>
            <span><strong>Stablecoin supply {stableChange} this month</strong> — {stableChange.startsWith('+') ? 'fresh USD entering the ecosystem. Historical precedent: stablecoin inflows of this magnitude precede meaningful rallies within 30–90 days.' : 'capital outflows detected. Monitor for potential selling pressure.'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--gold)', flexShrink: 0 }}>▸</span>
            <span><strong>BTC-SPX correlation {spxCorr}</strong> — {parseFloat(spxCorr) > 0.5 ? 'macro risk-off environment.' : 'decoupling from equities.'} Dollar {dxyChg.startsWith('+') ? `strength (DXY ${dxyChg}) creates headwind` : `weakness (DXY ${dxyChg}) provides tailwind`}. Monitor 10Y yield: if drops further, expect BTC to decouple upward as in 2023 pattern.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
