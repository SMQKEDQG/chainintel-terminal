'use client';

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import TokenUnlocks from '@/components/TokenUnlocks';
import { DailyBriefCard, CorrelationEngine, SmartAlerts } from '@/components/LevelUpModules';
import InsightDrawer, { useInsightDrawer } from '@/components/InsightDrawer';
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

/* ── Insight context (allows any child to trigger the drawer) ── */
interface InsightCtx {
  openInsight: (ctx: { type: 'asset' | 'etf' | 'chainscore' | 'whale' | 'kpi' | 'general'; title: string; subtitle?: string; data?: Record<string, any> }) => void;
}
const InsightContext = createContext<InsightCtx>({ openInsight: () => {} });

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
const LOADING_COINS: CmcCoin[] = [
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

const LOADING_GLOBAL: CmcGlobal = {
  total_market_cap: 2.65e12,
  total_volume_24h: 98.4e9,
  btc_dominance: 63.0,
  eth_dominance: 10.2,
  active_cryptocurrencies: 10200,
  total_market_cap_yesterday_percentage_change: 0.64,
};

function useCmcData(): CmcData {
  const [coins, setCoins] = useState<CmcCoin[]>(LOADING_COINS);
  const [global, setGlobal] = useState<CmcGlobal | null>(LOADING_GLOBAL);
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
                total_market_cap: gd.quote?.USD?.total_market_cap ?? LOADING_GLOBAL.total_market_cap,
                total_volume_24h: gd.quote?.USD?.total_volume_24h ?? LOADING_GLOBAL.total_volume_24h,
                btc_dominance: gd.btc_dominance ?? LOADING_GLOBAL.btc_dominance,
                eth_dominance: gd.eth_dominance ?? LOADING_GLOBAL.eth_dominance,
                active_cryptocurrencies: gd.active_cryptocurrencies ?? LOADING_GLOBAL.active_cryptocurrencies,
                total_market_cap_yesterday_percentage_change: gd.quote?.USD?.total_market_cap_yesterday_percentage_change ?? LOADING_GLOBAL.total_market_cap_yesterday_percentage_change,
              });
            }
          }
        } catch { /* global metrics failure is non-critical */ }

      } catch {
        // Fallback to CoinGecko
        if (cancelled) return;
        try {
          const geckoRes = await fetch('/api/coingecko?path=/coins/markets&vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=7d');
          if (!geckoRes.ok) throw new Error('CoinGecko failed');
          const geckoJson = await geckoRes.json();
          const geckoData = geckoJson.data || geckoJson;
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
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const days = TF_DAYS[tf];
    fetchWithRetry(
      `/api/coingecko?path=/coins/${coinId}/market_chart&vs_currency=usd&days=${days}`,
    )
      .then(r => r.json())
      .then((wrapper: any) => {
        const json: { prices: [number, number][]; total_volumes: [number, number][] } = wrapper.data || wrapper;
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
        setUpdatedAt(Date.now());
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsLive(false);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [coinId, tf, fallback]);

  return { tf, setTf, data, loading, isLive, updatedAt };
}

/* ── Time-ago string for chart freshness ── */
function useTimeAgo(ts: number | null): string {
  const [str, setStr] = useState('');
  useEffect(() => {
    if (!ts) return;
    const tick = () => {
      const diff = Math.floor((Date.now() - ts) / 1000);
      if (diff < 60) setStr(`Updated ${diff}s ago`);
      else if (diff < 3600) setStr(`Updated ${Math.floor(diff / 60)}m ago`);
      else setStr(`Updated ${Math.floor(diff / 3600)}h ago`);
    };
    tick();
    const iv = setInterval(tick, 10_000);
    return () => clearInterval(iv);
  }, [ts]);
  return str;
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
      fontSize: 13,
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
      fontSize: 13,
      color: 'var(--red)',
    }}>
      Data unavailable
    </div>
  );
}

/* ── Live BTC Chart ── */
function BtcChart() {
  const { tf, setTf, data, loading, isLive, updatedAt } = useLiveCoinChart('bitcoin');
  const timeAgo = useTimeAgo(updatedAt);
  const opts = makeChartOpts('BTC Price');
  const chartData = buildChartData(data.labels, data.prices, data.vols, '#E8A534', 'rgba(232,165,52,0.08)');

  return (
    <div className="panel panel-hover">
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
            {timeAgo || 'Loading'} · <a className="src-link" href="https://coingecko.com" target="_blank" rel="noreferrer">CoinGecko</a>
          </div>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: '145px', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 4, right: 4, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', zIndex: 2, animation: 'pulse 1.5s ease-in-out infinite' }}>
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
  const { tf, setTf, data, loading, isLive, updatedAt } = useLiveCoinChart('ethereum');
  const timeAgo = useTimeAgo(updatedAt);
  const opts = makeChartOpts('ETH Price');
  const chartData = buildChartData(data.labels, data.prices, data.vols, '#6B8AFF', 'rgba(107,138,255,0.08)');

  return (
    <div className="panel panel-hover">
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
            {timeAgo || 'Loading'} · <a className="src-link" href="https://coingecko.com" target="_blank" rel="noreferrer">CoinGecko</a>
          </div>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: '145px', position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', top: 4, right: 4, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', zIndex: 2, animation: 'pulse 1.5s ease-in-out infinite' }}>
            Updating...
          </div>
        )}
        <Bar id="ethChart" data={chartData as any} options={opts} />
      </div>
    </div>
  );
}

