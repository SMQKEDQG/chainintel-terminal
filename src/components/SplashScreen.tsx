'use client';

import { useEffect, useState, useRef } from 'react';

// Module-level flag: only show once per browser session
let _splashShown = false;
export function hasSplashBeenShown(): boolean { return _splashShown; }
export function markSplashShown(): void { _splashShown = true; }

interface SplashScreenProps { onComplete: () => void; }

/* ── Boot log lines — staggered terminal feel ── */
const BOOT_LINES = [
  { text: 'Initializing ChainIntel kernel...', color: '#5C5955', delay: 0 },
  { text: 'Loading market data engine', color: '#5C5955', delay: 200 },
  { text: '■■■■■■■■■■■■■■■■■■■■ 100%', color: '#E8A534', delay: 500 },
  { text: '14 live data sources connected', color: '#34D399', delay: 900 },
  { text: 'AI analysis pipeline ready', color: '#34D399', delay: 1150 },
  { text: 'Terminal online', color: '#E8A534', delay: 1400 },
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'boot' | 'exit'>('boot');
  const [visibleLines, setVisibleLines] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Stagger boot log lines
    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });

    // Start exit phase
    timers.push(setTimeout(() => setPhase('exit'), 2200));

    // Complete
    timers.push(setTimeout(() => onCompleteRef.current(), 2900));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <style>{`
        @keyframes splash-glow { 0%,100%{text-shadow:0 0 20px rgba(232,165,52,0.3)} 50%{text-shadow:0 0 40px rgba(232,165,52,0.5),0 0 80px rgba(232,165,52,0.15)} }
        @keyframes splash-logo-in { from{opacity:0;transform:scale(0.92) translateY(4px);filter:blur(4px)} to{opacity:1;transform:scale(1) translateY(0);filter:blur(0)} }
        @keyframes splash-fade-up { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes splash-scan { 0%{top:-2px;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:calc(100% + 2px);opacity:0} }
        @keyframes splash-bar-fill { from{width:0} to{width:100%} }
        @keyframes splash-out { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.02)} }
        @keyframes splash-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes splash-dot-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes splash-ring-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .splash-screen {
          position:fixed;inset:0;z-index:99999;
          background:#0A0A0A;
          display:flex;align-items:center;justify-content:center;flex-direction:column;
          overflow:hidden;
        }
        .splash-screen.splash-exiting {
          animation:splash-out 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
        }

        /* Subtle grid background */
        .splash-grid {
          position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(232,165,52,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,165,52,0.03) 1px, transparent 1px);
          background-size:40px 40px;
          mask-image:radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%);
          -webkit-mask-image:radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%);
        }

        /* Scan line */
        .splash-scan-line {
          position:absolute;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent 0%,rgba(232,165,52,0.4) 30%,rgba(232,165,52,0.4) 70%,transparent 100%);
          animation:splash-scan 2s ease-in-out infinite;
          pointer-events:none;
        }
      `}</style>

      <div className={`splash-screen${phase === 'exit' ? ' splash-exiting' : ''}`}>
        <div className="splash-grid" />
        <div className="splash-scan-line" />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, userSelect: 'none' }}>

          {/* Diamond logo mark */}
          <div style={{
            opacity: 0,
            animation: 'splash-logo-in 0.5s cubic-bezier(0.16,1,0.3,1) 0s forwards',
            marginBottom: 16,
          }}>
            <svg width="48" height="48" viewBox="0 0 36 36" fill="none">
              <path d="M18 2 L34 18 L18 34 L2 18 Z" stroke="#E8A534" strokeWidth="1.2" fill="none" />
              <path d="M18 9 L27 18 L18 27 L9 18 Z" stroke="#E8A534" strokeWidth="0.8" fill="none" opacity="0.4" />
              <path d="M18 14 L22 18 L18 22 L14 18 Z" fill="#E8A534" opacity="0.8" />
              <circle cx="18" cy="2" r="1.2" fill="#E8A534" />
              <circle cx="34" cy="18" r="1.2" fill="#E8A534" />
              <circle cx="18" cy="34" r="1.2" fill="#E8A534" />
              <circle cx="2" cy="18" r="1.2" fill="#E8A534" />
            </svg>
          </div>

          {/* Logo text */}
          <div style={{
            fontFamily: "'Space Grotesk','JetBrains Mono',monospace",
            fontSize: 'clamp(36px,5vw,56px)',
            fontWeight: 700,
            letterSpacing: '0.16em',
            lineHeight: 1,
            display: 'flex',
            opacity: 0,
            animation: 'splash-logo-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards, splash-glow 3s ease-in-out 0.8s infinite',
          }}>
            <span style={{ color: '#E8E6E3' }}>CHAIN</span>
            <span style={{ color: '#E8A534' }}>INTEL</span>
          </div>

          {/* Subtitle */}
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9, fontWeight: 400, letterSpacing: '0.32em',
            color: '#5C5955', textTransform: 'uppercase' as const,
            marginTop: 10, opacity: 0,
            animation: 'splash-fade-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s forwards',
          }}>
            DIGITAL ASSET INTELLIGENCE TERMINAL
          </div>

          {/* Amber divider with glow */}
          <div style={{
            width: 'clamp(240px,36vw,400px)', height: 1,
            marginTop: 28, overflow: 'hidden', position: 'relative',
          }}>
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(90deg, transparent, #E8A534 30%, #E8A534 70%, transparent)',
              transform: 'scaleX(0)', transformOrigin: 'center',
              animation: 'splash-bar-fill 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s forwards',
            }} />
            <div style={{
              position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
              width: '60%', height: 5, filter: 'blur(6px)',
              background: 'rgba(232,165,52,0.3)',
              opacity: 0,
              animation: 'splash-fade-up 0.4s ease 0.9s forwards',
            }} />
          </div>

          {/* Boot log */}
          <div style={{
            marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            gap: 4, minHeight: 100, width: 'clamp(240px,36vw,400px)',
          }}>
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i} style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10, letterSpacing: '0.06em',
                color: line.color,
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'splash-fade-up 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
              }}>
                {line.color === '#34D399' && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399', flexShrink: 0, animation: 'splash-dot-pulse 1.5s ease infinite' }} />
                )}
                {line.color === '#E8A534' && i === 2 && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#E8A534', flexShrink: 0 }} />
                )}
                {line.color === '#5C5955' && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#333', flexShrink: 0 }} />
                )}
                {line.color === '#E8A534' && i === BOOT_LINES.length - 1 && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#E8A534', flexShrink: 0, animation: 'splash-dot-pulse 1s ease infinite' }} />
                )}
                <span>{line.text}</span>
                {i === visibleLines - 1 && i < BOOT_LINES.length - 1 && (
                  <span style={{ display: 'inline-block', width: 6, height: 12, background: '#E8A534', marginLeft: 2, animation: 'splash-cursor 0.6s step-end infinite' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
