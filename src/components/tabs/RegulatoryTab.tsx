'use client';

import { useState, useEffect, useCallback } from 'react';

type Sentiment = 'all' | 'bullish' | 'bearish' | 'neutral';

interface RegItem {
  headline: string;
  summary: string;
  source: string;
  regulatory_body: string;
  date: string;
  date_raw: string;
  sentiment: string;
  tier1: boolean;
  badges: { label: string; cls: string }[];
  asset_tags: string[];
  url: string;
}

interface RegData {
  items: RegItem[];
  stats: { total: number; bullish: number; bearish: number; net: string };
  aiContext: string;
  source: string;
  timestamp: number;
}

const SENTIMENT_DISPLAY: Record<string, { arrow: string; color: string }> = {
  bullish: { arrow: '▲ BULLISH', color: 'var(--green)' },
  bearish: { arrow: '▼ BEARISH', color: 'var(--red)' },
  neutral: { arrow: '◆ NEUTRAL', color: 'var(--gold)' },
};

const BADGE_COLORS: Record<string, string> = {
  SEC: 'rgba(239,68,68,0.15)',
  CFTC: 'rgba(59,130,246,0.15)',
  'EU': 'rgba(0,212,170,0.1)',
  'ESMA': 'rgba(0,212,170,0.1)',
  'FCA': 'rgba(240,192,64,0.12)',
  'IMF': 'rgba(147,51,234,0.12)',
  'BIS': 'rgba(147,51,234,0.12)',
  'OCC': 'rgba(59,130,246,0.15)',
  'FinCEN': 'rgba(239,68,68,0.15)',
};

