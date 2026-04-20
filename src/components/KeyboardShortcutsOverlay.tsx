'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { category: 'NAVIGATION', items: [
    { keys: ['1–9, 0'], desc: 'Switch tabs (1=Overview … 0=Pricing)' },
    { keys: ['← →'], desc: 'Previous / next tab' },
    { keys: ['⌘K', '/'], desc: 'Open Command Palette' },
  ]},
  { category: 'ACTIONS', items: [
    { keys: ['?'], desc: 'Toggle this shortcuts panel' },
    { keys: ['Esc'], desc: 'Close any open panel or overlay' },
    { keys: ['R'], desc: 'Refresh current tab data' },
    { keys: ['F'], desc: 'Focus search (Markets tab)' },
  ]},
];

export default function KeyboardShortcutsOverlay({ isOpen, onClose }: KeyboardShortcutsOverlayProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--s1)', border: '1px solid var(--b2)',
          padding: '24px 28px', width: 380, maxWidth: '90vw',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.12em' }}>
            KEYBOARD SHORTCUTS
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>

        {SHORTCUTS.map((section) => (
          <div key={section.category} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: 8 }}>
              {section.category}
            </div>
            {section.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{item.desc}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {item.keys.map((k) => (
                    <span key={k} style={{
                      fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 7px',
                      background: 'var(--s3)', border: '1px solid var(--b3)',
                      color: 'var(--text)', letterSpacing: '0.04em',
                    }}>{k}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
          Press <span style={{ color: 'var(--accent)' }}>?</span> or <span style={{ color: 'var(--accent)' }}>ESC</span> to close
        </div>
      </div>
    </div>
  );
}
