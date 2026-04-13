'use client';

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, PointElement, LineElement, LineController, Tooltip, Legend, Filler);

/* ── CMC shared data context (single API call powers KPI, Heatmap, MarketTable) ── */
interface CmcCoin {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  price: number;
  market_cap: number;
  volume_24h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  image: string;
}

interface CmcGlobal {
  total_market_cap: number;
  total_volume_24h: number;
  btc_dominance: number;
  eth_dominance: number;
  active_cryptocurrencies: number;
  total_market_cap_yesterday_percentage_change: number;
}

interface CmcData {
  coins: CmcCoin[];
  global: CmcGlobal | null;
  source: 'live' | 'cached' | 'coingecko' | 'static';
  loading: boolean;
}

const CmcContext = createContext<CmcData>({
  coins: [],
  global: null,
  source: 'static',
  loading: true,
});

/* Transform CMC listings response into our CmcCoin format */
function cmcListingsToCoinData(data: any[]): CmcCoin[] {
  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    symbol: (c.symbol as string).toUpperCase(),
    slug: c.slug,
    cmc_rank: c.cmc_rank,
    price: c.quote?.USD?.price ?? 0,
    market_cap: c.quote?.USD?.market_cap ?? 0,
    volume_24h: c.quote?.USD?.volume_24h ?? 0,
    percent_change_24h: c.quote?.USD?.percent_change_24h ?? 0,
    percent_change_7d: c.quote?.USD?.percent_change_7d ?? 0,
    image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${c.id}.png`,
  }));
}

/* Transform CoinGecko /coins/markets response */
function geckoToCoinData(data: any[]): CmcCoin[] {
  return data.map((c: any, i: number) => ({
    id: i,
    name: c.name,
    symbol: (c.symbol as string).toUpperCase(),
    slug: c.id,
    cmc_rank: c.market_cap_rank ?? i + 1,
    price: c.current_price ?? 0,
    market_cap: c.market_cap ?? 0,
    volume_24h: c.total_volume ?? 0,
    percent_change_24h: c.price_change_percentage_24h ?? 0,
    percent_change_7d: c.price_change_percentage_7d_in_currency ?? 0,
    image: c.image ?? '',
  }));
}

/* Static fallback data */
const FALLBACK_COINS: CmcCoin[] = [
  { id: 1, name: 'Bitcoin', symbol: 'BTC', slug: 'bitcoin', cmc_rank: 1, price: 73000, market_cap: 1.44e12, volume_24h: 38.4e9, percent_change_24h: 0.82, percent_change_7d: -3.14, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
  { id: 1027, name: 'Ethereum', symbol: 'ETH', slug: 'ethereum', cmc_rank: 2, price: 2210, market_cap: 2.7e11, volume_24h: 14.8e9, percent_change_24h: -1.24, percent_change_7d: -8.32, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
  { id: 52, name: 'XRP', symbol: 'XRP', slug: 'xrp', cmc_rank: 3, price: 1.32, market_cap: 1.21e11, volume_24h: 7.8e9, percent_change_24h: 1.87, percent_change_7d: -4.2, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png' },
  { id: 5426, name: 'Solana', symbol: 'SOL', slug: 'solana', cmc_rank: 4, price: 81, market_cap: 6.72e10, volume_24h: 4.2e9, percent_change_24h: -0.41, percent_change_7d: -5.8, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' },
  { id: 1839, name: 'BNB', symbol: 'BNB', slug: 'bnb', cmc_rank: 5, price: 560, market_cap: 8.2e10, volume_24h: 1.8e9, percent_change_24h: 0.34, percent_change_7d: -1.2, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png' },
  { id: 74, name: 'Dogecoin', symbol: 'DOGE', slug: 'dogecoin', cmc_rank: 6, price: 0.082, market_cap: 1.2e10, volume_24h: 0.8e9, percent_change_24h: -0.9, percent_change_7d: -6.1, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png' },
  { id: 2010, name: 'Cardano', symbol: 'ADA', slug: 'cardano', cmc_rank: 7, price: 0.41, market_cap: 1.5e10, volume_24h: 0.5e9, percent_change_24h: -2.1, percent_change_7d: -5.4, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png' },
  { id: 4687, name: 'HBAR', symbol: 'HBAR', slug: 'hedera', cmc_rank: 8, price: 0.17, market_cap: 6.7e9, volume_24h: 0.3e9, percent_change_24h: 1.44, percent_change_7d: 2.1, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4687.png' },
  { id: 1975, name: 'Chainlink', symbol: 'LINK', slug: 'chainlink', cmc_rank: 9, price: 12.5, market_cap: 7.8e9, volume_24h: 0.6e9, percent_change_24h: 0.92, percent_change_7d: -2.1, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png' },
  { id: 5805, name: 'Avalanche', symbol: 'AVAX', slug: 'avalanche', cmc_rank: 10, price: 22, market_cap: 9e9, volume_24h: 0.4e9, percent_change_24h: -3.8, percent_change_7d: -7.2, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png' },
  { id: 3890, name: 'Polkadot', symbol: 'DOT', slug: 'polkadot', cmc_rank: 11, price: 4.2, market_cap: 5.9e9, volume_24h: 0.3e9, percent_change_24h: -1.5, percent_change_7d: -4.8, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png' },
  { id: 3408, name: 'Quant', symbol: 'QNT', slug: 'quant', cmc_rank: 12, price: 88, market_cap: 1.1e9, volume_24h: 44e6, percent_change_24h: 2.31, percent_change_7d: 1.8, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png' },
  { id: 512, name: 'Stellar', symbol: 'XLM', slug: 'stellar', cmc_rank: 13, price: 0.27, market_cap: 8.3e9, volume_24h: 0.5e9, percent_change_24h: -0.62, percent_change_7d: -2.8, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/512.png' },
  { id: 4030, name: 'Algorand', symbol: 'ALGO', slug: 'algorand', cmc_rank: 14, price: 0.18, market_cap: 1.3e9, volume_24h: 60e6, percent_change_24h: -0.8, percent_change_7d: -3.2, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4030.png' },
  { id: 1720, name: 'IOTA', symbol: 'IOTA', slug: 'iota', cmc_rank: 15, price: 0.21, market_cap: 0.58e9, volume_24h: 24e6, percent_change_24h: 1.14, percent_change_7d: 0.8, image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1720.png' },
];

const FALLBACK_GLOBAL: CmcGlobal = {
  total_market_cap: 2.65e12,
  total_volume_24h: 98.4e9,
  btc_dominance: 63.0,
  eth_dominance: 10.2,
  active_cryptocurrencies: 10200,
  total_market_cap_yesterday_percentage_change: 0.64,
};

function useCmcData(): CmcData {
  const [coins, setCoins] = useState<CmcCoin[]>(FALLBACK_COINS);
  const [global, setGlobal] = useState<CmcGlobal | null>(FALLBACK_GLOBAL);
  const [source, setSource] = useState<CmcData['source']>('static');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCmc() {
      try {
        // Try CMC proxy for listings
        const listingsRes = await fetch('/api/cmc?endpoint=/v1/cryptocurrency/listings/latest&limit=50&sort=market_cap&convert=USD');
        if (!listingsRes.ok) throw new Error('CMC listings failed');
        const listingsJson = await listingsRes.json();
        if (cancelled) return;

        const cmcCoins = cmcListingsToCoinData(listingsJson.data?.data || []);
        if (cmcCoins.length > 0) {
          setCoins(cmcCoins);
          setSource(listingsJson.source === 'live' ? 'live' : 'cached');
        } else {
          throw new Error('No CMC data returned');
        }

        // Also try global metrics
        try {
          const globalRes = await fetch('/api/cmc?endpoint=/v1/global-metrics/quotes/latest');
          if (globalRes.ok) {
            const globalJson = await globalRes.json();
            const gd = globalJson.data?.data;
            if (gd) {
              setGlobal({
                total_market_cap: gd.quote?.USD?.total_market_cap ?? FALLBACK_GLOBAL.total_market_cap,
                total_volume_24h: gd.quote?.USD?.total_volume_24h ?? FALLBACK_GLOBAL.total_volume_24h,
                btc_dominance: gd.btc_dominance ?? FALLBACK_GLOBAL.btc_dominance,
                eth_dominance: gd.eth_dominance ?? FALLBACK_GLOBAL.eth_dominance,
                active_cryptocurrencies: gd.active_cryptocurrencies ?? FALLBACK_GLOBAL.active_cryptocurrencies,
                total_market_cap_yesterday_percentage_change: gd.quote?.USD?.total_market_cap_yesterday_percentage_change ?? FALLBACK_GLOBAL.total_market_cap_yesterday_percentage_change,
              });
            }
          }
        } catch { /* global metrics failure is non-critical */ }

      } catch {
        // Fallback to CoinGecko
        if (cancelled) return;
        try {
          const geckoRes = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=7d');
          if (!geckoRes.ok) throw new Error('CoinGecko failed');
          const geckoData = await geckoRes.json();
          if (cancelled) return;
          const geckoCoins = geckoToCoinData(geckoData);
          if (geckoCoins.length > 0) {
            setCoins(geckoCoins);
            setSource('coingecko');
          }
        } catch {
          // Keep static fallback
          if (!cancelled) setSource('static');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCmc();
    const interval = setInterval(fetchCmc, 120_000); // refresh every 2 min
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { coins, global, source, loading };
}

/* ── Formatting helpers ── */
function fmtUsd(n: number, decimals = 2): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(decimals)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  return `$${n.toFixed(Math.max(4, decimals))}`;
}

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function sourceLabel(src: CmcData['source']): string {
  switch (src) {
    case 'live': return 'CMC Live';
    case 'cached': return 'CMC Cached';
    case 'coingecko': return 'CoinGecko';
    default: return 'Fallback';
  }
}
function sourceColor(src: CmcData['source']): string {
  return src === 'live' ? 'var(--green)' : src === 'cached' ? 'var(--gold)' : src === 'coingecko' ? 'var(--blue)' : 'var(--muted)';
}

/* ── Helpers for live chart data ── */
const TF_DAYS: Record<string, number> = { '30D': 30, '90D': 90, '1Y': 365 };
const TF_LABELS = ['30D', '90D', '1Y'] as const;
type TfKey = typeof TF_LABELS[number];

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')}`;
}

