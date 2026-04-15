'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataFreshness, ErrorState } from '../DataFreshness';
import { DATA_SOURCES, SOURCE_CATEGORIES, getSourcesByCategory, getCategoryStats, type SourceCategory, type DataSource } from '../../lib/source-registry';

type Sentiment = 'all' | 'bullish' | 'bearish' | 'neutral';
type ViewMode = 'feed' | 'events' | 'sources';

interface RegItemAPI {
  headline: string;
  summary?: string;
  source: string;
  date: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  tier1: boolean;
  badges: Array<{ label: string; cls: string }>;
  url: string;
  body?: string;
}

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  region: string;
  body: string;
  snippet: string;
}

interface RegData {
  items: RegItemAPI[];
  stats: { total: number; bullish: number; bearish: number; net: string };
  aiContext: string;
  source: string;
}

/* ──── Upcoming Events (sourced from public regulatory calendars) ──── */
const UPCOMING_EVENTS = [
  { date: 'Apr 21, 2026', event: 'FOMC Meeting Minutes Release', body: 'Federal Reserve', region: 'US', impact: 'high' as const },
  { date: 'May 6-7, 2026', event: 'FOMC Rate Decision', body: 'Federal Reserve', region: 'US', impact: 'high' as const },
  { date: 'May 15, 2026', event: 'SEC Crypto Roundtable — DeFi Classification', body: 'SEC', region: 'US', impact: 'high' as const },
  { date: 'Jun 1, 2026', event: 'EU MiCA Phase 2 — CASP Authorization Deadline', body: 'ESMA', region: 'EU', impact: 'high' as const },
  { date: 'Jun 17-18, 2026', event: 'FOMC Rate Decision + Dot Plot', body: 'Federal Reserve', region: 'US', impact: 'high' as const },
  { date: 'Q2 2026', event: 'CLARITY Act — Senate Floor Vote (Expected)', body: 'US Senate', region: 'US', impact: 'high' as const },
  { date: 'Q2 2026', event: 'UK FCA Crypto Trading Platform Authorization Rules', body: 'FCA', region: 'UK', impact: 'medium' as const },
  { date: 'Q3 2026', event: 'Japan FSA Stablecoin Framework Final Rules', body: 'FSA', region: 'Asia', impact: 'medium' as const },
  { date: 'Q3 2026', event: 'BIS Crypto Capital Standards — Implementation Phase', body: 'BIS', region: 'Global', impact: 'medium' as const },
  { date: 'Jan 1, 2027', event: 'EU MiCA Full Implementation — All CASPs Authorized', body: 'ESMA', region: 'EU', impact: 'high' as const },
];

const FALLBACK: RegData = {
  items: [
    { headline: 'SEC classifies 16 digital assets as commodities under joint CFTC framework', source: 'SEC', date: 'Mar 28, 2026', sentiment: 'bullish', tier1: true, badges: [{ label: 'SEC', cls: 'rb-sec' }], url: '' },
    { headline: 'EU MiCA Phase 2 compliance deadline confirmed — January 1, 2027', source: 'ESMA', date: 'Apr 2, 2026', sentiment: 'neutral', tier1: false, badges: [{ label: 'ESMA · EU', cls: 'rb-eu' }], url: '' },
    { headline: 'CLARITY Act advances through Senate committees — Q2 floor vote expected', source: 'US SENATE', date: 'Apr 7, 2026', sentiment: 'bullish', tier1: true, badges: [{ label: 'SENATE', cls: 'rb-sec' }], url: '' },
  ],
  stats: { total: 3, bullish: 2, bearish: 0, net: 'constructive' },
  aiContext: 'Regulatory environment constructive. SEC/CFTC commodity classification (16 assets), CLARITY Act advancing, MiCA Phase 2 confirmed.',
  source: 'fallback',
};

const SENTIMENT_DISPLAY = {
  bullish: { arrow: '▲ BULLISH', color: 'var(--green)' },
  bearish: { arrow: '▼ BEARISH', color: 'var(--red)' },
  neutral: { arrow: '◆ NEUTRAL', color: 'var(--gold)' },
};

const IMPACT_COLORS = { high: 'var(--red)', medium: 'var(--gold)', low: 'var(--text2)' };