/* ── AI Context Strip — Auto-rotating newsroom ticker ── */
function AiStrip() {
  const { coins, global } = useContext(CmcContext);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const btc = coins.find(c => c.symbol === 'BTC');
  const eth = coins.find(c => c.symbol === 'ETH');
  const sol = coins.find(c => c.symbol === 'SOL');
  const xrp = coins.find(c => c.symbol === 'XRP');
  const btcPrice = btc ? fmtPrice(btc.price) : '$73K';
  const btcChg = btc ? btc.percent_change_24h : 0;
  const btcDom = global?.btc_dominance?.toFixed(1) ?? '63.0';
  const ethPrice = eth ? fmtPrice(eth.price) : '$2,210';
  const ethChg = eth ? eth.percent_change_24h : 0;

  // Top gainers and losers from live data
  const top20 = coins.slice(0, 20);
  const topGainer = [...top20].sort((a, b) => b.percent_change_24h - a.percent_change_24h)[0];
  const topLoser = [...top20].sort((a, b) => a.percent_change_24h - b.percent_change_24h)[0];
  const totalMcap = global?.total_market_cap ? fmtUsd(global.total_market_cap, 2) : '$2.65T';

  const updates = [
    `BTC <strong>${btcPrice}</strong> (${btcChg >= 0 ? '+' : ''}${btcChg.toFixed(2)}%) — BTC Dominance <strong>${btcDom}%</strong>. ${btcChg < -3 ? 'Significant sell pressure detected.' : btcChg < 0 ? 'Monitor ETF flows for institutional direction.' : 'Institutional accumulation pattern continues.'}`,
    `ETH <strong>${ethPrice}</strong> (${ethChg >= 0 ? '+' : ''}${ethChg.toFixed(2)}%) — ${ethChg > 2 ? 'Strong momentum. DeFi TVL rising.' : ethChg > -2 ? 'Consolidating. Watch gas fee trends.' : 'Under pressure. Track staking outflows.'}`,
    `Top Market Cap: <strong>${totalMcap}</strong> — ${topGainer ? `Leading: <strong>${topGainer.symbol}</strong> +${topGainer.percent_change_24h.toFixed(1)}%` : 'Markets consolidating.'} ${topLoser ? ` · Lagging: <strong>${topLoser.symbol}</strong> ${topLoser.percent_change_24h.toFixed(1)}%` : ''}`,
    `Cross-chain intelligence: <strong>${coins.filter(c => c.percent_change_24h > 0).length}</strong> of top ${coins.length} assets positive. ${sol ? `SOL ${fmtPrice(sol.price)} (${sol.percent_change_24h >= 0 ? '+' : ''}${sol.percent_change_24h.toFixed(1)}%)` : ''} ${xrp ? `· XRP ${fmtPrice(xrp.price)} (${xrp.percent_change_24h >= 0 ? '+' : ''}${xrp.percent_change_24h.toFixed(1)}%)` : ''}`,
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIdx(prev => (prev + 1) % updates.length);
        setIsTransitioning(false);
      }, 400);
    }, 7000);
    return () => clearInterval(timer);
  }, [updates.length]);

  return (
    <div className="ai-context-strip" style={{ overflow: 'hidden', position: 'relative' }}>
      <span className="acs-icon" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'pulse 2s infinite' }} />
        ◈ CI·AI
      </span>
      <span
        className="acs-body"
        style={{
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(-8px)' : 'translateY(0)',
        }}
        dangerouslySetInnerHTML={{ __html: updates[activeIdx] }}
      />
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
        {updates.map((_, i) => (
          <div key={i} style={{
            width: i === activeIdx ? 12 : 4,
            height: 4,
            borderRadius: 2,
            background: i === activeIdx ? 'var(--accent)' : 'var(--b3)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
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
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--text2)', fontWeight: 500 }}>
        <span style={{ transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
        HOW TO READ THIS DASHBOARD — BEGINNER GUIDE
      </div>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '0 14px 12px' }}>
          {items.map(it => (
            <div key={it.label} style={{ background: 'var(--s2)', border: '1px solid var(--b1)', padding: '8px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 6, fontWeight: 600 }}>{it.label}</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{it.text}</div>
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
  const [fng, setFng] = useState<{ value: number; label: string } | null>(null);

  useEffect(() => {
    fetch('https://api.alternative.me/fng/?limit=1')
      .then(r => r.json())
      .then(d => {
        const entry = d?.data?.[0];
        if (entry) setFng({ value: Number(entry.value), label: entry.value_classification });
      })
      .catch(() => setFng({ value: 13, label: 'Extreme Fear' }));
  }, []);

  const btc = coins.find(c => c.symbol === 'BTC');
  const eth = coins.find(c => c.symbol === 'ETH');
  const btcPrice = btc ? fmtPrice(btc.price) : '$73K';
  const btcChg24h = btc?.percent_change_24h ?? 0;
  const btcChg7d = btc?.percent_change_7d ?? -3.14;
  const ethChg7d = eth?.percent_change_7d ?? -8.32;
  const btcDom = global?.btc_dominance?.toFixed(1) ?? '63.0';
  const fngVal = fng?.value ?? 13;
  const fngLabel = fng?.label ?? 'Extreme Fear';

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
    <div style={{ background: 'linear-gradient(135deg, rgba(17,17,17,1) 0%, rgba(22,22,22,0.95) 100%)', border: '1px solid rgba(232,165,52,0.2)', padding: '16px 18px', position: 'relative', marginBottom: 8, borderRadius: 6, boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(232,165,52,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--accent)', letterSpacing: '0.08em', fontWeight: 700 }}>⬡ CI·AI</span>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 14, letterSpacing: '0.12em', color: 'var(--text)', fontWeight: 700 }}>INTELLIGENCE BRIEF</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{dateStr}</span>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: sourceColor(source), boxShadow: `0 0 6px ${sourceColor(source)}`, animation: 'pulse 2s infinite' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 16, padding: '2px 6px', border: `1px solid ${sentimentColor}40`, color: sentimentColor, letterSpacing: '0.08em' }}>{sentiment}</span>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 10, letterSpacing: '-0.01em' }}>
        BTC {btcPrice} ({btcChg24h >= 0 ? '+' : ''}{btcChg24h.toFixed(2)}%) · BTC Dom {btcDom}% · Market: {gainers} up / {losers} down
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)', letterSpacing: '0.12em', marginBottom: 6, fontWeight: 600 }}>▲ BULLISH</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>
            {(() => {
              const topGainers = top20.filter(c => c.percent_change_24h > 0).sort((a, b) => b.percent_change_24h - a.percent_change_24h).slice(0, 3);
              if (topGainers.length === 0) return 'No significant gainers in top 20 today.';
              return `Top movers: ${topGainers.map(c => `${c.symbol} +${c.percent_change_24h.toFixed(1)}%`).join(', ')}. ${gainers} of ${top20.length} assets positive in 24h.`;
            })()}
          </div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', letterSpacing: '0.12em', marginBottom: 6, fontWeight: 600 }}>▼ WATCH</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>
            {eth ? `ETH ${ethChg7d >= 0 ? '+' : ''}${ethChg7d.toFixed(2)}% over 7 days (${fmtPrice(eth.price)}).` : 'ETH data loading.'}
            {' '}BTC dominance at {btcDom}% — {parseFloat(btcDom) > 60 ? 'capital rotating to safety, altcoin weakness likely' : 'healthy distribution across assets'}.
          </div>
        </div>
        <div style={{ background: 'rgba(240,192,64,0.05)', border: '1px solid rgba(240,192,64,0.12)', padding: '8px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--gold)', letterSpacing: '0.12em', marginBottom: 6, fontWeight: 600 }}>◈ KEY CATALYST</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>
            {fngVal <= 25 ? (
              <>Fear & Greed at <strong>{fngVal} ({fngLabel})</strong> — historically, scores below 25 precede 60-day mean reversions of +28%. Institutional accumulation window.{' '}
              CLARITY Act advancing — first SEC/CFTC joint framework targeting Q2 2026.</>
            ) : fngVal >= 75 ? (
              <>Fear & Greed at <strong>{fngVal} ({fngLabel})</strong> — elevated greed. Caution warranted. CLARITY Act still advancing through Senate Banking Committee.</>
            ) : (
              <>Fear & Greed at <strong>{fngVal} ({fngLabel})</strong> — neutral zone. CLARITY Act advancing — Senate Banking Committee vote scheduled. First SEC/CFTC joint framework for digital assets targeting Q2 2026.</>
            )}
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--b2)', paddingTop: 8, marginTop: 4 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 6 }}>RECENT REPORTS — FREE SOURCES</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Glassnode: BTC on-chain →', href: 'https://insights.glassnode.com' },
            { label: 'CoinGecko: Weekly report →', href: 'https://www.coingecko.com/research' },
            { label: 'DeFiLlama: TVL flows →', href: 'https://defillama.com' },
            { label: 'Messari: Protocol analysis →', href: 'https://messari.io/research' },
            { label: 'CryptoQuant: Whale flows →', href: 'https://cryptoquant.com' },
          ].map(s => (
            <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: 'var(--s2)', border: '1px solid var(--b2)', padding: '3px 8px', fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--text2)' }}>{s.label}</a>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 8, right: 8, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 2 }}>Pro unlocks real-time AI analysis</div>
    </div>
  );
}

/* ── Ask CI ── */
function AskCI() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>('');
  const chips = ['Market overview', 'Bitcoin analysis', 'ETF flows', 'Fear & Greed', 'DeFi TVL', 'ISO 20022 assets', 'XRP outlook', 'Whale signals'];

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
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', padding: '0 10px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>ASK CI&gt;</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          placeholder="Ask anything: 'BTC price target?' · 'Explain MVRV' · 'Best ISO 20022 asset?'"
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 13, padding: '8px 0', outline: 'none' }}
        />
        <button onClick={() => handleAsk()} disabled={loading} style={{ background: loading ? 'var(--s2)' : 'rgba(232,165,52,0.08)', border: '1px solid rgba(232,165,52,0.2)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', padding: '6px 14px', cursor: loading ? 'wait' : 'pointer', margin: 4, fontWeight: 700 }}>{loading ? 'ANALYZING...' : 'ANALYZE'}</button>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '4px 8px', background: 'var(--s1)', flexWrap: 'wrap' }}>
        {chips.map(c => (
          <button key={c} onClick={() => { setQuery(c); handleAsk(c); }} style={{ background: 'var(--s2)', border: '1px solid var(--b2)', color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.04em' }}>{c}</button>
        ))}
      </div>
      {loading && (
        <div style={{ background: 'var(--s1)', padding: '12px 14px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>◈</span> CI·AI analyzing your query...
        </div>
      )}
      {response && !loading && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em', fontWeight: 700 }}>◈ CI·AI RESPONSE</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: source === 'live' ? 'var(--green)' : 'var(--gold)', letterSpacing: '0.06em' }}>
              {source === 'live' ? '● LIVE AI' : source === 'cached' ? '● CACHED INTELLIGENCE' : '● OFFLINE'}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text2)', lineHeight: 1.75 }}
            dangerouslySetInnerHTML={{ __html: response.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>') }}
          />
        </div>
      )}
    </div>
  );
}

/* ── KPI Card ── */
function KPI({ label, value, change, changeDir, source, color }: { label: string; value: string; change: string; changeDir: 'up' | 'dn' | 'neutral'; source: string; color?: string }) {
  const prevVal = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (value !== prevVal.current) {
      setFlash(true);
      prevVal.current = value;
      const t = setTimeout(() => setFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="kpi metric-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-val" style={{
        color: color || 'var(--accent)',
        transition: 'text-shadow 0.3s ease',
        textShadow: flash ? `0 0 12px ${color || 'rgba(232,165,52,0.6)'}` : 'none',
      }}>{value}</div>
      <div className={`kpi-chg ${changeDir}`}>{change}</div>
      <div className="kpi-src" dangerouslySetInnerHTML={{ __html: source }} />
    </div>
  );
}

/* ── Sector Heat Row (LIVE) ── */
function SectorHeat() {
  const { coins, global } = useContext(CmcContext);
  const [sectors, setSectors] = useState<{ topLabel: string; topChg: number; worstLabel: string; worstChg: number } | null>(null);
  const [defi, setDefi] = useState<{ stablecoinSupply: number } | null>(null);
  const [perpFunding, setPerpFunding] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/market-sectors').then(r => r.json()).then(d => {
      if (d.topSector && d.worstSector) {
        setSectors({ topLabel: d.topSector.label, topChg: d.topSector.change, worstLabel: d.worstSector.label, worstChg: d.worstSector.change });
      }
    }).catch(() => {});
    fetch('/api/defi-overview').then(r => r.json()).then(d => {
      if (d.stablecoinSupply) setDefi({ stablecoinSupply: d.stablecoinSupply });
    }).catch(() => {});
    // Perp funding from derivatives API
    fetch('/api/derivatives').then(r => r.json()).then(d => {
      const btcAsset = d?.assets?.find?.((a: { asset: string }) => a.asset === 'BTC');
      if (btcAsset?.avgFundingRate !== undefined) setPerpFunding(btcAsset.avgFundingRate);
    }).catch(() => {});
  }, []);

  // Altcoin season: % of top 50 alts outperforming BTC over 90d
  const btc = coins.find(c => c.symbol === 'BTC');
  const btcChg = btc?.percent_change_7d ?? 0;
  const alts = coins.filter(c => c.symbol !== 'BTC' && c.symbol !== 'USDT' && c.symbol !== 'USDC').slice(0, 50);
  const altsBeatingBtc = alts.filter(a => (a.percent_change_7d ?? 0) > btcChg).length;
  const altcoinIndex = alts.length > 0 ? Math.round((altsBeatingBtc / alts.length) * 100) : 32;

  const stableSupply = defi?.stablecoinSupply ? (defi.stablecoinSupply / 1e9).toFixed(1) : '243.2';
  const topSectorVal = sectors ? `${sectors.topLabel} ${sectors.topChg >= 0 ? '+' : ''}${sectors.topChg.toFixed(1)}%` : 'RWA +4.2%';
  const topSectorSub = sectors?.topLabel || 'Real World Assets';
  const worstSectorVal = sectors ? `${sectors.worstLabel} ${sectors.worstChg >= 0 ? '+' : ''}${sectors.worstChg.toFixed(1)}%` : 'DeFi −3.1%';
  const worstSectorSub = sectors?.worstLabel || 'Decentralized Finance';
  const fundingStr = perpFunding !== null ? `${perpFunding >= 0 ? '+' : ''}${perpFunding.toFixed(4)}%` : '−0.004%';
  const fundingSub = perpFunding !== null ? (perpFunding < 0 ? 'Shorts paying · squeeze risk' : 'Longs paying · healthy') : 'Shorts paying · squeeze risk';

  const cells = [
    { label: 'ALTCOIN SEASON', val: String(altcoinIndex), sub: '/100', color: altcoinIndex > 75 ? 'var(--green)' : altcoinIndex > 25 ? 'var(--gold)' : 'var(--red)', bar: altcoinIndex },
    { label: 'TOP SECTOR · 24H', val: topSectorVal, sub: topSectorSub, color: 'var(--green)' },
    { label: 'WORST SECTOR · 24H', val: worstSectorVal, sub: worstSectorSub, color: 'var(--red)' },
    { label: 'STABLECOIN SUPPLY', val: `$${stableSupply}B`, sub: `${defi ? '● LIVE · DefiLlama' : '● CACHED · DefiLlama'}`, color: 'var(--accent)' },
    { label: 'PERP FUNDING (BTC)', val: fundingStr, sub: fundingSub, color: 'var(--gold)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: 'var(--b1)', marginBottom: 1 }}>
      {cells.map(c => (
        <div key={c.label} style={{ background: 'var(--s1)', padding: '7px 10px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 500 }}>{c.label}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: c.bar !== undefined ? 16 : 13, fontWeight: 700, color: c.color }}>
            {c.val}{c.bar !== undefined && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{c.sub}</span>}
          </div>
          {c.bar !== undefined ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ width: 60, height: 6, background: 'var(--b3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${c.bar}%`, height: 6, background: c.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Animated price component ── */
function AnimPrice({ value, format = 'price' }: { value: number; format?: 'price' | 'pct' }) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<'up' | 'dn' | null>(null);

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlash(value > prevRef.current ? 'up' : 'dn');
      prevRef.current = value;
      const t = setTimeout(() => setFlash(null), 900);
      return () => clearTimeout(t);
    }
  }, [value]);

  const display = format === 'pct'
    ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    : fmtPrice(value);

  return (
    <span style={{
      transition: 'color 0.3s ease',
      color: flash === 'up' ? 'var(--green)' : flash === 'dn' ? 'var(--red)' : undefined,
      textShadow: flash ? `0 0 8px ${flash === 'up' ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)'}` : 'none',
    }}>
      {display}
    </span>
  );
}

/* ── Heatmap (powered by shared CMC data) — Treemap-style interactive ── */
function Heatmap() {
  const { coins, source, loading } = useContext(CmcContext);
  const topCoins = coins.slice(0, 25);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CmcCoin | null>(null);

  // Compute treemap layout: size cells by market cap
  const totalMcap = topCoins.reduce((s, c) => s + c.market_cap, 0) || 1;

  // Treemap row layout: split coins into rows proportional to mcap
  function buildRows(items: CmcCoin[], cols: number): CmcCoin[][] {
    const rows: CmcCoin[][] = [];
    let row: CmcCoin[] = [];
    let rowMcap = 0;
    const avgRowMcap = totalMcap / Math.ceil(items.length / cols);
    for (const c of items) {
      row.push(c);
      rowMcap += c.market_cap;
      if (row.length >= cols || rowMcap >= avgRowMcap * 1.2) {
        rows.push(row);
        row = [];
        rowMcap = 0;
      }
    }
    if (row.length > 0) rows.push(row);
    return rows;
  }

  const rows = buildRows(topCoins, 6);

  function getIntensity(chg: number): number {
    return Math.min(0.08 + Math.abs(chg) * 0.05, 0.55);
  }

  return (
    <div className="panel panel-hover live-shimmer-border" style={{ position: 'relative' }}>
      <div className="ph">
        <div className="pt">Market Heatmap — 24h</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.06em' }}>SIZE = MARKET CAP</span>
          <div className="tag tag-live">
            <span style={{ marginRight: 4, color: sourceColor(source), fontSize: 7 }}>●</span>
            {sourceLabel(source)}
          </div>
        </div>
      </div>

      {/* Heatmap grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading && topCoins.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ animation: 'pulse 1.5s ease-in-out infinite', display: 'inline-block' }}>Connecting to live feeds...</span>
          </div>
        )}
        {rows.map((row, ri) => {
          const rowMcap = row.reduce((s, c) => s + c.market_cap, 0);
          return (
            <div key={ri} style={{ display: 'flex', gap: 2, height: ri === 0 ? 80 : ri === 1 ? 60 : 48 }}>
              {row.map((c, ci) => {
                const chg = c.percent_change_24h;
                const intensity = getIntensity(chg);
                const widthPct = (c.market_cap / rowMcap) * 100;
                const globalIdx = topCoins.indexOf(c);
                const isHovered = hoveredIdx === globalIdx;
                const isSelected = selectedCoin?.symbol === c.symbol;
                const isLarge = ri < 2 && ci < 3;

                return (
                  <div
                    key={c.symbol}
                    onMouseEnter={() => setHoveredIdx(globalIdx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setSelectedCoin(isSelected ? null : c)}
                    style={{
                      width: `${widthPct}%`,
                      minWidth: 0,
                      background: chg >= 0
                        ? `rgba(52,211,153,${intensity})`
                        : `rgba(248,113,113,${intensity})`,
                      border: isSelected
                        ? '1px solid var(--accent)'
                        : isHovered
                          ? `1px solid ${chg >= 0 ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)'}`
                          : '1px solid transparent',
                      borderRadius: 2,
                      padding: '4px 5px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                      zIndex: isHovered ? 2 : 1,
                      boxShadow: isHovered
                        ? `0 0 16px ${chg >= 0 ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}` : 'none',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--mono)',
                      fontSize: isLarge ? 12 : 9,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '0.04em',
                      lineHeight: 1,
                    }}>{c.symbol}</div>
                    <div style={{
                      fontFamily: 'var(--mono)',
                      fontSize: isLarge ? 11 : 8,
                      fontWeight: 600,
                      color: chg >= 0 ? '#6ee7b7' : '#fca5a5',
                      lineHeight: 1.3,
                    }}>
                      <AnimPrice value={chg} format="pct" />
                    </div>
                    {isLarge && (
                      <div style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 16,
                        color: 'rgba(255,255,255,0.6)',
                        lineHeight: 1.3,
                      }}>
                        <AnimPrice value={c.price} format="price" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredIdx !== null && topCoins[hoveredIdx] && (
        <div style={{
          position: 'absolute',
          bottom: 6,
          left: 8,
          right: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '5px 10px',
          background: 'rgba(10,10,10,0.92)',
          border: '1px solid var(--b3)',
          borderRadius: 3,
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          fontFamily: 'var(--mono)',
        }}>
          {topCoins[hoveredIdx].image && (
            <img src={topCoins[hoveredIdx].image} alt="" width={18} height={18} style={{ borderRadius: 2 }} />
          )}
          <span style={{ fontSize: 16, color: 'var(--text)', fontWeight: 600 }}>{topCoins[hoveredIdx].name}</span>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{topCoins[hoveredIdx].symbol}</span>
          <span style={{ fontSize: 16, color: 'var(--text)', marginLeft: 'auto' }}>
            <AnimPrice value={topCoins[hoveredIdx].price} format="price" />
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: topCoins[hoveredIdx].percent_change_24h >= 0 ? 'var(--green)' : 'var(--red)',
          }}>
            <AnimPrice value={topCoins[hoveredIdx].percent_change_24h} format="pct" />
          </span>
          <span style={{ fontSize: 16, color: 'var(--muted)' }}>MCap {fmtUsd(topCoins[hoveredIdx].market_cap, 1)}</span>
          <span style={{ fontSize: 16, color: 'var(--muted)' }}>Vol {fmtUsd(topCoins[hoveredIdx].volume_24h, 1)}</span>
        </div>
      )}

      {/* Selected coin detail panel */}
      {selectedCoin && (
        <div style={{
          marginTop: 6,
          padding: '8px 12px',
          background: 'rgba(232,165,52,0.03)',
          border: '1px solid var(--accent-border)',
          borderRadius: 3,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr',
          gap: '4px 16px',
          alignItems: 'center',
          fontFamily: 'var(--mono)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {selectedCoin.image && <img src={selectedCoin.image} alt="" width={20} height={20} style={{ borderRadius: 2 }} />}
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700 }}>{selectedCoin.name}</div>
              <div style={{ fontSize: 16, color: 'var(--muted)' }}>#{selectedCoin.cmc_rank}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>PRICE</div>
            <div style={{ fontSize: 16, color: 'var(--text)', fontWeight: 600 }}><AnimPrice value={selectedCoin.price} /></div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>24H</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: selectedCoin.percent_change_24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
              <AnimPrice value={selectedCoin.percent_change_24h} format="pct" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>MCAP</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>{fmtUsd(selectedCoin.market_cap, 1)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>VOL 24H</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>{fmtUsd(selectedCoin.volume_24h, 1)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ETF Flows (live from Supabase + fallback) ── */
function ETFFlows() {
  const [flows, setFlows] = useState<{ fund_name: string; ticker: string; issuer: string; flow: number }[]>([]);
  const [netFlow, setNetFlow] = useState<number | null>(null);
  const [flowDate, setFlowDate] = useState<string>('');
  const [live, setLive] = useState(false);

  useEffect(() => {
    fetch('/api/etf-flows').then(r => r.json()).then(d => {
      if (d.flows && d.flows.length > 0) {
        const grouped: Record<string, { fund_name: string; ticker: string; issuer: string; flow: number }> = {};
        for (const f of d.flows) {
          const key = f.ticker || f.fund_name;
          if (!grouped[key]) grouped[key] = { fund_name: f.fund_name, ticker: f.ticker, issuer: f.issuer || f.ticker, flow: 0 };
          grouped[key].flow += (f.flow_usd_millions ?? 0);
        }
        const sorted = Object.values(grouped).sort((a, b) => Math.abs(b.flow) - Math.abs(a.flow)).slice(0, 6);
        setFlows(sorted);
        setNetFlow(sorted.reduce((s, f) => s + f.flow, 0));
        setFlowDate(d.flows[0]?.date || '');
        setLive(true);
      }
    }).catch(() => {});
  }, []);

  // Fallback if API returns nothing
  const displayFlows = flows.length > 0 ? flows : [
    { fund_name: 'iShares Bitcoin Trust', ticker: 'IBIT', issuer: 'BlackRock', flow: 224.1 },
    { fund_name: 'Wise Origin Bitcoin', ticker: 'FBTC', issuer: 'Fidelity', flow: 88.3 },
    { fund_name: 'ARK 21Shares Bitcoin', ticker: 'ARKB', issuer: 'Ark/21Shares', flow: 31.2 },
    { fund_name: 'Bitwise Bitcoin ETF', ticker: 'BITB', issuer: 'Bitwise', flow: 18.4 },
    { fund_name: 'Grayscale Bitcoin Trust', ticker: 'GBTC', issuer: 'Grayscale', flow: -174.0 },
  ];
  const displayNet = netFlow ?? displayFlows.reduce((s, f) => s + f.flow, 0);

  return (
    <div className="panel panel-hover">
      <div className="ph">
        <div className="pt">Bitcoin ETF Daily Flows{flowDate ? ` · ${flowDate}` : ''}</div>
        <div className="tag tag-live">
          <span style={{ marginRight: 4, color: live ? 'var(--green)' : 'var(--gold)', fontSize: 7 }}>●</span>
          {live ? 'LIVE' : 'CACHED'} · <a className="src-link" href="https://farside.co.uk/bitcoin-etf-flow-all-data/" target="_blank" rel="noopener noreferrer">Farside</a>
        </div>
      </div>
      {displayFlows.map(f => (
        <div key={f.ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid var(--b1)', transition: 'background 0.15s', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          onClick={() => {
            const ctx = (window as any).__ciInsightCtx;
            if (ctx) ctx.openInsight({ type: 'etf', title: f.fund_name, subtitle: `${f.issuer} · ${f.ticker}`, data: { flow: `${f.flow >= 0 ? '+' : '−'}$${Math.abs(f.flow).toFixed(1)}M`, ticker: f.ticker, issuer: f.issuer } });
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--text)' }}>{f.fund_name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', letterSpacing: '0.08em' }}>{f.issuer.toUpperCase()} · {f.ticker}</div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: f.flow >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {f.flow >= 0 ? '+' : '−'}${Math.abs(f.flow).toFixed(1)}M
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(232,165,52,0.04)', borderTop: '1px solid var(--b2)' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--muted)', letterSpacing: '0.08em' }}>Net Flow · All BTC ETFs</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: displayNet >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {displayNet >= 0 ? '+' : '−'}${Math.abs(displayNet).toFixed(1)}M
        </span>
      </div>
    </div>
  );
}

/* ── ChainScore (live from Supabase + fallback) ── */
function ChainScore() {
  const [scores, setScores] = useState<{ sym: string; name: string; score: number; band: string }[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    fetch('/api/chainscore?all=true').then(r => r.json()).then(d => {
      if (d.ratings && d.ratings.length > 0) {
        const sorted = d.ratings
          .map((r: any) => ({ sym: r.asset_symbol, name: r.asset_name || r.asset_symbol, score: r.total_score ?? 0, band: r.score_band || '' }))
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 7);
        setScores(sorted);
        setLive(true);
      }
    }).catch(() => {});
  }, []);

  const displayScores = scores.length > 0 ? scores : [
    { sym: 'BTC', name: 'Bitcoin', score: 92, band: 'Institutional Grade' },
    { sym: 'ETH', name: 'Ethereum', score: 87, band: 'Investment Grade' },
    { sym: 'XRP', name: 'XRP', score: 79, band: 'Investment Grade' },
    { sym: 'HBAR', name: 'HBAR', score: 74, band: 'Speculative Grade' },
    { sym: 'QNT', name: 'Quant', score: 71, band: 'Speculative Grade' },
    { sym: 'SOL', name: 'Solana', score: 68, band: 'Speculative Grade' },
    { sym: 'XLM', name: 'Stellar', score: 64, band: 'Speculative Grade' },
  ];

  function bandColor(score: number): string {
    if (score >= 90) return 'var(--green)';
    if (score >= 75) return 'var(--accent)';
    if (score >= 60) return 'var(--blue)';
    return 'var(--muted)';
  }

  return (
    <div className="panel panel-hover">
      <div className="ph">
        <div className="pt">ChainScore™ — Top Rated</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div className="tag" style={{ background: 'rgba(232,165,52,0.08)', color: 'var(--accent)' }}>v1.0</div>
          {live && <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)' }}>● LIVE</span>}
        </div>
      </div>
      {displayScores.map((s, i) => (
        <div key={s.sym} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderBottom: '1px solid var(--b1)', transition: 'background 0.15s', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          onClick={() => {
            const ctx = (window as any).__ciInsightCtx;
            if (ctx) ctx.openInsight({ type: 'chainscore', title: s.name, subtitle: `ChainScore™ · ${s.sym}`, data: { score: `${s.score}/100`, band: s.band, rank: `#${i + 1}` } });
          }}
        >
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', width: 20 }}>{String(i + 1).padStart(2, '0')}</span>
          <div style={{ flex: '0 0 90px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--text)' }}>{s.name}</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>{s.sym}</span>
          </div>
          <div style={{ flex: 1, height: 6, background: 'var(--b3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${s.score}%`, height: '100%', background: `linear-gradient(90deg, ${bandColor(s.score)}, var(--accent))`, borderRadius: 3, transition: 'width 0.8s ease' }} />
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: bandColor(s.score), width: 30, textAlign: 'right' }}>{s.score}</span>
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
    <div className="panel panel-hover">
      <div className="ph">
        <div className="pt">Top Assets by Market Cap</div>
        <div className="tag tag-live">
          <span style={{ marginRight: 4, color: sourceColor(source), fontSize: 7 }}>●</span>
          {sourceLabel(source)} · <a className="src-link" href="https://coinmarketcap.com" target="_blank" rel="noopener noreferrer">CoinMarketCap</a>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--b2)' }}>
            <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text2)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>#</th>
            <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text2)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>ASSET</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text2)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>PRICE</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text2)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>24H</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text2)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>7D</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text2)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>MCAP</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text2)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>VOL 24H</th>
            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text2)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600 }}>SIGNAL</th>
          </tr>
        </thead>
        <tbody>
          {topAssets.map(a => {
            const sig = getSignal(a);
            const d1 = a.percent_change_24h;
            const d7 = a.percent_change_7d;
            return (
              <tr key={a.symbol} style={{ borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,165,52,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  onClick={() => {
                    const ctx = (window as any).__ciInsightCtx;
                    if (ctx) ctx.openInsight({ type: 'asset', title: a.name, subtitle: a.symbol, data: { price: fmtPrice(a.price), '24h': `${a.percent_change_24h >= 0 ? '+' : ''}${a.percent_change_24h.toFixed(2)}%`, '7d': `${a.percent_change_7d >= 0 ? '+' : ''}${a.percent_change_7d.toFixed(2)}%`, mcap: fmtUsd(a.market_cap, 1), volume: fmtUsd(a.volume_24h, 1), signal: sig.label } });
                  }}>
                <td style={{ padding: '6px 10px', color: 'var(--muted)', fontSize: 11 }}>{a.cmc_rank}</td>
                <td style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {a.image && <img src={a.image} alt={a.symbol} width={16} height={16} style={{ borderRadius: 2 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{a.name}</span>
                  <span style={{ fontSize: 16, color: 'var(--muted)' }}>{a.symbol}</span>
                </td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text)' }}>{fmtPrice(a.price)}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: d1 >= 0 ? 'var(--green)' : 'var(--red)' }}>{d1 >= 0 ? '+' : ''}{d1.toFixed(2)}%</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: d7 >= 0 ? 'var(--green)' : 'var(--red)' }}>{d7 >= 0 ? '+' : ''}{d7.toFixed(2)}%</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{fmtUsd(a.market_cap, 1)}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px', color: 'var(--text2)' }}>{fmtUsd(a.volume_24h, 1)}</td>
                <td style={{ textAlign: 'right', padding: '5px 8px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 16, padding: '2px 6px', border: `1px solid ${sig.color}`, color: sig.color, letterSpacing: '0.06em' }}>
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

/* ── Whale Feed (LIVE from /api/whales) ── */
function WhaleFeed() {
  const [whales, setWhales] = useState<{ dir: string; amt: string; asset: string; route: string; age: string; color: string }[]>([
    { dir: 'BUY', amt: '$48.2M', asset: '12,456 ETH', route: 'Unknown → Binance', age: '2m ago', color: 'var(--green)' },
    { dir: 'XFER', amt: '$122.4M', asset: '1,400 BTC', route: 'Cold wallet → Cold wallet', age: '7m ago', color: 'var(--blue)' },
    { dir: 'SELL', amt: '$31.8M', asset: '22.4M XRP', route: 'Kraken → Unknown', age: '12m ago', color: 'var(--red)' },
    { dir: 'BUY', amt: '$89.6M', asset: '1,024 BTC', route: 'Unknown → Coinbase Pro', age: '19m ago', color: 'var(--green)' },
  ]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/whales');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.transactions?.length) {
          const mapped = data.transactions.slice(0, 4).map((tx: any) => {
            const amt = tx.amount_usd ?? tx.amountUsd ?? 0;
            const sym = (tx.symbol || tx.asset || 'BTC').toUpperCase();
            const from = tx.from?.owner || tx.from_label || 'Unknown';
            const to = tx.to?.owner || tx.to_label || 'Unknown';
            const dir = to.toLowerCase().includes('exchange') || to.toLowerCase().includes('binance') || to.toLowerCase().includes('coinbase') ? 'SELL'
              : from.toLowerCase().includes('exchange') || from.toLowerCase().includes('binance') ? 'BUY'
              : 'XFER';
            const dirColor = dir === 'BUY' ? 'var(--green)' : dir === 'SELL' ? 'var(--red)' : 'var(--blue)';
            const ageMs = Date.now() - (tx.timestamp ? tx.timestamp * 1000 : Date.now());
            const ageMins = Math.max(1, Math.round(ageMs / 60000));
            const ageStr = ageMins < 60 ? `${ageMins}m ago` : `${Math.round(ageMins / 60)}h ago`;
            return {
              dir,
              amt: `$${(amt / 1e6).toFixed(1)}M`,
              asset: `${sym}`,
              route: `${from} → ${to}`,
              age: ageStr,
              color: dirColor,
            };
          });
          setWhales(mapped);
          setIsLive(true);
        }
      } catch { /* keep fallback */ }
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <div className="ph live-shimmer-border" style={{ marginTop: 8 }}>
        <div className="pt">Live Whale Alerts</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="tag" style={{ background: 'rgba(232,165,52,0.08)', color: 'var(--accent)' }}>
            {isLive && <span style={{ color: 'var(--green)', fontSize: 10, marginRight: 4 }}>●</span>}
            <a className="src-link" href="https://whale-alert.io" target="_blank" rel="noopener noreferrer">Whale Alert API</a>
          </div>
        </div>
      </div>
      {whales.map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--b1)', cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--s2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          onClick={() => {
            const ctx = (window as any).__ciInsightCtx;
            if (ctx) ctx.openInsight({ type: 'whale', title: w.asset, subtitle: `${w.dir} · ${w.amt}`, data: { direction: w.dir, amount: w.amt, route: w.route, time: w.age } });
          }}
        >
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: w.color, padding: '3px 6px', border: `1px solid ${w.color}`, borderRadius: 2, letterSpacing: '0.06em', minWidth: 38, textAlign: 'center', flexShrink: 0 }}>{w.dir}</span>
          <div style={{ minWidth: 80 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{w.amt}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{w.asset}</div>
          </div>
          <div style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{w.route}</div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{w.age}</span>
          <a href="https://whale-alert.io" target="_blank" rel="noopener noreferrer" className="src-link" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', opacity: 0.7, flexShrink: 0 }}>TX ↗</a>
        </div>
      ))}
      {/* Customize alerts CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderTop: '1px solid var(--b2)', background: 'rgba(232,165,52,0.02)' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.04em' }}>
          Tracking transactions &gt;$10M · BTC ETH XRP SOL
        </span>
        <button
          onClick={() => {
            const btn = document.querySelector('[data-tour="alert-btn"]') as HTMLElement;
            if (btn) btn.click();
          }}
          style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', background: 'rgba(232,165,52,0.08)', border: '1px solid rgba(232,165,52,0.2)', padding: '4px 12px', cursor: 'pointer', borderRadius: 2, letterSpacing: '0.06em', fontWeight: 600 }}
        >
          ⚙ CUSTOMIZE ALERTS
        </button>
      </div>
    </>
  );
}

/* ── Bloomberg Callout ── */
function BloombergCallout() {
  const features = ['On-chain analytics', 'Top 100 live prices', 'Whale surveillance', 'DeFi intelligence', 'ISO 20022 tracking', 'AI synthesis layer'];
  return (
    <div style={{ margin: '12px 0 0', background: 'linear-gradient(90deg,rgba(239,68,68,0.06),rgba(107,138,255,0.06))', border: '1px solid rgba(107,138,255,0.15)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 16, letterSpacing: '0.14em', color: 'var(--blue)', flexShrink: 0 }}>BLOOMBERG CANNOT DO THIS ↓</span>
      {features.map(f => (
        <span key={f} style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text2)' }}>{f} <span style={{ color: 'var(--red)' }}>✗ Bloomberg</span></span>
      ))}
      <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--muted)', marginLeft: 'auto', flexShrink: 0 }}>Bloomberg: $24K–$32K/yr · ChainIntel: from $0</span>
    </div>
  );
}

/* ── Live Fear & Greed KPI ── */
function LiveFngKpi() {
  const [fng, setFng] = useState<{ value: number; label: string } | null>(null);
  useEffect(() => {
    const load = () => fetch('/api/sentiment').then(r => r.json()).then(d => {
      if (d?.fearGreed) setFng({ value: d.fearGreed.value, label: d.fearGreed.label });
    }).catch(() => {});
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, []);
  const val = fng?.value ?? 13;
  const label = fng?.label ?? 'Extreme Fear';
  const color = val <= 25 ? 'var(--red)' : val <= 50 ? 'var(--gold)' : val <= 75 ? 'var(--green)' : 'var(--accent)';
  return <KPI label="Fear & Greed Index" value={String(val)} change={`${label} (${val}/100)${val <= 20 ? ' \u00b7 Historic low' : ''}`} changeDir={val > 50 ? 'up' : 'dn'} color={color} source={`<span style="color:${fng ? 'var(--green)' : 'var(--gold)'};font-size:7px">\u25cf</span> ${fng ? 'LIVE' : 'CACHED'} \u00b7 <a class="src-link" href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank">Fear &amp; Greed Index</a>`} />;
}

/* ── Live DeFi TVL KPI ── */
function LiveDefiKpi() {
  const [tvl, setTvl] = useState<{ totalTvl: number; protocolCount: number } | null>(null);
  useEffect(() => {
    fetch('/api/defi-overview').then(r => r.json()).then(d => {
      if (d?.totalTvl) setTvl({ totalTvl: d.totalTvl, protocolCount: d.protocolCount || 6400 });
    }).catch(() => {});
  }, []);
  const val = tvl ? fmtUsd(tvl.totalTvl, 1) : '$85.0B';
  return <KPI label="Total DeFi TVL" value={val} change={tvl ? `${tvl.protocolCount.toLocaleString()}+ protocols` : '6,400+ protocols'} changeDir="dn" source={`<span style="color:${tvl ? 'var(--green)' : 'var(--gold)'};font-size:7px">\u25cf</span> ${tvl ? 'LIVE' : 'CACHED'} \u00b7 <a class="src-link" href="https://defillama.com" target="_blank">DefiLlama</a>`} />;
}

/* ── Live KPI Row (powered by shared CMC data) ── */
function LiveKPIs() {
  const { coins, global, source } = useContext(CmcContext);
  const btc = coins.find(c => c.symbol === 'BTC');

  const totalMcap = global?.total_market_cap ?? LOADING_GLOBAL.total_market_cap;
  const mcapChg = global?.total_market_cap_yesterday_percentage_change ?? LOADING_GLOBAL.total_market_cap_yesterday_percentage_change;
  const btcDom = global?.btc_dominance ?? LOADING_GLOBAL.btc_dominance;

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
      <LiveFngKpi />
      <LiveDefiKpi />
    </div>
  );
}

/* ── AI MARKET SYNTHESIS (module-level cache) ── */
let _synthCache: { text: string; ts: number } | null = null;
const SYNTH_TTL = 5 * 60 * 1000; // 5 minutes

function AiMarketSynthesis() {
  const [text, setText] = useState<string | null>(_synthCache && Date.now() - _synthCache.ts < SYNTH_TTL ? _synthCache.text : null);
  const [loading, setLoading] = useState(!text);

  useEffect(() => {
    if (text) return; // already have fresh cache
    let cancelled = false;
    setLoading(true);
    fetch('/api/ask-ci', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Give a 2-sentence market synthesis for the Overview dashboard. Include BTC price, fear and greed score, and the most important signal right now.' }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((json) => {
        if (cancelled) return;
        const raw: string = json.answer ?? json.text ?? json.response ?? '';
        // Convert **bold** markers to <strong> tags
        const html = raw.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>');
        _synthCache = { text: html, ts: Date.now() };
        setText(html);
      })
      .catch(() => { if (!cancelled) setText(''); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          height: '14px',
          background: 'linear-gradient(90deg, var(--s1) 25%, var(--s2) 50%, var(--s1) 75%)',
          backgroundSize: '200% 100%',
          animation: 'pulseShimmer 1.4s infinite linear',
          borderRadius: '2px',
          width: '90%',
        }} />
        <div style={{
          height: '14px',
          background: 'linear-gradient(90deg, var(--s1) 25%, var(--s2) 50%, var(--s1) 75%)',
          backgroundSize: '200% 100%',
          animation: 'pulseShimmer 1.4s infinite linear',
          borderRadius: '2px',
          width: '75%',
        }} />
      </div>
    );
  }

  if (!text) {
    return (
      <div style={{ padding: '0 12px 8px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
        Market synthesis updating...
      </div>
    );
  }

  return (
    <div
      style={{ padding: '0 12px 8px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

/* ── MAIN OVERVIEW TAB ── */
export default function OverviewTab() {
  const cmcData = useCmcData();
  const { isOpen, context, openInsight, closeInsight } = useInsightDrawer();

  // Show skeleton overlay for first 2 seconds while data loads
  const [showSkeleton, setShowSkeleton] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 2000);
    return () => clearTimeout(t);
  }, []);

  // Expose insight context globally for child components
  useEffect(() => {
    (window as any).__ciInsightCtx = { openInsight };
    return () => { delete (window as any).__ciInsightCtx; };
  }, [openInsight]);

  return (
    <CmcContext.Provider value={cmcData}>
    <InsightContext.Provider value={{ openInsight }}>
    <div style={{ position: 'relative' }}>
      {/* Loading skeleton overlay — shown for 2s while live data arrives */}
      {showSkeleton && cmcData.source === 'static' && (
        <div className="connecting-indicator" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 0 6px',
          fontFamily: 'var(--mono)', fontSize: '7px',
          color: 'var(--muted)', letterSpacing: '0.12em',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', display: 'inline-block',
            animation: 'connectingPulse 2s infinite',
          }} />
          CONNECTING...
        </div>
      )}
      <AiStrip />
      <QuickGuide />
      <DailyBriefCard />
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

      {/* CI Signal — Cross-Source Correlation Engine */}
      <CorrelationEngine />

      {/* Smart Alerts (compact) */}
      <SmartAlerts compact />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--b1)', marginBottom: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <ChainScore />
        </div>
        <div className="panel panel-hover">
          <div className="ph"><div className="pt">AI Market Synthesis</div><div className="tag" style={{ background: 'rgba(232,165,52,0.08)', color: 'var(--accent)' }}>ChainIntel AI</div></div>
          <AiMarketSynthesis />
          <WhaleFeed />
        </div>
      </div>



      <TokenUnlocks />
      <BloombergCallout />
    </div>
    <InsightDrawer isOpen={isOpen} onClose={closeInsight} context={context} />
    </InsightContext.Provider>
    </CmcContext.Provider>
  );
}
