'use client';

import { useState, useEffect, useCallback } from 'react';

interface SentimentData {
  fearGreed: { value: number; label: string; zone: string };
  history: { value: number; date: string }[];
  stats: { avg7d: number; avg7dPrev: number; weekOverWeek: number };
  trending: { symbol: string; name: string; rank: number | null; thumb: string }[];
  trendingCategories: { name: string; coins_count?: number }[];
  globalMetrics: {
    btcDominance: number;
    ethDominance: number;
    totalMarketCap: number;
    totalVolume24h: number;
    activeCryptos: number;
    activeExchanges: number;
    defiVolume24h: number;
    defiMarketCap: number;
    stablecoinVolume24h: number;
    stablecoinMarketCap: number;
    totalMarketCapChange24h: number;
  } | null;
  aiContext: string;
  source: string;
  timestamp: number;
}

function fmtNum(n: number, decimals = 0): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: decimals })}`;
}

function GaugeRing({ value, size = 160 }: { value: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  // Color based on fear/greed
  let color = 'var(--muted)';
  if (value <= 25) color = 'var(--red)';
  else if (value <= 45) color = '#f97316'; // orange
  else if (value <= 55) color = 'var(--gold)';
  else if (value <= 75) color = 'var(--green)';
  else color = 'var(--cyan)';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--b2)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', marginTop: 2 }}>/ 100</div>
      </div>
    </div>
  );
}

function Sparkline({ data, width = 200, height = 40 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const last = data[data.length - 1];
  let color = 'var(--muted)';
  if (last <= 25) color = 'var(--red)';
  else if (last <= 45) color = '#f97316';
  else if (last <= 55) color = 'var(--gold)';
  else if (last <= 75) color = 'var(--green)';
  else color = 'var(--cyan)';

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      {/* Gradient fill under curve */}
      <defs>
        <linearGradient id="fng-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#fng-grad)" />
    </svg>
  );
}

export default function SentimentTab() {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/sentiment');
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
    const iv = setInterval(fetchData, 120_000); // refresh every 2 min
    return () => clearInterval(iv);
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.1em' }}>
          LOADING SENTIMENT DATA...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)' }}>
          SENTIMENT FEED UNAVAILABLE — {error}
        </div>
      </div>
    );
  }

  const fg = data.fearGreed;
  const gm = data.globalMetrics;
  const histValues = data.history.map(h => h.value);

  return (
    <div>
      {/* AI Context Strip */}
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body" dangerouslySetInnerHTML={{
          __html: data.aiContext.replace(
            /(\d+%|\+\d+%|−\d+%|\$[\d.]+[TBMK]?)/g,
            '<strong>$1</strong>'
          )
        }} />
      </div>

      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--text2)' }}>MARKET SENTIMENT & SOCIAL INTELLIGENCE</span>
        <div style={{ flex: 1, height: 1, background: 'var(--b2)' }} />
        <div className="tag tag-live">
          <a className="src-link" href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener noreferrer">Alternative.me</a>
          {' · '}
          <a className="src-link" href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko</a>
          {' · '}
          <a className="src-link" href="https://coinmarketcap.com" target="_blank" rel="noopener noreferrer">CMC</a>
        </div>
      </div>

      {/* Top row: Gauge + KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, marginBottom: 12 }}>
        {/* Fear & Greed Gauge */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>FEAR & GREED INDEX</div>
          <GaugeRing value={fg.value} />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text)', marginTop: 8, textTransform: 'uppercase' }}>
            {fg.label}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: data.stats.weekOverWeek >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
            {data.stats.weekOverWeek >= 0 ? '▲' : '▼'} {Math.abs(data.stats.weekOverWeek)} pts WoW
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div className="kpi">
            <div className="kpi-label">7-Day Average</div>
            <div className="kpi-val" style={{ color: data.stats.avg7d <= 45 ? 'var(--red)' : data.stats.avg7d >= 55 ? 'var(--green)' : 'var(--gold)' }}>
              {data.stats.avg7d}
            </div>
            <div className={`kpi-chg ${data.stats.weekOverWeek >= 0 ? 'up' : 'dn'}`}>
              {data.stats.weekOverWeek >= 0 ? '+' : ''}{data.stats.weekOverWeek} vs prev week
            </div>
          </div>

          {gm && (
            <>
              <div className="kpi">
                <div className="kpi-label">BTC Dominance</div>
                <div className="kpi-val cyan">{gm.btcDominance}%</div>
                <div className={`kpi-chg ${gm.btcDominance > 55 ? 'dn' : 'up'}`}>
                  {gm.btcDominance > 55 ? 'Risk-off regime' : gm.btcDominance < 45 ? 'Alt season conditions' : 'Balanced market'}
                </div>
              </div>
              <div className="kpi">
                <div className="kpi-label">ETH Dominance</div>
                <div className="kpi-val" style={{ color: 'var(--blue)' }}>{gm.ethDominance}%</div>
                <div className="kpi-chg">{gm.ethDominance < 15 ? 'ETH underweight' : 'Normal range'}</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Total Market Cap</div>
                <div className="kpi-val" style={{ color: 'var(--text)' }}>{fmtNum(gm.totalMarketCap)}</div>
                <div className={`kpi-chg ${gm.totalMarketCapChange24h >= 0 ? 'up' : 'dn'}`}>
                  {gm.totalMarketCapChange24h >= 0 ? '+' : ''}{gm.totalMarketCapChange24h.toFixed(2)}% 24h
                </div>
              </div>
              <div className="kpi">
                <div className="kpi-label">24h Volume</div>
                <div className="kpi-val" style={{ color: 'var(--text2)' }}>{fmtNum(gm.totalVolume24h)}</div>
                <div className="kpi-chg">Across {gm.activeExchanges} exchanges</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Stablecoin Market Cap</div>
                <div className="kpi-val" style={{ color: 'var(--green)' }}>{fmtNum(gm.stablecoinMarketCap)}</div>
                <div className="kpi-chg">Vol: {fmtNum(gm.stablecoinVolume24h)}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 30-Day Fear & Greed Chart */}
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="ph">
          <div className="pt">Fear & Greed — 30-Day Trend</div>
          <div className="tag tag-live">
            <a className="src-link" href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener noreferrer">Alternative.me</a>
          </div>
        </div>
        <div style={{ padding: '8px 12px' }}>
          <Sparkline data={histValues} width={700} height={60} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>
              {data.history[0]?.date || ''}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>
              {data.history[data.history.length - 1]?.date || ''}
            </span>
          </div>
          {/* Scale bar */}
          <div style={{ display: 'flex', gap: 0, height: 4, marginTop: 6, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ flex: 1, background: 'var(--red)' }} title="Extreme Fear (0-25)" />
            <div style={{ flex: 1, background: '#f97316' }} title="Fear (26-45)" />
            <div style={{ flex: 1, background: 'var(--gold)' }} title="Neutral (46-55)" />
            <div style={{ flex: 1, background: 'var(--green)' }} title="Greed (56-75)" />
            <div style={{ flex: 1, background: 'var(--cyan)' }} title="Extreme Greed (76-100)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--red)' }}>EXTREME FEAR</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: '#f97316' }}>FEAR</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--gold)' }}>NEUTRAL</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--green)' }}>GREED</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--cyan)' }}>EXTREME GREED</span>
          </div>
        </div>
      </div>

      {/* Bottom row: Trending + DeFi/Stablecoin metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Trending Coins */}
        <div className="panel">
          <div className="ph">
            <div className="pt">Trending Coins — 24h</div>
            <div className="tag tag-live">
              <a className="src-link" href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko</a>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>COIN</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>MKT RANK</th>
              </tr>
            </thead>
            <tbody>
              {data.trending.map((t, i) => (
                <tr key={t.symbol} style={{ borderBottom: '1px solid var(--b1)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '5px 8px', color: 'var(--muted)', fontSize: 10 }}>{i + 1}</td>
                  <td style={{ padding: '5px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t.thumb && <img src={t.thumb} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />}
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.symbol}</span>
                      <span style={{ fontSize: 9, color: 'var(--muted)' }}>{t.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>
                    {t.rank ? `#${t.rank}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.trendingCategories.length > 0 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--b1)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', marginBottom: 4 }}>TRENDING CATEGORIES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {data.trendingCategories.map(cat => (
                  <span key={cat.name} style={{
                    fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px',
                    background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', borderRadius: 2,
                  }}>
                    {cat.name}{cat.coins_count ? ` (${cat.coins_count})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Market Structure */}
        <div className="panel">
          <div className="ph">
            <div className="pt">Market Structure</div>
            <div className="tag tag-live">
              <a className="src-link" href="https://coinmarketcap.com" target="_blank" rel="noopener noreferrer">CMC</a>
            </div>
          </div>
          {gm && (
            <div style={{ padding: '8px 12px' }}>
              {/* Dominance bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', marginBottom: 4 }}>MARKET DOMINANCE</div>
                <div style={{ display: 'flex', gap: 0, height: 16, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${gm.btcDominance}%`, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: '#000', fontWeight: 700 }}>BTC {gm.btcDominance}%</span>
                  </div>
                  <div style={{ width: `${gm.ethDominance}%`, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: '#fff', fontWeight: 700 }}>ETH {gm.ethDominance}%</span>
                  </div>
                  <div style={{ flex: 1, background: 'var(--b3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--text2)', fontWeight: 600 }}>ALTS {(100 - gm.btcDominance - gm.ethDominance).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--s2)', padding: '8px 10px', border: '1px solid var(--b1)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)' }}>DeFi MARKET CAP</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--cyan)' }}>{fmtNum(gm.defiMarketCap)}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)' }}>Vol: {fmtNum(gm.defiVolume24h)}</div>
                </div>
                <div style={{ background: 'var(--s2)', padding: '8px 10px', border: '1px solid var(--b1)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)' }}>STABLECOIN CAP</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{fmtNum(gm.stablecoinMarketCap)}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)' }}>Vol: {fmtNum(gm.stablecoinVolume24h)}</div>
                </div>
                <div style={{ background: 'var(--s2)', padding: '8px 10px', border: '1px solid var(--b1)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)' }}>ACTIVE CRYPTOS</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{gm.activeCryptos.toLocaleString()}</div>
                </div>
                <div style={{ background: 'var(--s2)', padding: '8px 10px', border: '1px solid var(--b1)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)' }}>ACTIVE EXCHANGES</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{gm.activeExchanges.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sentiment Synthesis */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--cyan)' }}>CI · Sentiment Synthesis</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', marginLeft: 'auto' }}>
            {data.source === 'live' ? 'LIVE' : 'CACHED'} · {new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{
            __html: data.aiContext.replace(
              /(\d+%|\+\d+%|−\d+%|\$[\d.]+[TBMK]?|extreme fear|extreme greed|greed|fear|neutral)/gi,
              '<strong style="color:var(--text)">$1</strong>'
            )
          }}
        />
      </div>
    </div>
  );
}
