'use client';

import { useState, useEffect, useRef } from 'react';
import { TICKER_ASSETS } from '@/lib/constants';

interface TickerItem {
  sym: string;
  price: string;
  chg: number;
}

export default function TickerTape() {
  const [items, setItems] = useState<TickerItem[]>(
    TICKER_ASSETS.map(a => ({ sym: a.sym, price: '—', chg: 0 }))
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const ids = TICKER_ASSETS.map(a => a.id).join(',');
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        if (!res.ok) return;
        const data = await res.json();
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
      } catch {}
    }
    fetchPrices();
    const id = setInterval(fetchPrices, 60000);
    return () => clearInterval(id);
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
