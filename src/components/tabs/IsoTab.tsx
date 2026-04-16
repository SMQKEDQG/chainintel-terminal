'use client';

import { useState, useEffect, useCallback } from 'react';

interface CmcCoin {
  name: string;
  symbol: string;
  price: number;
  percent_change_24h: number;
  percent_change_7d: number;
  market_cap: number;
  volume_24h: number;
}

interface IsoAsset {
  sym: string;
  name: string;
  geckoId: string;
  cmcSlug: string;
  network: string;
  status: 'CERTIFIED' | 'IN PROGRESS' | 'PARTIAL';
  score: number;
  banks: string;
  txSpeed: string;
  useCase: string;
  statusColor: string;
}

const ISO_ASSETS: IsoAsset[] = [
  { sym: 'XRP', name: 'XRP Ledger', geckoId: 'ripple', cmcSlug: 'XRP', network: 'Ripple · RippleNet', status: 'CERTIFIED', score: 94, banks: '300+', txSpeed: '3-5s', useCase: 'Cross-border payments, remittances, liquidity bridging', statusColor: 'var(--green)' },
  { sym: 'XLM', name: 'Stellar Network', geckoId: 'stellar', cmcSlug: 'XLM', network: 'SDF · MoneyGram', status: 'CERTIFIED', score: 88, banks: '150+', txSpeed: '5s', useCase: 'Remittances, CBDC infrastructure, asset tokenization', statusColor: 'var(--green)' },
  { sym: 'HBAR', name: 'Hedera Hashgraph', geckoId: 'hedera-hashgraph', cmcSlug: 'HBAR', network: 'Hedera Council', status: 'CERTIFIED', score: 86, banks: '50+', txSpeed: '3-5s', useCase: 'Enterprise DLT, tokenized assets, supply chain', statusColor: 'var(--green)' },
  { sym: 'QNT', name: 'Quant Network', geckoId: 'quant-network', cmcSlug: 'QNT', network: 'Overledger', status: 'CERTIFIED', score: 82, banks: '40+', txSpeed: 'Bridge', useCase: 'Interoperability layer, multi-chain banking', statusColor: 'var(--green)' },
  { sym: 'IOTA', name: 'IOTA Foundation', geckoId: 'iota', cmcSlug: 'IOTA', network: 'Shimmer · Assembly', status: 'IN PROGRESS', score: 68, banks: '10+', txSpeed: '10s', useCase: 'IoT payments, data integrity, feeless microtransactions', statusColor: 'var(--gold)' },
  { sym: 'ADA', name: 'Cardano', geckoId: 'cardano', cmcSlug: 'ADA', network: 'EMURGO · IOG', status: 'IN PROGRESS', score: 64, banks: '5+', txSpeed: '20s', useCase: 'Identity solutions, DeFi, governance', statusColor: 'var(--gold)' },
  { sym: 'ALGO', name: 'Algorand', geckoId: 'algorand', cmcSlug: 'ALGO', network: 'Algorand Foundation', status: 'PARTIAL', score: 58, banks: '10+', txSpeed: '3.9s', useCase: 'CBDC pilots, green DeFi, carbon credits', statusColor: 'var(--gold)' },
  { sym: 'XDC', name: 'XDC Network', geckoId: 'xdce-crowd-sale', cmcSlug: 'XDC', network: 'XinFin · TradeFinex', status: 'PARTIAL', score: 54, banks: '10+', txSpeed: '2s', useCase: 'Trade finance, supply chain, tokenized invoices', statusColor: 'var(--gold)' },
];