export default function RegulatoryTab() {
  const [data, setData] = useState<RegData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Sentiment>('all');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/regulatory');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch { /* fail silently */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 300_000); // 5 min
    return () => clearInterval(iv);
  }, [fetchData]);

  const items = data?.items || [];
  const filtered = filter === 'all' ? items : items.filter(i => i.sentiment === filter);
  const stats = data?.stats;

  return (
    <div>
      {/* AI Context */}
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body">
          {data?.aiContext || 'Loading regulatory intelligence...'}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text2)' }}>REGULATORY INTELLIGENCE FEED</span>
        <div style={{ flex: 1, height: 1, background: 'var(--b2)' }} />
        <span className="tag tag-live">
          <span>Supabase</span>
          {' · '}
          <span>Auto-refreshed</span>
        </span>
      </div>

      {/* KPIs */}
      <div className="g4">
        <div className="kpi">
          <div className="kpi-label">Total Updates</div>
          <div className="kpi-val cyan">{stats?.total ?? '—'}</div>
          <div className="kpi-chg">{loading ? 'Loading...' : 'Monitored items'}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Bullish Developments</div>
          <div className="kpi-val" style={{ color: 'var(--green)' }}>{stats?.bullish ?? '—'}</div>
          <div className="kpi-chg up">Pro-crypto regulatory moves</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Bearish Developments</div>
          <div className="kpi-val" style={{ color: 'var(--red)' }}>{stats?.bearish ?? '—'}</div>
          <div className="kpi-chg dn">Restrictive / enforcement</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Net Environment</div>
          <div className="kpi-val" style={{ color: stats?.net === 'constructive' ? 'var(--green)' : stats?.net === 'cautious' ? 'var(--red)' : 'var(--gold)' }}>
            {stats?.net?.toUpperCase() || '—'}
          </div>
          <div className="kpi-chg">Regulatory climate</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 8 }}>
        {(['all', 'bullish', 'bearish', 'neutral'] as Sentiment[]).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            fontFamily: 'var(--mono)', fontSize: 9, padding: '4px 10px', cursor: 'pointer', border: '1px solid',
            borderColor: filter === s ? 'var(--cyan)' : 'var(--b2)',
            background: filter === s ? 'rgba(0,212,170,0.1)' : 'var(--s1)',
            color: filter === s ? 'var(--cyan)' : 'var(--text2)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {s === 'all' ? `ALL (${items.length})` : `${s.toUpperCase()} (${items.filter(i => i.sentiment === s).length})`}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="panel">
        <div className="ph">
          <div className="pt">Regulatory Feed — {filtered.length} Items</div>
        </div>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)' }}>SCANNING REGULATORY SOURCES...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>No regulatory items match this filter</div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {filtered.map((item, i) => {
              const sd = SENTIMENT_DISPLAY[item.sentiment] || SENTIMENT_DISPLAY.neutral;
              const isExpanded = expandedIdx === i;
              return (
                <div key={i}
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  style={{
                    padding: '10px 14px', borderBottom: '1px solid var(--b1)', cursor: 'pointer',
                    borderLeft: item.tier1 ? `3px solid ${sd.color}` : '3px solid transparent',
                    background: isExpanded ? 'rgba(0,212,170,0.03)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(0,212,170,0.02)'; }}
                  onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = ''; }}>

                  {/* Top row: badges + date + sentiment */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {item.badges.map((b, bi) => (
                      <span key={bi} style={{
                        fontFamily: 'var(--mono)', fontSize: 7, padding: '1px 6px', fontWeight: 600, letterSpacing: '0.05em',
                        background: BADGE_COLORS[b.label] || 'rgba(74,106,140,0.15)',
                        color: 'var(--text2)',
                      }}>
                        {b.label}
                      </span>
                    ))}
                    {item.tier1 && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 7, padding: '1px 4px', background: 'rgba(239,68,68,0.12)', color: 'var(--red)', fontWeight: 700 }}>TIER 1</span>
                    )}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', marginLeft: 'auto' }}>{item.date}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 600, color: sd.color }}>{sd.arrow}</span>
                  </div>

                  {/* Headline */}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', lineHeight: 1.5, fontWeight: item.tier1 ? 600 : 400 }}>
                    {item.headline}
                  </div>

                  {/* Expanded: summary + source link */}
                  {isExpanded && (
                    <div style={{ marginTop: 8 }}>
                      {item.summary && (
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 6, paddingLeft: 8, borderLeft: '2px solid var(--b2)' }}>
                          {item.summary}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="src-link" style={{ fontFamily: 'var(--mono)', fontSize: 9 }}>
                            View Source →
                          </a>
                        )}
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>Source: {item.source || item.regulatory_body}</span>
                        {item.asset_tags && item.asset_tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                            {item.asset_tags.map((tag: string, ti: number) => (
                              <span key={ti} style={{ fontFamily: 'var(--mono)', fontSize: 7, padding: '1px 4px', background: 'rgba(0,212,170,0.1)', color: 'var(--cyan)' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Synthesis */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--cyan)' }}>CI · Regulatory Synthesis</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', marginLeft: 'auto' }}>
            {data?.source === 'live' ? 'LIVE' : 'CACHED'} · {data ? new Date(data.timestamp).toLocaleTimeString() : ''}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.6 }}>
          {stats ? (
            <>
              <strong style={{ color: 'var(--text)' }}>
                {stats.net === 'constructive'
                  ? `Regulatory environment is constructive (${stats.bullish} bullish vs ${stats.bearish} bearish developments). The trend toward commodity classification for digital assets and custody permissions for banks creates a structural foundation for institutional adoption.`
                  : stats.net === 'cautious'
                    ? `Regulatory environment is cautious (${stats.bearish} bearish vs ${stats.bullish} bullish developments). Enforcement actions and risk warnings dominate. Position conservatively until clarity improves.`
                    : `Regulatory environment is balanced (${stats.bullish} bullish, ${stats.bearish} bearish developments). Mixed signals — both progressive frameworks and restrictive measures in play. No clear directional bias.`}
              </strong>
            </>
          ) : (
            'Loading regulatory analysis...'
          )}
        </div>
      </div>
    </div>
  );
}