function downsample<T>(arr: T[], target: number): T[] {
  if (arr.length <= target) return arr;
  const step = Math.floor(arr.length / target);
  return arr.filter((_, i) => i % step === 0).slice(0, target);
}

function buildChartData(
  labels: string[],
  prices: number[],
  vols: number[],
  lineColor: string,
  lineFill: string,
) {
  return {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Volume ($B)',
        data: vols,
        backgroundColor: 'rgba(74,106,140,0.3)',
        borderColor: 'transparent',
        yAxisID: 'vol',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Price ($)',
        data: prices,
        borderColor: lineColor,
        backgroundColor: lineFill,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
        yAxisID: 'price',
        order: 1,
      },
    ],
  };
}

function makeChartOpts(priceLabel: string): any {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      price: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#4a6a8c',
          font: { size: 9 },
          callback: (v: any) =>
            v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`,
        },
        title: { display: false },
      },
      vol: {
        type: 'linear',
        position: 'right',
        grid: { display: false },
        ticks: {
          color: '#4a6a8c',
          font: { size: 9 },
          callback: (v: any) => `$${v.toFixed(0)}B`,
        },
      },
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#4a6a8c', font: { size: 9 } },
      },
    },
  };
}

interface LiveChartData {
  labels: string[];
  prices: number[];
  vols: number[];
}

/* ── Fallback static data so charts ALWAYS render ── */
const FALLBACK_BTC: LiveChartData = {
  labels: ['Mar 14','Mar 17','Mar 20','Mar 23','Mar 26','Mar 29','Apr 01','Apr 04','Apr 07','Apr 10','Apr 12','Apr 13','Apr 14'],
  prices: [81200,79800,83100,84500,82300,85600,87200,84900,78400,73200,71800,73300,73500],
  vols: [42.1,38.5,45.2,41.8,39.6,52.3,48.7,44.1,56.8,62.4,51.2,47.3,43.8],
};
const FALLBACK_ETH: LiveChartData = {
  labels: ['Mar 14','Mar 17','Mar 20','Mar 23','Mar 26','Mar 29','Apr 01','Apr 04','Apr 07','Apr 10','Apr 12','Apr 13','Apr 14'],
  prices: [1920,1880,1950,2010,1960,2040,2120,2080,1840,1720,1690,1750,1780],
  vols: [18.4,16.2,19.8,17.5,16.8,22.1,20.4,18.9,24.2,26.8,21.4,19.7,18.1],
};

async function fetchWithRetry(url: string, retries = 3, delay = 1500): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
      if (r.status === 429 && i < retries - 1) {
        await new Promise(res => setTimeout(res, delay * (i + 1)));
        continue;
      }
      throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
  throw new Error('Max retries');
}

function useLiveCoinChart(coinId: string) {
  const [tf, setTf] = useState<TfKey>('30D');
  const fallback = coinId === 'bitcoin' ? FALLBACK_BTC : FALLBACK_ETH;
  const [data, setData] = useState<LiveChartData>(fallback);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const days = TF_DAYS[tf];
    fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
    )
      .then(r => r.json())
      .then((json: { prices: [number, number][]; total_volumes: [number, number][] }) => {
        if (cancelled) return;
        const TARGET = 13;
        const rawPrices = json.prices;
        const rawVols = json.total_volumes;
        const sampled = downsample(rawPrices, TARGET);
        const sampledVols = downsample(rawVols, TARGET);
        setData({
          labels: sampled.map(p => fmtDate(p[0])),
          prices: sampled.map(p => p[1]),
          vols: sampledVols.map(v => parseFloat((v[1] / 1e9).toFixed(2))),
        });
        setIsLive(true);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          // Keep fallback data — chart still renders
          setIsLive(false);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [coinId, tf, fallback]);

  return { tf, setTf, data, loading, isLive };
}

/* ── Shared chart skeleton / error state ── */
function ChartSkeleton() {
  return (
    <div style={{
      height: '145px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--mono)',
      fontSize: 9,
      color: 'var(--muted)',
      background: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 40px),repeating-linear-gradient(0deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 30px)',
    }}>
      <span style={{ animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.7 }}>Loading live data...</span>
    </div>
  );
}

function ChartError() {
  return (
    <div style={{
      height: '145px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--mono)',
      fontSize: 9,
      color: 'var(--red)',
    }}>
      Data unavailable
    </div>
  );
}

/* ── Live BTC Chart ── */
function BtcChart() {
  const { tf, setTf, data, loading, isLive } = useLiveCoinChart('bitcoin');
  const opts = makeChartOpts('BTC Price');
  const chartData = buildChartData(data.labels, data.prices, data.vols, '#00d4aa', 'rgba(0,212,170,0.08)');

  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">BTC Price &amp; Volume</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div className="tf-toggle">
            {TF_LABELS.map(t => (
              <div key={t} className={`tf-btn${tf === t ? ' active' : ''}`} onClick={() => setTf(t)} style={{ cursor: 'pointer' }}>{t}</div>
            ))}
          </div>
          <div className="tag tag-live">
            <span style={{ marginRight: 4, color: isLive ? 'var(--green)' : 'var(--gold)', fontSize: 7 }}>●</span>
            {isLive ? 'LIVE' : 'CACHED'} · <a className="src-link" href="https://coingecko.com" target="_blank" rel="noreferrer">CoinGecko</a>
          </div>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: '145px', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 4, right: 4, fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', zIndex: 2, animation: 'pulse 1.5s ease-in-out infinite' }}>
            Updating...
          </div>
        )}
        <Bar id="btcChart" data={chartData as any} options={opts} />
      </div>
    </div>
  );
}

/* ── Live ETH Chart ── */
function EthChart() {
  const { tf, setTf, data, loading, isLive } = useLiveCoinChart('ethereum');
  const opts = makeChartOpts('ETH Price');
  const chartData = buildChartData(data.labels, data.prices, data.vols, '#3b82f6', 'rgba(59,130,246,0.08)');

  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">ETH Price &amp; Volume</div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <div className="tf-toggle">
            {TF_LABELS.map(t => (
              <div key={t} className={`tf-btn${tf === t ? ' active' : ''}`} onClick={() => setTf(t)} style={{ cursor: 'pointer' }}>{t}</div>
            ))}
          </div>
          <div className="tag tag-live">
            <span style={{ marginRight: 4, color: isLive ? 'var(--green)' : 'var(--gold)', fontSize: 7 }}>●</span>
            {isLive ? 'LIVE' : 'CACHED'} · <a className="src-link" href="https://coingecko.com" target="_blank" rel="noreferrer">CoinGecko</a>
          </div>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: '145px', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 4, right: 4, fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', zIndex: 2, animation: 'pulse 1.5s ease-in-out infinite' }}>
            Updating...
          </div>
        )}
        <Bar id="ethChart" data={chartData as any} options={opts} />
      </div>
    </div>
  );
}

/* ── AI Context Strip (live data) ── */
function AiStrip() {
  const { coins, global } = useContext(CmcContext);
  const btc = coins.find(c => c.symbol === 'BTC');
  const btcPrice = btc ? fmtPrice(btc.price) : '$73K';
  const btcChg = btc ? btc.percent_change_24h : 0;
  const btcDom = global?.btc_dominance?.toFixed(1) ?? '63.0';

  const body = `BTC <strong>${btcPrice}</strong> (${btcChg >= 0 ? '+' : ''}${btcChg.toFixed(2)}%) — BTC Dominance <strong>${btcDom}%</strong>. ${btcChg < -3 ? 'Significant sell pressure. Watch for support levels.' : btcChg < 0 ? 'Slight pullback — monitor ETF flows for institutional direction.' : 'Price holding steady. Institutional accumulation pattern continues.'}`;

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

/* ── AI Morning Brief (live data) ── */
function MorningBrief() {
  const { coins, global, source } = useContext(CmcContext);
  const btc = coins.find(c => c.symbol === 'BTC');
  const eth = coins.find(c => c.symbol === 'ETH');
  const btcPrice = btc ? fmtPrice(btc.price) : '$73K';
  const btcChg24h = btc?.percent_change_24h ?? 0;
  const btcChg7d = btc?.percent_change_7d ?? -3.14;
  const ethChg7d = eth?.percent_change_7d ?? -8.32;
  const btcDom = global?.btc_dominance?.toFixed(1) ?? '63.0';

  // Dynamic sentiment based on live data
  const sentiment = btcChg7d > 5 ? 'BULLISH' : btcChg7d > 0 ? 'CAUTIOUSLY BULLISH' : btcChg7d > -5 ? 'NEUTRAL' : 'CAUTIOUSLY BEARISH';
  const sentimentColor = btcChg7d > 0 ? 'var(--green)' : btcChg7d > -5 ? 'var(--gold)' : 'var(--red)';

  // Count gainers/losers from top 20
  const top20 = coins.slice(0, 20);
  const gainers = top20.filter(c => c.percent_change_24h > 0).length;
  const losers = top20.length - gainers;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid rgba(0,212,170,0.15)', padding: '12px 14px', position: 'relative', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.08em', fontWeight: 600 }}>⬡ CI·AI</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.12em', color: 'var(--text2)' }}>INTELLIGENCE BRIEF</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>{dateStr}</span>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: sourceColor(source), boxShadow: `0 0 6px ${sourceColor(source)}`, animation: 'pulse 2s infinite' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px', border: `1px solid ${sentimentColor}40`, color: sentimentColor, letterSpacing: '0.08em' }}>{sentiment}</span>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--cyan)', marginBottom: 8, letterSpacing: '-0.01em' }}>
        BTC {btcPrice} ({btcChg24h >= 0 ? '+' : ''}{btcChg24h.toFixed(2)}%) · BTC Dom {btcDom}% · Market: {gainers} up / {losers} down
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--green)', letterSpacing: '0.12em', marginBottom: 4 }}>▲ BULLISH</div>
          <div style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--text)' }}>
            {(() => {
              const topGainers = top20.filter(c => c.percent_change_24h > 0).sort((a, b) => b.percent_change_24h - a.percent_change_24h).slice(0, 3);
              if (topGainers.length === 0) return 'No significant gainers in top 20 today.';
              return `Top movers: ${topGainers.map(c => `${c.symbol} +${c.percent_change_24h.toFixed(1)}%`).join(', ')}. ${gainers} of ${top20.length} assets positive in 24h.`;
            })()}
          </div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--red)', letterSpacing: '0.12em', marginBottom: 4 }}>▼ WATCH</div>
          <div style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--text)' }}>
            {eth ? `ETH ${ethChg7d >= 0 ? '+' : ''}${ethChg7d.toFixed(2)}% over 7 days (${fmtPrice(eth.price)}).` : 'ETH data loading.'}
            {' '}BTC dominance at {btcDom}% — {parseFloat(btcDom) > 60 ? 'capital rotating to safety, altcoin weakness likely' : 'healthy distribution across assets'}.
          </div>
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
      <div style={{ position: 'absolute', bottom: 8, right: 8, fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 2 }}>Pro unlocks real-time AI analysis</div>
    </div>
  );
}

/* ── Ask CI ── */
function AskCI() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>('');
  const chips = ['BTC outlook', 'ETF flows today', 'What does fear and greed 13 mean?', 'SOL target', 'Whale activity', 'Stablecoins'];

  const handleAsk = useCallback(async (q?: string) => {
    const question = (q || query).trim();
    if (!question) return;
    setLoading(true);
    setResponse('');
    setSource('');
    try {
      const res = await fetch('/api/ask-ci', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question }),
      });
      const data = await res.json();
      setResponse(data.answer || 'No response generated.');
      setSource(data.source || 'cached');
    } catch {
      setResponse('CI·AI is temporarily unavailable. Please try again.');
      setSource('error');
    } finally {
      setLoading(false);
    }
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
        <button onClick={() => handleAsk()} disabled={loading} style={{ background: loading ? 'var(--s2)' : 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: 'var(--cyan)', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.12em', padding: '6px 14px', cursor: loading ? 'wait' : 'pointer', margin: 4 }}>{loading ? 'ANALYZING...' : 'ANALYZE'}</button>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '4px 8px', background: 'var(--s1)', flexWrap: 'wrap' }}>
        {chips.map(c => (
          <button key={c} onClick={() => { setQuery(c); handleAsk(c); }} style={{ background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 8, padding: '3px 8px', cursor: 'pointer' }}>{c}</button>
        ))}
      </div>
      {loading && (
        <div style={{ background: 'var(--s1)', padding: '12px 14px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>◈</span> CI·AI analyzing your query...
        </div>
      )}
      {response && !loading && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--cyan)', letterSpacing: '0.1em' }}>◈ CI·AI RESPONSE</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: source === 'live' ? 'var(--green)' : 'var(--gold)', letterSpacing: '0.06em' }}>
              {source === 'live' ? '● LIVE AI' : source === 'cached' ? '● CACHED INTELLIGENCE' : '● OFFLINE'}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text2)', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: response.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>') }}
          />
        </div>
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

/* ── Heatmap (powered by shared CMC data) ── */
function Heatmap() {
  const { coins, source, loading } = useContext(CmcContext);
  const topCoins = coins.slice(0, 20);

  function getSpan(idx: number): { row?: string; col?: string } {
    if (idx === 0) return { row: 'span 2', col: 'span 2' };
    if (idx === 1) return { row: 'span 2' };
    return {};
  }

  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">Market Heatmap — 24h Performance</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)' }}>▪ size = market cap</span>
          <div className="tag tag-live">
            <span style={{ marginRight: 4, color: sourceColor(source), fontSize: 7 }}>●</span>
            {sourceLabel(source)} · <a className="src-link" href="https://coinmarketcap.com" target="_blank" rel="noopener noreferrer">CoinMarketCap</a>
          </div>
        </div>
      </div>
      {loading ? (
        <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>Loading live market data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
          {topCoins.map((c, i) => {
            const chg = c.percent_change_24h;
            const span = getSpan(i);
            return (
              <div key={c.symbol} style={{
                background: chg >= 0 ? `rgba(16,185,129,${Math.min(0.06 + Math.abs(chg) * 0.04, 0.4)})` : `rgba(239,68,68,${Math.min(0.06 + Math.abs(chg) * 0.04, 0.4)})`,
                border: `1px solid ${chg >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                padding: '8px 6px',
                textAlign: 'center',
                gridRow: span.row,
                gridColumn: span.col,
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600, color: 'var(--text)' }}>{c.symbol}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: chg >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
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