export default function RegulatoryTab() {
  const [data, setData] = useState<RegData>(FALLBACK);
  const [rssItems, setRssItems] = useState<RSSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Sentiment>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<SourceCategory | null>(null);

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const [regRes, rssRes] = await Promise.allSettled([
        fetch('/api/regulatory'),
        fetch('/api/regulatory-feeds'),
      ]);
      if (regRes.status === 'fulfilled' && regRes.value.ok) {
        const json = await regRes.value.json();
        if (json.items && json.items.length > 0) setData(json);
      }
      if (rssRes.status === 'fulfilled' && rssRes.value.ok) {
        const json = await rssRes.value.json();
        if (json.items) setRssItems(json.items);
      }
      setLastUpdated(new Date());
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 120_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const isLive = data.source === 'live';
  const isFallback = data.source === 'fallback';
  const sourceLabel = isLive ? '● LIVE' : '● CACHED';
  const sourceColor = isLive ? 'var(--green)' : 'var(--gold)';

  const visible = data.items.filter((r) => activeFilter === 'all' || r.sentiment === activeFilter);
  const activeSourceCount = DATA_SOURCES.filter(s => s.status === 'active').length;

  const btnStyle = (s: Sentiment): React.CSSProperties => {
    const base: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: '7px', padding: '2px 10px', cursor: 'pointer', letterSpacing: '0.08em' };
    if (s === 'all') return { ...base, background: activeFilter === 'all' ? 'var(--accent)' : 'var(--s3)', color: activeFilter === 'all' ? '#000' : 'var(--text2)', border: activeFilter === 'all' ? 'none' : '1px solid var(--b2)', fontWeight: activeFilter === 'all' ? 700 : 400 };
    const colorMap: Record<string, string> = { bullish: 'var(--green)', bearish: 'var(--red)', neutral: 'var(--gold)' };
    const borderMap: Record<string, string> = { bullish: 'rgba(16,185,129,0.3)', bearish: 'rgba(239,68,68,0.3)', neutral: 'rgba(240,192,64,0.3)' };
    return { ...base, background: activeFilter === s ? borderMap[s] : 'var(--s3)', color: colorMap[s], border: `1px solid ${borderMap[s]}` };
  };

  const viewBtnStyle = (v: ViewMode): React.CSSProperties => ({
    fontFamily: 'var(--mono)', fontSize: '7px', padding: '3px 12px', cursor: 'pointer',
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    background: viewMode === v ? 'var(--accent)' : 'transparent',
    color: viewMode === v ? '#000' : 'var(--text2)',
    border: viewMode === v ? '1px solid var(--accent)' : '1px solid var(--b2)',
    fontWeight: viewMode === v ? 700 : 400,
  });

  if (error && !lastUpdated) {
    return <ErrorState message="Regulatory feed temporarily unavailable." onRetry={fetchData} />;
  }

  return (
    <div className="page tab-content-enter" id="page-reg">
      {/* Loading indicator shown while initial data is pending (source === 'fallback') */}
      {isFallback && loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 6px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.12em' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          CONNECTING...
        </div>
      )}
      {/* AI Context Strip */}
      <div className="ai-context-strip" id="acs-reg">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" id="acs-body-reg">
          {data.aiContext}
          <span style={{ marginLeft: 8, fontFamily: 'var(--mono)', fontSize: '7px', color: sourceColor }}>{sourceLabel}</span>
        </span>
      </div>

      {/* KPI Row */}
      <div className="g4">
        <div className="kpi">
          <div className="kpi-label">Data Sources</div>
          <div className="kpi-val cyan">{activeSourceCount}</div>
          <div className="kpi-chg" style={{ color: 'var(--text2)' }}>12 categories · verified APIs</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Regulatory Updates</div>
          <div className="kpi-val" style={{ color: 'var(--text)' }}>{data.stats.total + rssItems.length}</div>
          <div className="kpi-chg">{data.stats.bullish} bullish · {data.stats.bearish} bearish</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Net Regulatory Stance</div>
          <div className="kpi-val" style={{ color: data.stats.net === 'constructive' ? 'var(--green)' : data.stats.net === 'cautious' ? 'var(--red)' : 'var(--gold)' }}>{data.stats.net?.toUpperCase() || 'BALANCED'}</div>
          <div className="kpi-chg">{isLive ? 'Live database' : 'Cached data'}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Upcoming Events</div>
          <div className="kpi-val gold">{UPCOMING_EVENTS.length}</div>
          <div className="kpi-chg">Next: {UPCOMING_EVENTS[0]?.date}</div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div style={{ display: 'flex', gap: '4px', margin: '8px 0', padding: '4px 0' }}>
        <button onClick={() => setViewMode('feed')} style={viewBtnStyle('feed')}>◈ Live Feed</button>
        <button onClick={() => setViewMode('events')} style={viewBtnStyle('events')}>◇ Upcoming Events</button>
        <button onClick={() => setViewMode('sources')} style={viewBtnStyle('sources')}>▣ Source Map ({activeSourceCount})</button>
        <div style={{ flex: 1 }} />
        <DataFreshness lastUpdated={lastUpdated} source="Multi-Source Aggregator" isLive={isLive} />
      </div>

      {/* ─── VIEW: LIVE FEED ──────────────────────────────── */}
      {viewMode === 'feed' && (
        <>
          {/* Top cards */}
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b2)', marginBottom: '6px' }}>
            <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', letterSpacing: '0.14em', color: 'var(--accent)' }}>◈ REGULATORY INTELLIGENCE — {isLive ? 'LIVE DATABASE + RSS FEEDS' : 'CACHED'}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>{data.stats.total} DB entries · {rssItems.length} RSS items · Auto-refresh 2m</span>
            </div>
            <div style={{ padding: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
                {data.items.slice(0, 4).map((item, idx) => {
                  const s = SENTIMENT_DISPLAY[item.sentiment] || SENTIMENT_DISPLAY.neutral;
                  return (
                    <div key={idx} style={{ background: 'var(--s2)', border: '1px solid var(--b2)', padding: '8px 10px' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: s.color, letterSpacing: '0.08em', marginBottom: '4px' }}>{s.arrow}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text)', lineHeight: 1.4, marginBottom: '4px' }}>{item.headline.slice(0, 80)}…</div>
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

          <div className="g2">
            {/* Supabase DB Feed */}
            <div className="panel panel-hover">
              <div className="ph"><div className="pt">Database Feed — Curated Regulatory Actions</div><div className="tag tag-live">{isLive ? 'Live' : 'Cached'}</div></div>
              <div style={{ display: 'flex', gap: '6px', padding: '6px 0 8px' }}>
                <button onClick={() => setActiveFilter('all')} style={btnStyle('all')}>ALL</button>
                <button onClick={() => setActiveFilter('bullish')} style={btnStyle('bullish')}>▲ BULLISH</button>
                <button onClick={() => setActiveFilter('bearish')} style={btnStyle('bearish')}>▼ BEARISH</button>
                <button onClick={() => setActiveFilter('neutral')} style={btnStyle('neutral')}>◆ NEUTRAL</button>
              </div>
              {visible.map((item, idx) => {
                const s = SENTIMENT_DISPLAY[item.sentiment] || SENTIMENT_DISPLAY.neutral;
                return (
                  <div key={idx} className="reg-item" data-sentiment={item.sentiment} style={{ cursor: item.url ? 'pointer' : 'default' }}
                    onClick={() => item.url && window.open(item.url, '_blank')}>
                    <div className="reg-hl">{item.headline}</div>
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

            {/* RSS Aggregated Feed */}
            <div className="panel panel-hover">
              <div className="ph">
                <div className="pt">RSS Live Wire — Multi-Source Aggregator</div>
                <div className="tag tag-live" style={{ background: 'rgba(232,165,52,0.1)', color: 'var(--accent)', fontSize: '7px' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginRight: 4, animation: 'pulse 2s infinite' }} />
                  STREAMING
                </div>
              </div>
              {rssItems.length === 0 && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', padding: '12px 0' }}>Loading RSS feeds...</div>
              )}
              {rssItems.slice(0, 15).map((item, idx) => (
                <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}
                  onClick={() => item.link && window.open(item.link, '_blank')}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text)', lineHeight: 1.5, marginBottom: '3px' }}>{item.title}</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', padding: '1px 6px', background: 'var(--s3)', color: 'var(--accent)', border: '1px solid var(--b2)' }}>{item.body}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>{item.region}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>
                      {item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Tracker + Asset Matrix */}
          <div className="g2">
            <div className="panel panel-hover">
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

            <div className="panel panel-hover">
              <div className="ph"><div className="pt">Asset-Level Regulatory Matrix</div><div className="tag tag-pro">PRO</div></div>
              <table className="dt">
                <thead><tr><th style={{ textAlign: 'left' }}>Asset</th><th>US Status</th><th>EU MiCA</th><th>ETF</th><th>Risk</th></tr></thead>
                <tbody>
                  {[
                    { name: 'Bitcoin', sym: 'BTC', us: 'COMMODITY', mica: 'EXEMPT', etf: 'APPROVED', risk: 'LOW', uc: 'var(--green)', mc: 'var(--green)', ec: 'var(--green)', rc: 'var(--green)' },
                    { name: 'Ethereum', sym: 'ETH', us: 'COMMODITY', mica: 'EXEMPT', etf: 'APPROVED', risk: 'LOW', uc: 'var(--green)', mc: 'var(--green)', ec: 'var(--green)', rc: 'var(--green)' },
                    { name: 'XRP', sym: 'XRP', us: 'COMMODITY', mica: 'MiCA ALIGN', etf: 'PENDING', risk: 'MED', uc: 'var(--green)', mc: 'var(--green)', ec: 'var(--gold)', rc: 'var(--gold)' },
                    { name: 'Solana', sym: 'SOL', us: 'DISPUTED', mica: 'MiCA ALIGN', etf: 'PENDING', risk: 'MED', uc: 'var(--gold)', mc: 'var(--green)', ec: 'var(--gold)', rc: 'var(--gold)' },
                    { name: 'HBAR', sym: 'HBAR', us: 'COMMODITY', mica: 'MiCA ALIGN', etf: 'APPROVED', risk: 'LOW', uc: 'var(--green)', mc: 'var(--green)', ec: 'var(--green)', rc: 'var(--green)' },
                  ].map((a) => (
                    <tr key={a.sym}>
                      <td><span className="aname">{a.name}</span><span className="asym">{a.sym}</span></td>
                      <td style={{ color: a.uc }}>{a.us}</td>
                      <td style={{ color: a.mc }}>{a.mica}</td>
                      <td style={{ color: a.ec }}>{a.etf}</td>
                      <td style={{ color: a.rc }}>{a.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── VIEW: UPCOMING EVENTS ────────────────────────── */}
      {viewMode === 'events' && (
        <div className="panel panel-hover">
          <div className="ph">
            <div className="pt">Regulatory Events Calendar</div>
            <div className="tag tag-pro">ChainIntel Research</div>
          </div>
          <div style={{ display: 'grid', gap: '1px' }}>
            {UPCOMING_EVENTS.map((evt, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 60px', gap: '12px', padding: '10px 8px', background: idx % 2 === 0 ? 'var(--s2)' : 'transparent', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--accent)', letterSpacing: '0.06em' }}>{evt.date}</div>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text)', lineHeight: 1.5 }}>{evt.event}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '2px' }}>{evt.body}</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', padding: '2px 8px', background: 'var(--s3)', border: '1px solid var(--b2)', textAlign: 'center', color: 'var(--text2)' }}>{evt.region}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: IMPACT_COLORS[evt.impact], textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
                  {evt.impact === 'high' ? '◈' : '◇'} {evt.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── VIEW: SOURCE MAP ─────────────────────────────── */}
      {viewMode === 'sources' && (
        <>
          <div className="section-h">
            <div className="section-h-label">{activeSourceCount} Verified Data Sources · 12 Categories · Real APIs Only</div>
            <div className="section-h-line"></div>
          </div>

          {/* Category summary grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
            {getCategoryStats().map(({ category, count, icon, color }) => (
              <div key={category}
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                style={{
                  background: expandedCategory === category ? 'var(--s2)' : 'var(--s1)',
                  border: expandedCategory === category ? `1px solid ${color}` : '1px solid var(--b2)',
                  padding: '8px 10px', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color }}>{icon}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color, fontWeight: 700 }}>{count}</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--text)', letterSpacing: '0.06em', lineHeight: 1.3 }}>{category}</div>
              </div>
            ))}
          </div>

          {/* Expanded category detail */}
          {expandedCategory && (
            <div className="panel" style={{ border: `1px solid ${SOURCE_CATEGORIES[expandedCategory].color}` }}>
              <div className="ph">
                <div className="pt" style={{ color: SOURCE_CATEGORIES[expandedCategory].color }}>
                  {SOURCE_CATEGORIES[expandedCategory].icon} {expandedCategory}
                </div>
              </div>
              <div style={{ display: 'grid', gap: '1px' }}>
                {getSourcesByCategory()[expandedCategory]?.map((src: DataSource) => (
                  <div key={src.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 80px', gap: '8px', padding: '6px 8px', background: 'var(--s2)', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--text)' }}>{src.name}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '1px' }}>{src.description.substring(0, 80)}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--text2)' }}>{src.type}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: src.auth === 'none' ? 'var(--green)' : 'var(--gold)' }}>{src.auth === 'none' ? 'PUBLIC' : 'KEY'}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--accent)', textAlign: 'right' }}>⟳ {src.refreshRate}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full source list (compact) */}
          {!expandedCategory && (
            <div className="panel panel-hover">
              <div className="ph"><div className="pt">All {activeSourceCount} Sources — Sorted by Category</div></div>
              <table className="dt">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Source</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Auth</th>
                    <th>Refresh</th>
                    <th>Tabs</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_SOURCES.map((src) => (
                    <tr key={src.id}>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--text)' }}>{src.name}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: SOURCE_CATEGORIES[src.category]?.color || 'var(--text2)' }}>{src.category}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--text2)' }}>{src.type}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: src.auth === 'none' ? 'var(--green)' : 'var(--gold)' }}>{src.auth === 'none' ? '—' : '🔑'}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--accent)' }}>{src.refreshRate}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)' }}>{src.tabs.slice(0, 2).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
