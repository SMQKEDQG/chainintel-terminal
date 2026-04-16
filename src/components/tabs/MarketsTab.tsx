'use client';

import { useState, useEffect, useCallback } from 'react';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  market_cap_rank: number;
}

interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  buzz_score: number;
  buzz_sources: string[];
  mentions_24h: number;
  trending_rank: number;
}

/* ── Transform normalized market data response to table rows ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function marketCoinToCoinData(item: any): CoinData {
  return {
    id: item.id || item.slug || '',
    symbol: (item.symbol || '').toLowerCase(),
    name: item.name || '',
    image: item.image || '',
    current_price: item.price || 0,
    market_cap: item.market_cap || 0,
    total_volume: item.volume_24h || 0,
    price_change_percentage_24h: item.percent_change_24h || 0,
    price_change_percentage_7d_in_currency: item.percent_change_7d || 0,
    market_cap_rank: item.rank || item.cmc_rank || 0,
  };
}

function formatPrice(n: number) {
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1) return '$' + n.toFixed(2);
  if (n >= 0.01) return '$' + n.toFixed(4);
  return '$' + n.toFixed(6);
}
function formatMcap(n: number) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M';
  return '$' + n.toLocaleString();
}

function getSignal(chg24: number): { label: string; color: string } {
  if (chg24 > 3) return { label: 'STRONG BUY', color: 'var(--green)' };
  if (chg24 > 0) return { label: 'ACCUMULATE', color: 'var(--green)' };
  if (chg24 > -3) return { label: 'HOLD', color: 'var(--gold)' };
  return { label: 'WATCH', color: 'var(--muted)' };
}

/* ── Buzz bar for trending tab ── */
function BuzzBar({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 60, height: 6, background: 'var(--b2)', borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          width: `${score}%`, height: '100%', borderRadius: 3,
          background: score > 70 ? 'var(--green)' : score > 40 ? 'var(--accent)' : 'var(--blue)',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: score > 70 ? 'var(--green)' : score > 40 ? 'var(--accent)' : 'var(--blue)' }}>
        {score}
      </span>
    </div>
  );
}

function SourcePills({ sources }: { sources: string[] }) {
  const colorMap: Record<string, string> = {
    'CryptoPanic News': 'var(--blue)',
    'CoinGecko Trending': 'var(--green)',
    'Social/News Buzz': 'var(--blue)',
  };
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {sources.map((s) => (
        <span key={s} style={{
          fontFamily: 'var(--mono)', fontSize: 9, padding: '1px 5px',
          border: `1px solid ${colorMap[s] || 'var(--b3)'}`,
          color: colorMap[s] || 'var(--muted)',
          letterSpacing: '0.04em', whiteSpace: 'nowrap',
        }}>
          {s === 'CoinGecko Trending' ? '📈 GECKO' :
           s === 'CryptoPanic News' ? '📰 NEWS' :
           s === 'Social/News Buzz' ? '𝕏 BUZZ' : s}
        </span>
      ))}
    </div>
  );
}

