'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ── Command Palette — Ctrl+K quick navigation and search ── */

interface CommandItem {
  id: string;
  label: string;
  description: string;
  category: 'navigation' | 'action' | 'search';
  icon: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-overview', label: 'Overview', description: 'Market dashboard & intelligence brief', category: 'navigation', icon: '◉', action: () => onNavigate('overview'), keywords: ['home', 'dashboard', 'main'] },
    { id: 'nav-markets', label: 'Markets', description: 'Top 100 assets by market cap', category: 'navigation', icon: '📊', action: () => onNavigate('markets'), keywords: ['prices', 'coins', 'tokens', 'crypto'] },
    { id: 'nav-onchain', label: 'On-Chain Pro', description: 'On-chain metrics & network stats', category: 'navigation', icon: '⛓', action: () => onNavigate('onchain'), keywords: ['chain', 'network', 'hashrate'] },
    { id: 'nav-defi', label: 'DeFi Pro', description: 'TVL, yields, bridges, DEX volume', category: 'navigation', icon: '🏦', action: () => onNavigate('defi'), keywords: ['tvl', 'yield', 'dex', 'bridge'] },
    { id: 'nav-etfinst', label: 'ETF & Institutional', description: 'ETF flows, institutional data', category: 'navigation', icon: '🏛', action: () => onNavigate('etfinst'), keywords: ['etf', 'bitcoin', 'institutional', 'ibit', 'gbtc'] },
    { id: 'nav-regulatory', label: 'Regulatory', description: 'Regulatory intelligence feed', category: 'navigation', icon: '⚖️', action: () => onNavigate('regulatory'), keywords: ['sec', 'cftc', 'regulation', 'law'] },
    { id: 'nav-iso', label: 'ISO 20022', description: 'ISO-native ledger tracking', category: 'navigation', icon: '🏦', action: () => onNavigate('iso'), keywords: ['swift', 'iso', 'banking'] },
    { id: 'nav-sentiment', label: 'Sentiment Pro', description: 'Fear & Greed, social sentiment', category: 'navigation', icon: '🧠', action: () => onNavigate('sentiment'), keywords: ['fear', 'greed', 'social', 'reddit'] },
    { id: 'nav-derivatives', label: 'Derivatives Pro', description: 'Funding rates, open interest', category: 'navigation', icon: '📈', action: () => onNavigate('derivatives'), keywords: ['funding', 'oi', 'perps', 'futures'] },
    { id: 'nav-whales', label: 'Whales Pro', description: 'Whale alerts & ChainScore ratings', category: 'navigation', icon: '🐋', action: () => onNavigate('whales'), keywords: ['whale', 'chainscore', 'large'] },
    { id: 'nav-portfolio', label: 'Portfolio', description: 'Portfolio models & allocation', category: 'navigation', icon: '💼', action: () => onNavigate('portfolio'), keywords: ['portfolio', 'allocation', 'model'] },
    { id: 'nav-pricing', label: 'Pricing', description: 'Pro & Enterprise plans', category: 'navigation', icon: '💳', action: () => onNavigate('pricing'), keywords: ['pricing', 'upgrade', 'pro', 'subscribe'] },
    // Actions
    { id: 'act-btc', label: 'BTC Price', description: 'Quick view Bitcoin price', category: 'action', icon: '₿', action: () => onNavigate('overview'), keywords: ['bitcoin', 'btc', 'price'] },
    { id: 'act-eth', label: 'ETH Price', description: 'Quick view Ethereum price', category: 'action', icon: 'Ξ', action: () => onNavigate('overview'), keywords: ['ethereum', 'eth'] },
    { id: 'act-fng', label: 'Fear & Greed Index', description: 'Current market sentiment', category: 'action', icon: '😨', action: () => onNavigate('sentiment'), keywords: ['fear', 'greed', 'sentiment'] },
    { id: 'act-etfflows', label: 'Today\'s ETF Flows', description: 'Check latest ETF inflow/outflow', category: 'action', icon: '💵', action: () => onNavigate('etfinst'), keywords: ['etf', 'flow', 'today'] },
  ];

  const filtered = query.trim()
    ? commands.filter(c => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.keywords?.some(k => k.includes(q))
        );
      })
    : commands;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const execute = useCallback((item: CommandItem) => {
    item.action();
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      execute(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filtered, selectedIndex, execute, onClose]);

  if (!isOpen) return null;

  const categories: Record<string, CommandItem[]> = {};
  for (const item of filtered) {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  }

  const categoryLabels: Record<string, string> = {
    navigation: 'NAVIGATE',
    action: 'QUICK ACTIONS',
    search: 'SEARCH',
  };

  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', zIndex: 100000, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Palette */}
      <div
        className="fixed"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 520,
          maxWidth: '90vw',
          maxHeight: '60vh',
          background: 'var(--s1)',
          border: '1px solid var(--accent)',
          borderRadius: 6,
          zIndex: 100001,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(232,165,52,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--b2)' }}>
          <span style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, navigate tabs..."
            className="flex-1 bg-transparent outline-none font-mono text-[11px]"
            style={{ color: 'var(--text)', caretColor: 'var(--accent)' }}
            autoComplete="off"
            spellCheck={false}
          />
          <span
            className="font-mono text-[8px] px-1.5 py-0.5 rounded"
            style={{ background: 'var(--s3)', color: 'var(--muted)', border: '1px solid var(--b3)' }}
          >
            ESC
          </span>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto py-1" style={{ maxHeight: 'calc(60vh - 60px)' }}>
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
              No results for "{query}"
            </div>
          ) : (
            Object.entries(categories).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-4 py-1.5 font-mono text-[7px] tracking-widest" style={{ color: 'var(--muted)' }}>
                  {categoryLabels[cat] || cat.toUpperCase()}
                </div>
                {items.map(item => {
                  const idx = flatIndex++;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => execute(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className="flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors"
                      style={{
                        background: isSelected ? 'rgba(232,165,52,0.08)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                      }}
                    >
                      <span style={{ fontSize: 14, width: 24, textAlign: 'center' }}>{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[10px] font-semibold" style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                          {item.label}
                        </div>
                        <div className="font-mono text-[8px]" style={{ color: 'var(--muted)' }}>
                          {item.description}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="font-mono text-[8px]" style={{ color: 'var(--accent)' }}>↵</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2 border-t font-mono text-[7px]"
          style={{ borderColor: 'var(--b2)', color: 'var(--muted)' }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>ESC close</span>
          <span style={{ marginLeft: 'auto', color: 'var(--accent)', opacity: 0.5 }}>CHAININTEL</span>
        </div>
      </div>
    </>
  );
}
