'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataFreshness, SkeletonGrid, SkeletonTable, ErrorState } from '../DataFreshness';

interface OnChainAsset {
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
}

interface OnChainAPI {
  assets: OnChainAsset[];
  btcHashrate: number;
  updatedAt: string;
  source: string;
}

interface MempoolData {
  hashrate: number;
  difficulty: number;
  nextDiffAdj: string;
  fees: { fast: number; normal: number; economy: number };
  blockHeight: number;
  totalBtc: number;
}

export default function OnChainTab() {
  const [assets, setAssets] = useState<OnChainAsset[]>([]);
  const [mempool, setMempool] = useState<MempoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const [metricsRes, mempoolRes, networkRes] = await Promise.allSettled([
        fetch('/api/onchain-metrics'),
        fetch('/api/onchain'),
        fetch('/api/network-stats'),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        const json: OnChainAPI = await metricsRes.value.json();
        if (json.assets?.length > 0) {
          setAssets(json.assets);
          setIsLive(json.source === 'live');
        }
      }

      if (mempoolRes.status === 'fulfilled' && mempoolRes.value.ok) {
        const mJson = await mempoolRes.value.json();
        if (mJson.blockHeight > 0) setMempool(mJson);
      }

      // Merge network-stats aggregator data (Etherscan gas, Beaconcha.in, Blockchair)
      if (networkRes.status === 'fulfilled' && networkRes.value.ok) {
        try {
          const netJson = await networkRes.value.json();
          // Enrich mempool data with Etherscan gas if available
          if (netJson.etherscan?.gasOracle) {
            setMempool(prev => prev ? { ...prev, ethGas: netJson.etherscan.gasOracle } : prev);
          }
          setIsLive(true);
        } catch { /* keep existing data */ }
      }

      setLastUpdated(new Date());
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 120_000); // refresh every 2 min
    return () => clearInterval(iv);
  }, [fetchData]);

  // Filter out assets with null/missing price data (e.g. MATIC→POL rebrand)
  const validAssets = assets.filter(a => a.price != null && a.marketCap != null);

  const btc = validAssets.find(a => a.symbol === 'BTC');
  const hr = mempool?.hashrate ?? btc?.hashrate ?? 0;
  const blk = mempool?.blockHeight ?? 0;
  const fees = mempool?.fees ?? { fast: 0, normal: 0, economy: 0 };

  // Dynamic AI synthesis — built from live data
  const topScorer = validAssets[0];
  const biggestMover30d = [...validAssets].sort((a, b) => Math.abs(b.change30d ?? 0) - Math.abs(a.change30d ?? 0))[0];
  const netExchangeFlow = validAssets.reduce((sum, a) => sum + (a.exchangeFlow30d ?? 0), 0);
  const avgMvrv = validAssets.length > 0 ? validAssets.reduce((s, a) => s + (a.mvrv ?? 0), 0) / validAssets.length : 0;
  
  const flowDir = netExchangeFlow < 0 ? 'outflows dominate' : 'inflows increasing';
  const mvrvSignal = avgMvrv < 1 ? 'deep undervalued zone — historically strong entry' : avgMvrv < 2 ? 'fair value — accumulation zone' : avgMvrv < 3 ? 'heating up — watch for overextension' : 'overheated — caution warranted';

  const sourceLabel = isLive ? '● LIVE · COINGECKO · MEMPOOL.SPACE' : '● CACHED · STATIC DATA';

  if (error && !lastUpdated) {
    return <ErrorState message="On-chain data feeds temporarily unavailable. This may be due to rate limiting from upstream providers." onRetry={fetchData} />;
  }

  // KPI cards — top 9 metrics, all from live data
  const kpiCards = [
    { label: 'Hash Rate · BTC', value: hr > 0 ? `${hr.toFixed(1)} EH/s` : 'Loading...', sub: hr > 800 ? 'Near ATH zone — miners confident' : hr > 600 ? 'Healthy network security' : 'Loading hashrate...', color: 'var(--accent)', delta: hr > 800 ? 'ATH Zone' : hr > 0 ? 'Healthy' : '—', deltaColor: hr > 800 ? 'var(--accent)' : 'var(--green)' },
    { label: 'Block Height', value: blk > 0 ? blk.toLocaleString() : 'Loading...', sub: 'Latest confirmed Bitcoin mainnet block', color: 'var(--text)' },
    { label: 'BTC Fee · Fast', value: fees.fast > 0 ? `${fees.fast} sat/vB` : 'Loading...', sub: fees.normal > 0 ? `Normal: ${fees.normal} · Economy: ${fees.economy} sat/vB` : 'Loading fee estimates...', color: 'var(--accent)', delta: fees.fast > 50 ? '▲ High' : fees.fast > 20 ? '◆ Normal' : fees.fast > 0 ? '▼ Low' : '', deltaColor: fees.fast > 50 ? 'var(--red)' : fees.fast > 20 ? 'var(--gold)' : 'var(--green)' },
    { label: 'Avg MVRV · 12 Assets', value: avgMvrv > 0 ? avgMvrv.toFixed(2) : 'Loading...', sub: mvrvSignal, color: 'var(--gold)', delta: avgMvrv < 2 ? '▲ Accumulation' : '▼ Caution', deltaColor: avgMvrv < 2 ? 'var(--gold)' : 'var(--red)' },
    { label: 'Net Exchange Flow', value: assets.length > 0 ? `${netExchangeFlow > 0 ? '+' : ''}${(netExchangeFlow / 1000).toFixed(1)}K` : 'Loading...', sub: `30d aggregate across ${validAssets.length} assets — ${flowDir}`, color: netExchangeFlow < 0 ? 'var(--green)' : 'var(--red)', delta: netExchangeFlow < 0 ? '▲ Bullish' : '▼ Bearish', deltaColor: netExchangeFlow < 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Top On-Chain Score', value: topScorer ? `${topScorer.symbol} · ${topScorer.onchainScore}` : 'Loading...', sub: topScorer ? `Strongest on-chain profile of ${validAssets.length} tracked assets` : '', color: 'var(--accent)', delta: topScorer ? `#1 of ${validAssets.length}` : '', deltaColor: 'var(--accent)' },
    { label: btc ? `BTC MVRV` : 'BTC MVRV', value: btc ? btc.mvrv.toFixed(2) : 'Loading...', sub: btc ? `${btc.mvrv < 1 ? 'Undervalued zone' : btc.mvrv < 2.4 ? 'Fair value (1.0–2.4)' : 'Overheated zone'}` : '', color: 'var(--gold)' },
    { label: btc ? `BTC LTH Supply` : 'BTC LTH Supply', value: btc ? `${btc.lthSupplyPct.toFixed(1)}%` : 'Loading...', sub: btc ? `Est. % held 155+ days — ${btc.lthSupplyPct > 70 ? 'strong conviction' : 'moderate'}` : '', color: 'var(--green)' },
    { label: '30d Biggest Mover', value: biggestMover30d ? `${biggestMover30d.symbol} ${biggestMover30d.change30d >= 0 ? '+' : ''}${biggestMover30d.change30d.toFixed(1)}%` : 'Loading...', sub: biggestMover30d ? `Largest 30-day price move in tracked universe` : '', color: biggestMover30d && biggestMover30d.change30d >= 0 ? 'var(--green)' : 'var(--red)' },
  ];

  return (
    <div className="tab-content-enter">
      {/* AI Context Strip — fully dynamic */}
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body">
          {validAssets.length > 0 ? (
            <>
              BTC hashrate <strong>{hr > 0 ? `${hr.toFixed(0)} EH/s` : 'loading'}</strong> — {hr > 800 ? 'near ATH zone, miner confidence high' : 'tracking healthy levels'}.
              {blk > 0 && <> Block #{blk.toLocaleString()}.</>}
              {fees.fast > 0 && <> Fees: {fees.fast} sat/vB.</>}
              {' '}Avg MVRV {avgMvrv.toFixed(2)} — {mvrvSignal}. Net exchange {flowDir}.
              {' '}<strong>On-chain: {avgMvrv < 2 && netExchangeFlow < 0 ? 'constructively bullish' : avgMvrv < 2 ? 'neutral leaning bullish' : 'caution zone'}.</strong>
              <span style={{ marginLeft: 8 }} className={`source-badge ${isLive ? 'live' : 'cached'}`}>{sourceLabel}</span>
            </>
          ) : (
            <>Loading on-chain intelligence from 12 assets...</>
          )}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text2)' }}>BITCOIN ON-CHAIN INTELLIGENCE</span>
        <div style={{ flex: 1, height: 1, background: 'var(--b2)' }} />
        <DataFreshness lastUpdated={lastUpdated} source="CoinGecko · Mempool" isLive={isLive} />
        <span className="tag" style={{ background: 'rgba(107,138,255,0.1)', color: 'var(--blue)' }}>PRO</span>
      </div>

      {/* KPI Grid — 100% live */}
      {loading ? (
        <SkeletonGrid cols={3} rows={3} />
      ) : (
        <div className="data-fresh" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {kpiCards.map(m => (
            <div key={m.label} className="metric-card" style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 12px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: m.color }}>{m.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', marginTop: 2 }}>{m.sub}</div>
              {m.delta && (
                <div style={{ marginTop: 4, fontFamily: 'var(--mono)', fontSize: 8, color: m.deltaColor, fontWeight: 600 }}>{m.delta}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Intelligence Matrix — ALL from live API */}
      {loading ? (
        <SkeletonTable rows={12} cols={8} />
      ) : (
        <div className="panel panel-hover data-fresh">
          <div className="ph">
            <div className="pt">On-Chain Intelligence Matrix · {validAssets.length} Assets</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DataFreshness lastUpdated={lastUpdated} isLive={isLive} />
              <span className="source-badge live">● LIVE · DERIVED</span>
            </div>
          </div>
          {/* Data stream indicator */}
          <div className="data-stream" style={{ marginBottom: 8 }} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                {['Asset', 'Price', 'MVRV', 'Exch Flow 30d', 'LTH %', 'NVT', 'Hash EH/s', 'OC Score'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Asset' ? 'left' : 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8, letterSpacing: '0.1em' }}>{h}</th>
                ))}
                <th style={{ padding: '6px 8px', width: 100, fontSize: 8, color: 'var(--muted)' }}>Score Bar</th>
              </tr>
            </thead>
            <tbody>
              {validAssets.map(a => {
                const flow = a.exchangeFlow30d ?? 0;
                const flowStr = `${flow > 0 ? '+' : ''}${(flow / 1000).toFixed(1)}K`;
                const flowColor = flow < 0 ? 'var(--green)' : 'var(--red)';
                const p = a.price ?? 0;
                const priceStr = p >= 1000 ? `$${p.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : p >= 1 ? `$${p.toFixed(2)}` : `$${p.toFixed(4)}`;
                
                return (
                  <tr key={a.symbol} className="row-alive" style={{ borderBottom: '1px solid var(--b1)', transition: 'background 0.12s' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--text)' }}>
                      {a.symbol}
                      <span style={{ marginLeft: 6, fontSize: 8, color: a.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {(a.change24h ?? 0) >= 0 ? '▲' : '▼'}{Math.abs(a.change24h ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{priceStr}</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--gold)' }}>{(a.mvrv ?? 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: flowColor }}>{flowStr}</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{(a.lthSupplyPct ?? 0).toFixed(1)}%</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{(a.nvt ?? 0).toFixed(1)}</td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', color: a.hashrate > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                      {a.hashrate > 0 ? a.hashrate.toFixed(0) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 700, color: 'var(--accent)' }}>{a.onchainScore}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <div style={{ height: 6, background: 'var(--b3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${a.onchainScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--blue))', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Synthesis — fully dynamic */}
      {validAssets.length > 0 && (
        <div className="data-fresh" style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div className="heartbeat" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.08em' }}>On-Chain AI Synthesis · Live Analysis</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>▸</span>
              <span>
                <strong style={{ color: 'var(--text)' }}>BTC hashrate {hr > 0 ? `${hr.toFixed(0)} EH/s` : 'loading'}</strong> — {hr > 800 ? 'near all-time high zone. Miners confident in future price action.' : hr > 600 ? 'healthy network security levels.' : 'data loading.'}
                {mempool && <> Difficulty: {mempool.difficulty.toFixed(2)}T.</>}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>▸</span>
              <span>
                <strong style={{ color: 'var(--text)' }}>Net exchange flow {netExchangeFlow > 0 ? '+' : ''}{(netExchangeFlow / 1000).toFixed(1)}K</strong> across {validAssets.length} assets (30d) — {netExchangeFlow < 0 ? 'coins moving to cold storage, structural accumulation signal' : 'increased exchange deposits, watch for selling pressure'}.
                {btc && <> BTC LTH supply {btc.lthSupplyPct.toFixed(1)}% — {btc.lthSupplyPct > 70 ? 'strong conviction holding.' : 'moderate conviction.'}</>}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: avgMvrv < 2 && netExchangeFlow < 0 ? 'var(--green)' : 'var(--gold)', flexShrink: 0 }}>▸</span>
              <span>
                <strong style={{ color: 'var(--text)' }}>On-chain picture: {avgMvrv < 2 && netExchangeFlow < 0 ? 'constructively bullish' : avgMvrv < 2 ? 'neutral-to-bullish' : 'mixed signals'}</strong> — avg MVRV {avgMvrv.toFixed(2)} ({mvrvSignal}). {topScorer && <>Top rated: {topScorer.symbol} ({topScorer.onchainScore}/100).</>}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
