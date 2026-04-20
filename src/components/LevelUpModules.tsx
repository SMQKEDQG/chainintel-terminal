'use client';

import { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════════
   LEVEL UP 1: Cross-Source Correlation Engine
   Fuses whale + funding + ETF + sentiment + momentum into CI Signal
   ═══════════════════════════════════════════════════════════════════════════════ */

interface CISignalAsset {
  symbol: string; name: string; price: number; change24h: number; change7d: number;
  ciSignal: number; ciLabel: string; ciColor: string;
  components: { sentiment: number; funding: number; etfFlow: number; momentum: number; chainScore: number };
}

interface CorrelationData {
  global: { signal: number; label: string };
  assets: CISignalAsset[];
  inputs: { fearGreed: { value: number; label: string; signal: number }; funding: { rate: number; signal: number }; etf: { signal: number; streak: number; direction: string } };
  methodology: string;
  sources?: string[];
  sourceCount?: number;
  priceSource?: string;
  timestamp?: number;
}

export function CorrelationEngine() {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/correlation-engine').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    const iv = setInterval(() => { fetch('/api/correlation-engine').then(r => r.json()).then(setData).catch(() => {}); }, 60000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return (
    <div className="panel" style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 12, width: '60%', background: 'var(--s3)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 8, width: '80%', background: 'var(--s2)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 6, width: '40%', background: 'var(--s2)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 32, background: 'var(--s2)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      </div>
    </div>
  );
  if (!data) {
    return (
      <div className="panel panel-hover" style={{ padding: 16 }}>
        <div className="ph">
          <div className="pt" style={{ color: 'var(--accent)' }}>◈ CI Signal — Cross-Source Correlation Engine</div>
          <div className="tag" style={{ color: 'var(--gold)', border: '1px solid rgba(232,165,52,0.25)' }}>STANDBY</div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
          Correlation inputs are temporarily unavailable. The module will resume automatically when market, ETF, and sentiment sources reconnect.
        </div>
      </div>
    );
  }

  const signalColor = data.global.signal >= 60 ? 'var(--green)' : data.global.signal >= 45 ? 'var(--gold)' : 'var(--red)';
  const sortedAssets = [...data.assets].sort((a, b) => b.ciSignal - a.ciSignal);
  const strongestAsset = sortedAssets[0];
  const weakestAsset = sortedAssets[sortedAssets.length - 1];
  const driverCandidates = [
    { label: 'Sentiment', signal: data.inputs.fearGreed.signal, detail: data.inputs.fearGreed.label },
    { label: 'Funding', signal: data.inputs.funding.signal, detail: data.inputs.funding.rate > 0 ? 'Longs paying' : 'Shorts paying' },
    { label: 'ETF Flows', signal: data.inputs.etf.signal, detail: `${data.inputs.etf.streak}d ${data.inputs.etf.direction}` },
  ];
  const dominantDriver = [...driverCandidates].sort((a, b) => Math.abs(b.signal - 50) - Math.abs(a.signal - 50))[0];
  const updatedAt = data.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : null;

  return (
    <div className="panel panel-hover" style={{ border: `1px solid ${signalColor}40` }}>
      <div className="ph">
        <div className="pt" style={{ color: 'var(--accent)' }}>◈ CI Signal — Cross-Source Correlation Engine</div>
        <div className="tag" style={{ background: `${signalColor}15`, color: signalColor, border: `1px solid ${signalColor}40` }}>{data.global.label}</div>
      </div>

      {/* Global signal gauge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0 10px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 700, color: signalColor, lineHeight: 1 }}>{data.global.signal}</div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ width: `${data.global.signal}%`, height: '100%', background: `linear-gradient(90deg, var(--red), var(--gold), var(--green))`, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)' }}>
            <span>RISK OFF</span><span>NEUTRAL</span><span>RISK ON</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
        <SummaryTile
          label="STRONGEST SETUP"
          value={strongestAsset ? `${strongestAsset.symbol} ${strongestAsset.ciSignal}` : '—'}
          sub={strongestAsset ? `${strongestAsset.ciLabel} · ${strongestAsset.change7d >= 0 ? '+' : ''}${strongestAsset.change7d.toFixed(1)}% 7d` : 'Awaiting data'}
          color={strongestAsset?.ciColor || 'var(--accent)'}
        />
        <SummaryTile
          label="WEAKEST SETUP"
          value={weakestAsset ? `${weakestAsset.symbol} ${weakestAsset.ciSignal}` : '—'}
          sub={weakestAsset ? `${weakestAsset.ciLabel} · ${weakestAsset.change7d >= 0 ? '+' : ''}${weakestAsset.change7d.toFixed(1)}% 7d` : 'Awaiting data'}
          color={weakestAsset?.ciColor || 'var(--gold)'}
        />
        <SummaryTile
          label="DOMINANT DRIVER"
          value={dominantDriver?.label || '—'}
          sub={dominantDriver?.detail || 'Cross-source blend'}
          color={Math.abs((dominantDriver?.signal || 50) - 50) >= 20 ? signalColor : 'var(--text2)'}
        />
      </div>

      {/* Input signals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
        <SignalBox label="FEAR & GREED" value={`${data.inputs.fearGreed.value}`} sub={data.inputs.fearGreed.label} signal={data.inputs.fearGreed.signal} />
        <SignalBox label="FUNDING RATE" value={`${(data.inputs.funding.rate * 100).toFixed(4)}%`} sub={data.inputs.funding.rate > 0 ? 'Longs paying' : 'Shorts paying'} signal={data.inputs.funding.signal} />
        <SignalBox label="ETF FLOWS" value={`${data.inputs.etf.streak}d ${data.inputs.etf.direction}`} sub={`Streak signal`} signal={data.inputs.etf.signal} />
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.06em' }}>
        BREAKDOWN BARS: S sentiment · F funding · E ETF flows · M momentum · C chain score
      </div>

      {/* Per-asset signals */}
      <div style={{ display: 'grid', gap: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 60px 60px 1fr 60px', gap: 8, padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.1em' }}>
          <span>ASSET</span><span>PRICE</span><span>24H</span><span>7D</span><span>SIGNAL BREAKDOWN</span><span>CI SIGNAL</span>
        </div>
        {data.assets.map((a) => (
          <div key={a.symbol} style={{ display: 'grid', gridTemplateColumns: '80px 80px 60px 60px 1fr 60px', gap: 8, padding: '5px 8px', background: 'var(--s2)', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text)', fontWeight: 600 }}>{a.symbol}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)' }}>${a.price != null ? (a.price >= 1 ? a.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : a.price < 0.01 ? a.price.toFixed(4) : a.price.toFixed(2)) : '—'}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: a.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>{a.change24h >= 0 ? '+' : ''}{a.change24h?.toFixed(1)}%</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: a.change7d >= 0 ? 'var(--green)' : 'var(--red)' }}>{a.change7d >= 0 ? '+' : ''}{a.change7d?.toFixed(1)}%</span>
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {Object.entries(a.components).map(([k, v]) => (
                <div key={k} style={{ flex: 1, height: 4, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${v}%`, height: '100%', background: v >= 60 ? 'var(--green)' : v >= 40 ? 'var(--gold)' : 'var(--red)', borderRadius: 2 }} />
                </div>
              ))}
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: a.ciColor, textAlign: 'right' }}>{a.ciSignal} {a.ciLabel}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0 0', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.04em' }}>
          {data.methodology} · Updated every 60s · {data.sourceCount || 5} cross-source inputs
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.04em' }}>
          Price feed: {(data.priceSource || 'standby-cache').toUpperCase()} {updatedAt ? `· ${updatedAt}` : ''}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '7px 8px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--text2)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

function SignalBox({ label, value, sub, signal }: { label: string; value: string; sub: string; signal: number }) {
  const color = signal >= 60 ? 'var(--green)' : signal >= 40 ? 'var(--gold)' : 'var(--red)';
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '6px 8px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LEVEL UP 2: Portfolio Allocation Intelligence
   ═══════════════════════════════════════════════════════════════════════════════ */

export function PortfolioModels() {
  const [data, setData] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portfolio-models').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="panel" style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 12, width: '50%', background: 'var(--s3)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 8, width: '70%', background: 'var(--s2)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 40, background: 'var(--s2)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );
  if (!data?.models) return null;

  const model = data.models[selectedModel];
  const regimeColor = data.regime.fng <= 25 ? 'var(--red)' : data.regime.fng <= 40 ? 'var(--gold)' : data.regime.fng <= 60 ? 'var(--text2)' : data.regime.fng <= 75 ? 'var(--green)' : 'var(--accent)';

  const modelBtn = (key: string, label: string) => ({
    fontFamily: 'var(--mono)', fontSize: 7, padding: '3px 10px', cursor: 'pointer', letterSpacing: '0.08em',
    background: selectedModel === key ? 'var(--accent)' : 'transparent', color: selectedModel === key ? '#000' : 'var(--text2)',
    border: selectedModel === key ? '1px solid var(--accent)' : '1px solid var(--b2)', fontWeight: selectedModel === key ? 700 : 400,
  });

  return (
    <div className="panel panel-hover">
      <div className="ph">
        <div className="pt">◈ Portfolio Allocation Intelligence</div>
        <div className="tag tag-pro">PRO</div>
      </div>

      {/* Regime indicator */}
      <div style={{ background: `${regimeColor}08`, border: `1px solid ${regimeColor}25`, padding: '6px 10px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: regimeColor, letterSpacing: '0.12em' }}>MARKET REGIME: {data.regime.label}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)' }}>F&G: {data.regime.fng}/100</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>{data.regime.advice}</div>
      </div>

      {/* Model selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button onClick={() => setSelectedModel('conservative')} style={modelBtn('conservative', 'Conservative')}>CONSERVATIVE</button>
        <button onClick={() => setSelectedModel('moderate')} style={modelBtn('moderate', 'Moderate')}>MODERATE</button>
        <button onClick={() => setSelectedModel('aggressive')} style={modelBtn('aggressive', 'Aggressive')}>AGGRESSIVE</button>
      </div>

      {/* Model detail */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', marginBottom: 6 }}>{model.description} · Risk: {model.riskLevel} · Target: {model.targetReturn}</div>

        {/* Performance */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {['24h', '7d', '30d'].map(period => {
            const key = `change${period.replace('d', 'D').replace('h', 'H')}` as 'change24h' | 'change7d' | 'change30d';
            const val = model.performance?.[key.replace('change', 'change')] ?? 0;
            const pVal = model.performance?.[period === '24h' ? 'change24h' : period === '7d' ? 'change7d' : 'change30d'] ?? 0;
            return (
              <div key={period} style={{ fontFamily: 'var(--mono)', fontSize: 8 }}>
                <span style={{ color: 'var(--muted)', marginRight: 4 }}>{period.toUpperCase()}</span>
                <span style={{ color: pVal >= 0 ? 'var(--green)' : 'var(--red)' }}>{pVal >= 0 ? '+' : ''}{pVal.toFixed(2)}%</span>
              </div>
            );
          })}
        </div>

        {/* Allocations table */}
        <div style={{ display: 'grid', gap: 1 }}>
          {model.positions?.map((pos: any) => (
            <div key={pos.symbol} style={{ display: 'grid', gridTemplateColumns: '70px 50px 60px 1fr 50px', gap: 8, padding: '5px 8px', background: 'var(--s2)', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text)', fontWeight: 600 }}>{pos.symbol}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)' }}>{pos.targetPct}%</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: pos.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>{pos.change24h >= 0 ? '+' : ''}{pos.change24h}%</span>
              <div style={{ height: 4, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${pos.targetPct}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, opacity: 0.7 }} />
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: pos.needsRebalance ? 'var(--red)' : 'var(--muted)', textAlign: 'right' }}>
                {pos.needsRebalance ? `↻ ${pos.drift > 0 ? '+' : ''}${pos.drift}%` : '✓'}
              </span>
            </div>
          ))}
        </div>

        {model.rebalance?.needed && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--gold)', padding: '6px 0 0', letterSpacing: '0.04em' }}>
            ⚠ REBALANCE RECOMMENDED — {model.rebalance.positionsOutOfBand.join(', ')} drifted beyond ±5% threshold
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', fontStyle: 'italic' }}>{data.disclaimer}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LEVEL UP 3: Smart Alerts Engine — Notification Center
   ═══════════════════════════════════════════════════════════════════════════════ */

interface AlertItem {
  id: string; type: string; severity: 'critical' | 'warning' | 'info'; title: string; description: string; value: string; timestamp: number; source: string;
}

export function SmartAlerts({ compact = false }: { compact?: boolean }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/smart-alerts').then(r => r.json()).then(d => { setAlerts(d.alerts || []); setLoading(false); }).catch(() => setLoading(false));
    const iv = setInterval(() => { fetch('/api/smart-alerts').then(r => r.json()).then(d => setAlerts(d.alerts || [])).catch(() => {}); }, 30000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return (
    <div className="panel panel-hover">
      <div className="ph"><div className="pt">◈ Smart Alert Center</div><div className="tag" style={{ background: 'rgba(232,165,52,0.08)', color: 'var(--accent)' }}>Loading</div></div>
      {[1,2].map(i => (<div key={i} style={{ padding: '8px 0', borderTop: i > 1 ? '1px solid var(--b1)' : undefined }}><div style={{ background: 'var(--s3)', height: 10, width: `${60 + i * 15}%`, borderRadius: 3, animation: 'shimmer 1.5s ease-in-out infinite' }} /><div style={{ background: 'var(--s3)', height: 8, width: `${40 + i * 10}%`, borderRadius: 3, marginTop: 6, animation: 'shimmer 1.5s ease-in-out infinite' }} /></div>))}
    </div>
  );

  const sevColor: Record<string, string> = { critical: 'var(--red)', warning: 'var(--gold)', info: 'var(--accent)' };
  const sevIcon: Record<string, string> = { critical: '◈', warning: '◇', info: '○' };
  const displayed = compact ? alerts.slice(0, 3) : alerts;

  // Default sample alerts shown when no live alerts fire (demonstrates value to free users)
  const defaultAlerts: AlertItem[] = [
    { id: 'default-1', type: 'info', severity: 'info', title: 'Alert Engine Active', description: 'Monitoring BTC liquidations, funding rate flips, ETF streak breaks, and price anomalies across 6 sources.', value: '6 sources', timestamp: Date.now(), source: 'ChainIntel' },
    { id: 'default-2', type: 'info', severity: 'info', title: 'Thresholds Configured', description: 'Liquidation >$1M · Price move >5% · Funding rate >0.1% · Fear & Greed extremes · ETF streak ≥5d', value: '5 rules', timestamp: Date.now(), source: 'Smart Alerts' },
  ];

  const effectiveAlerts = displayed.length > 0 ? displayed : (compact ? [] : defaultAlerts);
  if (effectiveAlerts.length === 0 && compact) return null;

  return (
    <div className={compact ? '' : 'panel panel-hover'} style={compact ? {} : {}}>
      {!compact && <div className="ph"><div className="pt">◈ Smart Alert Center</div><div className="tag" style={{ background: alerts.some(a => a.severity === 'critical') ? 'rgba(239,68,68,0.15)' : 'rgba(232,165,52,0.08)', color: alerts.some(a => a.severity === 'critical') ? 'var(--red)' : 'var(--accent)' }}>{alerts.length > 0 ? `${alerts.length} Active` : 'Monitoring'}</div></div>}
      {effectiveAlerts.length === 0 ? (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', padding: compact ? '4px 0' : '12px 0' }}>No active alerts — all systems nominal.</div>
      ) : (
        <div style={{ display: 'grid', gap: compact ? 2 : 4 }}>
          {effectiveAlerts.map((alert) => (
            <div key={alert.id} style={{ display: 'flex', gap: 8, padding: compact ? '4px 8px' : '6px 10px', background: `${sevColor[alert.severity]}06`, border: `1px solid ${sevColor[alert.severity]}20`, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: sevColor[alert.severity], flexShrink: 0, marginTop: 1 }}>{sevIcon[alert.severity]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: compact ? 8 : 9, color: 'var(--text)', fontWeight: 600 }}>{alert.title}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: sevColor[alert.severity], fontWeight: 700, flexShrink: 0 }}>{alert.value}</span>
                </div>
                {!compact && <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)', lineHeight: 1.5 }}>{alert.description}</div>}
                <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', marginTop: 2 }}>{alert.source} · {alert.severity.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LEVEL UP 4: Market Microstructure (Order Book + Liquidations)
   ═══════════════════════════════════════════════════════════════════════════════ */

export function MicrostructurePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/microstructure').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    const iv = setInterval(() => { fetch('/api/microstructure').then(r => r.json()).then(setData).catch(() => {}); }, 15000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return (
    <div className="panel" style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 12, width: '55%', background: 'var(--s3)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[1,2].map(i => <div key={i} style={{ height: 60, background: 'var(--s2)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      </div>
    </div>
  );
  if (!data) return null;

  const ob = data.orderBook?.btc;
  const liqs = data.liquidations?.btc;
  const flow = data.tradeFlow;

  return (
    <div className="panel panel-hover">
      <div className="ph">
        <div className="pt">◈ Market Microstructure — BTC/USDT</div>
        <div className="tag" style={{ background: 'rgba(107,138,255,0.1)', color: 'var(--blue)' }}>15s refresh</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* Order Book Imbalance */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 6 }}>ORDER BOOK DEPTH</div>
          {ob ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--green)' }}>BIDS ${(ob.bidTotal / 1e6).toFixed(1)}M</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--red)' }}>ASKS ${(ob.askTotal / 1e6).toFixed(1)}M</span>
              </div>
              <div style={{ height: 8, background: 'var(--s3)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${50 + ob.imbalance / 2}%`, height: '100%', background: 'var(--green)', borderRadius: '4px 0 0 4px' }} />
                <div style={{ flex: 1, height: '100%', background: 'var(--red)', borderRadius: '0 4px 4px 0' }} />
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: ob.imbalance > 0 ? 'var(--green)' : 'var(--red)', textAlign: 'center', marginTop: 4 }}>
                {ob.imbalance > 0 ? '▲' : '▼'} {Math.abs(ob.imbalance).toFixed(1)}% {ob.imbalance > 0 ? 'BUY' : 'SELL'} IMBALANCE
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', marginTop: 4 }}>
                Spread: ${ob.spread} · Mid: ${ob.midPrice?.toLocaleString()}
              </div>
              {ob.bidWall && <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--green)', marginTop: 2 }}>Bid Wall: ${ob.bidWall.price?.toLocaleString()} (${(ob.bidWall.usd / 1e6).toFixed(2)}M)</div>}
              {ob.askWall && <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--red)' }}>Ask Wall: ${ob.askWall.price?.toLocaleString()} (${(ob.askWall.usd / 1e6).toFixed(2)}M)</div>}
            </>
          ) : <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><div style={{ height: 8, width: '60%', background: 'var(--s3)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} /><div style={{ height: 6, width: '40%', background: 'var(--s2)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} /></div>}
        </div>

        {/* Liquidation Cascade */}
        <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 6 }}>LIQUIDATION CASCADE</div>
          {liqs ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--red)' }}>LONG LIQ ${(liqs.totalLong / 1e6).toFixed(2)}M</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--green)' }}>SHORT LIQ ${(liqs.totalShort / 1e6).toFixed(2)}M</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: liqs.cascadeRisk === 'HIGH' ? 'var(--red)' : liqs.cascadeRisk === 'MEDIUM' ? 'var(--gold)' : 'var(--green)', marginBottom: 4, textAlign: 'center' }}>
                CASCADE RISK: {liqs.cascadeRisk}
              </div>
              {liqs.events?.slice(0, 5).map((e: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontFamily: 'var(--mono)', fontSize: 7 }}>
                  <span style={{ color: e.side === 'SELL' ? 'var(--red)' : 'var(--green)' }}>{e.side === 'SELL' ? 'LONG LIQ' : 'SHORT LIQ'}</span>
                  <span style={{ color: 'var(--text2)' }}>${(e.usd / 1000).toFixed(1)}K @ ${e.price?.toLocaleString()}</span>
                </div>
              ))}
            </>
          ) : <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><div style={{ height: 8, width: '60%', background: 'var(--s3)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} /><div style={{ height: 6, width: '40%', background: 'var(--s2)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} /></div>}
        </div>
      </div>

      {/* Trade Flow */}
      {flow && (
        <div style={{ marginTop: 8, background: 'var(--s2)', border: '1px solid var(--b2)', padding: '6px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.1em' }}>TRADE FLOW (RECENT 100 TRADES)</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, color: flow.netFlow === 'BUY DOMINANT' ? 'var(--green)' : 'var(--red)' }}>{flow.netFlow}</span>
          </div>
          <div style={{ height: 6, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden', display: 'flex', marginTop: 4 }}>
            <div style={{ width: `${flow.buyPressure}%`, height: '100%', background: 'var(--green)' }} />
            <div style={{ flex: 1, height: '100%', background: 'var(--red)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 7, marginTop: 2 }}>
            <span style={{ color: 'var(--green)' }}>BUY {flow.buyPressure}% (${(flow.buyVolume / 1e6).toFixed(1)}M)</span>
            <span style={{ color: 'var(--red)' }}>SELL {flow.sellPressure}% (${(flow.sellVolume / 1e6).toFixed(1)}M)</span>
          </div>
        </div>
      )}

      {/* Funding History */}
      {data.fundingHistory?.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {data.fundingHistory.slice(0, 8).map((f: any, i: number) => (
            <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 7, padding: '2px 6px', background: f.rate > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: f.rate > 0 ? 'var(--green)' : 'var(--red)', border: `1px solid ${f.rate > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              {(f.rate * 100).toFixed(4)}% ({f.annualized}% ann)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LEVEL UP 5: AI Daily Intelligence Brief — Comprehensive Market Digest
   Aggregates 7+ live sources into a Bloomberg-style intelligence card
   ═══════════════════════════════════════════════════════════════════════════════ */

function BriefSectionHeader({ label, color, live }: { label: string; color: string; live?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 4 }}>
      <div style={{ width: 3, height: 14, background: color, borderRadius: 1 }} />
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color, letterSpacing: '0.1em', fontWeight: 700 }}>{label}</span>
      {live && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--green)', opacity: 0.8 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          LIVE
        </span>
      )}
    </div>
  );
}

function MetricPill({ label, value, change, color }: { label: string; value: string; change?: number; color?: string }) {
  const changeColor = change !== undefined ? (change >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text2)';
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '6px 10px', flex: '1 1 0', minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: color || 'var(--muted)', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', fontWeight: 600, lineHeight: 1.2 }}>{value}</div>
      {change !== undefined && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: changeColor, fontWeight: 500, marginTop: 1 }}>
          {change >= 0 ? '▲' : '▼'} {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
    </div>
  );
}

function SignalBadge({ signal, confidence }: { signal: string; confidence: number }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    BULLISH: { bg: 'rgba(52,211,153,0.1)', text: 'var(--green)', border: 'rgba(52,211,153,0.3)' },
    'CAUTIOUSLY BULLISH': { bg: 'rgba(52,211,153,0.06)', text: 'var(--green)', border: 'rgba(52,211,153,0.2)' },
    NEUTRAL: { bg: 'rgba(232,165,52,0.08)', text: 'var(--accent)', border: 'rgba(232,165,52,0.25)' },
    'CAUTIOUSLY BEARISH': { bg: 'rgba(248,113,113,0.06)', text: 'var(--red)', border: 'rgba(248,113,113,0.2)' },
    BEARISH: { bg: 'rgba(248,113,113,0.1)', text: 'var(--red)', border: 'rgba(248,113,113,0.3)' },
  };
  const c = colors[signal] || colors.NEUTRAL;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: c.bg, border: `1px solid ${c.border}`, padding: '5px 12px' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: c.text, letterSpacing: '0.08em' }}>{signal}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>{confidence}% confidence</span>
    </div>
  );
}

export function DailyBriefCard({ marketDataFallback }: { marketDataFallback?: { coins: { symbol: string; price: number; percent_change_24h: number }[] } } = {}) {
  const [data, setData] = useState<any>(null);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-brief')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ background: 'var(--s1)', border: '1px solid rgba(232,165,52,0.15)', padding: 16, minHeight: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>COMPILING INTELLIGENCE BRIEF...</span>
        </div>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 12, background: 'var(--s2)', marginTop: 10, width: `${90 - i * 15}%`, opacity: 0.4 }} />
        ))}
      </div>
    );
  }

  if (!data?.brief) return null;

  const b = data.brief;
  const km = b.keyMetrics || {};
  const snap = b.marketSnapshot || {};
  const defi = b.defi || {};
  const net = b.networkHealth || {};
  const trending = b.trending || [];

  const fmt = (n: number, d = 0) => {
    if (n === null || n === undefined) return '—';
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n === 0) return '$0';
    return `$${n.toLocaleString('en-US', { maximumFractionDigits: d })}`;
  };

  // Patch zero-priced assets with MarketDataContext fallback
  if (data?.brief?.marketSnapshot?.assets && marketDataFallback?.coins) {
    const symbolMap: Record<string, { price: number; change24h: number }> = {};
    for (const c of marketDataFallback.coins) {
      symbolMap[c.symbol.toUpperCase()] = { price: c.price, change24h: c.percent_change_24h };
    }
    for (const a of data.brief.marketSnapshot.assets) {
      if ((!a.price || a.price === 0) && symbolMap[a.symbol]) {
        a.price = symbolMap[a.symbol].price;
        if (a.change24h === 0 || !a.change24h) a.change24h = symbolMap[a.symbol].change24h;
      }
    }
  }


  return (
    <div style={{ background: 'var(--s1)', border: '1px solid rgba(232,165,52,0.2)', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', userSelect: 'none', background: 'rgba(232,165,52,0.03)' }}
      >
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px rgba(232,165,52,0.4)', animation: 'pulse 2s infinite' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em' }}>DAILY INTELLIGENCE BRIEF</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>{b.date} {b.time ? `• ${b.time} ET` : ''}</span>
        <div style={{ flex: 1 }} />
        <SignalBadge signal={b.signal || 'NEUTRAL'} confidence={b.signalConfidence || 50} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* ── Collapsed summary ── */}
      {!expanded && (
        <div style={{ padding: '6px 14px 10px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
          {b.text?.substring(0, 280)}{(b.text?.length || 0) > 280 ? '...' : ''}
        </div>
      )}

      {/* ── Expanded Full Brief ── */}
      {expanded && (
        <div style={{ padding: '4px 14px 14px' }}>

          {/* ▸ MARKET SNAPSHOT */}
          <BriefSectionHeader label="MARKET SNAPSHOT" color="var(--accent)" live />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {(snap.assets || []).map((a: any) => (
              <MetricPill key={a.symbol} label={a.symbol} value={fmt(a.price, a.price < 10 ? 2 : 0)} change={a.change24h} />
            ))}
          </div>
          {/* Global row */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <MetricPill label="TOTAL MCAP" value={fmt(snap.totalMcap)} change={snap.mcapChange24h} />
            <MetricPill label="24H VOLUME" value={fmt(snap.totalVol24h)} color="var(--blue)" />
            <MetricPill label="BTC DOM" value={`${(snap.btcDominance || 0).toFixed(1)}%`} color="var(--accent)" />
            <MetricPill label="ETH DOM" value={`${(snap.ethDominance || 0).toFixed(1)}%`} color="var(--blue)" />
          </div>

          {/* ▸ SENTIMENT */}
          <BriefSectionHeader label="MARKET SENTIMENT" color="var(--purple)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '8px 12px', background: 'var(--s2)', border: '1px solid var(--b2)' }}>
            <div style={{ position: 'relative', width: 52, height: 52 }}>
              <svg viewBox="0 0 52 52" style={{ width: 52, height: 52 }}>
                <circle cx="26" cy="26" r="22" fill="none" stroke="var(--b3)" strokeWidth="4" />
                <circle
                  cx="26" cy="26" r="22" fill="none"
                  stroke={km.fearGreed <= 25 ? 'var(--red)' : km.fearGreed <= 45 ? '#F59E0B' : km.fearGreed <= 55 ? 'var(--accent)' : km.fearGreed <= 75 ? 'var(--green)' : '#10B981'}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(km.fearGreed / 100) * 138} 138`}
                  transform="rotate(-90 26 26)"
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{km.fearGreed || '—'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', fontWeight: 600, marginBottom: 2 }}>Fear & Greed: {km.fearGreedLabel || 'N/A'}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.5 }}>
                {km.fearGreed <= 20 ? 'Extreme fear often signals buying opportunities. Market is deeply pessimistic.' :
                 km.fearGreed <= 40 ? 'Fear is present. Smart money tends to accumulate in fear zones.' :
                 km.fearGreed <= 60 ? 'Market sentiment is balanced. No strong directional conviction.' :
                 km.fearGreed <= 80 ? 'Greed is building. Exercise caution on new long positions.' :
                 'Extreme greed. Historically precedes corrections. Reduce risk exposure.'}
              </div>
            </div>
          </div>

          {/* ▸ DEFI & STABLECOINS */}
          <BriefSectionHeader label="DEFI & STABLECOINS" color="var(--blue)" live />
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <MetricPill label="TOTAL TVL" value={fmt(defi.totalTvl)} color="var(--blue)" />
            <MetricPill label="ETH TVL" value={fmt(defi.ethTvl)} color="var(--blue)" />
            <MetricPill label="ETH SHARE" value={`${(defi.ethDominance || 0).toFixed(1)}%`} color="var(--blue)" />
            <MetricPill label="STABLECOIN" value={fmt(defi.stablecoinSupply)} color="var(--green)" />
          </div>
          {(defi.topChains || []).length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              {defi.topChains.map((c: any) => (
                <div key={c.name} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', background: 'var(--s2)', padding: '3px 8px', border: '1px solid var(--b1)' }}>
                  {c.name}: {fmt(c.tvl)}
                </div>
              ))}
            </div>
          )}

          {/* ▸ NETWORK HEALTH */}
          <BriefSectionHeader label="NETWORK HEALTH" color="var(--green)" live />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12 }}>
            {/* BTC Mempool */}
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>BTC MEMPOOL</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>Pending TXs</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{net.btcMempool?.pendingTxs?.toLocaleString() || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>Size</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{net.btcMempool?.vsizeMB ? `${net.btcMempool.vsizeMB} MB` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>Congestion</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                  color: net.btcMempool?.congestion === 'HIGH' ? 'var(--red)' : net.btcMempool?.congestion === 'MODERATE' ? 'var(--accent)' : 'var(--green)',
                }}>{net.btcMempool?.congestion || '—'}</span>
              </div>
            </div>
            {/* ETH Gas */}
            <div style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--blue)', fontWeight: 600, marginBottom: 4 }}>ETH GAS ORACLE</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>Slow</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{net.ethGas?.low || '—'} gwei</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>Standard</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{net.ethGas?.standard || '—'} gwei</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)' }}>Fast</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{net.ethGas?.fast || '—'} gwei</span>
              </div>
            </div>
          </div>

          {/* ▸ TRENDING */}
          {trending.length > 0 && (
            <>
              <BriefSectionHeader label="TRENDING" color="#F59E0B" />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                {trending.map((t: any, i: number) => (
                  <div key={i} style={{
                    fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 10px',
                    background: 'var(--s2)', border: '1px solid var(--b2)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{t.symbol}</span>
                    {t.change24h !== null && (
                      <span style={{ color: t.change24h >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                        {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(1)}%
                      </span>
                    )}
                    {t.rank > 0 && <span style={{ color: 'var(--muted)', fontSize: 9 }}>#{t.rank}</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ▸ CI COMPOSITE SIGNAL */}
          <BriefSectionHeader label="CI COMPOSITE SIGNAL" color="var(--accent)" />
          <div style={{ background: 'rgba(232,165,52,0.04)', border: '1px solid rgba(232,165,52,0.15)', padding: '10px 12px', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <SignalBadge signal={b.signal || 'NEUTRAL'} confidence={b.signalConfidence || 50} />
            </div>
            {(b.bullishFactors || []).length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>BULLISH FACTORS:</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                  {b.bullishFactors.map((f: string, i: number) => (
                    <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', background: 'rgba(52,211,153,0.08)', padding: '2px 8px', border: '1px solid rgba(52,211,153,0.2)' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
            {(b.bearishFactors || []).length > 0 && (
              <div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>BEARISH FACTORS:</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                  {b.bearishFactors.map((f: string, i: number) => (
                    <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)', background: 'rgba(248,113,113,0.08)', padding: '2px 8px', border: '1px solid rgba(248,113,113,0.2)' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ▸ NARRATIVE SUMMARY */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.7, marginTop: 8, padding: '8px 10px', background: 'var(--s2)', borderLeft: '2px solid var(--accent)' }}>
            {b.text}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>Source: {data.source || 'aggregated'} • {snap.activeCryptos ? `${snap.activeCryptos.toLocaleString()} assets tracked` : ''}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>Refreshes every 3 min</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SOURCE STATUS INDICATOR (for header/footer)
   ═══════════════════════════════════════════════════════════════════════════════ */

export function SourceStatusBadge() {
  const [status, setStatus] = useState<{ up: number; total: number } | null>(null);

  useEffect(() => {
    fetch('/api/source-status').then(r => r.json()).then(d => setStatus(d.summary)).catch(() => {});
  }, []);

  if (!status) return null;
  const allUp = status.up === status.total;

  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: allUp ? 'var(--green)' : 'var(--gold)', letterSpacing: '0.06em' }}>
      {status.up}/{status.total} SOURCES ● {allUp ? 'ALL CONNECTED' : `${status.total - status.up} DOWN`}
    </span>
  );
}
