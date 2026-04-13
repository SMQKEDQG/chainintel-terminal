'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

const BTC_DATASETS: Record<string, { labels: string[]; prices: number[]; vols: number[] }> = {
  btc30: { labels: ['Mar 10','Mar 13','Mar 16','Mar 19','Mar 22','Mar 25','Mar 28','Mar 31','Apr 3','Apr 6','Apr 9'], prices: [82000,79000,76000,74000,71000,73000,75000,74000,72000,73200,73000], vols: [38,35,42,39,44,41,36,38,40,37,38] },
  btc90: { labels: ['Jan 9','Jan 23','Feb 6','Feb 20','Mar 6','Mar 20','Apr 3','Apr 9'], prices: [95000,88000,84000,80000,76000,74000,72000,73000], vols: [50,48,44,42,40,38,37,38] },
  btc1y: { labels: ['Apr 25','Jun 25','Aug 25','Oct 25','Dec 25','Feb 26','Apr 26'], prices: [63000,68000,72000,81000,96000,84000,73000], vols: [30,34,36,42,55,48,38] },
};

function buildBtcData(key: string) {
  const d = BTC_DATASETS[key];
  return {
    labels: d.labels,
    datasets: [
      { type: 'bar' as const, label: 'Volume ($B)', data: d.vols, backgroundColor: 'rgba(59,130,246,0.35)', borderColor: 'transparent', yAxisID: 'vol', order: 2 },
      { type: 'line' as const, label: 'Price ($)', data: d.prices, borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.08)', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true, yAxisID: 'price', order: 1 },
    ],
  };
}

const BTC_CHART_OPTS: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
  scales: {
    price: { type: 'linear', position: 'left', grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#4a6a8c', font: { size: 9 }, callback: (v: any) => `$${(v/1000).toFixed(0)}K` } },
    vol: { type: 'linear', position: 'right', grid: { display: false }, ticks: { color: '#4a6a8c', font: { size: 9 }, callback: (v: any) => `$${v}B` } },
    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#4a6a8c', font: { size: 9 } } },
  },
};

function BtcChart() {
  const [tf, setTf] = useState<'btc30' | 'btc90' | 'btc1y'>('btc30');
  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">BTC Price &amp; Volume — 90 Day</div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div className="tf-toggle">
            {(['btc30','btc90','btc1y'] as const).map((t, i) => (
              <div key={t} className={`tf-btn${tf === t ? ' active' : ''}`} onClick={() => setTf(t)} style={{ cursor: 'pointer' }}>{['30D','90D','1Y'][i]}</div>
            ))}
          </div>
          <div className="tag tag-live"><a className="src-link" href="https://coingecko.com" target="_blank" rel="noreferrer">CoinGecko</a></div>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: '145px' }}>
        <Bar id="btcChart" data={buildBtcData(tf) as any} options={BTC_CHART_OPTS} />
      </div>
    </div>
  );
}

