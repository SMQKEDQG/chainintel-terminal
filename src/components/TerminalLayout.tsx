'use client';

import { useState, useEffect, useCallback } from 'react';
import { TABS, VERSION, type TabId } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import TickerTape from './TickerTape';
import AlertPanel from './AlertPanel';
import StatusBar from './StatusBar';
import GuidedTour from './GuidedTour';
import CommandPalette from './CommandPalette';
import { SourceStatusBadge } from './LevelUpModules';
import Link from 'next/link';

const PRO_TAB_IDS = new Set(['onchain', 'defi', 'derivatives', 'alerts', 'sentiment']);

interface TerminalLayoutProps {
  children: React.ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function TerminalLayout({ children, activeTab, onTabChange }: TerminalLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const [clock, setClock] = useState('');
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

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
      setCmdPaletteOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Ticker Tape */}
      <div data-tour="ticker-tape">
        <TickerTape />
      </div>

      {/* Topbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ background: 'var(--s1)', borderColor: 'var(--b1)', zIndex: 9999, position: 'sticky', top: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none" aria-label="ChainIntel Logo">
            {/* Diamond lattice — precision intelligence mark */}
            {/* Outer diamond */}
            <path d="M18 2 L34 18 L18 34 L2 18 Z" 
              stroke="var(--accent)" strokeWidth="1.2" fill="none" />
            {/* Inner diamond */}
            <path d="M18 9 L27 18 L18 27 L9 18 Z" 
              stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.5" />
            {/* Center filled diamond */}
            <path d="M18 14 L22 18 L18 22 L14 18 Z" 
              fill="var(--accent)" opacity="0.9" />
            {/* Cross hair lines */}
            <line x1="18" y1="2" x2="18" y2="34" stroke="var(--accent)" strokeWidth="0.5" opacity="0.2" />
            <line x1="2" y1="18" x2="34" y2="18" stroke="var(--accent)" strokeWidth="0.5" opacity="0.2" />
            {/* Corner accent dots */}
            <circle cx="18" cy="2" r="1.5" fill="var(--accent)" />
            <circle cx="34" cy="18" r="1.5" fill="var(--accent)" />
            <circle cx="18" cy="34" r="1.5" fill="var(--accent)" />
            <circle cx="2" cy="18" r="1.5" fill="var(--accent)" />
          </svg>
          <div
            className="tour-title-btn"
            onClick={() => setTourOpen(true)}
            title="Click for guided tour"
          >
            <div className="text-sm font-bold tracking-[0.16em]" style={{ color: 'var(--accent)', fontFamily: 'var(--sans)' }}>
              CHAININTEL
            </div>
            <div className="font-mono text-[9px] tracking-widest" style={{ color: 'var(--muted)' }}>
              DIGITAL ASSET INTELLIGENCE · {VERSION}
              <span style={{ marginLeft: 6, color: 'var(--accent)', opacity: 0.4, fontSize: 6 }}>▶ TOUR</span>
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
                  className="font-mono text-[7px] tracking-wider px-2 py-1 border transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ color: 'var(--muted)', borderColor: 'var(--b3)', background: 'transparent' }}
                >
                  SIGN OUT
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="font-mono text-[8px] tracking-wider px-2.5 py-1 border transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ color: 'var(--muted)', borderColor: 'var(--b3)', textDecoration: 'none' }}
                >
                  SIGN IN
                </Link>
                <Link
                  href="/signup"
                  className="font-mono text-[8px] tracking-wider px-2.5 py-1 transition-opacity hover:opacity-80"
                  style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, textDecoration: 'none' }}
                >
                  SIGN UP
                </Link>
              </div>
            )
          )}
          <button
            data-tour="alert-btn"
            onClick={() => setAlertPanelOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2 py-1 border transition-colors hover:border-[var(--accent)]"
            style={{ borderColor: alertPanelOpen ? 'var(--accent)' : 'var(--b3)', background: alertPanelOpen ? 'rgba(232,165,52,0.06)' : 'transparent' }}
            title="Alert Engine"
          >
            <span style={{ fontSize: 10 }}>🔔</span>
            <span className="font-mono text-[7px] tracking-wider" style={{ color: alertPanelOpen ? 'var(--accent)' : 'var(--muted)' }}>ALERTS</span>
          </button>
          <div data-tour="live-indicator" className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full heartbeat" style={{ background: 'var(--green)' }} />
            <span className="font-mono text-[8px] tracking-wider live-breathe" style={{ color: 'var(--green)' }}>LIVE</span>
          </div>
          <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{clock}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav
        data-tour="tab-nav"
        className="flex items-center gap-0 overflow-x-auto border-b scrollbar-hide"
        style={{ background: 'var(--s1)', borderColor: 'var(--b1)', zIndex: 10000, position: 'sticky', top: 42, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            data-tour={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            title={tab.title}
            className="font-mono text-[9.5px] tracking-wider px-3.5 py-2.5 whitespace-nowrap border-b-2 transition-colors duration-150 hover:bg-[var(--s2)]"
            style={{
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--muted)',
              borderBottomColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              background: activeTab === tab.id ? 'rgba(232,165,52,0.04)' : undefined,
            }}
          >
            {tab.label}
            {PRO_TAB_IDS.has(tab.id) && <span className="tab-pro-badge">PRO</span>}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-3" style={{ background: 'var(--bg)' }}>
        {children}
      </main>

      {/* Footer links */}
      <footer
        className="flex items-center justify-between px-4 py-1 border-t font-mono text-[7px]"
        style={{ background: 'var(--s1)', borderColor: 'var(--b1)', color: 'var(--muted)', letterSpacing: '0.06em' }}
      >
        <div className="flex items-center gap-4">
          <span>CHAININTEL {VERSION}</span>
          <SourceStatusBadge />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a href="/deck" className="hover:text-[var(--accent)] transition-colors">PITCH DECK</a>
          <a href="/why-chainintel" className="hover:text-[var(--accent)] transition-colors">WHY CHAININTEL</a>
          <a href="/promo" className="hover:text-[var(--accent)] transition-colors">PROMO</a>
          <a href="/tos" className="hover:text-[var(--accent)] transition-colors">TERMS</a>
          <a href="/privacy" className="hover:text-[var(--accent)] transition-colors">PRIVACY</a>
        </div>
      </footer>

      {/* Live Status Bar */}
      <div data-tour="status-bar">
        <StatusBar />
      </div>

      {/* Alert Panel Slideout */}
      <AlertPanel isOpen={alertPanelOpen} onClose={() => setAlertPanelOpen(false)} />

      {/* Guided Tour */}
      <GuidedTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onSwitchTab={(tabId) => onTabChange(tabId as TabId)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onNavigate={(tabId) => { onTabChange(tabId as TabId); setCmdPaletteOpen(false); }}
      />
    </div>
  );
}