export default function MarketsTab() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'coinpaprika' | 'coingecko-fallback' | 'fallback'>('fallback');
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [subTab, setSubTab] = useState<'all' | 'trend' | 'gain' | 'lose'>('all');
  const [sortKey, setSortKey] = useState<string>('rank');
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const fetchCoins = useCallback(async () => {
    try {
      const marketRes = await fetch('/api/market-data?limit=100');
      if (!marketRes.ok) throw new Error('market-data request failed');
      const json = await marketRes.json();
      if (json.coins?.length > 0) {
        const mapped = json.coins.map(marketCoinToCoinData);
        setCoins(mapped);
        setDataSource(json.source === 'coinpaprika' ? 'coinpaprika' : json.source === 'coingecko-fallback' ? 'coingecko-fallback' : 'fallback');
        setError(null);
        setLoading(false);
        return;
      }
    } catch {
      // Keep fallback state
    }

    setError('API rate limited — showing cached market data');
    setDataSource('fallback');
    setLoading(false);
  }, []);

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch('/api/trending');
      if (res.ok) {
        const json = await res.json();
        if (json.trending?.length > 0) {
          setTrending(json.trending);
        }
      }
    } catch {
      // Trending fetch failed silently
    }
    setTrendingLoading(false);
  }, []);

  // Fetch binance-data aggregator for exchange-level depth
  useEffect(() => {
    fetch('/api/binance-data').then(r => r.json()).then(d => {
      if (d?.binance?.tickers) {
        (globalThis as any).__ciBinanceTickers = d.binance.tickers;
      }
      if (d?.binance?.futuresOI) {
        (globalThis as any).__ciFuturesOI = d.binance.futuresOI;
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchCoins();
    fetchTrending();
    const id = setInterval(fetchCoins, 60000);
    const id2 = setInterval(fetchTrending, 120000);
    return () => { clearInterval(id); clearInterval(id2); };
  }, [fetchCoins, fetchTrending]);

  const handleRetry = () => {
    setLoading(true);
    fetchCoins();
    fetchTrending();
  };

  const totalMcap = coins.reduce((a, c) => a + (c.market_cap || 0), 0);
  const totalVol = coins.reduce((a, c) => a + (c.total_volume || 0), 0);
  const gainers = coins.filter(c => c.price_change_percentage_24h > 0).length;
  const losers = coins.length - gainers;

  let filtered = [...coins];
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(s) || c.symbol.toLowerCase().includes(s));
  }
  if (subTab === 'gain') filtered = filtered.filter(c => c.price_change_percentage_24h > 0).sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  if (subTab === 'lose') filtered = filtered.filter(c => c.price_change_percentage_24h < 0).sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 1 ? -1 : 1);
    else { setSortKey(key); setSortDir(1); }
  };

  if (subTab !== 'trend') {
    if (sortKey === 'price') filtered.sort((a, b) => (b.current_price - a.current_price) * sortDir);
    if (sortKey === 'change24h') filtered.sort((a, b) => (b.price_change_percentage_24h - a.price_change_percentage_24h) * sortDir);
    if (sortKey === 'marketCap') filtered.sort((a, b) => (b.market_cap - a.market_cap) * sortDir);
    if (sortKey === 'volume') filtered.sort((a, b) => (b.total_volume - a.total_volume) * sortDir);
  }

  const subTabs = [
    { id: 'all' as const, label: 'ALL ASSETS' },
    { id: 'trend' as const, label: '🔥 TRENDING' },
    { id: 'gain' as const, label: 'TOP GAINERS' },
    { id: 'lose' as const, label: 'TOP LOSERS' },
  ];

  const sourceLabel = dataSource === 'coinpaprika' ? '● LIVE · COINPAPRIKA' :
    dataSource === 'coingecko-fallback' ? '● FALLBACK · COINGECKO' :
    coins.length > 0 ? '● CACHED' : '○ CONNECTING...';
  const sourceColor = dataSource === 'coinpaprika' ? 'var(--green)' : dataSource === 'coingecko-fallback' ? 'var(--blue)' : 'var(--gold)';

  return (
    <div>
      {/* Loading indicator shown while dataSource is 'fallback' and fetching */}
      {dataSource === 'fallback' && loading && (
        <div className="connecting-indicator" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 6px', fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.12em' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'connectingPulse 2s infinite' }} />
          CONNECTING...
        </div>
      )}
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body">
          {coins.length === 0 ? (
            <span>Connecting to market data feed...</span>
          ) : (() => {
            const g = coins.filter(c => c.price_change_percentage_24h > 0).length;
            const l = coins.length - g;
            const topGainer = [...coins].filter(c => !['usdt','usdc','dai','busd','tusd','fdusd'].includes(c.symbol)).sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0];
            const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
            const mcapStr = totalMcap >= 1e12 ? `$${(totalMcap / 1e12).toFixed(2)}T` : `$${(totalMcap / 1e9).toFixed(0)}B`;
            const ratio = g / Math.max(1, coins.length);
            const sentiment = ratio > 0.7 ? 'Broad rally' : ratio > 0.5 ? 'Mixed market' : ratio > 0.3 ? 'Selective selling' : 'Broad decline';
            return <><strong>{sentiment} — {g} up / {l} down</strong> across {coins.length} assets. Total market cap {mcapStr}.{topGainer ? ` Top mover: ${topGainer.name} (${topGainer.symbol.toUpperCase()}) ${topGainer.price_change_percentage_24h >= 0 ? '+' : ''}${topGainer.price_change_percentage_24h.toFixed(1)}%.` : ''}</>;
          })()}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, letterSpacing: '0.14em', color: 'var(--text2)' }}>
          {subTab === 'trend' ? 'TRENDING ASSETS' : 'TOP 100 MARKETS'} <span style={{ color: 'var(--muted)' }}>
            {subTab === 'trend' ? '· Social Buzz + CoinGecko + CryptoPanic' : '· By Market Cap · Live Feed'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11, padding: '2px 6px',
            background: dataSource.startsWith('live') ? 'rgba(16,185,129,0.15)' : 'rgba(240,192,64,0.15)',
            border: `1px solid ${sourceColor}`,
            color: sourceColor,
            letterSpacing: '0.08em',
          }}>
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.25)',
          padding: '6px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--gold)' }}>
            ⚠ {error} · Showing {coins.length} assets
          </span>
          <button onClick={handleRetry} style={{
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', background: 'none',
            border: '1px solid var(--accent)', padding: '3px 8px', cursor: 'pointer', letterSpacing: '0.08em',
          }}>
            RETRY
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--b2)', marginBottom: 10 }}>
        {subTabs.map(t => (
          <div key={t.id} onClick={() => setSubTab(t.id)} style={{
            fontFamily: 'var(--mono)', fontSize: 12, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.1em',
            borderBottom: `2px solid ${subTab === t.id ? 'var(--blue)' : 'transparent'}`,
            color: subTab === t.id ? 'var(--blue)' : 'var(--muted)',
          }}>{t.label}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        <div className="panel" style={{ padding: '10px 14px' }}>
          <div className="oc-lbl">Total Market Cap</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>{formatMcap(totalMcap)}</div>
        </div>
        <div className="panel" style={{ padding: '10px 14px' }}>
          <div className="oc-lbl">24h Volume (Top 100)</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{formatMcap(totalVol)}</div>
        </div>
        <div className="panel" style={{ padding: '10px 14px' }}>
          <div className="oc-lbl">Gainers / Losers</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600 }}>
            <span style={{ color: 'var(--green)' }}>{gainers}</span> / <span style={{ color: 'var(--red)' }}>{losers}</span>
          </div>
        </div>
        <div className="panel" style={{ padding: '10px 14px' }}>
          <div className="oc-lbl">BTC Dominance</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: 'var(--gold)' }}>
            {coins.length > 0 ? ((coins[0]?.market_cap / totalMcap) * 100).toFixed(1) + '%' : '—'}
          </div>
        </div>
      </div>

      {subTab !== 'trend' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ticker..."
            style={{ background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 10px', outline: 'none', flex: 1, maxWidth: 280 }} />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
            ⟳ AUTO-REFRESH 60s · <a className="src-link" href="https://docs.coinpaprika.com" target="_blank" rel="noopener noreferrer">API DOCS</a>
          </div>
        </div>
      )}

      {/* ── TRENDING VIEW ── */}
      {subTab === 'trend' ? (
        <div>
          {/* Trending info strip */}
          <div style={{
            background: 'rgba(232,165,52,0.04)', border: '1px solid var(--b2)',
            padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>🔥</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
              Aggregated from <strong style={{ color: 'var(--text)' }}>CoinGecko Trending</strong> and <strong style={{ color: 'var(--text)' }}>CryptoPanic News Buzz</strong>. Ranked by composite social signal score. Updates every 2 minutes.
            </span>
          </div>

          {trendingLoading && trending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
              Loading trending assets from 4 sources...
            </div>
          ) : trending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
              Trending data unavailable — APIs may be rate limited. <button onClick={handleRetry} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>ASSET</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>BUZZ SCORE</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>SOURCES</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 10 }}>PRICE</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 10 }}>24H %</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 10 }}>MCAP</th>
                  </tr>
                </thead>
                <tbody>
                  {trending.map((t) => (
                    <tr key={t.symbol + t.trending_rank} style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,165,52,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td style={{ padding: '6px 8px', color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>
                        {t.trending_rank}
                      </td>
                      <td style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <img src={t.image} alt={t.symbol} width={18} height={18} style={{ borderRadius: '50%' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{t.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>{t.symbol.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <BuzzBar score={t.buzz_score} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <SourcePills sources={t.buzz_sources} />
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text)' }}>
                        {t.current_price > 0 ? formatPrice(t.current_price) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', color: t.price_change_percentage_24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {t.price_change_percentage_24h !== 0
                          ? `${t.price_change_percentage_24h >= 0 ? '+' : ''}${t.price_change_percentage_24h.toFixed(2)}%`
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text2)' }}>
                        {t.market_cap > 0 ? formatMcap(t.market_cap) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Trending footer */}
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 11, flexShrink: 0 }}>⬡ CI·AI</span>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
                Trending signals aggregated from CoinGecko community activity and real-time crypto news mentions.
                Buzz score reflects cross-platform social momentum — higher scores indicate assets generating discussion across multiple channels simultaneously.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── STANDARD TABLE VIEW (all / gainers / losers) ── */
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--b2)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer' }} onClick={() => handleSort('rank')}>#</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em' }}>ASSET</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, cursor: 'pointer' }} onClick={() => handleSort('price')}>PRICE ▾</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, cursor: 'pointer' }} onClick={() => handleSort('change24h')}>24H %</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 10 }}>7D %</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, cursor: 'pointer' }} onClick={() => handleSort('marketCap')}>MCAP</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 10, cursor: 'pointer' }} onClick={() => handleSort('volume')}>VOL 24H</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 10 }}>SIGNAL</th>
                </tr>
              </thead>
              <tbody>
                {loading && coins.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading top 100 assets...</td></tr>
                ) : (
                  filtered.map((c) => {
                    const sig = getSignal(c.price_change_percentage_24h);
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,165,52,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <td style={{ padding: '5px 8px', color: 'var(--muted)', fontSize: 11 }}>{c.market_cap_rank}</td>
                        <td style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <img src={c.image} alt={c.symbol} width={16} height={16} style={{ borderRadius: '50%' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{c.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{c.symbol.toUpperCase()}</span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text)' }}>{formatPrice(c.current_price)}</td>
                        <td style={{ textAlign: 'right', padding: '5px 8px', color: c.price_change_percentage_24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {c.price_change_percentage_24h >= 0 ? '+' : ''}{c.price_change_percentage_24h?.toFixed(2)}%
                        </td>
                        <td style={{ textAlign: 'right', padding: '5px 8px', color: (c.price_change_percentage_7d_in_currency || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {(c.price_change_percentage_7d_in_currency || 0) >= 0 ? '+' : ''}{(c.price_change_percentage_7d_in_currency || 0).toFixed(2)}%
                        </td>
                        <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{formatMcap(c.market_cap)}</td>
                        <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{formatMcap(c.total_volume)}</td>
                        <td style={{ textAlign: 'right', padding: '5px 8px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 6px', border: `1px solid ${sig.color}`, color: sig.color, letterSpacing: '0.06em' }}>{sig.label}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 11, flexShrink: 0 }}>⬡ CI·AI</span>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
                Market breadth analysis: {gainers} of {coins.length} assets positive in 24h. BTC dominance {coins.length > 0 ? ((coins[0]?.market_cap / totalMcap) * 100).toFixed(1) : '—'}% — capital rotating to safety.
                {dataSource === 'fallback' && <span style={{ color: 'var(--gold)' }}> Data may be delayed — live feed will resume when API is available.</span>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
