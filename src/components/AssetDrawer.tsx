'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import Sparkline from './Sparkline';

interface AssetDetail {
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  rank: number;
  sparkline7d?: number[];
}

interface AssetDrillContextType {
  openAssetDrawer: (symbol: string) => void;
}

const AssetDrillContext = createContext<AssetDrillContextType>({ openAssetDrawer: () => {} });

export function useAssetDrill() { return useContext(AssetDrillContext); }

function getSignal(chg: number): { label: string; color: string } {
  if (chg > 3) return { label: 'STRONG BUY', color: 'var(--green)' };
  if (chg > 0) return { label: 'ACCUMULATE', color: 'var(--green)' };
  if (chg > -3) return { label: 'HOLD', color: 'var(--gold)' };
  return { label: 'WATCH', color: 'var(--muted)' };
}

function fmtPrice(n: number) {
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1) return '$' + n.toFixed(2);
  if (n >= 0.01) return '$' + n.toFixed(4);
  return '$' + n.toFixed(6);
}
function fmtMcap(n: number) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M';
  return '$' + n.toLocaleString();
}

function AssetDrawerPanel({ asset, onClose }: { asset: AssetDetail | null; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!asset) return null;

  const sig = getSignal(asset.change24h);
  const sparkColor = (asset.change7d || 0) >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 99998,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
    }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, maxWidth: '90vw',
          background: 'var(--s1)', borderLeft: '1px solid var(--b2)',
          overflowY: 'auto', animation: 'slideInRight 200ms ease-out',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {asset.image && (
            <img src={asset.image} alt="" width={28} height={28} style={{ borderRadius: '50%' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{asset.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em' }}>{asset.symbol} · RANK #{asset.rank}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        {/* Live Price */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
            {fmtPrice(asset.price)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: asset.change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}% 24h
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: (asset.change7d || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {(asset.change7d || 0) >= 0 ? '+' : ''}{(asset.change7d || 0).toFixed(2)}% 7d
            </span>
          </div>
        </div>

        {/* Sparkline Chart */}
        {asset.sparkline7d && asset.sparkline7d.length > 2 && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--b1)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 6 }}>7D PRICE TREND</div>
            <Sparkline data={asset.sparkline7d} color={sparkColor} width={320} height={60} />
          </div>
        )}

        {/* Key Metrics */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 10 }}>KEY METRICS</div>
          {[
            { label: 'Market Cap', value: fmtMcap(asset.marketCap) },
            { label: '24h Volume', value: fmtMcap(asset.volume24h) },
            { label: 'Vol/MCap', value: asset.marketCap > 0 ? (asset.volume24h / asset.marketCap * 100).toFixed(2) + '%' : '—' },
          ].map((m) => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{m.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* CI Signal */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>CI SIGNAL</div>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11, padding: '3px 10px',
            border: `1px solid ${sig.color}`, color: sig.color,
            letterSpacing: '0.08em',
          }}>{sig.label}</span>
        </div>

        {/* Quick Links */}
        <div style={{ padding: '14px 20px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 8 }}>QUICK LINKS</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <a href={`https://www.coingecko.com/en/coins/${asset.name.toLowerCase().replace(/\s+/g, '-')}`} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--blue)', padding: '3px 8px', border: '1px solid rgba(107,138,255,0.3)', textDecoration: 'none' }}>
              CoinGecko ↗
            </a>
            <a href={`https://coinpaprika.com/coin/${asset.symbol.toLowerCase()}-${asset.name.toLowerCase().replace(/\s+/g, '-')}/`} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--blue)', padding: '3px 8px', border: '1px solid rgba(107,138,255,0.3)', textDecoration: 'none' }}>
              CoinPaprika ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssetDrillProvider({ children }: { children: ReactNode }) {
  const [drawerSymbol, setDrawerSymbol] = useState<string | null>(null);
  const [asset, setAsset] = useState<AssetDetail | null>(null);

  const openAssetDrawer = useCallback((symbol: string) => {
    setDrawerSymbol(symbol.toUpperCase());
  }, []);

  useEffect(() => {
    if (!drawerSymbol) { setAsset(null); return; }
    let cancelled = false;
    fetch(`/api/market-data?limit=250&exclude_stablecoins=0`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const coin = data.coins?.find((c: any) => c.symbol?.toUpperCase() === drawerSymbol);
        if (coin) {
          // Generate synthetic sparkline from 7d change
          const pct7d = coin.percent_change_7d || 0;
          const syntheticSparkline = Array.from({ length: 7 }, (_, i) => {
            const progress = i / 6;
            return coin.price * (1 - (pct7d / 100) * (1 - progress) + (Math.sin(progress * Math.PI * 2) * pct7d / 200));
          });
          setAsset({
            symbol: coin.symbol,
            name: coin.name,
            image: coin.image,
            price: coin.price,
            change24h: coin.percent_change_24h || 0,
            change7d: coin.percent_change_7d || 0,
            marketCap: coin.market_cap || 0,
            volume24h: coin.volume_24h || 0,
            rank: coin.rank || 0,
            sparkline7d: syntheticSparkline,
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [drawerSymbol]);

  const closeDrawer = useCallback(() => { setDrawerSymbol(null); setAsset(null); }, []);

  return (
    <AssetDrillContext.Provider value={{ openAssetDrawer }}>
      {children}
      <AssetDrawerPanel asset={asset} onClose={closeDrawer} />
    </AssetDrillContext.Provider>
  );
}
