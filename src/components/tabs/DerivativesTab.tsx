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

const EMPTY_DERIV_STATE: DerivData = {
  assets: [],
  summary: { totalOI: 0, totalVolume: 0, btcOI: 0, ethOI: 0, btcFunding: 0, assetCount: 0, dataPoints: 0 },
  updatedAt: '',
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

interface StablecoinInfo {
  name: string;
  symbol: string;
  supply: number;
  change30d: number;
  peg: number;
  chain: string;
}

interface StablecoinSupplyData {
  stablecoins: StablecoinInfo[];
  totalSupply: number;
  totalChange30d: number;
  updatedAt: string;
  live: boolean;
  stale?: boolean;
}

const EMPTY_STABLECOIN_DATA: StablecoinSupplyData = {
  stablecoins: [],
  totalSupply: 0,
  totalChange30d: 0,
  updatedAt: '',
  live: false,
};

export default function DerivativesTab() {
  const [data, setData] = useState<DerivData>(EMPTY_DERIV_STATE);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [macroData, setMacroData] = useState<MacroAsset[]>([]);
  const [macroLive, setMacroLive] = useState(false);
  const [macroBtcPrice, setMacroBtcPrice] = useState(0);
  const [macroBtcChg, setMacroBtcChg] = useState(0);
  const [stablecoinData, setStablecoinData] = useState<StablecoinSupplyData>(EMPTY_STABLECOIN_DATA);
  const [stablecoinLoading, setStablecoinLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/derivatives');
      if (!res.ok) throw new Error(`${res.status}`);
      const json: DerivData = await res.json();
      if (json.assets && json.assets.length > 0) {
        setData(json);
        setIsLive(true);
        setLastUpdate(new Date(json.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setData(EMPTY_DERIV_STATE);
        setIsLive(false);
        setLastUpdate('');
      }
    } catch {
      setData(EMPTY_DERIV_STATE);
      setIsLive(false);
      setLastUpdate('');
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

  const fetchStablecoins = useCallback(async () => {
    try {
      const res = await fetch('/api/stablecoin-supply');
      if (!res.ok) throw new Error(`${res.status}`);
      const json: StablecoinSupplyData = await res.json();
      setStablecoinData(json);
    } catch {
      setStablecoinData(EMPTY_STABLECOIN_DATA);
    } finally {
      setStablecoinLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchMacro();
    fetchStablecoins();
    const iv = setInterval(fetchData, 120_000); // refresh every 2 min
    const iv2 = setInterval(fetchMacro, 300_000); // refresh macro every 5 min
    const iv3 = setInterval(fetchStablecoins, 300_000); // refresh stablecoin supply every 5 min
    return () => { clearInterval(iv); clearInterval(iv2); clearInterval(iv3); };
  }, [fetchData, fetchMacro, fetchStablecoins]);

  const { assets, summary } = data;
  const btc = assets.find(a => a.asset === 'BTC');
  const eth = assets.find(a => a.asset === 'ETH');

  // Determine sentiment from funding rates
  const negCount = assets.filter(a => a.avgFundingRate < -0.001).length;
  const posCount = assets.filter(a => a.avgFundingRate > 0.001).length;
  const sentiment = negCount > posCount ? 'short bias' : posCount > negCount ? 'long bias' : 'neutral';
  const stablecoinFlowLabel = stablecoinData.totalChange30d > 0 ? 'BULLISH inflow' : stablecoinData.totalChange30d < 0 ? 'NET redemption' : 'Flat 30d supply';
  const stablecoinFlowColor = stablecoinData.totalChange30d > 0 ? 'var(--green)' : stablecoinData.totalChange30d < 0 ? 'var(--red)' : 'var(--text2)';
  const stablecoinTag = stablecoinData.live ? 'LIVE · DefiLlama' : stablecoinData.stale ? 'CACHED · DefiLlama' : stablecoinLoading ? 'CONNECTING...' : 'FEED UNAVAILABLE';
  const stablecoinHasData = stablecoinData.stablecoins.length > 0;
  const btcDominance = summary.totalOI > 0 ? ((summary.btcOI / summary.totalOI) * 100).toFixed(0) : null;
  const derivativesTag = isLive ? 'LIVE · CoinGecko' : loading ? 'CONNECTING...' : 'FEED UNAVAILABLE';

  // OI chart — simple horizontal bars by asset
  const oiChartData = {
    labels: assets.slice(0, 8).map(a => a.asset),
    datasets: [{
      label: 'Open Interest',
      data: assets.slice(0, 8).map(a => a.totalOI / 1e9),
      backgroundColor: assets.slice(0, 8).map(a => a.avgFundingRate < 0 ? 'rgba(239,68,68,0.5)' : 'rgba(232,165,52,0.5)'),
      borderColor: assets.slice(0, 8).map(a => a.avgFundingRate < 0 ? '#ef4444' : '#E8A534'),
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
      backgroundColor: 'rgba(107,138,255,0.5)',
      borderColor: '#6B8AFF',
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
          ) : loading ? 'Connecting to live derivatives intelligence...' : 'Live derivatives feed unavailable. Reconnect in progress.'}
        </span>
        <span className="acs-ts" id="acs-ts-derivatives"></span>
      </div>

      <div className="section-h">
        <div className="section-h-label">Derivatives Intelligence</div>
        <div className="section-h-line"></div>
        <div className={`tag ${isLive ? 'tag-live' : 'tag-pro'}`}>
          {isLive ? (
            <><span style={{ color: 'var(--green)', marginRight: '4px' }}>●</span> {derivativesTag}</>
          ) : loading ? (
            <span className="connecting-indicator" style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em' }}>CONNECTING...</span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--muted)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', letterSpacing: '0.1em' }}>FEED UNAVAILABLE</span>
            </span>
          )}
          {lastUpdate && <span style={{ marginLeft: '8px', color: 'var(--muted)' }}>Updated {lastUpdate}</span>}
        </div>
      </div>

      {/* KPI row */}
      <div className="g4">
        <div className="deriv-card">
          <div className="deriv-label">BTC Open Interest</div>
          <div className="deriv-metric" style={{ color: 'var(--accent)' }}>{fmt$(summary.btcOI)}</div>
          <div className="deriv-sub">{isLive ? `${summary.dataPoints} contracts tracked` : loading ? 'Connecting to CoinGecko derivatives' : 'Waiting for live feed'}</div>
        </div>
        <div className="deriv-card">
          <div className="deriv-label">ETH Open Interest</div>
          <div className="deriv-metric" style={{ color: 'var(--blue)' }}>{fmt$(summary.ethOI)}</div>
          <div className="deriv-sub">{eth ? `Funding ${fmtRate(eth.avgFundingRate)}` : loading ? 'Connecting to CoinGecko' : 'Waiting for live feed'}</div>
        </div>
        <div className="deriv-card">
          <div className="deriv-label">Total Derivatives OI</div>
          <div className="deriv-metric" style={{ color: 'var(--text)' }}>{fmt$(summary.totalOI)}</div>
          <div className="deriv-sub">{summary.assetCount > 0 ? `${summary.assetCount} assets · All exchanges` : loading ? 'Connecting to aggregated contracts' : 'No live contracts available'}</div>
        </div>
        <div className="deriv-card">
          <div className="deriv-label">BTC Perp Funding</div>
          <div className="deriv-metric" style={{ color: summary.btcFunding < 0 ? 'var(--red)' : summary.btcFunding > 0 ? 'var(--green)' : 'var(--gold)' }}>
            {fmtRate(summary.btcFunding)}
          </div>
          <div className="deriv-sub">{summary.btcOI === 0 && !loading ? 'Waiting for live BTC funding' : summary.btcFunding < -0.001 ? 'Short bias · Squeeze risk' : summary.btcFunding > 0.001 ? 'Long bias · Correction risk' : 'Neutral · 8h rate'}</div>
        </div>
      </div>

      <div className="g2">
        {/* Funding Rates Table — LIVE */}
        <div className="panel panel-hover">
          <div className="ph">
            <div className="pt">Perpetual Funding Rates · Cross-Exchange</div>
            <div className={`tag ${isLive ? 'tag-live' : 'tag-pro'}`}>{isLive ? 'LIVE' : loading ? <span className="connecting-indicator" style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em' }}>CONNECTING...</span> : <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em' }}>FEED UNAVAILABLE</span>}</div>
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
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                    {loading ? 'Connecting to live derivatives feed...' : 'No live derivatives data available right now.'}
                  </td>
                </tr>
              ) : assets.slice(0, 8).map((a) => (
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
              <div className={`tag ${isLive ? 'tag-live' : 'tag-pro'}`}>{isLive ? 'LIVE' : loading ? <span className="connecting-indicator" style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em' }}>CONNECTING...</span> : <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.1em' }}>FEED UNAVAILABLE</span>}</div>
            </div>
            <div className="chart-wrap" style={{ height: '160px' }}>
              {assets.length > 0 ? <Bar data={oiChartData} options={oiOptions as any} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '8px' }}>{loading ? 'Connecting...' : 'No live OI chart data'}</div>}
            </div>
          </div>

          {/* 24h Volume Chart */}
          <div className="panel panel-hover">
            <div className="ph">
              <div className="pt">24h Derivatives Volume</div>
              <div className={`tag ${isLive ? 'tag-live' : 'tag-pro'}`}>{isLive ? 'CoinGecko' : loading ? 'CONNECTING...' : 'FEED UNAVAILABLE'}</div>
            </div>
            <div className="chart-wrap" style={{ height: '120px' }}>
              {assets.length > 0 ? <Bar data={volChartData} options={volOptions as any} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '8px' }}>{loading ? 'Connecting...' : 'No live volume data'}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Macro Correlation + Stablecoin Supply — LIVE DATA */}
      <div className="g2" style={{ marginTop: '1px' }}>
        <div className="panel panel-hover">
          <div className="ph">
            <div className="pt">Macro Correlation — BTC vs Traditional Markets</div>
            <div className={`tag ${macroLive ? 'tag-live' : 'tag-ai'}`}>{macroLive ? <><span style={{ color: 'var(--green)', marginRight: '4px' }}>●</span> LIVE · Yahoo Finance</> : 'FEED STANDBY'}</div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>30-DAY ROLLING PEARSON CORRELATION WITH BTC PRICE{macroBtcPrice > 0 && <span style={{ color: 'var(--accent)', marginLeft: '8px' }}>BTC ${macroBtcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })} ({macroBtcChg >= 0 ? '+' : ''}{macroBtcChg.toFixed(1)}% 7d)</span>}</div>
          {macroData.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: '8px' }}>
              Macro correlation feed is temporarily unavailable.
            </div>
          ) : macroData.map((m) => {
            const val = m.value ?? 0;
            const fmtVal = m.symbol === 'TNX' ? `${val.toFixed(2)}%`
              : m.unit === '$' ? `$${val.toLocaleString('en-US', { maximumFractionDigits: val < 100 ? 1 : 0 })}`
              : val.toLocaleString('en-US', { maximumFractionDigits: val < 200 ? 1 : 0 });
            const chg7d = m.change7d ?? 0;
            const chgStr = m.symbol === 'TNX'
              ? `${(m.changeBps ?? 0) >= 0 ? '+' : ''}${Math.round(m.changeBps ?? 0)}bps 7d`
              : `${chg7d >= 0 ? '+' : ''}${chg7d.toFixed(1)}% 7d`;
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
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '8px' }}>{macroLive ? 'Live 30-day correlation · CoinGecko BTC × Yahoo Finance TradFi · 5min refresh' : 'Awaiting next macro correlation snapshot'} · ChainIntel exclusive</div>
        </div>

        <div className="panel panel-hover">
          <div className="ph">
            <div className="pt">Stablecoin Supply — Liquidity Signal</div>
            <div className={`tag ${stablecoinData.live ? 'tag-live' : 'tag-pro'}`}>{stablecoinTag}</div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.1em' }}>STABLECOIN MARKET = SIDELINED CASH WAITING TO ENTER CRYPTO</div>
          <div className="g2" style={{ gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'var(--s1)', padding: '10px', border: '1px solid var(--b2)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '3px' }}>TOTAL STABLECOIN SUPPLY</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{fmt$(stablecoinData.totalSupply)}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: stablecoinFlowColor }}>{stablecoinHasData ? `${stablecoinData.totalChange30d >= 0 ? '+' : ''}${fmt$(stablecoinData.totalChange30d)} this month · ${stablecoinFlowLabel}` : stablecoinLoading ? 'Connecting to live stablecoin supply...' : 'Live stablecoin feed unavailable'}</div>
            </div>
            <div style={{ background: 'var(--s1)', padding: '10px', border: '1px solid var(--b2)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '3px' }}>30D SUPPLY CHANGE</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 700, color: stablecoinFlowColor }}>{stablecoinData.totalChange30d >= 0 ? '+' : ''}{fmt$(stablecoinData.totalChange30d)}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text2)' }}>{stablecoinHasData ? 'Net USD supply change across tracked stablecoins' : stablecoinLoading ? 'Waiting for DefiLlama response' : 'No live stablecoin metrics available'}</div>
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
              {stablecoinHasData ? stablecoinData.stablecoins.map((coin) => (
                <tr className="row-alive" key={coin.symbol}>
                  <td style={coin.symbol === 'RLUSD' ? { color: 'var(--accent)', fontWeight: 600 } : undefined}>{coin.symbol}</td>
                  <td>{fmt$(coin.supply)}</td>
                  <td className={coin.change30d >= 0 ? 'fr-positive' : 'fr-negative'}>{coin.change30d >= 0 ? '+' : ''}{fmt$(coin.change30d)}</td>
                  <td style={{ color: Math.abs((coin.peg ?? 1) - 1) <= 0.01 ? 'var(--green)' : 'var(--gold)' }}>{Math.abs((coin.peg ?? 1) - 1) <= 0.01 ? '✓' : '•'} {coin.peg.toFixed(3)}</td>
                  <td style={{ color: 'var(--text2)' }}>{coin.chain}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                    {stablecoinLoading ? 'Connecting to live stablecoin supply...' : 'No live stablecoin supply data available right now.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {stablecoinData.updatedAt && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '8px' }}>
              Updated {new Date(stablecoinData.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · DefiLlama stablecoin supply
            </div>
          )}
        </div>
      </div>

      {/* Market Microstructure — Level Up 4 */}
      <MicrostructurePanel />

      {/* AI Synthesis — dynamic */}
      <div className="ai-box">
        <div className="ai-label">
          <span className="ai-pulse"></span>
          Derivatives AI Synthesis · {isLive ? 'Live Data' : 'Standby'} · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="ai-text">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: negCount > posCount ? 'var(--red)' : 'var(--green)', flexShrink: 0 }}>▸</span>
              <span>{assets.length > 0 ? <><strong>{negCount} of {assets.length} assets have negative funding</strong> — derivatives traders are net short. {negCount > posCount ? 'When shorts dominate and spot shows accumulation, historically precedes short squeezes.' : 'Mixed positioning across assets.'}</> : 'Live derivatives positioning is still loading. The synthesis updates as soon as funding and open-interest snapshots land.'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>▸</span>
              <span>{summary.totalOI > 0 && btcDominance ? <><strong>Total OI: {fmt$(summary.totalOI)}</strong> — BTC dominates at {btcDominance}% of total derivatives open interest. {summary.btcFunding < -0.001 ? 'Reduced leverage = lower crash risk from cascading liquidations.' : 'Monitor for leverage buildup.'}</> : 'Open-interest totals will appear here once the derivatives aggregator returns a full cross-exchange snapshot.'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span>
              <span>{stablecoinHasData ? <><strong>Stablecoin supply {stablecoinData.totalChange30d >= 0 ? '+' : ''}{fmt$(stablecoinData.totalChange30d)} this month</strong> — {stablecoinData.totalChange30d >= 0 ? 'fresh USD entering the ecosystem.' : 'net liquidity leaving tracked stablecoins.'} Historical precedent: large stablecoin balance changes often precede meaningful moves within 30–90 days.</> : 'Stablecoin liquidity signals will populate here when the DefiLlama supply feed responds.'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--gold)', flexShrink: 0 }}>▸</span>
              <span>{macroData.length > 0 ? <><strong>BTC-SPX correlation {macroData.find(m => m.symbol === 'SPX')?.corrLabel}</strong> — {(macroData.find(m => m.symbol === 'SPX')?.correlation ?? 0) > 0.5 ? 'macro risk-on environment. Equities correlation suggests crypto tracking TradFi sentiment.' : 'BTC decoupling from equities. Independent crypto-native drivers dominating.'} DXY at {macroData.find(m => m.symbol === 'DXY')?.value?.toFixed(1)} ({(macroData.find(m => m.symbol === 'DXY')?.change7d ?? 0) > 0 ? 'strengthening — headwind for risk assets' : 'weakening — tailwind for crypto'}). 10Y Treasury at {macroData.find(m => m.symbol === 'TNX')?.value?.toFixed(2)}% — {(macroData.find(m => m.symbol === 'TNX')?.change7d ?? 0) < 0 ? 'yields declining, expect BTC to benefit from looser financial conditions.' : 'rising yields create competition for risk-on capital.'}</> : 'Macro correlation commentary will return when the cross-asset feed is back online.'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
