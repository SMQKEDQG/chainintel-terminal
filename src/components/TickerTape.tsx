'use client';

import { useState, useEffect, useRef } from 'react';
import { TICKER_ASSETS } from '@/lib/constants';

interface TickerItem {
  sym: string;
  price: string;
  chg: number;
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrices() {
      // Try CMC proxy first
      try {
        const res = await fetch('/api/cmc?endpoint=/v1/cryptocurrency/listings/latest&limit=200&sort=market_cap&convert=USD');
        if (res.ok) {
          const json = await res.json();
          const data = json.data?.data || [];
          if (data.length > 0 && !cancelled) {
            setItems(cmcToTickerItems(data));
            return;
          }
        }
      } catch { /* fall through to CoinGecko */ }

      // Fallback: CoinGecko
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
    const id = setInterval(fetchPrices, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const renderItem = (item: TickerItem, i: number) => (
    <div key={i} className="flex items-center gap-2 px-4 whitespace-nowrap">
      <span className="font-mono text-[9px] font-medium" style={{ color: 'var(--text)' }}>{item.sym}</span>
      <span className="font-mono text-[9px]" style={{ color: 'var(--text2)' }}>{item.price}</span>
      <span
        className="font-mono text-[8px]"
        style={{ color: item.chg >= 0 ? 'var(--green)' : 'var(--red)' }}
      >
        {item.chg >= 0 ? '+' : ''}{item.chg.toFixed(2)}%
      </span>
    </div>
  );

  return (
    <div
      className="overflow-hidden border-b"
      style={{ background: 'var(--s1)', borderColor: 'var(--b1)', height: 28 }}
    >
      <div ref={containerRef} className="flex items-center h-full ticker-track">
        {/* Duplicate for seamless scroll */}
        {items.map((item, i) => renderItem(item, i))}
        {items.map((item, i) => renderItem(item, i + items.length))}
      </div>
    </div>
  );
}
