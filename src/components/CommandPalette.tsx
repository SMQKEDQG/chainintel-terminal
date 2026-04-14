'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TABS, type TabId } from '@/lib/constants';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onTabChange: (tab: TabId) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  type: 'tab' | 'asset' | 'action';
  action: () => void;
  icon: string;
}

const QUICK_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', tab: 'markets' as TabId },
  { symbol: 'ETH', name: 'Ethereum', tab: 'markets' as TabId },
  { symbol: 'XRP', name: 'XRP', tab: 'iso' as TabId },
  { symbol: 'SOL', name: 'Solana', tab: 'markets' as TabId },
  { symbol: 'HBAR', name: 'Hedera', tab: 'iso' as TabId },
  { symbol: 'QNT', name: 'Quant', tab: 'iso' as TabId },
  { symbol: 'XLM', name: 'Stellar', tab: 'iso' as TabId },
  { symbol: 'ADA', name: 'Cardano', tab: 'iso' as TabId },
  { symbol: 'LINK', name: 'Chainlink', tab: 'markets' as TabId },
  { symbol: 'AVAX', name: 'Avalanche', tab: 'markets' as TabId },
  { symbol: 'DOT', name: 'Polkadot', tab: 'markets' as TabId },
  { symbol: 'ALGO', name: 'Algorand', tab: 'iso' as TabId },
];

export default function CommandPalette({ open, onClose, onTabChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build items list
  const buildItems = useCallback((): CommandItem[] => {
    const items: CommandItem[] = [];

    // Tab navigation
    for (const tab of TABS) {
      items.push({
        id: `tab-${tab.id}`,
        label: tab.label,
        description: tab.title,
        type: 'tab',
        action: () => { onTabChange(tab.id); onClose(); },
        icon: '⬡',
      });
    }

    // Quick asset search
    for (const asset of QUICK_ASSETS) {
      items.push({
        id: `asset-${asset.symbol}`,
        label: `${asset.symbol} — ${asset.name}`,
        description: `View in ${TABS.find(t => t.id === asset.tab)?.label || 'Markets'}`,
        type: 'asset',
        action: () => { onTabChange(asset.tab); onClose(); },
        icon: '◈',
      });
    }

    // Quick actions
    items.push({
      id: 'action-portfolio',
      label: 'Open Portfolio Tracker',
      description: 'Track your holdings with live P&L',
      type: 'action',
      action: () => { onTabChange('portfolio'); onClose(); },
      icon: '▸',
    });
    items.push({
      id: 'action-pricing',
      label: 'View Pricing Plans',
      description: 'Compare Free, Pro, and Enterprise',
      type: 'action',
      action: () => { onTabChange('pricing'); onClose(); },
      icon: '▸',
    });

    return items;
  }, [onTabChange, onClose]);

  const allItems = buildItems();

  // Filter by query
  const filtered = query.length === 0
    ? allItems.filter(i => i.type === 'tab') // Show tabs by default
    : allItems.filter(i => {
        const q = query.toLowerCase();
        return i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
      });

  // Reset selection when query changes
  useEffect(() => { setSelectedIdx(0); }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIdx]) {
      e.preventDefault();
      filtered[selectedIdx].action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', zIndex: 99999,
        }}
      />
      {/* Palette */}
      <div
        style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 560, background: 'var(--s1)',
          border: '1px solid var(--b3)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          zIndex: 100000, overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--b2)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--cyan)' }}>⬡</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tabs, assets, or actions..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)',
              letterSpacing: '0.02em',
            }}
          />
          <kbd style={{
            fontFamily: 'var(--mono)', fontSize: 8, padding: '2px 6px',
            background: 'var(--s3)', color: 'var(--muted)', border: '1px solid var(--b2)',
            letterSpacing: '0.06em',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 0' }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '20px 16px', textAlign: 'center',
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)',
            }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => item.action()}
                onMouseEnter={() => setSelectedIdx(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 16px', cursor: 'pointer',
                  background: idx === selectedIdx ? 'rgba(0,212,170,0.08)' : 'transparent',
                  borderLeft: idx === selectedIdx ? '2px solid var(--cyan)' : '2px solid transparent',
                  transition: 'background 100ms',
                }}
              >
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--cyan)',
                  width: 16, textAlign: 'center', flexShrink: 0,
                }}>
                  {item.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500,
                    color: idx === selectedIdx ? 'var(--cyan)' : 'var(--text)',
                    letterSpacing: '0.04em',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)',
                    letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.description}
                  </div>
                </div>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--muted)',
                  padding: '1px 5px', background: 'var(--s3)', border: '1px solid var(--b1)',
                  letterSpacing: '0.1em', flexShrink: 0,
                }}>
                  {item.type === 'tab' ? 'TAB' : item.type === 'asset' ? 'ASSET' : 'ACTION'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 16px', borderTop: '1px solid var(--b2)',
          fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--muted)',
          letterSpacing: '0.06em',
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
          <span style={{ marginLeft: 'auto' }}>ChainIntel Command</span>
        </div>
      </div>
    </>
  );
}
