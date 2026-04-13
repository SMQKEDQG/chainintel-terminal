'use client';

import { useState, useEffect } from 'react';

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

function formatPrice(n: number) {
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1) return '$' + n.toFixed(2);
  return '$' + n.toFixed(4);
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

export default function MarketsTab() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subTab, setSubTab] = useState<'all' | 'trend' | 'gain' | 'lose'>('all');
  const [sortKey, setSortKey] = useState<string>('rank');
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  useEffect(() => {
    async function fetchCoins() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=7d');
        if (!res.ok) return;
        const data: CoinData[] = await res.json();
        setCoins(data);
      } catch {} finally { setLoading(false); }
    }
    fetchCoins();
    const id = setInterval(fetchCoins, 60000);
    return () => clearInterval(id);
  }, []);

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

  if (sortKey === 'price') filtered.sort((a, b) => (b.current_price - a.current_price) * sortDir);
  if (sortKey === 'change24h') filtered.sort((a, b) => (b.price_change_percentage_24h - a.price_change_percentage_24h) * sortDir);
  if (sortKey === 'marketCap') filtered.sort((a, b) => (b.market_cap - a.market_cap) * sortDir);
  if (sortKey === 'volume') filtered.sort((a, b) => (b.total_volume - a.total_volume) * sortDir);

  const subTabs = [
    { id: 'all' as const, label: 'ALL ASSETS' },
    { id: 'trend' as const, label: 'TRENDING' },
    { id: 'gain' as const, label: 'TOP GAINERS' },
    { id: 'lose' as const, label: 'TOP LOSERS' },
  ];

  return (
    <div>
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body"><strong>Top 100 Assets Live</strong> — Real-time market cap ranking from CoinGecko. Signal column uses 24h price direction as proxy. Filter by sector or search by name/ticker.</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--text2)' }}>
          TOP 100 MARKETS <span style={{ color: 'var(--muted)' }}>· By Market Cap · Live CoinGecko Feed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>Updated just now</span>
          <a className="src-link" href="https://coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko</a>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--b2)', marginBottom: 10 }}>
        {subTabs.map(t => (
          <div key={t.id} onClick={() => setSubTab(t.id)} style={{
            fontFamily: 'var(--mono)', fontSize: 8, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.1em',
            borderBottom: `2px solid ${subTab === t.id ? 'var(--blue)' : 'transparent'}`,
            color: subTab === t.id ? 'var(--blue)' : 'var(--muted)',
          }}>{t.label}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        <div className="panel" style={{ padding: '10px 14px' }}>
          <div className="oc-lbl">Total Market Cap</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: 'var(--cyan)' }}>{formatMcap(totalMcap)}</div>
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ticker..."
          style={{ background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 10px', outline: 'none', flex: 1, maxWidth: 280 }} />
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', marginLeft: 'auto' }}>
          ⟳ AUTO-REFRESH 60s · <a className="src-link" href="https://coingecko.com/en/api" target="_blank" rel="noopener noreferrer">API DOCS</a>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--b2)' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em', cursor: 'pointer' }} onClick={() => handleSort('rank')}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em' }}>ASSET</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 9, cursor: 'pointer' }} onClick={() => handleSort('price')}>PRICE ▾</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 9, cursor: 'pointer' }} onClick={() => handleSort('change24h')}>24H %</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 9 }}>7D %</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 9, cursor: 'pointer' }} onClick={() => handleSort('marketCap')}>MCAP</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 9, cursor: 'pointer' }} onClick={() => handleSort('volume')}>VOL 24H</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 9 }}>SIGNAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading top 100 assets from CoinGecko...</td></tr>
            ) : (
              filtered.map((c, i) => {
                const sig = getSignal(c.price_change_percentage_24h);
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '5px 8px', color: 'var(--muted)', fontSize: 9 }}>{c.market_cap_rank}</td>
                    <td style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <img src={c.image} alt={c.symbol} width={16} height={16} style={{ borderRadius: '50%' }} />
                      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{c.name}</span>
                      <span style={{ fontSize: 8, color: 'var(--muted)' }}>{c.symbol.toUpperCase()}</span>
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
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px', border: `1px solid ${sig.color}`, color: sig.color, letterSpacing: '0.06em' }}>{sig.label}</span>
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
          <span style={{ color: 'var(--cyan)', fontFamily: 'var(--mono)', fontSize: 9, flexShrink: 0 }}>⬡ CI·AI</span>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.6 }}>
            Market breadth analysis: {gainers} of 100 assets positive in 24h. BTC dominance {coins.length > 0 ? ((coins[0]?.market_cap / totalMcap) * 100).toFixed(1) : '—'}% — capital rotating to safety.
          </div>
        </div>
      </div>
    </div>
  );
}