/* ── AI Context Strip ── */
function AiStrip({ body }: { body: string }) {
  return (
    <div className="ai-context-strip">
      <span className="acs-icon">◈ CI·AI</span>
      <span className="acs-body" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}

/* ── Quick Guide ── */
function QuickGuide() {
  const [open, setOpen] = useState(true);
  const items = [
    { label: 'Fear & Greed (0–100)', text: '13 = Extreme Fear. Historically, fear extremes are where institutional accumulation happens quietly.' },
    { label: 'Exchange Outflows', text: 'Coins leaving exchanges = going to cold storage = holders not selling. Bullish long-term signal.' },
    { label: 'MVRV Ratio', text: 'Market Value / Realized Value. Below 2.4 = no top risk. Above 3.7 = historically overbought.' },
    { label: 'ETF Net Flows', text: 'Daily institutional money moving in/out of Bitcoin ETFs. 4+ day inflow streaks = accumulation signal.' },
    { label: 'ISO 20022', text: 'Global bank messaging standard replacing SWIFT. Assets on ISO-native ledgers get direct bank integration advantage.' },
    { label: 'Signal: BUY/HOLD/WATCH', text: 'ChainIntel composite: on-chain health + regulatory status + ETF momentum. Not financial advice.' },
  ];
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', marginBottom: 8 }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.1em', color: 'var(--muted)' }}>
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
        HOW TO READ THIS DASHBOARD — BEGINNER GUIDE
      </div>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 14px 12px' }}>
          {items.map(it => (
            <div key={it.label} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', padding: '8px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.1em', color: 'var(--cyan)', marginBottom: 4 }}>{it.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)', lineHeight: 1.5 }}>{it.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── AI Morning Brief ── */
function MorningBrief() {
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid rgba(0,212,170,0.15)', padding: '12px 14px', position: 'relative', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.08em', fontWeight: 600 }}>⬡ CI·AI</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.12em', color: 'var(--text2)' }}>MORNING INTELLIGENCE BRIEF</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>Apr 10, 2026</span>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', animation: 'pulse 2s infinite' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px', border: '1px solid rgba(240,192,64,0.3)', color: 'var(--gold)', letterSpacing: '0.08em' }}>CAUTIOUSLY BULLISH</span>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--cyan)', marginBottom: 8, letterSpacing: '-0.01em' }}>
        BTC $73K · Extreme Fear 13 · Institutional accumulation confirmed · 4 ETF inflow days
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--green)', letterSpacing: '0.12em', marginBottom: 4 }}>▲ BULLISH</div>
          <div style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--text)' }}>BlackRock IBIT +$224M — 4th consecutive inflow day. 7-day net +$1.04B. Institutions buying into Extreme Fear.</div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--red)', letterSpacing: '0.12em', marginBottom: 4 }}>▼ WATCH</div>
          <div style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--text)' }}>ETH down 8.32% over 7 days. DeFi TVL fell 2.1%. No confirmed altcoin recovery yet — BTC dominance rising to 63%.</div>
        </div>
        <div style={{ background: 'rgba(240,192,64,0.05)', border: '1px solid rgba(240,192,64,0.12)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--gold)', letterSpacing: '0.12em', marginBottom: 4 }}>◈ KEY CATALYST</div>
          <div style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--text)' }}>CLARITY Act advancing — Senate Banking Committee vote scheduled. First SEC/CFTC joint framework for digital assets targeting Q2 2026.</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--b2)', paddingTop: 8, marginTop: 4 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 6 }}>RECENT REPORTS — FREE SOURCES</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Glassnode: BTC on-chain →', href: 'https://insights.glassnode.com' },
            { label: 'CoinGecko: Weekly report →', href: 'https://www.coingecko.com/research' },
            { label: 'DeFiLlama: TVL flows →', href: 'https://defillama.com' },
            { label: 'Messari: Protocol analysis →', href: 'https://messari.io/research' },
            { label: 'CryptoQuant: Whale flows →', href: 'https://cryptoquant.com' },
          ].map(s => (
            <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: 'var(--s2)', border: '1px solid var(--b2)', padding: '3px 8px', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)' }}>{s.label}</a>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 8, right: 8, fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 2 }}>DEMO DATA · Pro unlocks real-time AI analysis</div>
    </div>
  );
}

/* ── Ask CI ── */
function AskCI() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const chips = ['BTC outlook', 'ETF flows today', 'What does fear and greed 13 mean?', 'SOL target', 'Whale activity', 'Stablecoins'];

  const handleAsk = useCallback(() => {
    if (!query.trim()) return;
    setResponse(`⬡ CI·AI analyzing "${query}"... This feature requires Pro subscription for real-time AI analysis. Demo response: Based on current on-chain metrics and market structure, the indicators suggest a cautiously bullish outlook with accumulation signals from institutional players.`);
  }, [query]);

  return (
    <div style={{ background: 'var(--b1)', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--s1)', border: '1px solid var(--b2)' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cyan)', padding: '0 10px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>ASK CI&gt;</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask anything: 'BTC price target?' · 'Explain MVRV' · 'Best ISO 20022 asset?'"
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 11, padding: '8px 0', outline: 'none' }}
        />
        <button onClick={handleAsk} style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: 'var(--cyan)', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.12em', padding: '6px 14px', cursor: 'pointer', margin: 4 }}>ANALYZE</button>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '4px 8px', background: 'var(--s1)' }}>
        {chips.map(c => (
          <button key={c} onClick={() => { setQuery(c); }} style={{ background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 8, padding: '3px 8px', cursor: 'pointer' }}>{c}</button>
        ))}
      </div>
      {response && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.6 }}>{response}</div>
      )}
    </div>
  );
}

