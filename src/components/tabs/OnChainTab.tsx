'use client';

import { useState, useEffect, useCallback } from 'react';

interface AssetMetrics {
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  change7d: number;
  change30d: number;
  mvrv: number;
  nvt: number;
  exchangeFlow30d: number;
  lthSupplyPct: number;
  dailyTxCount: number;
  onchainScore: number;
  hashrate: number;
  liquidityScore: number;
  adoptionScore: number;
  networkScore: number;
  decentralization: number;
}

interface OnChainData {
  assets: AssetMetrics[];
  btcHashrate: number;
  updatedAt: string;
  source: string;
  methodology: string;
}

function fmtPrice(n: number): string {
  if (n >= 10000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(4)}`;
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function mvrvColor(v: number): string {
  if (v >= 3.0) return 'var(--red)';     // Overvalued
  if (v >= 2.0) return 'var(--gold)';    // Caution
  if (v >= 1.0) return 'var(--green)';   // Fair value
  return 'var(--cyan)';                   // Undervalued
}

function mvrvLabel(v: number): string {
  if (v >= 3.0) return 'OVERVALUED';
  if (v >= 2.0) return 'CAUTION';
  if (v >= 1.0) return 'FAIR VALUE';
  return 'UNDERVALUED';
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--cyan)' : score >= 60 ? 'var(--green)' : score >= 40 ? 'var(--gold)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 80, height: 6, background: 'var(--b3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color})`, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color, minWidth: 20 }}>{score}</span>
    </div>
  );
}

type SortKey = 'symbol' | 'onchainScore' | 'mvrv' | 'nvt' | 'exchangeFlow30d' | 'lthSupplyPct' | 'volume24h' | 'change30d';

