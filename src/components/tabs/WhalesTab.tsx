'use client';

import { useState, useEffect, useCallback } from 'react';

interface WhaleAlert {
  type: 'buy' | 'sell' | 'transfer';
  dir: string;
  amt: string;
  btcAmount: number;
  txid: string;
  route: string;
  minsAgo: number;
  blockHeight: number;
  confirmed: boolean;
}

interface WhaleSummary {
  totalVolume: number;
  count: number;
  buyCount: number;
  sellCount: number;
  xferCount: number;
  netDirection: string;
}

interface WhaleData {
  alerts: WhaleAlert[];
  summary: WhaleSummary;
  source: string;
  timestamp: number;
}

interface ChainScoreRating {
  asset: string;
  name: string;
  score: number;
  grade: string;
  signal: string;
  factors: {
    regulatory_clarity: number;
    adoption_velocity: number;
    decentralization: number;
    liquidity_depth: number;
    network_fundamentals: number;
  };
  updated: string;
}

interface ChainScoreData {
  count: number;
  ratings: ChainScoreRating[];
}

function ScoreBar({ score, max = 20 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? 'var(--accent)' : pct >= 60 ? 'var(--green)' : pct >= 40 ? 'var(--gold)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 50, height: 5, background: 'var(--b3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color, minWidth: 14, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

function gradeColor(grade: string): string {
  if (grade.startsWith('A') || grade === 'Institutional Grade' || grade === 'Investment Grade') return 'var(--accent)';
  if (grade.startsWith('B') || grade === 'Speculative Grade') return 'var(--green)';
  if (grade.startsWith('C') || grade === 'High Risk') return 'var(--gold)';
  return 'var(--red)';
}

function signalColor(signal: string): string {
  if (signal === 'BUY') return 'var(--green)';
  if (signal === 'HOLD') return 'var(--gold)';
  return 'var(--red)';
}

function alertTypeColor(type: string): string {
  if (type === 'buy') return 'var(--green)';
  if (type === 'sell') return 'var(--red)';
  return 'var(--accent)';
}

export default function WhalesTab() {
  const [whaleData, setWhaleData] = useState<WhaleData | null>(null);
  const [chainScores, setChainScores] = useState<ChainScoreRating[]>([]);
  const [whaleLoading, setWhaleLoading] = useState(true);
  const [csLoading, setCsLoading] = useState(true);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const fetchWhales = useCallback(async () => {
    try {
      const res = await fetch('/api/whales');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setWhaleData(json);
    } catch { /* fail silently */ }
    setWhaleLoading(false);
  }, []);

  const fetchChainScores = useCallback(async () => {
    try {
      const res = await fetch('/api/chainscore?all=true');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const ratings = json.ratings || (json.count ? json.ratings : [json]);
      if (Array.isArray(ratings)) {
        ratings.sort((a: ChainScoreRating, b: ChainScoreRating) => b.score - a.score);
        setChainScores(ratings);
      }
    } catch { /* fail silently */ }
    setCsLoading(false);
  }, []);

  useEffect(() => {
    fetchWhales();
    fetchChainScores();
    const whaleIv = setInterval(fetchWhales, 120_000);
    const csIv = setInterval(fetchChainScores, 300_000);
    return () => { clearInterval(whaleIv); clearInterval(csIv); };
  }, [fetchWhales, fetchChainScores]);

  const summary = whaleData?.summary;
  const alerts = whaleData?.alerts || [];

  // AI synthesis
  const whaleAi = summary
    ? `${summary.count} whale transactions detected (last ~1hr). Net direction: ${summary.netDirection}. ${summary.totalVolume.toFixed(0)} BTC moved — ${summary.buyCount} accumulation, ${summary.sellCount} distribution, ${summary.xferCount} transfers.`
    : 'Loading whale intelligence...';

  const topScore = chainScores[0];
  const csAi = topScore
    ? `ChainScore leader: ${topScore.asset} at ${topScore.score}/100 (${topScore.grade}). ${chainScores.filter(r => r.signal === 'BUY').length} assets rated BUY, ${chainScores.filter(r => r.signal === 'HOLD').length} HOLD, ${chainScores.filter(r => r.signal === 'WATCH').length} WATCH.`
    : '';

  return (
    <div>
      {/* AI Context */}
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body">
          <strong>{whaleAi}</strong>{csAi ? ` ${csAi}` : ''}
        </span>
      </div>

      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--text2)' }}>WHALE ACTIVITY & CHAINSCORE RATINGS</span>
        <div style={{ flex: 1, height: 1, background: 'var(--b2)' }} />
        <span className="tag" style={{ background: 'rgba(107,138,255,0.1)', color: 'var(--blue)' }}>PRO</span>
        <span className="tag tag-live">
          <a className="src-link" href="https://mempool.space" target="_blank" rel="noopener noreferrer">Mempool</a>
          {' · '}
          <span>Supabase</span>
        </span>
      </div>

      {/* KPI Row */}
      <div className="g4">
        <div className="kpi">
          <div className="kpi-label">Whale Transactions</div>
          <div className="kpi-val cyan">{summary?.count ?? '—'}</div>
          <div className="kpi-chg">{whaleLoading ? 'Loading...' : 'Last ~1 hour'}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Volume</div>
          <div className="kpi-val" style={{ color: 'var(--gold)' }}>{summary ? `${summary.totalVolume.toFixed(0)} BTC` : '—'}</div>
          <div className="kpi-chg">{summary ? `$${((summary.totalVolume * 74000) / 1e6).toFixed(0)}M est.` : ''}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Net Direction</div>
          <div className="kpi-val" style={{ color: summary?.netDirection === 'accumulation' ? 'var(--green)' : summary?.netDirection === 'distribution' ? 'var(--red)' : 'var(--gold)' }}>
            {summary?.netDirection?.toUpperCase() || '—'}
          </div>
          <div className="kpi-chg">{summary ? `${summary.buyCount} buy · ${summary.sellCount} sell · ${summary.xferCount} xfer` : ''}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">ChainScore Assets</div>
          <div className="kpi-val cyan">{chainScores.length || '—'}</div>
          <div className="kpi-chg">{csLoading ? 'Loading...' : `${chainScores.filter(r => r.signal === 'BUY').length} rated BUY`}</div>
        </div>
      </div>

      {/* Two columns: Whale Alerts + ChainScore */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        {/* Whale Alerts */}
        <div className="panel">
          <div className="ph">
            <div className="pt">Live Whale Alerts — BTC</div>
            <div className="tag tag-live">
              <a className="src-link" href="https://mempool.space" target="_blank" rel="noopener noreferrer">Mempool.space</a>
            </div>
          </div>
          {whaleLoading ? (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>SCANNING BLOCKCHAIN...</div>
          ) : alerts.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>No large transactions in recent blocks</div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {alerts.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderBottom: '1px solid var(--b1)',
                  background: a.btcAmount >= 100 ? 'rgba(240,192,64,0.04)' : 'transparent',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,165,52,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = a.btcAmount >= 100 ? 'rgba(240,192,64,0.04)' : '')}>
                  {/* Direction icon */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: a.type === 'buy' ? 'rgba(16,185,129,0.15)' : a.type === 'sell' ? 'rgba(239,68,68,0.15)' : 'rgba(232,165,52,0.1)',
                    fontSize: 12,
                  }}>
                    {a.type === 'buy' ? '↓' : a.type === 'sell' ? '↑' : '↔'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: alertTypeColor(a.type) }}>{a.amt}</span>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 11, padding: '1px 4px', fontWeight: 600,
                        background: a.type === 'buy' ? 'rgba(16,185,129,0.15)' : a.type === 'sell' ? 'rgba(239,68,68,0.15)' : 'rgba(232,165,52,0.1)',
                        color: alertTypeColor(a.type),
                      }}>{a.dir}</span>
                      {a.btcAmount >= 100 && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '1px 4px', background: 'rgba(240,192,64,0.2)', color: 'var(--gold)', fontWeight: 700 }}>🐋 MEGA</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{a.route}</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>
                      <a href={`https://mempool.space/tx/${a.txid.replace('...', '')}`} target="_blank" rel="noopener noreferrer" className="src-link">{a.txid}</a>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
                      {a.minsAgo}m ago · #{a.blockHeight}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ChainScore Ratings */}
        <div className="panel">
          <div className="ph">
            <div className="pt">ChainScore™ Ratings — {chainScores.length} Assets</div>
            <div className="tag tag-live">Supabase</div>
          </div>
          {csLoading ? (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>LOADING RATINGS...</div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--b2)', position: 'sticky', top: 0, background: 'var(--s1)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>ASSET</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>SCORE</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>GRADE</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>SIGNAL</th>
                  </tr>
                </thead>
                <tbody>
                  {chainScores.map(r => (
                    <>
                      <tr key={r.asset}
                        onClick={() => setExpandedAsset(expandedAsset === r.asset ? null : r.asset)}
                        style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,165,52,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '5px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--muted)', transition: 'transform 0.2s', transform: expandedAsset === r.asset ? 'rotate(90deg)' : '' }}>▶</span>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.asset}</span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.name}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', padding: '5px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <div style={{ width: 40, height: 5, background: 'var(--b3)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${r.score}%`, height: '100%', background: r.score >= 75 ? 'var(--accent)' : r.score >= 60 ? 'var(--green)' : 'var(--gold)', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--accent)', minWidth: 20 }}>{r.score}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '2px 6px', fontWeight: 600, color: gradeColor(r.grade), background: `${gradeColor(r.grade)}15` }}>
                            {r.grade}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '5px 8px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '2px 6px', fontWeight: 700, color: signalColor(r.signal) }}>
                            {r.signal}
                          </span>
                        </td>
                      </tr>
                      {expandedAsset === r.asset && (
                        <tr key={`${r.asset}-detail`} style={{ background: 'rgba(232,165,52,0.03)' }}>
                          <td colSpan={4} style={{ padding: '10px 16px' }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.1em' }}>FACTOR BREAKDOWN (0-20 each)</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                              <div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>REGULATORY</div>
                                <ScoreBar score={r.factors.regulatory_clarity} />
                              </div>
                              <div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>ADOPTION</div>
                                <ScoreBar score={r.factors.adoption_velocity} />
                              </div>
                              <div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>DECENTRAL.</div>
                                <ScoreBar score={r.factors.decentralization} />
                              </div>
                              <div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>LIQUIDITY</div>
                                <ScoreBar score={r.factors.liquidity_depth} />
                              </div>
                              <div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>NETWORK</div>
                                <ScoreBar score={r.factors.network_fundamentals} />
                              </div>
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                              Last scored: {new Date(r.updated).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Synthesis */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>CI · Whale & ChainScore Synthesis</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
            {whaleData?.source === 'live' ? 'LIVE' : 'CACHED'} · {whaleData ? new Date(whaleData.timestamp).toLocaleTimeString() : ''}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>
            {summary?.netDirection === 'accumulation'
              ? 'Whale activity skews accumulation — large holders are buying, not selling. This aligns with Fear & Greed at extreme lows.'
              : summary?.netDirection === 'distribution'
                ? 'Distribution pattern detected — large holders reducing exposure. Monitor for continued selling pressure.'
                : 'Whale flows neutral — no strong directional signal from large transactions.'}
          </strong>
          {topScore && ` ChainScore ratings show ${topScore.asset} leading at ${topScore.score}/100. ${chainScores.filter(r => r.signal === 'BUY').length} of ${chainScores.length} assets carry a BUY signal.`}
        </div>
      </div>
    </div>
  );
}