/* ── KPI Card ── */
function KPI({ label, value, change, changeDir, source, color }: { label: string; value: string; change: string; changeDir: 'up' | 'dn' | 'neutral'; source: string; color?: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-val" style={{ color: color || 'var(--cyan)' }}>{value}</div>
      <div className={`kpi-chg ${changeDir}`}>{change}</div>
      <div className="kpi-src" dangerouslySetInnerHTML={{ __html: source }} />
    </div>
  );
}

/* ── Sector Heat Row ── */
function SectorHeat() {
  const cells = [
    { label: 'ALTCOIN SEASON', val: '32', sub: '/100', color: 'var(--gold)', bar: 32 },
    { label: 'TOP SECTOR · 24H', val: 'RWA +4.2%', sub: 'Real World Assets', color: 'var(--green)' },
    { label: 'WORST SECTOR · 24H', val: 'DeFi −3.1%', sub: 'Decentralized Finance', color: 'var(--red)' },
    { label: 'STABLECOIN SUPPLY', val: '$243.2B', sub: '+$4.2B 30d · INFLOW', color: 'var(--cyan)' },
    { label: 'PERP FUNDING (BTC)', val: '−0.004%', sub: 'Shorts paying · squeeze risk', color: 'var(--gold)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: 'var(--b1)', marginBottom: 1 }}>
      {cells.map(c => (
        <div key={c.label} style={{ background: 'var(--s1)', padding: '7px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>{c.label}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: c.bar !== undefined ? 14 : 10, fontWeight: 700, color: c.color }}>
            {c.val}{c.bar !== undefined && <span style={{ fontSize: 9, color: 'var(--muted)' }}>{c.sub}</span>}
          </div>
          {c.bar !== undefined ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ width: 60, height: 6, background: 'var(--b3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${c.bar}%`, height: 6, background: c.color, borderRadius: 3 }} />
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)' }}>{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Heatmap ── */
function Heatmap() {
  const coins = [
    { sym: 'BTC', chg: 0.82, size: 5 }, { sym: 'ETH', chg: -1.24, size: 4 }, { sym: 'XRP', chg: 1.87, size: 3.5 },
    { sym: 'SOL', chg: -0.41, size: 3 }, { sym: 'HBAR', chg: 1.44, size: 2 }, { sym: 'ADA', chg: -2.1, size: 2 },
    { sym: 'AVAX', chg: -3.8, size: 1.8 }, { sym: 'LINK', chg: 0.92, size: 1.8 }, { sym: 'DOT', chg: -1.5, size: 1.5 },
    { sym: 'QNT', chg: 2.31, size: 1.2 }, { sym: 'ALGO', chg: -0.8, size: 1 }, { sym: 'XLM', chg: -0.62, size: 1.3 },
  ];
  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">Market Heatmap — 24h Performance</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>▪ size = market cap</span>
          <div className="tag tag-live">Live · <a className="src-link" href="https://coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko</a></div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
        {coins.map(c => (
          <div key={c.sym} style={{
            background: c.chg >= 0 ? `rgba(16,185,129,${0.06 + Math.abs(c.chg) * 0.04})` : `rgba(239,68,68,${0.06 + Math.abs(c.chg) * 0.04})`,
            border: `1px solid ${c.chg >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            padding: '8px 6px',
            textAlign: 'center',
            gridRow: c.size >= 4 ? 'span 2' : undefined,
            gridColumn: c.size >= 5 ? 'span 2' : undefined,
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: 'var(--text)' }}>{c.sym}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: c.chg >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {c.chg >= 0 ? '+' : ''}{c.chg.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ETF Flows ── */
function ETFFlows() {
  const flows = [
    { name: 'iShares Bitcoin Trust', issuer: 'BLACKROCK · IBIT', flow: '+$224.1M', up: true },
    { name: 'Wise Origin Bitcoin', issuer: 'FIDELITY · FBTC', flow: '+$88.3M', up: true },
    { name: 'ARK 21Shares Bitcoin', issuer: 'ARK INVEST · ARKB', flow: '+$31.2M', up: true },
    { name: 'Bitwise Bitcoin ETF', issuer: 'BITWISE · BITB', flow: '+$18.4M', up: true },
    { name: 'Grayscale Bitcoin Trust', issuer: 'GRAYSCALE · GBTC', flow: '−$174.0M', up: false },
  ];
  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">Bitcoin ETF Daily Flows</div>
        <div className="tag tag-live"><a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noopener noreferrer">Farside Investors</a></div>
      </div>
      {flows.map(f => (
        <div key={f.issuer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid var(--b1)' }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text)' }}>{f.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', letterSpacing: '0.08em' }}>{f.issuer}</div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: f.up ? 'var(--green)' : 'var(--red)' }}>{f.flow}</div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,212,170,0.04)', borderTop: '1px solid var(--b2)' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '0.08em' }}>Net Flow Today · All BTC ETFs</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>+$169.6M</span>
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--b1)', background: 'rgba(0,212,170,0.02)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--cyan)', letterSpacing: '0.06em', marginBottom: 4 }}>⬡ AI Correlation Signal</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)', lineHeight: 1.5 }}>
          4 consecutive inflow days with <strong>Extreme Fear (13 out of 100)</strong> — historically, this pattern preceded +22% BTC returns within 45 days (2023 precedent). GBTC rotation into IBIT confirms institutional preference for lower-fee products, not a sector exit.
        </div>
      </div>
    </div>
  );
}

/* ── ChainScore ── */
function ChainScore() {
  const scores = [
    { rank: '01', name: 'Bitcoin', sym: 'BTC', score: 92 },
    { rank: '02', name: 'Ethereum', sym: 'ETH', score: 87 },
    { rank: '03', name: 'XRP', sym: 'XRP', score: 79 },
    { rank: '04', name: 'HBAR', sym: 'HBAR', score: 74 },
    { rank: '05', name: 'QNT', sym: 'QNT', score: 71 },
    { rank: '06', name: 'Solana', sym: 'SOL', score: 68 },
    { rank: '07', name: 'XLM / Stellar', sym: 'XLM', score: 64 },
  ];
  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">ChainScore™ — Top Rated</div>
        <div className="tag" style={{ background: 'rgba(0,212,170,0.08)', color: 'var(--cyan)' }}>Methodology v1.0</div>
      </div>
      {scores.map(s => (
        <div key={s.sym} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderBottom: '1px solid var(--b1)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', width: 20 }}>{s.rank}</span>
          <div style={{ flex: '0 0 90px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text)' }}>{s.name}</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)' }}>{s.sym}</span>
          </div>
          <div style={{ flex: 1, height: 6, background: 'var(--b3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${s.score}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--blue))', borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--cyan)', width: 30, textAlign: 'right' }}>{s.score}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Market Table ── */
function MarketTable() {
  const assets = [
    { rank: 1, name: 'Bitcoin', sym: 'BTC', price: '$73,000', d1: '+0.82%', d7: '−3.14%', mcap: '$1.64T', vol: '$38.4B', signal: 'ACCUMULATE', sigColor: 'var(--green)' },
    { rank: 2, name: 'Ethereum', sym: 'ETH', price: '$2,210', d1: '−1.24%', d7: '−8.32%', mcap: '$190.2B', vol: '$14.8B', signal: 'HOLD', sigColor: 'var(--gold)' },
    { rank: 3, name: 'XRP', sym: 'XRP', price: '$1.32', d1: '+1.87%', d7: '−4.20%', mcap: '$121.0B', vol: '$7.8B', signal: 'ACCUMULATE', sigColor: 'var(--green)' },
    { rank: 4, name: 'Solana', sym: 'SOL', price: '$81.00', d1: '−0.41%', d7: '−5.80%', mcap: '$67.2B', vol: '$4.2B', signal: 'HOLD', sigColor: 'var(--gold)' },
    { rank: 5, name: 'HBAR', sym: 'HBAR', price: '$0.170', d1: '+1.44%', d7: '+2.10%', mcap: '$6.7B', vol: '$0.3B', signal: 'ACCUMULATE', sigColor: 'var(--green)' },
    { rank: 6, name: 'QNT', sym: 'QNT', price: '$88.00', d1: '+2.31%', d7: '+1.80%', mcap: '$1.1B', vol: '$44M', signal: 'HOLD', sigColor: 'var(--gold)' },
    { rank: 7, name: 'XLM / Stellar', sym: 'XLM', price: '$0.270', d1: '−0.62%', d7: '−2.8%', mcap: '$8.3B', vol: '$0.5B', signal: 'WATCH', sigColor: 'var(--muted)' },
    { rank: 8, name: 'IOTA', sym: 'IOTA', price: '$0.210', d1: '+1.14%', d7: '+0.8%', mcap: '$0.58B', vol: '$24M', signal: 'HOLD', sigColor: 'var(--gold)' },
  ];
  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">Top Assets by Market Cap</div>
        <div className="tag tag-live">Live · <a className="src-link" href="https://coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko</a></div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--b2)' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8, letterSpacing: '0.1em' }}>#</th>
            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontSize: 8, letterSpacing: '0.1em' }}>ASSET</th>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>PRICE</th>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>24H</th>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>7D</th>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>MCAP</th>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>VOL 24H</th>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontSize: 8 }}>SIGNAL</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(a => (
            <tr key={a.sym} style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
              <td style={{ padding: '5px 8px', color: 'var(--muted)', fontSize: 9 }}>{a.rank}</td>
              <td style={{ padding: '5px 8px' }}>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{a.name}</span>
                <span style={{ marginLeft: 6, fontSize: 8, color: 'var(--muted)' }}>{a.sym}</span>
              </td>
              <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text)' }}>{a.price}</td>
              <td style={{ textAlign: 'right', padding: '5px 8px', color: a.d1.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>{a.d1}</td>
              <td style={{ textAlign: 'right', padding: '5px 8px', color: a.d7.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>{a.d7}</td>
              <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{a.mcap}</td>
              <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{a.vol}</td>
              <td style={{ textAlign: 'right', padding: '5px 8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px', border: `1px solid ${a.sigColor}`, color: a.sigColor, letterSpacing: '0.06em' }}>
                  {a.signal}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Whale Feed ── */
function WhaleFeed() {
  const whales = [
    { dir: 'BUY', amt: '$48.2M', asset: '12,456 ETH', route: 'Unknown → Binance', age: '2m ago', color: 'var(--green)' },
    { dir: 'XFER', amt: '$122.4M', asset: '1,400 BTC', route: 'Cold wallet → Cold wallet', age: '7m ago', color: 'var(--blue)' },
    { dir: 'SELL', amt: '$31.8M', asset: '22.4M XRP', route: 'Kraken → Unknown', age: '12m ago', color: 'var(--red)' },
    { dir: 'BUY', amt: '$89.6M', asset: '1,024 BTC', route: 'Unknown → Coinbase Pro', age: '19m ago', color: 'var(--green)' },
  ];
  return (
    <>
      <div className="ph" style={{ marginTop: 8 }}><div className="pt">Live Whale Alerts</div><div className="tag" style={{ background: 'rgba(0,212,170,0.08)', color: 'var(--cyan)' }}>Whale Alert API</div></div>
      {whales.map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', borderBottom: '1px solid var(--b1)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, color: w.color, padding: '2px 6px', border: `1px solid ${w.color}`, letterSpacing: '0.06em', width: 36, textAlign: 'center' }}>{w.dir}</span>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{w.amt}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text2)' }}>{w.asset}</div>
          </div>
          <div style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)' }}>{w.route}</div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>{w.age}</span>
        </div>
      ))}
    </>
  );
}

/* ── Bloomberg Callout ── */
function BloombergCallout() {
  const features = ['On-chain analytics', 'Top 100 live prices', 'Whale surveillance', 'DeFi intelligence', 'ISO 20022 tracking', 'AI synthesis layer'];
  return (
    <div style={{ margin: '12px 0 0', background: 'linear-gradient(90deg,rgba(239,68,68,0.06),rgba(59,130,246,0.06))', border: '1px solid rgba(59,130,246,0.15)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.14em', color: 'var(--blue)', flexShrink: 0 }}>BLOOMBERG CANNOT DO THIS ↓</span>
      {features.map(f => (
        <span key={f} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text2)' }}>{f} <span style={{ color: 'var(--red)' }}>✗ Bloomberg</span></span>
      ))}
      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)', marginLeft: 'auto', flexShrink: 0 }}>Bloomberg: $24K–$32K/yr · ChainIntel: from $0</span>
    </div>
  );
}

/* ── MAIN OVERVIEW TAB ── */
export default function OverviewTab() {
  return (
    <div>
      <AiStrip body='Market at <strong>Extreme Fear (13/100)</strong> — historically a contrarian accumulation signal. 4 consecutive ETF inflow days (+$169.6M today) while retail sentiment is maximally negative. <strong>Smart money and retail are diverging.</strong>' />
      <QuickGuide />
      <MorningBrief />
      <AskCI />

      <div className="g4" style={{ marginTop: 8 }}>
        <KPI label="Total Market Cap" value="$2.65T" change="+$18.4B today · +0.64%" changeDir="up" color="var(--gold)" source='<a class="src-link" href="https://coingecko.com" target="_blank">CoinGecko</a> · <a class="src-link" href="https://coinmarketcap.com" target="_blank">CoinMarketCap</a>' />
        <KPI label="BTC Dominance" value="63.0%" change="+0.8% vs yesterday — rising" changeDir="up" source='<a class="src-link" href="https://coingecko.com" target="_blank">CoinGecko</a> API' />
        <KPI label="Fear & Greed Index" value="13" change="Extreme Fear (13/100) · Historic low" changeDir="dn" color="var(--red)" source='<a class="src-link" href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank">Fear &amp; Greed Index</a>' />
        <KPI label="Total DeFi TVL" value="$85.0B" change="−2.1% in 24h · 6,400+ protocols" changeDir="dn" source='<a class="src-link" href="https://defillama.com" target="_blank">DefiLlama</a>' />
      </div>

      <SectorHeat />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--b1)', marginBottom: 1 }}>
        <Heatmap />
        <BtcChart />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--b1)', marginBottom: 1 }}>
        <MarketTable />
        <ETFFlows />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--b1)', marginBottom: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <ChainScore />
        </div>
        <div className="panel">
          <div className="ph"><div className="pt">AI Market Synthesis</div><div className="tag" style={{ background: 'rgba(0,212,170,0.08)', color: 'var(--cyan)' }}>ChainIntel AI</div></div>
          <div style={{ padding: '0 12px 8px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Bitcoin holding $73K at Extreme Fear (13/100).</strong> Price stability against capitulation-level sentiment historically precedes 8–15% bounces. ETF flows constructive: IBIT +$224M, net +$169.6M, 4th consecutive inflow day. Exchange reserves −42,800 BTC in 30 days. LTH supply at 74.8%. <strong style={{ color: 'var(--text)' }}>Setup cautiously bullish for 90+ day horizon.</strong>
          </div>
          <WhaleFeed />
        </div>
      </div>



      <BloombergCallout />
    </div>
  );
}
