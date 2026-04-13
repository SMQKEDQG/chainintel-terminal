'use client';

import { useState, useEffect, useCallback } from 'react';
import { TABS, VERSION, type TabId } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import TickerTape from './TickerTape';
import Link from 'next/link';

interface TerminalLayoutProps {
  children: React.ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function TerminalLayout({ children, activeTab, onTabChange }: TerminalLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/New_York' }) + ' EDT');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      // TODO: command palette
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Ticker Tape */}
      <TickerTape />

      {/* Topbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ background: 'var(--s1)', borderColor: 'var(--b1)', zIndex: 9999, position: 'sticky', top: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none" aria-label="ChainIntel Logo">
            {/* Hexagonal node network — data intelligence mark */}
            {/* Outer hexagon */}
            <path d="M18 3 L31 10.5 L31 25.5 L18 33 L5 25.5 L5 10.5 Z" 
              stroke="var(--cyan)" strokeWidth="1.5" fill="none" />
            {/* Inner data paths — three connecting lines through center */}
            <line x1="18" y1="3" x2="18" y2="33" stroke="var(--cyan)" strokeWidth="1" opacity="0.3" />
            <line x1="5" y1="10.5" x2="31" y2="25.5" stroke="var(--cyan)" strokeWidth="1" opacity="0.3" />
            <line x1="31" y1="10.5" x2="5" y2="25.5" stroke="var(--cyan)" strokeWidth="1" opacity="0.3" />
            {/* Center filled hexagon */}
            <path d="M18 13 L23 16 L23 22 L18 25 L13 22 L13 16 Z" 
              fill="var(--cyan)" opacity="0.9" />
            {/* Node dots at vertices */}
            <circle cx="18" cy="3" r="1.8" fill="var(--cyan)" />
            <circle cx="31" cy="10.5" r="1.8" fill="var(--cyan)" />
            <circle cx="31" cy="25.5" r="1.8" fill="var(--cyan)" />
            <circle cx="18" cy="33" r="1.8" fill="var(--cyan)" />
            <circle cx="5" cy="25.5" r="1.8" fill="var(--cyan)" />
            <circle cx="5" cy="10.5" r="1.8" fill="var(--cyan)" />
          </svg>
          <div>
            <div className="font-mono text-xs font-semibold tracking-wider" style={{ color: 'var(--cyan)' }}>
              CHAININTEL
            </div>
            <div className="font-mono text-[7px] tracking-widest" style={{ color: 'var(--muted)' }}>
              DIGITAL ASSET INTELLIGENCE · {VERSION}
            </div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-[8px] tracking-wider" style={{ color: 'var(--text2)' }}>
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="font-mono text-[7px] tracking-wider px-2 py-1 border transition-colors hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
                  style={{ color: 'var(--muted)', borderColor: 'var(--b3)', background: 'transparent' }}
                >
                  SIGN OUT
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="font-mono text-[8px] tracking-wider px-2.5 py-1 border transition-colors hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
                  style={{ color: 'var(--muted)', borderColor: 'var(--b3)', textDecoration: 'none' }}
                >
                  SIGN IN
                </Link>
                <Link
                  href="/signup"
                  className="font-mono text-[8px] tracking-wider px-2.5 py-1 transition-opacity hover:opacity-80"
                  style={{ background: 'var(--cyan)', color: '#000', fontWeight: 700, textDecoration: 'none' }}
                >
                  SIGN UP
                </Link>
              </div>
            )
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
            <span className="font-mono text-[8px] tracking-wider" style={{ color: 'var(--cyan)' }}>LIVE</span>
          </div>
          <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{clock}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav
        className="flex items-center gap-0 overflow-x-auto border-b"
        style={{ background: 'var(--s1)', borderColor: 'var(--b1)', zIndex: 10000, position: 'sticky', top: 42 }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.title}
            className="font-mono text-[9px] tracking-wider px-3.5 py-2.5 whitespace-nowrap border-b-2 transition-colors duration-150 hover:bg-[var(--s2)]"
            style={{
              color: activeTab === tab.id ? 'var(--cyan)' : 'var(--muted)',
              borderBottomColor: activeTab === tab.id ? 'var(--cyan)' : 'transparent',
              background: activeTab === tab.id ? 'rgba(0,212,170,0.04)' : undefined,
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-3" style={{ background: 'var(--bg)' }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        className="flex items-center justify-between px-4 py-1.5 border-t font-mono text-[8px]"
        style={{ background: 'var(--s1)', borderColor: 'var(--b1)', color: 'var(--muted)', letterSpacing: '0.06em' }}
      >
        <div className="flex items-center gap-4">
          <span>CHAININTEL {VERSION}</span>
          <span>89 SOURCES</span>
          <span>12 MODULES</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <a href="/deck" className="hover:text-[var(--cyan)] transition-colors">PITCH DECK</a>
          <a href="/why-chainintel" className="hover:text-[var(--cyan)] transition-colors">WHY CHAININTEL</a>
          <a href="/promo" className="hover:text-[var(--cyan)] transition-colors">PROMO</a>
          <a href="/tos" className="hover:text-[var(--cyan)] transition-colors">TERMS</a>
          <a href="/privacy" className="hover:text-[var(--cyan)] transition-colors">PRIVACY</a>
          <span className="hidden sm:inline">chainintelterminal.com</span>
        </div>
      </footer>
    </div>
  );
}