export default function OnChainTab() {
  const [data, setData] = useState<OnChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('onchainScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/onchain-metrics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 120_000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.1em' }}>LOADING ON-CHAIN METRICS...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)' }}>ON-CHAIN FEED UNAVAILABLE — {error}</div>
      </div>
    );
  }

  const btc = data.assets.find(a => a.symbol === 'BTC');
  const eth = data.assets.find(a => a.symbol === 'ETH');

  // Sort assets
  const sorted = [...data.assets].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    if (typeof av === 'string') return sortDir === 'asc' ? (av as string).localeCompare(bv as any) : (bv as any as string).localeCompare(av as string);
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  // AI Synthesis
  const btcMvrvNote = btc ? `BTC MVRV at ${btc.mvrv} — ${mvrvLabel(btc.mvrv).toLowerCase()}. ` : '';
  const flowNote = btc && btc.exchangeFlow30d < 0
    ? `Exchange reserves declining (${fmtCompact(btc.exchangeFlow30d)} BTC net outflow) — structural accumulation signal. `
    : btc ? `Exchange inflows detected — distribution risk. ` : '';
  const hashNote = data.btcHashrate > 0 ? `Hash rate at ${Math.round(data.btcHashrate)} EH/s. ` : '';

  return (
    <div>
      {/* AI Context Strip */}
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body">
          <strong>{btcMvrvNote}</strong>{flowNote}{hashNote}
          On-chain fundamentals {btc && btc.onchainScore >= 70 ? 'constructively bullish' : btc && btc.onchainScore >= 50 ? 'neutral — no strong directional signal' : 'cautionary — watch for further deterioration'}.
        </span>
      </div>

      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text2)' }}>ON-CHAIN INTELLIGENCE</span>
        <div style={{ flex: 1, height: 1, background: 'var(--b2)' }} />
        <span className="tag" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue)' }}>PRO</span>
        <span className="tag tag-live">
          <a className="src-link" href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko</a>
          {' · '}
          <a className="src-link" href="https://mempool.space" target="_blank" rel="noopener noreferrer">Mempool</a>
        </span>
      </div>

      {/* Top KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {btc && (
          <>
            <div className="kpi">
              <div className="kpi-label">MVRV Ratio · BTC</div>
              <div className="kpi-val" style={{ color: mvrvColor(btc.mvrv) }}>{btc.mvrv}</div>
              <div className="kpi-chg" style={{ color: mvrvColor(btc.mvrv) }}>{mvrvLabel(btc.mvrv)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Exchange Flow · 30d</div>
              <div className="kpi-val" style={{ color: btc.exchangeFlow30d < 0 ? 'var(--green)' : 'var(--red)' }}>
                {btc.exchangeFlow30d < 0 ? '−' : '+'}{fmtCompact(Math.abs(btc.exchangeFlow30d))}
              </div>
              <div className={`kpi-chg ${btc.exchangeFlow30d < 0 ? 'up' : 'dn'}`}>
                {btc.exchangeFlow30d < 0 ? 'Net outflow — accumulation' : 'Net inflow — distribution'}
              </div>
            </div>
          </>
        )}
        {btc && (
          <div className="kpi">
            <div className="kpi-label">Long-Term Holders</div>
            <div className="kpi-val" style={{ color: 'var(--green)' }}>{btc.lthSupplyPct.toFixed(1)}%</div>
            <div className="kpi-chg">{btc.lthSupplyPct > 70 ? 'High conviction' : 'Moderate'}</div>
          </div>
        )}
        {data.btcHashrate > 0 && (
          <div className="kpi">
            <div className="kpi-label">Hash Rate · BTC</div>
            <div className="kpi-val cyan">{Math.round(data.btcHashrate)} EH/s</div>
            <div className="kpi-chg up">{data.btcHashrate > 800 ? 'ATH zone — miner confidence high' : 'Growing'}</div>
          </div>
        )}
      </div>

      {/* Secondary metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {btc && (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 12px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>NVT Ratio · BTC</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: 'var(--gold)' }}>{btc.nvt}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', marginTop: 2 }}>
              {btc.nvt < 50 ? 'Network undervalued vs throughput' : btc.nvt < 80 ? 'Fair value zone' : 'Potentially overvalued'}
            </div>
          </div>
        )}
        {eth && (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 12px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>ETH MVRV</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: mvrvColor(eth.mvrv) }}>{eth.mvrv}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', marginTop: 2 }}>{mvrvLabel(eth.mvrv)}</div>
          </div>
        )}
        {btc && (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 12px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>Stablecoin Supply Ratio</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: 'var(--green)' }}>
              {(btc.volume24h / btc.marketCap).toFixed(3)}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', marginTop: 2 }}>
              Vol/MCap — {btc.volume24h / btc.marketCap > 0.05 ? 'elevated activity' : 'normal range'}
            </div>
          </div>
        )}
      </div>

      {/* Full Matrix Table */}
      <div className="panel">
        <div className="ph">
          <div className="pt">On-Chain Intelligence Matrix · {data.assets.length} Assets</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="tag tag-live">
              <a className="src-link" href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko</a>
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)' }}>
              {new Date(data.updatedAt).toLocaleTimeString()} · Click row to expand
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11, minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                {([
                  ['symbol', 'ASSET'],
                  ['mvrv', 'MVRV'],
                  ['exchangeFlow30d', 'EXCH FLOW 30D'],
                  ['lthSupplyPct', 'LTH %'],
                  ['nvt', 'NVT'],
                  ['volume24h', 'VOLUME 24H'],
                  ['change30d', '30D %'],
                  ['onchainScore', 'OC SCORE'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th key={key} onClick={() => handleSort(key)}
                    style={{ textAlign: key === 'symbol' ? 'left' : 'right', padding: '6px 8px', color: sortKey === key ? 'var(--cyan)' : 'var(--muted)', fontSize: 8, letterSpacing: '0.08em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    {label} {sortKey === key ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                  </th>
                ))}
                <th style={{ padding: '6px 8px', width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(a => (
                <>
                  <tr key={a.symbol}
                    onClick={() => setExpandedAsset(expandedAsset === a.symbol ? null : a.symbol)}
                    style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = expandedAsset === a.symbol ? 'rgba(0,212,170,0.03)' : '')}>
                    <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 8, color: 'var(--muted)', transition: 'transform 0.2s', transform: expandedAsset === a.symbol ? 'rotate(90deg)' : '' }}>▶</span>
                        {a.symbol}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: mvrvColor(a.mvrv), fontWeight: 600 }}>{a.mvrv}</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: a.exchangeFlow30d < 0 ? 'var(--green)' : 'var(--red)' }}>
                      {a.exchangeFlow30d < 0 ? '−' : '+'}{fmtCompact(Math.abs(a.exchangeFlow30d))}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{a.lthSupplyPct.toFixed(1)}%</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{a.nvt}</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{fmtCompact(a.volume24h)}</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: a.change30d >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {a.change30d >= 0 ? '+' : ''}{a.change30d.toFixed(1)}%
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 8px' }}>
                      <ScoreBar score={a.onchainScore} />
                    </td>
                    <td></td>
                  </tr>
                  {expandedAsset === a.symbol && (
                    <tr key={`${a.symbol}-detail`} style={{ background: 'rgba(0,212,170,0.03)' }}>
                      <td colSpan={9} style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                          <div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', marginBottom: 2 }}>PRICE</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fmtPrice(a.price)}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: a.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}% 24h
                            </div>
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', marginBottom: 2 }}>MARKET CAP</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>${fmtCompact(a.marketCap)}</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', marginBottom: 2 }}>MVRV ASSESSMENT</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: mvrvColor(a.mvrv) }}>{mvrvLabel(a.mvrv)}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', marginTop: 2 }}>
                              {a.mvrv < 1 ? 'Below realized value — historically strong buy zone' : a.mvrv < 2 ? 'Fair value range — neutral positioning' : a.mvrv < 3 ? 'Above fair value — consider reducing exposure' : 'Significantly overvalued — high risk of correction'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', marginBottom: 2 }}>SCORE BREAKDOWN</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', lineHeight: 1.8 }}>
                              Liquidity: {a.liquidityScore}/20<br />
                              Adoption: {a.adoptionScore}/20<br />
                              Network: {a.networkScore}/20<br />
                              Decentr.: {a.decentralization}/20
                            </div>
                          </div>
                        </div>
                        {a.hashrate > 0 && (
                          <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cyan)' }}>
                            Hash Rate: {Math.round(a.hashrate)} EH/s — {a.hashrate > 800 ? 'Near ATH, miner confidence extremely high' : 'Growing steadily'}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology note */}
      <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', padding: '6px 8px', background: 'var(--s1)', border: '1px solid var(--b1)' }}>
        <strong style={{ color: 'var(--text2)' }}>Methodology:</strong> {data.methodology}
      </div>
    </div>
  );
}
