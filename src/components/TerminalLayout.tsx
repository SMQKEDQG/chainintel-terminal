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
          <svg width="28" height="32" viewBox="0 0 40 46" fill="none">
            <polygon points="20,2 37,11 37,35 20,44 3,35 3,11" stroke="var(--cyan)" strokeWidth="1.8" fill="none"/>
            <polygon points="20,8 30,14 30,32 20,38 10,32 10,14" stroke="var(--cyan)" strokeWidth="0.8" fill="none" opacity="0.5"/>
            <circle cx="20" cy="20" r="3" fill="var(--cyan)"/>
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
        <div className="flex items-center gap-4">
          <a href="/deck" className="hover:text-[var(--cyan)] transition-colors">PITCH DECK</a>
          <a href="/why-chainintel" className="hover:text-[var(--cyan)] transition-colors">WHY CHAININTEL</a>
          <a href="/promo" className="hover:text-[var(--cyan)] transition-colors">PROMO</a>
          <span>chainintelterminal.com</span>
        </div>
      </footer>
    </div>
  );
}
