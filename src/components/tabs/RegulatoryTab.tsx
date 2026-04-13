'use client';

import { useState } from 'react';

type Sentiment = 'all' | 'bullish' | 'bearish' | 'neutral';

interface RegItem {
  hl: string;
  badges: Array<{ label: string; cls: string }>;
  tier1?: boolean;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  date: string;
}

const REG_ITEMS: RegItem[] = [
  { hl: 'SEC classifies 16 digital assets as commodities under joint CFTC digital asset guidance framework — directly affects trading, custody, and reporting obligations for institutional holders', badges: [{ label: 'SEC', cls: 'rb-sec' }], tier1: true, sentiment: 'bullish', date: 'Mar 28, 2026' },
  { hl: 'EU MiCA Phase 2 compliance deadline confirmed as January 1, 2027 — all Crypto-Asset Service Providers must be authorized or cease EU operations', badges: [{ label: 'ESMA · EU', cls: 'rb-eu' }], sentiment: 'neutral', date: 'Apr 2, 2026' },
  { hl: 'FCA publishes CP25/40 — UK crypto trading platform authorization and prudential requirements — 2027 implementation timeline confirmed', badges: [{ label: 'FCA · UK', cls: 'rb-sec' }], sentiment: 'neutral', date: 'Apr 2, 2026' },
  { hl: 'IMF April 2026 Financial Stability Report warns tokenized finance creates systemic risk if unregulated — recommends macro-prudential buffers for institutions', badges: [{ label: 'IMF', cls: 'rb-imf' }], tier1: true, sentiment: 'bearish', date: 'Apr 5, 2026' },
  { hl: 'CLARITY Act advances through Senate Ag & Banking Committees — digital asset market structure bill targeting Q2 2026 Senate floor vote — CFTC to have exclusive jurisdiction over digital commodity spot markets', badges: [{ label: 'US SENATE', cls: 'rb-sec' }], tier1: true, sentiment: 'bullish', date: 'Apr 7, 2026' },
  { hl: 'BIS publishes updated crypto capital standards for global banks — 2% cap on unbacked crypto asset exposure — effective Jan 2026', badges: [{ label: 'BIS · BASEL', cls: 'rb-imf' }], sentiment: 'bearish', date: 'Mar 10, 2026' },
  { hl: 'OCC clarifies national banks may provide crypto custody services without prior approval — removes key barrier for bank-native digital asset products', badges: [{ label: 'OCC', cls: 'rb-cftc' }], sentiment: 'bullish', date: 'Mar 10, 2026' },
];

const SENTIMENT_DISPLAY = {
  bullish: { arrow: '▲ BULLISH', color: 'var(--green)' },
  bearish: { arrow: '▼ BEARISH', color: 'var(--red)' },
  neutral: { arrow: '◆ NEUTRAL', color: 'var(--gold)' },
};

