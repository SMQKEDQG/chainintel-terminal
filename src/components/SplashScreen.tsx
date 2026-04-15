'use client';

import { useEffect, useState } from 'react';

// Module-level flag: only show once per browser session (persists across re-renders/navigations)
let _splashShown = false;

export function hasSplashBeenShown(): boolean {
  return _splashShown;
}

export function markSplashShown(): void {
  _splashShown = true;
}

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');

  useEffect(() => {
    // Phase timeline:
    // 0ms       → component mounts, CSS animations begin
    // 2000ms    → start exit fade
    // 2800ms    → call onComplete
    const exitTimer = setTimeout(() => {
      setPhase('exit');
    }, 2000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes splash-logo-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes splash-subtitle-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes splash-line-draw {
          from { transform: scaleX(0); transform-origin: left center; }
          to   { transform: scaleX(1); transform-origin: left center; }
        }

        @keyframes splash-indicator-1-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes splash-indicator-2-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes splash-dot-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        @keyframes splash-overlay-out {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        .splash-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: #0A0A0A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        }

        .splash-overlay.splash-exit {
          animation: splash-overlay-out 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .splash-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          user-select: none;
        }

        .splash-logo {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 700;
          letter-spacing: 0.18em;
          line-height: 1;
          display: flex;
          align-items: baseline;
          gap: 0;
          opacity: 0;
          animation: splash-logo-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0s forwards;
        }

        .splash-logo-chain {
          color: #E8E6E3;
        }

        .splash-logo-intel {
          color: #E8A534;
        }

        .splash-subtitle {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.32em;
          color: #5C5955;
          text-transform: uppercase;
          margin-top: 10px;
          opacity: 0;
          animation: splash-subtitle-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
        }

        .splash-line-container {
          width: clamp(240px, 36vw, 380px);
          height: 1px;
          margin-top: 28px;
          overflow: hidden;
          background: transparent;
        }

        .splash-line {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, #E8A534 0%, rgba(232, 165, 52, 0.4) 100%);
          transform: scaleX(0);
          transform-origin: left center;
          animation: splash-line-draw 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
        }

        .splash-indicators {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: 24px;
        }

        .splash-indicator {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0;
        }

        .splash-indicator-1 {
          color: #E8E6E3;
          animation: splash-indicator-1-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1.2s forwards;
        }

        .splash-indicator-2 {
          color: #5C5955;
          animation: splash-indicator-2-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1.55s forwards;
        }

        .splash-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #34D399;
          flex-shrink: 0;
          animation: splash-dot-pulse 1.2s ease-in-out 1.2s infinite;
        }

        .splash-dot-muted {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #5C5955;
          flex-shrink: 0;
        }
      `}</style>

      <div className={`splash-overlay${phase === 'exit' ? ' splash-exit' : ''}`}>
        <div className="splash-inner">
          {/* Logo */}
          <div className="splash-logo" aria-label="ChainIntel">
            <span className="splash-logo-chain">CHAIN</span>
            <span className="splash-logo-intel">INTEL</span>
          </div>

          {/* Subtitle */}
          <div className="splash-subtitle" aria-label="Digital Asset Intelligence">
            DIGITAL ASSET INTELLIGENCE
          </div>

          {/* Amber line */}
          <div className="splash-line-container" aria-hidden="true">
            <div className="splash-line" />
          </div>

          {/* Data indicators */}
          <div className="splash-indicators" aria-hidden="true">
            <div className="splash-indicator splash-indicator-1">
              <div className="splash-dot" />
              <span>14 SOURCES CONNECTED</span>
            </div>
            <div className="splash-indicator splash-indicator-2">
              <div className="splash-dot-muted" />
              <span>LIVE DATA FEEDS ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
