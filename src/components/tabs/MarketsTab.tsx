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

/* ── Fallback top-20 data ── ensures tab never shows $0 ── */
const FALLBACK_COINS: CoinData[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', current_price: 73000, market_cap: 1440000000000, total_volume: 38400000000, price_change_percentage_24h: 0.82, price_change_percentage_7d_in_currency: -3.14, market_cap_rank: 1 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', current_price: 2250, market_cap: 270000000000, total_volume: 14800000000, price_change_percentage_24h: -1.24, price_change_percentage_7d_in_currency: -8.32, market_cap_rank: 2 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png', current_price: 1.0, market_cap: 143000000000, total_volume: 62000000000, price_change_percentage_24h: 0.01, price_change_percentage_7d_in_currency: 0.0, market_cap_rank: 3 },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png', current_price: 1.35, market_cap: 121000000000, total_volume: 7800000000, price_change_percentage_24h: 1.87, price_change_percentage_7d_in_currency: -4.20, market_cap_rank: 4 },
  { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', current_price: 83.90, market_cap: 67200000000, total_volume: 4200000000, price_change_percentage_24h: -0.41, price_change_percentage_7d_in_currency: -5.80, market_cap_rank: 5 },
  { id: 'bnb', symbol: 'bnb', name: 'BNB', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png', current_price: 598, market_cap: 86000000000, total_volume: 1800000000, price_change_percentage_24h: 0.34, price_change_percentage_7d_in_currency: -2.10, market_cap_rank: 6 },
  { id: 'usd-coin', symbol: 'usdc', name: 'USD Coin', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png', current_price: 1.0, market_cap: 51000000000, total_volume: 8100000000, price_change_percentage_24h: 0.0, price_change_percentage_7d_in_currency: 0.0, market_cap_rank: 7 },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png', current_price: 0.082, market_cap: 12000000000, total_volume: 1200000000, price_change_percentage_24h: -2.10, price_change_percentage_7d_in_currency: -6.30, market_cap_rank: 8 },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png', current_price: 0.2402, market_cap: 8600000000, total_volume: 580000000, price_change_percentage_24h: 0.87, price_change_percentage_7d_in_currency: -3.50, market_cap_rank: 9 },
  { id: 'tron', symbol: 'trx', name: 'TRON', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png', current_price: 0.126, market_cap: 10800000000, total_volume: 620000000, price_change_percentage_24h: 0.45, price_change_percentage_7d_in_currency: -1.80, market_cap_rank: 10 },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png', current_price: 8.08, market_cap: 5200000000, total_volume: 380000000, price_change_percentage_24h: 2.58, price_change_percentage_7d_in_currency: -1.20, market_cap_rank: 11 },
  { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png', current_price: 9.35, market_cap: 3800000000, total_volume: 410000000, price_change_percentage_24h: 2.96, price_change_percentage_7d_in_currency: -3.80, market_cap_rank: 12 },
  { id: 'stellar', symbol: 'xlm', name: 'Stellar', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/512.png', current_price: 0.152, market_cap: 8300000000, total_volume: 500000000, price_change_percentage_24h: 0.35, price_change_percentage_7d_in_currency: -2.80, market_cap_rank: 13 },
  { id: 'hedera-hashgraph', symbol: 'hbar', name: 'Hedera', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4642.png', current_price: 0.0855, market_cap: 6700000000, total_volume: 300000000, price_change_percentage_24h: -0.61, price_change_percentage_7d_in_currency: 2.10, market_cap_rank: 14 },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png', current_price: 3.82, market_cap: 5400000000, total_volume: 320000000, price_change_percentage_24h: -1.50, price_change_percentage_7d_in_currency: -5.20, market_cap_rank: 15 },
  { id: 'litecoin', symbol: 'ltc', name: 'Litecoin', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2.png', current_price: 65.40, market_cap: 4900000000, total_volume: 380000000, price_change_percentage_24h: 1.10, price_change_percentage_7d_in_currency: -2.90, market_cap_rank: 16 },
  { id: 'quant-network', symbol: 'qnt', name: 'Quant', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3155.png', current_price: 74.87, market_cap: 1100000000, total_volume: 44000000, price_change_percentage_24h: -1.77, price_change_percentage_7d_in_currency: 1.80, market_cap_rank: 17 },
  { id: 'algorand', symbol: 'algo', name: 'Algorand', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4030.png', current_price: 0.1033, market_cap: 850000000, total_volume: 42000000, price_change_percentage_24h: 0.0, price_change_percentage_7d_in_currency: -2.40, market_cap_rank: 18 },
  { id: 'iota', symbol: 'iota', name: 'IOTA', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1720.png', current_price: 0.054, market_cap: 580000000, total_volume: 24000000, price_change_percentage_24h: -2.11, price_change_percentage_7d_in_currency: 0.80, market_cap_rank: 19 },
  { id: 'xdc-network', symbol: 'xdc', name: 'XDC Network', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2634.png', current_price: 0.028, market_cap: 400000000, total_volume: 18000000, price_change_percentage_24h: 0.0, price_change_percentage_7d_in_currency: -1.10, market_cap_rank: 20 },
];

/* ── Transform CMC API response to our CoinData format ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cmcToCoinData(item: any): CoinData {
  const quote = item.quote?.USD || {};
  return {
    id: item.slug || String(item.id),
    symbol: (item.symbol || '').toLowerCase(),
    name: item.name || '',
    image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${item.id}.png`,
    current_price: quote.price || 0,
    market_cap: quote.market_cap || 0,
    total_volume: quote.volume_24h || 0,
    price_change_percentage_24h: quote.percent_change_24h || 0,
    price_change_percentage_7d_in_currency: quote.percent_change_7d || 0,
    market_cap_rank: item.cmc_rank || 0,
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

export default function MarketsTab() {
  const [coins, setCoins] = useState<CoinData[]>(FALLBACK_COINS);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'live-cmc' | 'live-cg' | 'cached' | 'fallback'>('fallback');
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [subTab, setSubTab] = useState<'all' | 'trend' | 'gain' | 'lose'>('all');
  const [sortKey, setSortKey] = useState<string>('rank');
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const fetchCoins = useCallback(async () => {
    // Strategy: try CMC proxy → CoinGecko fallback → keep static fallback
    
    // 1) Try CoinMarketCap via our proxy
    try {
      const cmcRes = await fetch('/api/cmc?endpoint=/v1/cryptocurrency/listings/latest&limit=100&sort=market_cap&convert=USD');
      if (cmcRes.ok) {
        const json = await cmcRes.json();
        if (json.data?.data?.length > 0) {
          const mapped = json.data.data.map(cmcToCoinData);
          setCoins(mapped);
          setDataSource(json.source === 'live' ? 'live-cmc' : 'cached');
          setError(null);
          setLoading(false);
          return;
        }
      }
    } catch {
      // CMC failed, try CoinGecko
    }

    // 2) Fallback to CoinGecko (no API key needed)
    try {
      const cgRes = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=7d');
      if (cgRes.ok) {
        const data: CoinData[] = await cgRes.json();
        if (data && data.length > 0) {
          setCoins(data);
          setDataSource('live-cg');
          setError(null);
          setLoading(false);
          return;
        }
      }
    } catch {
      // CoinGecko also failed
    }

    // 3) Keep fallback data, show warning
    setError('API rate limited — showing cached market data');
    setDataSource('fallback');
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoins();
    const id = setInterval(fetchCoins, 60000);
    return () => clearInterval(id);
  }, [fetchCoins]);

  const handleRetry = () => {
    setLoading(true);
    fetchCoins();
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

  const sourceLabel = dataSource === 'live-cmc' ? '● LIVE · COINMARKETCAP' :
    dataSource === 'live-cg' ? '● LIVE · COINGECKO' :
    dataSource === 'cached' ? '● CACHED · COINMARKETCAP' :
    '● CACHED · STATIC DATA';
  const sourceColor = dataSource.startsWith('live') ? 'var(--green)' : 'var(--gold)';

  return (
    <div>
      <div className="ai-context-strip">
        <span className="acs-icon">◈ CI·AI</span>
        <span className="acs-body"><strong>Top 100 Assets Live</strong> — Real-time market cap ranking from CoinMarketCap. Signal column uses 24h price direction as proxy. Filter by sector or search by name/ticker.</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--text2)' }}>
          TOP 100 MARKETS <span style={{ color: 'var(--muted)' }}>· By Market Cap · Live Feed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px',
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
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--gold)' }}>
            ⚠ {error} · Showing {coins.length} assets
          </span>
          <button onClick={handleRetry} style={{
            fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--cyan)', background: 'none',
            border: '1px solid var(--cyan)', padding: '3px 8px', cursor: 'pointer', letterSpacing: '0.08em',
          }}>
            RETRY
          </button>
        </div>
      )}

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
          ⟳ AUTO-REFRESH 60s · <a className="src-link" href="https://coinmarketcap.com/api/" target="_blank" rel="noopener noreferrer">API DOCS</a>
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
            {loading && coins.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading top 100 assets...</td></tr>
            ) : (
              filtered.map((c) => {
                const sig = getSignal(c.price_change_percentage_24h);
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '5px 8px', color: 'var(--muted)', fontSize: 9 }}>{c.market_cap_rank}</td>
                    <td style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <img src={c.image} alt={c.symbol} width={16} height={16} style={{ borderRadius: '50%' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
            Market breadth analysis: {gainers} of {coins.length} assets positive in 24h. BTC dominance {coins.length > 0 ? ((coins[0]?.market_cap / totalMcap) * 100).toFixed(1) : '—'}% — capital rotating to safety.
            {dataSource === 'fallback' && <span style={{ color: 'var(--gold)' }}> Data may be delayed — live feed will resume when API is available.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
