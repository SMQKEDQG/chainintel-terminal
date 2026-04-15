'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { TICKER_ASSETS } from '@/lib/constants';

interface TickerItem {
  sym: string;
  price: string;
  chg: number;
  prevPrice?: string;
}

/* Map symbol → CMC data from the listings response */
function cmcToTickerItems(cmcData: any[]): TickerItem[] {
  const bySymbol = new Map<string, any>();
  for (const c of cmcData) {
    bySymbol.set((c.symbol as string).toUpperCase(), c);
  }
  return TICKER_ASSETS.map(a => {
    const c = bySymbol.get(a.sym);
    if (!c) return { sym: a.sym, price: '—', chg: 0 };
    const p = c.quote?.USD?.price ?? 0;
    const price = p >= 1000 ? p.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : p >= 1 ? p.toFixed(2)
      : p.toFixed(4);
    return { sym: a.sym, price: `$${price}`, chg: c.quote?.USD?.percent_change_24h ?? 0 };
  });
}

export default function TickerTape() {
  const [items, setItems] = useState<TickerItem[]>(
    TICKER_ASSETS.map(a => ({ sym: a.sym, price: '—', chg: 0 }))
  );
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'dn' | null>>({});
  const prevPrices = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchPrices() {
      try {
        const res = await fetch('/api/cmc?endpoint=/v1/cryptocurrency/listings/latest&limit=200&sort=market_cap&convert=USD');
        if (res.ok) {
          const json = await res.json();
          const data = json.data?.data || [];
          if (data.length > 0 && !cancelled) {
            const newItems = cmcToTickerItems(data);
            // Detect price changes for flash effect
            const newFlash: Record<string, 'up' | 'dn' | null> = {};
            for (const item of newItems) {
              const prev = prevPrices.current[item.sym];
              if (prev && prev !== item.price) {
                newFlash[item.sym] = item.price > prev ? 'up' : 'dn';
              }
              prevPrices.current[item.sym] = item.price;
            }
            if (Object.keys(newFlash).length > 0) {
              setFlashMap(newFlash);
              setTimeout(() => setFlashMap({}), 1200);
            }
            setItems(newItems);
            return;
          }
        }
      } catch { /* fall through to CoinGecko */ }

      try {
        const ids = TICKER_ASSETS.map(a => a.id).join(',');
        const res = await fetch(
          `/api/coingecko?path=/simple/price&ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const data = json.data || json;
        if (cancelled) return;
        setItems(
          TICKER_ASSETS.map(a => {
            const d = data[a.id];
            if (!d) return { sym: a.sym, price: '—', chg: 0 };
            const price = d.usd >= 1000 ? d.usd.toLocaleString('en-US', { maximumFractionDigits: 0 })
              : d.usd >= 1 ? d.usd.toFixed(2)
              : d.usd.toFixed(4);
            return { sym: a.sym, price: `$${price}`, chg: d.usd_24h_change || 0 };
          })
        );
      } catch { /* keep initial state */ }
    }

    fetchPrices();
    const id = setInterval(fetchPrices, 30000); // faster refresh: every 30s
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Build the repeated ticker content for seamless scroll
  const renderItem = (item: TickerItem, i: number) => {
    const flash = flashMap[item.sym];
    return (
      <div key={i} className="tick">
        <span className="tsym">{item.sym}</span>
        <span
          className="tprice"
          style={{
            transition: 'color 0.3s, text-shadow 0.3s',
            color: flash === 'up' ? 'var(--green)' : flash === 'dn' ? 'var(--red)' : undefined,
            textShadow: flash ? `0 0 8px ${flash === 'up' ? 'rgba(52,211,153,0.6)' : 'rgba(248,113,113,0.6)'}` : 'none',
          }}
        >
          {item.price}
        </span>
        <span className={item.chg >= 0 ? 'up' : 'dn'} style={{ fontSize: '10px' }}>
          {item.chg >= 0 ? '▲' : '▼'} {Math.abs(item.chg).toFixed(2)}%
        </span>
      </div>
    );
  };

  return (
    <div className="ticker">
      <div className="ticker-inner">
        {/* Triple the items for seamless infinite scroll */}
        {items.map((item, i) => renderItem(item, i))}
        {items.map((item, i) => renderItem(item, i + items.length))}
        {items.map((item, i) => renderItem(item, i + items.length * 2))}
      </div>
    </div>
  );
}