export default function RegulatoryTab() {
  const [activeFilter, setActiveFilter] = useState<Sentiment>('all');

  const visible = REG_ITEMS.filter((r) => activeFilter === 'all' || r.sentiment === activeFilter);

  const btnStyle = (s: Sentiment): React.CSSProperties => {
    const base: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: '7px', padding: '2px 10px', cursor: 'pointer', letterSpacing: '0.08em' };
    if (s === 'all') return { ...base, background: activeFilter === 'all' ? 'var(--cyan)' : 'var(--s3)', color: activeFilter === 'all' ? '#000' : 'var(--text2)', border: activeFilter === 'all' ? 'none' : '1px solid var(--b2)', fontWeight: activeFilter === 'all' ? 700 : 400 };
    const colorMap: Record<string, string> = { bullish: 'var(--green)', bearish: 'var(--red)', neutral: 'var(--gold)' };
    const borderMap: Record<string, string> = { bullish: 'rgba(16,185,129,0.3)', bearish: 'rgba(239,68,68,0.3)', neutral: 'rgba(240,192,64,0.3)' };
    return { ...base, background: activeFilter === s ? borderMap[s] : 'var(--s3)', color: colorMap[s], border: `1px solid ${borderMap[s]}` };
  };

  return (
    <div className="page" id="page-reg">
      <div className="ai-context-strip" id="acs-reg">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-reg">
          Regulatory environment is the most constructive since 2020. SEC/CFTC joint commodity classification (16 assets), OCC bank custody clarification, CLARITY Act advancing.{' '}
          <strong>2026 is the year the legal framework locks in.</strong>
        </span>
        <span className="acs-ts" id="acs-ts-reg"></span>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--b2)', margin: '1px 0' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.14em', color: 'var(--cyan)' }}>◈ REGULATORY INTELLIGENCE — LIVE DATABASE FEED</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>7 entries · Tier 1 Institutional sources only</span>
        </div>
        <div id="regCacheFeed" style={{ padding: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
            {REG_ITEMS.slice(0, 4).map((item) => {
              const s = SENTIMENT_DISPLAY[item.sentiment];
              return (
                <div key={item.date + item.sentiment} style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: s.color, letterSpacing: '0.08em', marginBottom: '4px' }}>{s.arrow}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text)', lineHeight: 1.4, marginBottom: '4px' }}>{item.hl.slice(0, 80)}…</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>
                    {item.badges.map((b) => <span key={b.label} className={`reg-badge ${b.cls}`} style={{ marginRight: '4px' }}>{b.label}</span>)}
                    {item.date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="section-h">
        <div className="section-h-label">Regulatory Intelligence Feed · 12 Agencies · Structured Data Not Journalism</div>
        <div className="section-h-line"></div>
        <div className="tag tag-pro">PRO</div>
      </div>

      <div className="g4">
        <div className="kpi"><div className="kpi-label">Active Agencies Monitored</div><div className="kpi-val cyan">12</div><div className="kpi-chg" style={{ color: 'var(--text2)' }}>SEC · CFTC · BIS · IMF · FCA · MAS · ESMA · FSB · FATF · OCC · FDIC · Fed</div></div>
        <div className="kpi"><div className="kpi-label">Actions This Month</div><div className="kpi-val" style={{ color: 'var(--text)' }}>14</div><div className="kpi-chg">Enforcement, guidance, proposals</div></div>
        <div className="kpi"><div className="kpi-label">Regulatory Clarity Score</div><div className="kpi-val up">72</div><div className="kpi-chg up">+8 vs Q1 2026 · Best since 2021</div></div>
        <div className="kpi"><div className="kpi-label">Pending Decisions</div><div className="kpi-val gold">6</div><div className="kpi-chg">Stablecoin, ETF, Classification</div></div>
      </div>

      <div className="g2">
        <div className="panel">
          <div className="ph"><div className="pt">Recent Regulatory Actions</div><div className="tag tag-live">Auto-Aggregated · 12 Sources</div></div>
          <div style={{ display: 'flex', gap: '6px', padding: '6px 0 8px' }}>
            <button onClick={() => setActiveFilter('all')} style={btnStyle('all')}>ALL</button>
            <button onClick={() => setActiveFilter('bullish')} style={btnStyle('bullish')}>▲ BULLISH</button>
            <button onClick={() => setActiveFilter('bearish')} style={btnStyle('bearish')}>▼ BEARISH</button>
            <button onClick={() => setActiveFilter('neutral')} style={btnStyle('neutral')}>◆ NEUTRAL</button>
          </div>
          {visible.map((item) => {
            const s = SENTIMENT_DISPLAY[item.sentiment];
            return (
              <div key={item.date + item.hl.slice(0, 20)} className="reg-item" data-sentiment={item.sentiment}>
                <div className="reg-hl">{item.hl}</div>
                <div className="reg-meta">
                  {item.badges.map((b) => <span key={b.label} className={`reg-badge ${b.cls}`}>{b.label}</span>)}
                  {item.tier1 && <span className="reg-badge rb-t1">TIER 1</span>}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: s.color, marginLeft: '4px' }}>{s.arrow}</span>
                  <span className="reg-date">{item.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <div className="ph"><div className="pt">Regulatory Tracker</div></div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>Stablecoin Legislation</div>
          {[
            { label: 'CLARITY Act (US Senate)', status: 'ADVANCING', cls: 'rt-advancing' },
            { label: 'GENIUS Act (Stablecoin) — House', status: 'RECONCILING', cls: 'rt-active' },
            { label: 'EU MiCA E-Money Tokens', status: 'ACTIVE', cls: 'rt-active' },
            { label: 'UK Stablecoin Regime', status: 'DRAFT', cls: 'rt-draft' },
            { label: 'MAS (Singapore) Payment Services Act', status: 'FINAL', cls: 'rt-final' },
          ].map((item) => (
            <div key={item.label} className="rt-item"><div className="rt-label">{item.label}</div><div className={`rt-status ${item.cls}`}>{item.status}</div></div>
          ))}
          <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '10px 0 6px' }}>Asset Classification</div>
          {[
            { label: 'SEC/CFTC Joint Crypto Guidance', status: 'ACTIVE', cls: 'rt-active' },
            { label: 'EU MiCA Asset Classification', status: 'FINAL', cls: 'rt-final' },
            { label: 'BTC — US Commodity Status', status: 'APPROVED', cls: 'rt-approved' },
            { label: 'ETH — US Commodity Status', status: 'APPROVED', cls: 'rt-approved' },
          ].map((item) => (
            <div key={item.label} className="rt-item"><div className="rt-label">{item.label}</div><div className={`rt-status ${item.cls}`}>{item.status}</div></div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="ph"><div className="pt">Asset-Level Regulatory Status Matrix</div><div className="tag tag-pro">ChainIntel Research</div></div>
        <table className="dt">
          <thead><tr><th style={{ textAlign: 'left' }}>Asset</th><th>US Classification</th><th>EU MiCA Status</th><th>ETF Status</th><th>SEC Filing</th><th>Reg Risk Score</th></tr></thead>
          <tbody>
            {[
              { name: 'Bitcoin', sym: 'BTC', usC: 'COMMODITY', mica: 'EXEMPT', etf: 'APPROVED', sec: 'NOT FILED', risk: 'LOW 12', gc: 'var(--green)', mc: 'var(--green)', ec: 'var(--green)', sc: 'var(--text2)', rc: 'var(--green)' },
              { name: 'Ethereum', sym: 'ETH', usC: 'COMMODITY', mica: 'EXEMPT', etf: 'APPROVED', sec: 'NOT FILED', risk: 'LOW 14', gc: 'var(--green)', mc: 'var(--green)', ec: 'var(--green)', sc: 'var(--text2)', rc: 'var(--green)' },
              { name: 'XRP', sym: 'XRP', usC: 'COMMODITY', mica: 'MiCA ALIGN', etf: 'PENDING', sec: 'SETTLED', risk: 'MED 22', gc: 'var(--green)', mc: 'var(--green)', ec: 'var(--gold)', sc: 'var(--gold)', rc: 'var(--gold)' },
              { name: 'Solana', sym: 'SOL', usC: 'DISPUTED', mica: 'MiCA ALIGN', etf: 'PENDING', sec: 'NAMED', risk: 'MED 31', gc: 'var(--gold)', mc: 'var(--green)', ec: 'var(--gold)', sc: 'var(--red)', rc: 'var(--gold)' },
              { name: 'HBAR', sym: 'HBAR', usC: 'COMMODITY', mica: 'MiCA ALIGN', etf: 'APPROVED', sec: 'NOT FILED', risk: 'LOW 18', gc: 'var(--green)', mc: 'var(--green)', ec: 'var(--green)', sc: 'var(--text2)', rc: 'var(--green)' },
              { name: 'QNT', sym: 'QNT', usC: 'COMMODITY', mica: 'COMPLIANT', etf: 'APPROVED', sec: 'NOT FILED', risk: 'LOW 16', gc: 'var(--green)', mc: 'var(--green)', ec: 'var(--green)', sc: 'var(--text2)', rc: 'var(--green)' },
            ].map((a) => (
              <tr key={a.sym}>
                <td><span className="aname">{a.name}</span><span className="asym">{a.sym}</span></td>
                <td style={{ color: a.gc }}>{a.usC}</td>
                <td style={{ color: a.mc }}>{a.mica}</td>
                <td style={{ color: a.ec }}>{a.etf}</td>
                <td style={{ color: a.sc }}>{a.sec}</td>
                <td style={{ color: a.rc, fontFamily: 'var(--mono)' }}>{a.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