/* ── Market Table (powered by shared CMC data) ── */
function MarketTable() {
  const { coins, source } = useContext(CmcContext);
  const topAssets = coins.slice(0, 12);

  /* Simple signal logic based on 7d performance */
  function getSignal(c: CmcCoin): { label: string; color: string } {
    const d7 = c.percent_change_7d;
    if (d7 > 2) return { label: 'ACCUMULATE', color: 'var(--green)' };
    if (d7 > -3) return { label: 'HOLD', color: 'var(--gold)' };
    return { label: 'WATCH', color: 'var(--muted)' };
  }

  return (
    <div className="panel">
      <div className="ph">
        <div className="pt">Top Assets by Market Cap</div>
        <div className="tag tag-live">
          <span style={{ marginRight: 4, color: sourceColor(source), fontSize: 7 }}>●</span>
          {sourceLabel(source)} · <a className="src-link" href="https://coinmarketcap.com" target="_blank" rel="noopener noreferrer">CoinMarketCap</a>
        </div>
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
          {topAssets.map(a => {
            const sig = getSignal(a);
            const d1 = a.percent_change_24h;
            const d7 = a.percent_change_7d;
            return (
              <tr key={a.symbol} style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,170,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={{ padding: '5px 8px', color: 'var(--muted)', fontSize: 9 }}>{a.cmc_rank}</td>
                <td style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {a.image && <img src={a.image} alt={a.symbol} width={16} height={16} style={{ borderRadius: 2 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{a.name}</span>
                  <span style={{ fontSize: 8, color: 'var(--muted)' }}>{a.symbol}</span>
                </td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text)' }}>{fmtPrice(a.price)}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: d1 >= 0 ? 'var(--green)' : 'var(--red)' }}>{d1 >= 0 ? '+' : ''}{d1.toFixed(2)}%</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: d7 >= 0 ? 'var(--green)' : 'var(--red)' }}>{d7 >= 0 ? '+' : ''}{d7.toFixed(2)}%</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{fmtUsd(a.market_cap, 1)}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{fmtUsd(a.volume_24h, 1)}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px', border: `1px solid ${sig.color}`, color: sig.color, letterSpacing: '0.06em' }}>
                    {sig.label}
                  </span>
                </td>
              </tr>
            );
          })}
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

/* ── Live KPI Row (powered by shared CMC data) ── */
function LiveKPIs() {
  const { coins, global, source } = useContext(CmcContext);
  const btc = coins.find(c => c.symbol === 'BTC');

  const totalMcap = global?.total_market_cap ?? FALLBACK_GLOBAL.total_market_cap;
  const mcapChg = global?.total_market_cap_yesterday_percentage_change ?? FALLBACK_GLOBAL.total_market_cap_yesterday_percentage_change;
  const btcDom = global?.btc_dominance ?? FALLBACK_GLOBAL.btc_dominance;

  const srcHtml = `<span style="color:${sourceColor(source)};font-size:7px">●</span> ${sourceLabel(source)} · <a class="src-link" href="https://coinmarketcap.com" target="_blank">CoinMarketCap</a>`;

  return (
    <div className="g4" style={{ marginTop: 8 }}>
      <KPI
        label="Total Market Cap"
        value={fmtUsd(totalMcap, 2)}
        change={`${mcapChg >= 0 ? '+' : ''}${mcapChg.toFixed(2)}% today`}
        changeDir={mcapChg >= 0 ? 'up' : 'dn'}
        color="var(--gold)"
        source={srcHtml}
      />
      <KPI
        label="BTC Dominance"
        value={`${btcDom.toFixed(1)}%`}
        change={btc ? `BTC ${fmtPrice(btc.price)} · ${btc.percent_change_24h >= 0 ? '+' : ''}${btc.percent_change_24h.toFixed(2)}%` : 'Loading...'}
        changeDir={btc && btc.percent_change_24h >= 0 ? 'up' : 'dn'}
        source={srcHtml}
      />
      <KPI label="Fear & Greed Index" value="13" change="Extreme Fear (13/100) · Historic low" changeDir="dn" color="var(--red)" source='<a class="src-link" href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank">Fear &amp; Greed Index</a>' />
      <KPI label="Total DeFi TVL" value="$85.0B" change="−2.1% in 24h · 6,400+ protocols" changeDir="dn" source='<a class="src-link" href="https://defillama.com" target="_blank">DefiLlama</a>' />
    </div>
  );
}

/* ── MAIN OVERVIEW TAB ── */
export default function OverviewTab() {
  const cmcData = useCmcData();

  return (
    <CmcContext.Provider value={cmcData}>
    <div>
      <AiStrip />
      <QuickGuide />
      <MorningBrief />
      <AskCI />

      <LiveKPIs />

      <SectorHeat />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--b1)', marginBottom: 1 }}>
        <Heatmap />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <BtcChart />
          <EthChart />
        </div>
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
    </CmcContext.Provider>
  );
}
