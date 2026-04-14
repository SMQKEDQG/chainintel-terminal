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
}

export function CorrelationEngine() {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/correlation-engine').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    const iv = setInterval(() => { fetch('/api/correlation-engine').then(r => r.json()).then(setData).catch(() => {}); }, 60000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return <div className="panel" style={{ padding: 16 }}><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>Loading Correlation Engine...</div></div>;
  if (!data) return null;

  const signalColor = data.global.signal >= 60 ? 'var(--green)' : data.global.signal >= 45 ? 'var(--gold)' : 'var(--red)';

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

      {/* Input signals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
        <SignalBox label="FEAR & GREED" value={`${data.inputs.fearGreed.value}`} sub={data.inputs.fearGreed.label} signal={data.inputs.fearGreed.signal} />
        <SignalBox label="FUNDING RATE" value={`${(data.inputs.funding.rate * 100).toFixed(4)}%`} sub={data.inputs.funding.rate > 0 ? 'Longs paying' : 'Shorts paying'} signal={data.inputs.funding.signal} />
        <SignalBox label="ETF FLOWS" value={`${data.inputs.etf.streak}d ${data.inputs.etf.direction}`} sub={`Streak signal`} signal={data.inputs.etf.signal} />
      </div>

      {/* Per-asset signals */}
      <div style={{ display: 'grid', gap: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 60px 60px 1fr 60px', gap: 8, padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.1em' }}>
          <span>ASSET</span><span>PRICE</span><span>24H</span><span>7D</span><span>SIGNAL BREAKDOWN</span><span>CI SIGNAL</span>
        </div>
        {data.assets.map((a) => (
          <div key={a.symbol} style={{ display: 'grid', gridTemplateColumns: '80px 80px 60px 60px 1fr 60px', gap: 8, padding: '5px 8px', background: 'var(--s2)', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text)', fontWeight: 600 }}>{a.symbol}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)' }}>${a.price?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
      <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', padding: '6px 0 0', letterSpacing: '0.04em' }}>
        {data.methodology} · Updated every 60s · 5 cross-source inputs
      </div>
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

  if (loading) return <div className="panel" style={{ padding: 16 }}><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>Loading Portfolio Models...</div></div>;
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

  if (loading) return null;

  const sevColor: Record<string, string> = { critical: 'var(--red)', warning: 'var(--gold)', info: 'var(--accent)' };
  const sevIcon: Record<string, string> = { critical: '◈', warning: '◇', info: '○' };
  const displayed = compact ? alerts.slice(0, 3) : alerts;

  if (displayed.length === 0 && compact) return null;

  return (
    <div className={compact ? '' : 'panel panel-hover'} style={compact ? {} : {}}>
      {!compact && <div className="ph"><div className="pt">◈ Smart Alert Center</div><div className="tag" style={{ background: alerts.some(a => a.severity === 'critical') ? 'rgba(239,68,68,0.15)' : 'rgba(232,165,52,0.08)', color: alerts.some(a => a.severity === 'critical') ? 'var(--red)' : 'var(--accent)' }}>{alerts.length} Active</div></div>}
      {displayed.length === 0 ? (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', padding: compact ? '4px 0' : '12px 0' }}>No active alerts — all systems nominal.</div>
      ) : (
        <div style={{ display: 'grid', gap: compact ? 2 : 4 }}>
          {displayed.map((alert) => (
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

  if (loading) return <div className="panel" style={{ padding: 16 }}><div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>Loading Microstructure...</div></div>;
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
          ) : <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>Loading...</div>}
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
          ) : <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>Loading...</div>}
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
   LEVEL UP 5: AI Daily Brief Card (for Overview tab)
   ═══════════════════════════════════════════════════════════════════════════════ */

export function DailyBriefCard() {
  const [data, setData] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-brief').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading || !data?.brief) return null;

  const brief = data.brief;
  const sections = brief.sections || {};
  const signal = brief.signal || sections['CI SIGNAL'] || '';

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid rgba(232,165,52,0.2)', marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', fontWeight: 600 }}>⬡ DAILY INTELLIGENCE BRIEF</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>{brief.date}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--text2)', letterSpacing: '0.06em' }}>{expanded ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
      </div>

      {/* Always show signal summary */}
      {signal && !expanded && (
        <div style={{ padding: '0 12px 8px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)', lineHeight: 1.6 }}>{typeof signal === 'string' ? signal.substring(0, 200) : ''}{typeof signal === 'string' && signal.length > 200 ? '...' : ''}</div>
      )}

      {/* Expanded full brief */}
      {expanded && (
        <div style={{ padding: '0 12px 12px' }}>
          {sections['MARKET SNAPSHOT'] && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: 4 }}>MARKET SNAPSHOT</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sections['MARKET SNAPSHOT']}</div>
            </div>
          )}
          {sections['OVERNIGHT WHALE ACTIVITY'] && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--gold)', letterSpacing: '0.12em', marginBottom: 4 }}>WHALE ACTIVITY</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sections['OVERNIGHT WHALE ACTIVITY']}</div>
            </div>
          )}
          {sections['ETF FLOWS'] && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--green)', letterSpacing: '0.12em', marginBottom: 4 }}>ETF FLOWS</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sections['ETF FLOWS']}</div>
            </div>
          )}
          {signal && (
            <div style={{ background: 'rgba(232,165,52,0.05)', border: '1px solid rgba(232,165,52,0.15)', padding: '8px 10px', marginTop: 8 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: 4 }}>CI SIGNAL</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text)', lineHeight: 1.6, fontWeight: 500 }}>{typeof signal === 'string' ? signal : ''}</div>
            </div>
          )}
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