const TIMELINE = [
  { date: 'Nov 2022', event: 'SWIFT mandates ISO 20022 for cross-border payments', done: true },
  { date: 'Mar 2023', event: 'Fed, ECB, BOE adopt ISO 20022 for RTGS systems', done: true },
  { date: 'Nov 2025', event: 'Full SWIFT migration deadline (extended from Mar 2025)', done: true },
  { date: 'Q1 2026', event: 'ISO 20022-native assets gain direct bank integration advantage', done: true },
  { date: 'Q2 2026', event: 'Expected: first major bank deploys XRP for real-time settlement', done: false },
  { date: 'H2 2026', event: 'CBDC interoperability trials using Stellar & HBAR infrastructure', done: false },
];

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(4)}`;
}

function fmtMcap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function IsoTab() {
  const [prices, setPrices] = useState<Record<string, CmcCoin>>({});
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/market-data?limit=200');
      if (!res.ok) return;
      const json = await res.json();
      const coins = Array.isArray(json?.coins) ? json.coins : [];
      const map: Record<string, CmcCoin> = {};
      for (const c of coins) {
        if (ISO_ASSETS.some(a => a.sym === c.symbol)) {
          map[c.symbol] = c;
        }
      }
      setPrices(map);
    } catch { /* fail silently */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPrices();
    const iv = setInterval(fetchPrices, 120_000);
    return () => clearInterval(iv);
  }, [fetchPrices]);

  const certifiedCount = ISO_ASSETS.filter(a => a.status === 'CERTIFIED').length;
  const inProgressCount = ISO_ASSETS.filter(a => a.status !== 'CERTIFIED').length;
  const totalMcap = ISO_ASSETS.reduce((sum, a) => sum + (prices[a.sym]?.market_cap || 0), 0);

  return (
    <div>
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body">
          ISO 20022 is the global banking messaging standard replacing SWIFT MT. Assets with native compliance get <strong>direct integration into banking payment rails</strong> — $150T+ flows annually through these systems.
          {totalMcap > 0 && <> Combined ISO 20022 asset market cap: <strong>{fmtMcap(totalMcap)}</strong>.</>}
          {' '}This is the most underpriced structural catalyst in crypto.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--text2)' }}>ISO 20022 BANKING INTEGRATION TRACKER</span>
        <div style={{ flex: 1, height: 1, background: 'var(--b2)' }} />
        <span className="tag" style={{ background: 'rgba(107,138,255,0.1)', color: 'var(--blue)' }}>PRO · {ISO_ASSETS.length} Assets</span>
        <span className="tag tag-live">
          <a className="src-link" href="https://coinpaprika.com" target="_blank" rel="noopener noreferrer">CoinPaprika</a>
          {' · '}
          <a className="src-link" href="https://www.swift.com/standards/iso-20022" target="_blank" rel="noopener noreferrer">SWIFT</a>
        </span>
      </div>

      {/* KPI Row */}
      <div className="g4">
        <div className="kpi">
          <div className="kpi-label">SWIFT Annual Volume</div>
          <div className="kpi-val gold">$150T+</div>
          <div className="kpi-chg">Total addressable market</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Certified Assets</div>
          <div className="kpi-val cyan">{certifiedCount}</div>
          <div className="kpi-chg">{ISO_ASSETS.filter(a => a.status === 'CERTIFIED').map(a => a.sym).join(', ')}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">In Progress / Partial</div>
          <div className="kpi-val" style={{ color: 'var(--gold)' }}>{inProgressCount}</div>
          <div className="kpi-chg">{ISO_ASSETS.filter(a => a.status !== 'CERTIFIED').map(a => a.sym).join(', ')}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Combined Market Cap</div>
          <div className="kpi-val" style={{ color: 'var(--text)' }}>{totalMcap > 0 ? fmtMcap(totalMcap) : '—'}</div>
          <div className={`kpi-chg ${loading ? '' : 'up'}`}>{loading ? 'Loading...' : 'Live'}</div>
        </div>
      </div>

      {/* Main Asset Table */}
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="ph">
          <div className="pt">ISO 20022 Compliance Matrix</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--b2)' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>ASSET</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>NETWORK</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>PRICE</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>24H %</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>MKT CAP</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>BANKS</th>
              <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>TX SPEED</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 12 }}>CI SCORE</th>
              <th style={{ padding: '6px 8px', width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {ISO_ASSETS.map(a => {
              const p = prices[a.sym];
              return (
                <tr key={a.sym} style={{ borderBottom: '1px solid var(--b1)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,165,52,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '5px 8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{a.sym}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.name}</div>
                  </td>
                  <td style={{ padding: '5px 8px', fontSize: 11, color: 'var(--text2)' }}>{a.network}</td>
                  <td style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 600, color: 'var(--text)' }}>
                    {p ? fmtPrice(p.price) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 600, color: p ? (p.percent_change_24h >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)' }}>
                    {p ? `${(p.percent_change_24h ?? 0) >= 0 ? '+' : ''}${(p.percent_change_24h ?? 0).toFixed(2)}%` : '—'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>
                    {p ? fmtMcap(p.market_cap) : '—'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', color: 'var(--accent)' }}>{a.banks}</td>
                  <td style={{ textAlign: 'center', padding: '5px 8px', color: 'var(--text2)' }}>{a.txSpeed}</td>
                  <td style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 700, color: 'var(--accent)' }}>{a.score}</td>
                  <td style={{ padding: '5px 8px' }}>
                    <div style={{ height: 6, background: 'var(--b3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${a.score}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--blue))', borderRadius: 3 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Two-column bottom: Use cases + Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        {/* Use Cases */}
        <div className="panel">
          <div className="ph">
            <div className="pt">Banking Use Cases</div>
          </div>
          <div style={{ padding: '8px 12px' }}>
            {ISO_ASSETS.filter(a => a.status === 'CERTIFIED').map(a => (
              <div key={a.sym} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--b1)' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', minWidth: 36 }}>{a.sym}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>{a.useCase}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Migration Timeline */}
        <div className="panel">
          <div className="ph">
            <div className="pt">SWIFT Migration Timeline</div>
          </div>
          <div style={{ padding: '8px 12px' }}>
            {TIMELINE.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: i < TIMELINE.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 12 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: t.done ? 'var(--accent)' : 'var(--b3)',
                    border: t.done ? 'none' : '1px solid var(--muted)',
                  }} />
                  {i < TIMELINE.length - 1 && (
                    <div style={{ width: 1, height: 20, background: t.done ? 'var(--accent)' : 'var(--b2)', opacity: 0.4, marginTop: 2 }} />
                  )}
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: t.done ? 'var(--accent)' : 'var(--gold)' }}>{t.date}</span>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{t.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Synthesis */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>CI · ISO 20022 Intelligence</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>The SWIFT ISO 20022 migration is complete — this isn&apos;t future speculation, it&apos;s live infrastructure.</strong>{' '}
          {certifiedCount} assets have full certification for banking message compatibility. XRP leads with 300+ banking partnerships and the fastest settlement at 3-5 seconds.
          {totalMcap > 0 && <>{' '}Combined sector market cap of <strong style={{ color: 'var(--accent)' }}>{fmtMcap(totalMcap)}</strong> for exposure to $150T+ annual payment flows — the asymmetry here is the most compelling in all of crypto.</>}
        </div>
      </div>
    </div>
  );
}
